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

attendance_bp = Blueprint("attendance", __name__, url_prefix="/api")

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


@attendance_bp.route("/employees", methods=["GET"])
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


@attendance_bp.route("/request-join", methods=["POST"])
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

@attendance_bp.route("/login", methods=["POST"])
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

@attendance_bp.route("/dashboard", methods=["GET"])
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


@attendance_bp.route("/analytics", methods=["GET"])
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


@attendance_bp.route("/sync-attendance", methods=["POST"])
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



@attendance_bp.route("/ask-policy", methods=["POST"])
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


@attendance_bp.route("/verify-attendance", methods=["POST"])
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

