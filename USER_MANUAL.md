# User Manual

Welcome to the comprehensive user manual for our production application. This document provides step-by-step instructions for installation, configuration, and operation.

## Table of Contents
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Usage Examples](#usage-examples)
4. [Troubleshooting](#troubleshooting)
5. [FAQ](#faq)

---

## Installation

### Prerequisites
- Docker & Docker Compose (Recommended)
- Python 3.11+ (For local development)
- Git

### Using Docker (Production Parity)
```bash
git clone <repository_url>
cd <repository_directory>
docker build -t app-service .
docker run -p 8000:8000 --env-file .env app-service
```

### Local Development
```bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
python app.py
```

## Configuration

All configuration is managed via Environment Variables. Copy the `.env.example` file to `.env` and configure accordingly:
```bash
cp .env.example .env
```

Key configuration parameters:
- `FLASK_ENV`: Set to `production` or `development`.
- `DATABASE_URL`: Connection string for the primary database.
- `SECRET_KEY`: Cryptographic key used for sessions.

## Usage Examples

### Accessing the UI
Navigate to `http://localhost:8000` in your browser. The responsive UI allows you to input data payloads for processing.

### API Interaction
You can interact with the backend programmatically:
```bash
curl -X POST http://localhost:8000/api/process \
  -H "Content-Type: application/json" \
  -d '{"sample_key": "sample_value", "metrics": [1, 2, 3]}'
```

## Troubleshooting

- **Port Conflict (8000):** If port 8000 is already in use, change the mapping in the Docker command: `docker run -p 8080:8000 app-service`.
- **Missing Environment Variables:** Ensure your `.env` file is present and properly sourced. The app will fail to start if critical keys like `SECRET_KEY` are missing in production.

## FAQ

**Q: Does this app support cross-origin requests (CORS)?**
A: By default, CORS is restrictive. If you are deploying a decoupled frontend, ensure you configure the allowed origins in the application settings.

**Q: How do I clear the local database cache?**
A: You can delete the `instance/` folder locally, which will force SQLite to recreate the schema on the next run.
