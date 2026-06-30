import os
import tempfile
import json
from datetime import datetime
from typing import Any
from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models import Employee, Candidate, User, Stream, LeaveRequest, AttendanceRecord, ExpenseReimbursement, HRTicket
from app.services.llm_service import get_llm, initialize_rag_index, process_leave_with_llm, process_expense_with_llm, parse_hr_ticket
from app.services.media_service import transcribe_audio, extract_text_from_image, extract_text_from_pdf
from app.services.auth_service import resolve_authenticated_user, generate_auth_token, is_owner, get_request_data
from app.services.biometric_service import verify_face
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

def resolve_employee_id(raw_id: Any) -> Any:
    if not raw_id:
        return None
    if isinstance(raw_id, int):
        return raw_id
    if isinstance(raw_id, str):
        if raw_id.isdigit():
            return int(raw_id)
        emp = Employee.query.filter_by(employee_id_string=raw_id).first()
        if emp:
            return emp.id
    return raw_id


@auth_bp.route("/employees", methods=["GET"])
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


@auth_bp.route("/request-join", methods=["POST"])
def request_join() -> Any:
    data = get_request_data()
    username = (data.get("username") or "").strip()
    role = (data.get("role") or "Employee").strip()
    department = (data.get("department") or "General").strip()
    
    if not username:
        return jsonify({"success": False, "message": "Username/Name required"}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({"success": False, "message": "User already exists"}), 400
        
    user = User(
        username=username,
        password_hash=generate_password_hash("dummy"),
        role=role,
        stream=department,
        status="Pending"
    )
    db.session.add(user)
    db.session.commit()
    
    return jsonify({"success": True, "message": "Join request submitted. Please wait for owner approval."})


@auth_bp.route("/login", methods=["POST"])
def login() -> Any:
    data = get_request_data()
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"success": False, "message": "Invalid credentials"}), 401
        
    if user.status != "Active":
        return jsonify({"success": False, "message": "Account pending approval"}), 403
        
    token = generate_auth_token(username)
    return jsonify({
        "success": True,
        "token": token,
        "user": user.to_dict()
    })


@auth_bp.route("/dashboard", methods=["GET"])
def get_dashboard() -> Any:
    auth_user = resolve_authenticated_user()
    if not auth_user:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    if is_owner(auth_user):
        leaves = LeaveRequest.query.all()
        attendance = AttendanceRecord.query.all()
    else:
        # Assuming we eventually map User to Employee, for now just show all for simplicity or user specific
        leaves = LeaveRequest.query.all()
        attendance = AttendanceRecord.query.all()
        
    return jsonify(
        {
            "leave_count": len(leaves),
            "attendance_count": len(attendance),
            "role": auth_user.role,
            "username": auth_user.username
        }
    )


@auth_bp.route("/analytics", methods=["GET"])
def get_analytics() -> Any:
    # Gather metrics for the dashboard
    total_employees = Employee.query.count()
    pending_leaves = LeaveRequest.query.filter_by(status="Pending").count()
    open_tickets = HRTicket.query.filter_by(status="Pending").count()
    pending_expenses = ExpenseReimbursement.query.filter_by(status="Pending").count()

    return jsonify(
        {
            "total_employees": total_employees,
            "pending_leaves": pending_leaves,
            "open_tickets": open_tickets,
            "pending_expenses": pending_expenses,
        }
    )


def resolve_employee_id(emp_val: Any) -> int:
    """Helper to safely convert 'EMP-XXX', '101', or 1 to the integer employee.id."""
    if not emp_val:
        return 1
    if isinstance(emp_val, int):
        return emp_val
    emp_str = str(emp_val).strip()
    
    # Check if it matches an actual employee_id_string
    emp = Employee.query.filter_by(employee_id_string=emp_str).first()
    if emp:
        return emp.id
        
    if emp_str.startswith("EMP-"):
        # fallback parsing just in case
        try:
            return int(emp_str.replace("EMP-", ""))
        except ValueError:
            return 1
    if emp_str.isdigit():
        return int(emp_str)
    return 1


@auth_bp.route("/sync-attendance", methods=["POST"])
def sync_attendance() -> Any:
    data = request.json or {}
    employee_id_raw = data.get("employee_id") or data.get("employee")
    date_str = data.get("date")
    if not employee_id_raw or not date_str:
        return jsonify({"error": "Missing employee_id or date"}), 400
    try:
        record_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    emp_id_int = resolve_employee_id(employee_id_raw)
    record = AttendanceRecord(employee_id=emp_id_int, date=record_date)
    db.session.add(record)
    db.session.commit()
    return jsonify({"message": "Attendance synced successfully"})


@auth_bp.route("/ask-policy", methods=["POST"])
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
            if context_chunks:
                answer = context_chunks[0].strip()
            else:
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


@auth_bp.route("/verify-attendance", methods=["POST"])
def verify_attendance() -> Any:
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    image_file = request.files["image"]
    employee_id = request.form.get("employee_id")
    if not employee_id:
        return jsonify({"error": "Missing employee_id"}), 400

    if not verify_face(image_file, employee_id):
        return jsonify({"error": "Face verification failed or no face detected"}), 400

    emp_id_int = resolve_employee_id(employee_id)
    record = AttendanceRecord(
        employee_id=emp_id_int, date=datetime.utcnow().date(), verified_by="biometric"
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({"status": "success", "message": "Attendance verified"})


@auth_bp.route("/submit-leave", methods=["POST"])
def submit_leave() -> Any:
    data = request.json or {}
    unstructured_text = data.get("raw_text", "")
    employee_id_raw = data.get("employee_id") or data.get("employee")
    emp_id_int = resolve_employee_id(employee_id_raw)

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
        employee_id=emp_id_int, start_date=start_date, end_date=end_date, reason_raw_text=reason
    )
    db.session.add(leave_req)
    db.session.commit()
    return jsonify({"status": "success", "extracted_data": extracted_data})


@auth_bp.route("/submit-audio-leave", methods=["POST"])
def submit_audio_leave() -> Any:
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    employee_id_raw = request.form.get("employee_id", "")
    emp_id_int = resolve_employee_id(employee_id_raw)

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

        record = LeaveRequest(
            employee_id=emp_id_int,
            start_date=start_date,
            end_date=end_date,
            leave_type=extracted_data.get("leave_type", "General"),
            reason_raw_text=transcribed_text,
        )
        db.session.add(record)
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


@auth_bp.route("/submit-receipt", methods=["POST"])
def submit_receipt() -> Any:
    if "receipt" not in request.files:
        return jsonify({"error": "No receipt image provided"}), 400

    receipt_file = request.files["receipt"]
    employee_id_raw = request.form.get("employee_id", "").strip()
    emp_id_int = resolve_employee_id(employee_id_raw)

    temp_file = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    temp_path = temp_file.name
    temp_file.close()

    try:
        receipt_file.save(temp_path)
        raw_text = extract_text_from_image(temp_path)
        structured_data = process_expense_with_llm(raw_text)

        expense = ExpenseReimbursement(
            employee_id=emp_id_int,
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


@auth_bp.route("/upload-resume", methods=["POST"])
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


@auth_bp.route("/submit-hr-ticket", methods=["POST"])
def submit_hr_ticket() -> Any:
    data = request.json or {}
    unstructured_text = data.get("raw_text", "")
    employee_id_raw = data.get("employee_id") or data.get("employee")
    emp_id_int = resolve_employee_id(employee_id_raw)

    if not unstructured_text:
        return jsonify({"error": "No raw_text provided"}), 400

    extracted_data = parse_hr_ticket(unstructured_text)
    record = HRTicket(
        employee_id=emp_id_int,
        original_language=extracted_data.get("language", "en"),
        category=extracted_data.get("category", "General"),
        english_summary=extracted_data.get("english_summary", unstructured_text),
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({"status": "success", "ticket_id": record.id, "extracted_data": extracted_data})


@auth_bp.route("/pending-users", methods=["GET"])
def pending_users() -> Any:
    auth_user = resolve_authenticated_user()
    if not auth_user or not is_owner(auth_user):
        return jsonify({"success": False, "message": "Owner access required."}), 403

    users = User.query.filter_by(status="Pending").order_by(User.created_at.asc()).all()
    return jsonify({"success": True, "users": [user.to_dict() for user in users]})



@auth_bp.route("/approve-user", methods=["POST"])
def approve_user() -> Any:
    auth_user = resolve_authenticated_user()
    if not auth_user or not is_owner(auth_user):
        return jsonify({"success": False, "message": "Owner access required."}), 403

    payload = get_request_data()
    username = (payload.get("username") or "").strip()
    user_id = payload.get("user_id")

    if user_id:
        user = User.query.get(user_id)
    elif username:
        user = User.query.filter_by(username=username).first()
    else:
        return jsonify({"success": False, "message": "Username or user_id is required."}), 400

    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    if user.status != "Active":
        user.status = "Active"
        
        # Create Employee record so they appear in Directory
        import random
        emp_id_string = f"EMP-{random.randint(1000, 9999)}"
        emp = Employee(
            employee_id_string=emp_id_string,
            full_name=user.username,
            department=user.stream or "General",
            role=user.role,
            username=user.username,
            status="Active",
            stream=user.stream
        )
        db.session.add(emp)

    db.session.commit()
    return jsonify({"success": True, "message": "User approved and added to Directory.", "user": user.to_dict()})



@auth_bp.route("/delegate-owner", methods=["POST"])
def delegate_owner() -> Any:
    auth_user = resolve_authenticated_user()
    if not auth_user or auth_user.role != "Main Owner":
        return jsonify({"success": False, "message": "Main Owner access required."}), 403

    payload = get_request_data()
    username = (payload.get("username") or "").strip()
    user_id = payload.get("user_id")

    if user_id:
        # App sends Employee ID for delegation right now. Let's find Employee then User.
        emp = Employee.query.get(user_id)
        if emp and emp.username:
            user = User.query.filter_by(username=emp.username).first()
        else:
            # Fallback in case it was sending actual User ID
            user = User.query.get(user_id)
    elif username:
        user = User.query.filter_by(username=username).first()
    else:
        return jsonify({"success": False, "message": "Username or user_id is required."}), 400

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

