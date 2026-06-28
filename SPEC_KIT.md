# 📋 Specification Kit (Phase 1: Plan & Spec)

## 1. Core User Flows

### A. Smart Leave Parsing Flow
1. **Input**: Employee navigates to the Leave Request page and inputs unstructured text (e.g., "I feel terrible, won't be able to come in from tomorrow until Friday") or uploads an audio voice note.
2. **Processing**: 
   - If audio, it is routed through `Whisper.cpp` for text transcription.
   - The unstructured text is fed to a local LLM via `llama.cpp` using a strict system prompt to extract: `start_date`, `end_date`, `reason`, and `leave_type`.
3. **Review**: The UI presents the structured JSON data to the employee for a quick confirmation ("Did we get this right?").
4. **Submit**: The confirmed structured data is saved to the SQLite `Leave` table.

### B. Smart Attendance Tracking Flow
1. **Input**: Employee navigates to the Attendance page and uploads a photo of their handwritten timesheet or ID card.
2. **Processing**: The image is processed locally using an `ONNX CPU` Vision/OCR model to detect the Employee ID, Date, and Time In/Out.
3. **Review**: The system overlays the extracted data on the UI for quick verification.
4. **Submit**: Structured attendance logs are saved into the SQLite `Attendance` table.

### C. Employee Profile Management Flow
1. **Input**: Admin navigates to the dashboard and adds a new employee.
2. **Processing**: Standard CRUD operations using the Flask backend. 
3. **Submit**: Employee details (Name, ID, Department, Role) are saved to the SQLite `Employee` table.

---

## 2. Data Models (SQLite Schema)

### `Employee`
*   `id` (Primary Key, Integer)
*   `employee_id_string` (String, Unique) - e.g., "EMP-102"
*   `full_name` (String)
*   `department` (String)
*   `role` (String)

### `Leave`
*   `id` (Primary Key, Integer)
*   `employee_id` (Foreign Key -> Employee.id)
*   `start_date` (Date)
*   `end_date` (Date)
*   `leave_type` (String) - e.g., "Sick", "Vacation", "Personal"
*   `reason_raw_text` (Text) - The original unstructured text for auditing
*   `status` (String) - Default: "Pending"

### `Attendance`
*   `id` (Primary Key, Integer)
*   `employee_id` (Foreign Key -> Employee.id)
*   `date` (Date)
*   `time_in` (DateTime)
*   `time_out` (DateTime, Nullable)
*   `source_image_path` (String) - Path to the locally stored unstructured image

---

## 3. Work-Division Plan (3-Person Team)

*   **Dev 1 (Backend & Database Setup)**: Focuses on setting up the Flask boilerplate, configuring SQLite, building the CRUD API endpoints, and orchestrating the backend file structure.
*   **Dev 2 (AI Integration - The "Model Whisperer")**: Responsible for downloading, quantizing (if needed), and wrapping the local AI models (llama.cpp, whisper.cpp, ONNX). Exposes simple Python functions that the backend can call to process unstructured data.
*   **Dev 3 (Frontend & UI/UX)**: Responsible for building the Vanilla JS, HTML, and CSS. Ensures the upload forms, the data confirmation screens, and dashboards are highly responsive and look great.

---

## 4. GitLab Issues List (MVP Sprint)

**Deadline constraint:** All tasks must be resolved before the MVP Lunch Break deadline (12:30 PM).

| Issue Title | Assignee | Est. Time (Hours) | Due Date (Today) |
| :--- | :--- | :--- | :--- |
| **#1** Initialize Flask Project, SQLite DB, and Basic Models | Dev 1 | 1.0 | 10:45 AM |
| **#2** Build HTML/CSS scaffolding and basic routing | Dev 3 | 1.0 | 10:45 AM |
| **#3** Setup local LLM (llama.cpp) bindings & Prompt Engineering for Leave extraction | Dev 2 | 1.5 | 11:30 AM |
| **#4** Build Unstructured Leave Form (Text/Audio upload) in Frontend | Dev 3 | 1.0 | 11:30 AM |
| **#5** Implement local ONNX OCR script for handwritten attendance extraction | Dev 2 | 1.5 | 11:30 AM |
| **#6** Connect Flask API to Local LLM script for Leave extraction JSON response | Dev 1 | 1.0 | 12:00 PM |
| **#7** Connect Flask API to ONNX OCR script for Attendance extraction | Dev 1 | 1.0 | 12:00 PM |
| **#8** End-to-End Testing (Turn off Wi-Fi and verify full flow locally) | All Hands | 0.5 | 12:30 PM |
