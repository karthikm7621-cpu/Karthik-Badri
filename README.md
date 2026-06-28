# 🧠 CPU-First EMS: Smart Employee Management System

> **A fully offline, AI-powered Employee Management System that turns chaos into structure, running entirely on your CPU.**

Welcome to the **CPU-First EMS**, built for the **CPU-First Hackathon**. This project aims to revolutionize how small to medium businesses handle employee attendance, leave management, and profiles by leveraging the power of local, private, and lightweight AI models—without requiring an internet connection or expensive GPUs.

---

## 🚀 The Hackathon Angle: Unstructured Chaos to Structured Data

The core mission of our project is to demonstrate that advanced AI data extraction can be done **100% offline, running on standard CPU hardware**. We eliminate reliance on cloud APIs and expensive GPU clusters. 

How do we turn unstructured input into structured data?
1. **Smart Leave Parser**: Employees can simply type a messy message (e.g., *"I need to take off next Tuesday because I'm sick"*) or upload an audio voice note. Using **llama.cpp** (for text intent extraction) and **Whisper.cpp** (for offline audio transcription), we extract the exact intent, requested dates, and reason, converting it into a clean JSON payload that gets saved directly to our database.
2. **Smart Attendance OCR**: Employees upload an image of a handwritten timesheet or ID badge. We process this using a lightweight **ONNX Runtime (CPU)** vision model to extract the timestamp and employee ID, converting the visual unstructured data into structured, queryable attendance logs.

---

## 🏗 Architecture & Tech Stack

Our stack is designed to be lightweight, fully open-source, and extremely easy to deploy on any standard hardware.

*   **Frontend**: HTML5, CSS3, Vanilla JavaScript (No heavy frameworks, fast and responsive).
*   **Backend**: Python with Flask (Lightweight, easy to interface with local AI runtimes).
*   **Database**: SQLite (Serverless, single-file, 100% offline-first).
*   **AI Inference (CPU-Only)**:
    *   **Text Processing**: [llama.cpp](https://github.com/ggerganov/llama.cpp) (via Python bindings / Ollama) running a quantized small LLM (e.g., Llama 3 8B Q4 or Phi-3).
    *   **Audio Transcription**: [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) for fast, CPU-bound voice-to-text.
    *   **Computer Vision / OCR**: [ONNX Runtime (CPU)](https://onnxruntime.ai/) running a lightweight OCR model (e.g., EasyOCR or a quantized custom model).

---

## 🔌 How to Run (100% Offline)

To prove this works offline, we encourage you to **turn off your Wi-Fi** before running the application!

### Prerequisites
*   Python 3.10+
*   C/C++ Compiler (for compiling llama.cpp/whisper.cpp if building from source)
*   At least 8GB of RAM (16GB recommended for running the local LLM smoothly).

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/cpu-first-ems.git
   cd cpu-first-ems
   ```

2. **Download the offline AI models**
   *(Note: For the hackathon, we provide a script to download the required `.gguf` and `.onnx` model files before you go completely offline).*
   ```bash
   ./scripts/download_models.sh
   ```

3. **Set up the Python Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Initialize the local database**
   ```bash
   flask db init
   ```

5. **Start the offline server**
   ```bash
   flask run --host=0.0.0.0 --port=5000
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:5000`.

---

## ⚖️ License

This project is proudly open-source and released under the **GNU General Public License v3.0 (GPLv3)**. 
By using a strong copyleft license, we ensure that any derivative works based on our fully offline, CPU-first architecture remain free and open for the community.

See the [LICENSE](LICENSE) file for more details.
