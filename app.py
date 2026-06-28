# To run this Flask application locally, execute:
# python app.py
# (It will automatically create the ems.db SQLite database file on first run)

from flask import Flask, request, jsonify, send_from_directory
from models import db, Employee, LeaveRequest, AttendanceRecord
import os

app = Flask(__name__)


@app.route("/")
def index():
    return send_from_directory("static", "index.html")

# Use a local SQLite database for offline-first capability
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ems.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

@app.route('/api/employees', methods=['GET', 'POST'])
def manage_employees():
    if request.method == 'POST':
        # TODO: Implement add employee logic
        pass 
    return jsonify({"message": "List of employees endpoint stub"})

@app.route('/api/attendance', methods=['POST'])
def track_attendance():
    # TODO: Handle image upload and ONNX CPU OCR extraction
    return jsonify({"message": "Attendance tracked endpoint stub"})

@app.route('/api/leave', methods=['POST'])
def submit_leave_request():
    """
    Handles unstructured leave requests (text) and processes them
    using local CPU-based AI inference.
    """
    data = request.json or {}
    unstructured_text = data.get('raw_text', '')
    
    if not unstructured_text:
        return jsonify({"error": "No raw_text provided"}), 400

    # Process unstructured text using local offline AI
    structured_data = process_leave_with_llm(unstructured_text)
    
    # TODO: Save the structured_data into the SQLite database as a LeaveRequest
    
    return jsonify({"status": "success", "extracted_data": structured_data})

def process_leave_with_llm(raw_text: str) -> dict:
    """
    Placeholder function for local CPU inference (e.g., using llama.cpp).
    This function processes unstructured text into structured JSON.
    """
    # -------------------------------------------------------------
    # Example logic that would be handled by llama-cpp-python:
    # -------------------------------------------------------------
    # from llama_cpp import Llama
    # llm = Llama(model_path="./models/llama-3-8b-instruct.Q4_K_M.gguf")
    # prompt = f"Extract leave dates and reason from this text: {raw_text}"
    # response = llm(prompt, max_tokens=100)
    # -------------------------------------------------------------
    
    print(f"[*] Running local CPU inference to parse: '{raw_text}'")
    
    # Mocking the AI extraction for now
    return {
        "start_date": "2026-07-01",
        "end_date": "2026-07-03",
        "reason": "Feeling unwell",
        "leave_type": "Sick"
    }

if __name__ == '__main__':
    # Initialize the database and tables on startup
    with app.app_context():
        db.create_all()
    
    # Run the server on localhost, port 5000
    app.run(debug=True, host='0.0.0.0', port=5000)
