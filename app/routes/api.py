import os
import tempfile
import json
from datetime import datetime
from typing import Any
from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import (
    Employee,
    Candidate,
    User,
    Stream,
    LeaveRequest,
    AttendanceRecord,
    ExpenseReimbursement,
    HRTicket,
)
from app.services import (
    initialize_rag_index,
    get_llm,
    verify_face,
    process_leave_with_llm,
    transcribe_audio,
    extract_text_from_image,
    process_expense_with_llm,
    extract_text_from_pdf,
    parse_hr_ticket,
    resolve_authenticated_user,
    is_owner,
    get_request_data,
)

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.route("/employees", methods=["GET"])
def get_employees() -> Any:
    employees = Employee.query.all()
    return jsonify(
        [
            {
                "id": e.id,
                "employee_id_string": e.employee_id_string,
                "full_name": e.full_name,
                "department": e.department,
                "role": e.role,
            }
            for e in employees
        ]
    )


@api_bp.route("/dashboard", methods=["GET"])
def get_dashboard() -> Any:
    leaves = LeaveRequest.query.all()
    attendance = AttendanceRecord.query.all()
    return jsonify(
        {
            "leave_count": len(leaves),
            "attendance_count": len(attendance),
        }
    )


@api_bp.route("/sync-attendance", methods=["POST"])
def sync_attendance() -> Any:
    data = request.json or {}
    employee_id = data.get("employee_id")
    date_str = data.get("date")
    if not employee_id or not date_str:
        return jsonify({"error": "Missing employee_id or date"}), 400
    try:
        record_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    record = AttendanceRecord(employee_id=employee_id, date=record_date)
    db.session.add(record)
    db.session.commit()
    return jsonify({"message": "Attendance synced successfully"})


@api_bp.route("/ask-policy", methods=["POST"])
def ask_policy() -> Any:
    payload = request.get_json(silent=True) or {}
    query = str(payload.get("query") or "").strip()
    if not query:
        return jsonify({"error": "Query is required"}), 400

    try:
        index, chunks = initialize_rag_index()
        context_chunks = chunks[:3]

        if index is not None and chunks:
            try:
                from sentence_transformers import SentenceTransformer
                import numpy as np
                import app.services

                if app.services.RAG_EMBEDDING_MODEL is None:
                    app.services.RAG_EMBEDDING_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
                embedding = app.services.RAG_EMBEDDING_MODEL.encode(
                    [query], convert_to_numpy=True, normalize_embeddings=True
                )
                embedding = np.asarray(embedding, dtype="float32")
                _, indices = index.search(embedding, min(3, len(chunks)))
                context_chunks = [chunks[idx] for idx in indices[0] if 0 <= idx < len(chunks)]
                if not context_chunks:
                    context_chunks = chunks[:3]
            except Exception:
                context_chunks = chunks[:3]

        context = "\n\n".join(context_chunks)
        prompt = (
            "You are an HR assistant. Answer the user's question based ONLY "
            "on the provided context. If the context does not contain the "
            "answer, say 'I cannot find the answer in the policy.'\n\n"
            f"Context:\n{context}\n\nQuestion:\n{query}"
        )

        llm = get_llm()
        if llm is None:
            answer = "I cannot find the answer in the policy."
        else:
            response = llm(prompt, max_tokens=220, temperature=0.0)
            try:
                answer = response["choices"][0]["text"].strip()
            except Exception:
                answer = str(response)

        if not answer:
            answer = "I cannot find the answer in the policy."
        return jsonify({"answer": answer})
    except Exception as exc:
        return jsonify({"answer": "I cannot find the answer in the policy.", "error": str(exc)})


@api_bp.route("/verify-attendance", methods=["POST"])
def verify_attendance() -> Any:
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    image_file = request.files["image"]
    employee_id = request.form.get("employee_id")
    if not employee_id:
        return jsonify({"error": "Missing employee_id"}), 400

    if not verify_face(image_file, employee_id):
        return jsonify({"error": "Face verification failed or no face detected"}), 400

    emp_id_int = int(employee_id) if employee_id.isdigit() else 1
    record = AttendanceRecord(
        employee_id=emp_id_int, date=datetime.utcnow().date(), verified_by="biometric"
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({"status": "success", "message": "Attendance verified"})


@api_bp.route("/submit-leave", methods=["POST"])
def submit_leave() -> Any:
    data = request.json or {}
    unstructured_text = data.get("raw_text", "")
    employee_id = data.get("employee_id", 1)

    if not unstructured_text:
        return jsonify({"error": "No raw_text provided"}), 400

    extracted_data = process_leave_with_llm(unstructured_text)

    try:
        start_date = datetime.strptime(extracted_data.get("start_date", ""), "%Y-%m-%d").date()
        end_date = datetime.strptime(extracted_data.get("end_date", ""), "%Y-%m-%d").date()
    except ValueError:
        start_date = datetime.utcnow().date()
        end_date = datetime.utcnow().date()

    reason = extracted_data.get("reason", "")
    leave_req = LeaveRequest(
        employee_id=employee_id, start_date=start_date, end_date=end_date, reason_raw_text=reason
    )
    db.session.add(leave_req)
    db.session.commit()
    return jsonify({"status": "success", "extracted_data": extracted_data})


@api_bp.route("/submit-audio-leave", methods=["POST"])
def submit_audio_leave() -> Any:
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    employee_id = request.form.get("employee_id", 1)

    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, audio_file.filename or "temp_audio.wav")
    audio_file.save(temp_path)

    try:
        transcribed_text = transcribe_audio(temp_path)
        extracted_data = process_leave_with_llm(transcribed_text)

        try:
            start_date = datetime.strptime(extracted_data.get("start_date", ""), "%Y-%m-%d").date()
            end_date = datetime.strptime(extracted_data.get("end_date", ""), "%Y-%m-%d").date()
        except ValueError:
            start_date = datetime.utcnow().date()
            end_date = datetime.utcnow().date()

        reason = extracted_data.get("reason", "")
        leave_req = LeaveRequest(
            employee_id=employee_id,
            start_date=start_date,
            end_date=end_date,
            reason_raw_text=reason,
        )
        db.session.add(leave_req)
        db.session.commit()
        return jsonify(
            {
                "status": "success",
                "transcription": transcribed_text,
                "extracted_data": extracted_data,
            }
        )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@api_bp.route("/submit-receipt", methods=["POST"])
def submit_receipt() -> Any:
    if "receipt" not in request.files:
        return jsonify({"error": "No receipt image provided"}), 400

    receipt_file = request.files["receipt"]
    employee_id = request.form.get("employee_id", "").strip()

    temp_file = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    temp_path = temp_file.name
    temp_file.close()

    try:
        receipt_file.save(temp_path)
        raw_text = extract_text_from_image(temp_path)
        structured_data = process_expense_with_llm(raw_text)

        expense = ExpenseReimbursement(
            employee_id=int(employee_id) if employee_id.isdigit() else None,
            vendor=structured_data.get("vendor", "Unknown"),
            date=structured_data.get("date", ""),
            amount=structured_data.get("amount", "0.00"),
            currency=structured_data.get("currency", "USD"),
            status="Pending",
        )
        db.session.add(expense)
        db.session.commit()

        return jsonify(
            {
                "status": "success",
                "ocr_text": raw_text,
                "extracted_data": structured_data,
                "expense": {
                    "id": expense.id,
                    "vendor": expense.vendor,
                    "date": expense.date,
                    "amount": expense.amount,
                    "currency": expense.currency,
                    "status": expense.status,
                },
            }
        )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@api_bp.route("/upload-resume", methods=["POST"])
def upload_resume() -> Any:
    auth_user = resolve_authenticated_user()
    if not auth_user or not is_owner(auth_user):
        return jsonify({"success": False, "message": "Owner access required."}), 403

    if "resume" not in request.files:
        return jsonify({"error": "No resume file provided"}), 400

    resume_file = request.files["resume"]
    filename = (resume_file.filename or "").lower()
    if not filename.endswith(".pdf"):
        return jsonify({"error": "Only PDF resumes are accepted"}), 400

    temp_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    temp_path = temp_file.name
    temp_file.close()

    try:
        resume_file.save(temp_path)
        raw_text = extract_text_from_pdf(temp_path)
        llm = get_llm()
        if not llm:
            return jsonify({"error": "LLM model not available on server"}), 503

        system_prompt = (
            "You are an HR data extractor. Read the following resume text. "
            "Extract the candidate's name, email, a list of core technical skills, "
            "and total years of experience as an integer. "
            "Output ONLY valid JSON in this exact format: "
            '{"candidate_name": "...", "email": "...", '
            '"skills": ["..."], "years_of_experience": X}. '
            "No markdown, no conversational text."
        )
        prompt = f"{system_prompt}\n\nResume Text:\n{raw_text}\n\nJSON:"
        response = llm(prompt, max_tokens=256, temperature=0.0)

        try:
            output_text = response["choices"][0]["text"].strip()
        except Exception:
            output_text = str(response)

        parsed = None
        try:
            parsed = json.loads(output_text)
        except Exception:
            import re

            m = re.search(r"\{.*\}", output_text, re.S)
            if m:
                try:
                    parsed = json.loads(m.group(0))
                except Exception:
                    pass

        if not parsed:
            return jsonify({"error": "Failed to parse LLM output as JSON", "raw": output_text}), 502

        try:
            skills_val = parsed.get("skills") or []
            if not isinstance(skills_val, list):
                skills_val = [str(skills_val)]

            candidate = Candidate(
                name=parsed.get("candidate_name"),
                email=parsed.get("email"),
                skills=json.dumps(skills_val),
                years_of_experience=int(parsed.get("years_of_experience") or 0),
                status="New",
            )
            db.session.add(candidate)
            db.session.commit()
        except Exception as e:
            return jsonify({"error": "Failed to save candidate", "detail": str(e)}), 500

        return jsonify(
            {
                "status": "success",
                "candidate_id": candidate.id,
                "extracted": parsed,
            }
        ), 200
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@api_bp.route("/submit-hr-ticket", methods=["POST"])
def submit_hr_ticket() -> Any:
    data = request.json or {}
    unstructured_text = data.get("raw_text", "")
    employee_id = data.get("employee_id", 1)

    if not unstructured_text:
        return jsonify({"error": "No raw_text provided"}), 400

    extracted_data = parse_hr_ticket(unstructured_text)
    ticket = HRTicket(
        employee_id=employee_id,
        original_language=extracted_data.get("original_language", "unknown"),
        category=extracted_data.get("category", "other"),
        english_summary=extracted_data.get("english_summary", "Unknown issue"),
        status="Pending",
    )
    db.session.add(ticket)
    db.session.commit()
    return jsonify({"status": "success", "ticket_id": ticket.id, "extracted_data": extracted_data})


@api_bp.route("/pending-users", methods=["GET"])
def pending_users() -> Any:
    auth_user = resolve_authenticated_user()
    if not auth_user or not is_owner(auth_user):
        return jsonify({"success": False, "message": "Owner access required."}), 403

    users = User.query.filter_by(status="Pending").order_by(User.created_at.asc()).all()
    return jsonify({"success": True, "users": [user.to_dict() for user in users]})


@api_bp.route("/approve-user", methods=["POST"])
def approve_user() -> Any:
    auth_user = resolve_authenticated_user()
    if not auth_user or not is_owner(auth_user):
        return jsonify({"success": False, "message": "Owner access required."}), 403

    payload = get_request_data()
    username = (payload.get("username") or "").strip()
    if not username:
        return jsonify({"success": False, "message": "Username is required."}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    user.status = "Active"
    db.session.commit()
    return jsonify({"success": True, "message": "User approved.", "user": user.to_dict()})


@api_bp.route("/delegate-owner", methods=["POST"])
def delegate_owner() -> Any:
    auth_user = resolve_authenticated_user()
    if not auth_user or auth_user.role != "Main Owner":
        return jsonify({"success": False, "message": "Main Owner access required."}), 403

    payload = get_request_data()
    username = (payload.get("username") or "").strip()
    if not username:
        return jsonify({"success": False, "message": "Username is required."}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    if user.role not in {"Employee", "Delegated Owner"}:
        return jsonify(
            {"success": False, "message": "Only Employee or Delegated Owner can be upgraded."}
        ), 400

    user.role = "Delegated Owner"
    db.session.commit()
    return jsonify(
        {"success": True, "message": "User delegated owner access.", "user": user.to_dict()}
    )


@api_bp.route("/add-stream", methods=["POST"])
def add_stream() -> Any:
    auth_user = resolve_authenticated_user()
    if not auth_user or not is_owner(auth_user):
        return jsonify({"success": False, "message": "Owner access required."}), 403

    payload = get_request_data()
    name = (payload.get("name") or "").strip()
    if not name:
        return jsonify({"success": False, "message": "Stream name is required."}), 400

    stream = Stream.query.filter_by(name=name).first()
    if not stream:
        stream = Stream(name=name)
        db.session.add(stream)
        db.session.commit()

    return jsonify({"success": True, "message": "Stream added.", "stream": {"name": stream.name}})
