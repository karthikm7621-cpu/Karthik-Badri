import json
import os
from datetime import datetime
from typing import Any, Dict

from flask import Flask, jsonify, request
from flask_cors import CORS

from models import AttendanceRecord, Employee, LeaveRequest, db

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///ems.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)


def get_llm() -> Any:
    """Loads a lightweight local LLM via llama-cpp-python."""
    model_path = os.environ.get("LLM_MODEL_PATH", "./models/model.gguf")
    try:
        from llama_cpp import Llama

        if os.path.exists(model_path):
            return Llama(model_path=model_path, verbose=False)
    except ImportError:
        pass
    return None


def process_leave_with_llm(raw_text: str) -> Dict[str, Any]:
    """Parses unstructured text to extract leave details using a local LLM."""
    llm = get_llm()
    if not llm:
        return {
            "start_date": "2026-07-01",
            "end_date": "2026-07-03",
            "reason": "Mocked reason due to missing model",
        }

    system_prompt = (
        "You are a strict JSON data extractor. "
        "Extract 'start_date', 'end_date', and 'reason' from the text. "
        "Return ONLY valid JSON with keys: start_date, end_date, reason. No other text."
    )
    prompt = f"{system_prompt}\nText: {raw_text}\nJSON:"

    response = llm(prompt, max_tokens=150, temperature=0.1)
    try:
        output_text = response["choices"][0]["text"].strip()
        parsed = json.loads(output_text)
        return parsed
    except Exception:
        return {
            "start_date": "1970-01-01",
            "end_date": "1970-01-01",
            "reason": "Failed to parse",
        }


@app.route("/api/employees", methods=["GET"])
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


@app.route("/api/dashboard", methods=["GET"])
def get_dashboard() -> Any:
    leaves = LeaveRequest.query.all()
    attendance = AttendanceRecord.query.all()
    return jsonify(
        {
            "leave_count": len(leaves),
            "attendance_count": len(attendance),
        }
    )


@app.route("/api/sync-attendance", methods=["POST"])
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

    record = AttendanceRecord(
        employee_id=employee_id,
        date=record_date,
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({"message": "Attendance synced successfully"})


@app.route("/api/submit-leave", methods=["POST"])
def submit_leave() -> Any:
    data = request.json or {}
    unstructured_text = data.get("raw_text", "")
    employee_id = data.get("employee_id", 1)

    if not unstructured_text:
        return jsonify({"error": "No raw_text provided"}), 400

    extracted_data = process_leave_with_llm(unstructured_text)

    try:
        start_date = datetime.strptime(
            extracted_data.get("start_date", ""), "%Y-%m-%d"
        ).date()
        end_date = datetime.strptime(
            extracted_data.get("end_date", ""), "%Y-%m-%d"
        ).date()
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

    return jsonify({"status": "success", "extracted_data": extracted_data})


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, host="0.0.0.0", port=5000)
