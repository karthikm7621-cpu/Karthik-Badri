from datetime import datetime
from typing import Any, Dict
from app.extensions import db

class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id_string = db.Column(db.String(50), unique=True, nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    department = db.Column(db.String(100))
    role = db.Column(db.String(100))
    username = db.Column(db.String(80), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)
    user_role = db.Column(db.String(40), nullable=True)
    status = db.Column(db.String(20), nullable=True, default="Pending")
    stream = db.Column(db.String(80), nullable=True)


class Candidate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=True)
    email = db.Column(db.String(200), nullable=True)
    skills = db.Column(db.Text, nullable=True)
    years_of_experience = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(40), nullable=False, default="New")


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(40), nullable=False, default="Employee")
    status = db.Column(db.String(20), nullable=False, default="Pending")
    stream = db.Column(db.String(80), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "status": self.status,
            "stream": self.stream,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Stream(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class LeaveRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("employee.id"), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    leave_type = db.Column(db.String(50))
    reason_raw_text = db.Column(db.Text)
    status = db.Column(db.String(50), default="Pending")


class AttendanceRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("employee.id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time_in = db.Column(db.DateTime, default=datetime.utcnow)
    time_out = db.Column(db.DateTime, nullable=True)
    source_image_path = db.Column(db.String(255))
    verified_by = db.Column(db.String(50), nullable=True)


class ExpenseReimbursement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("employee.id"), nullable=True)
    vendor = db.Column(db.String(150), nullable=True)
    date = db.Column(db.String(30), nullable=True)
    amount = db.Column(db.String(50), nullable=True)
    currency = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(30), default="Pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class HRTicket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("employee.id"), nullable=False)
    original_language = db.Column(db.String(10), nullable=True)
    category = db.Column(db.String(50), nullable=True)
    english_summary = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default="Pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
