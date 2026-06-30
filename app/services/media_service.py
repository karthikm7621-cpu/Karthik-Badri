import json
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from flask import request, current_app
from itsdangerous import URLSafeTimedSerializer
from app.models import User

def transcribe_audio(file_path: str) -> str:
    try:
        import whisper

        model = whisper.load_model("tiny.en", device="cpu")
        result = model.transcribe(file_path)
        return result["text"]
    except ImportError:
        return "Mocked transcription: User needs tomorrow off due to sickness."
    except Exception as e:
        return f"Transcription failed: {str(e)}"



def get_ocr_reader() -> Any:
    try:
        from easyocr import Reader

        return Reader(["en"], gpu=False)
    except Exception:
        return None



def extract_text_from_image(image_path: str) -> str:
    if not image_path or not os.path.exists(image_path):
        return ""
    try:
        import onnxruntime as ort

        providers = ort.get_available_providers()
        if "CPUExecutionProvider" not in providers:
            return ""
    except Exception:
        return ""
    try:
        from PIL import Image

        with Image.open(image_path) as image:
            image.convert("RGB").save(image_path)
    except Exception:
        pass
    reader = get_ocr_reader()
    if reader is None:
        return ""
    try:
        results = reader.readtext(image_path, detail=0, paragraph=True)
        return " ".join(part for part in results if part).strip()
    except Exception:
        return ""



def extract_text_from_pdf(file_path: str) -> str:
    if not file_path or not os.path.exists(file_path):
        return ""
    try:
        import fitz
    except Exception:
        return ""
    text_parts = []
    try:
        doc = fitz.open(file_path)
        for page in doc:
            try:
                page_text = page.get_text()
            except Exception:
                page_text = ""
            if page_text:
                text_parts.append(page_text)
        doc.close()
    except Exception:
        return ""
    return "\n".join(part for part in text_parts if part).strip()


