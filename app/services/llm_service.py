import json
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from flask import request, current_app
from itsdangerous import URLSafeTimedSerializer
from app.models import User

RAG_EMBEDDING_MODEL: Optional[Any] = None
RAG_INDEX: Optional[Any] = None
RAG_CHUNKS: List[str] = []
RAG_ERROR: Optional[str] = None

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



def chunk_text(text: str, chunk_size: int = 500, overlap: int = 80) -> List[str]:
    if not text:
        return []
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []
    chunks: List[str] = []
    start = 0
    while start < len(cleaned):
        end = min(len(cleaned), start + chunk_size)
        chunk = cleaned[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(cleaned):
            break
        start = max(0, end - overlap)
    return chunks



def initialize_rag_index(file_path: Optional[str] = None) -> Tuple[Optional[Any], List[str]]:
    global RAG_EMBEDDING_MODEL, RAG_INDEX, RAG_CHUNKS, RAG_ERROR

    if RAG_INDEX is not None and RAG_CHUNKS:
        return RAG_INDEX, RAG_CHUNKS

    candidates = []
    if file_path:
        candidates.append(file_path)

    base_dir = os.path.dirname(os.path.dirname(__file__))
    candidates.extend(
        [
            os.path.join(base_dir, "static", "policy_handbook.txt"),
            os.path.join(base_dir, "README.md"),
            os.path.join(base_dir, "SPEC_KIT.md"),
        ]
    )

    raw_text = ""
    for candidate in candidates:
        if not candidate or not os.path.exists(candidate):
            continue
        try:
            with open(candidate, "r", encoding="utf-8") as handle:
                raw_text = handle.read()
            break
        except Exception:
            continue

    if not raw_text:
        raw_text = (
            "Company policy handbook: employees should submit leave requests at "
            "least three working days in advance. Remote work requires prior "
            "manager approval. Benefits information is shared during onboarding "
            "and updated annually."
        )

    chunks = chunk_text(raw_text)
    if not chunks:
        RAG_ERROR = "No policy content available"
        return None, []

    try:
        from sentence_transformers import SentenceTransformer
        import faiss
        import numpy as np
    except Exception as exc:
        RAG_ERROR = str(exc)
        RAG_CHUNKS = chunks
        return None, chunks

    try:
        if RAG_EMBEDDING_MODEL is None:
            RAG_EMBEDDING_MODEL = SentenceTransformer("all-MiniLM-L6-v2")

        embeddings = RAG_EMBEDDING_MODEL.encode(
            chunks,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        embeddings = np.asarray(embeddings, dtype="float32")
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(embeddings)

        RAG_INDEX = index
        RAG_CHUNKS = chunks
        RAG_ERROR = None
        return index, chunks
    except Exception as exc:
        RAG_ERROR = str(exc)
        RAG_CHUNKS = chunks
        return None, chunks



def process_leave_with_llm(raw_text: str) -> Dict[str, Any]:
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



def process_expense_with_llm(raw_text: str) -> Dict[str, Any]:
    llm = get_llm()
    if not llm:
        return {
            "vendor": "Unknown",
            "date": datetime.utcnow().date().isoformat(),
            "amount": "0.00",
            "currency": "USD",
        }
    system_prompt = (
        "You are a strict JSON data extractor. "
        "Extract 'vendor', 'date', 'amount', and 'currency' from the receipt text. "
        "Return ONLY valid JSON with keys: vendor, date, amount, currency. No other text."
    )
    prompt = f"{system_prompt}\nText: {raw_text}\nJSON:"
    response = llm(prompt, max_tokens=120, temperature=0.1)
    try:
        output_text = response["choices"][0]["text"].strip()
        parsed = json.loads(output_text)
        return parsed
    except Exception:
        return {
            "vendor": "Unknown",
            "date": datetime.utcnow().date().isoformat(),
            "amount": "0.00",
            "currency": "USD",
        }



def parse_hr_ticket(raw_text: str) -> Dict[str, Any]:
    llm = get_llm()
    if not llm:
        return {
            "original_language": "unknown",
            "category": "other",
            "english_summary": "Mocked summary due to missing model",
        }
    system_prompt = (
        "You are an HR classification system. Read the following text. "
        "1. Identify the ISO language code. "
        "2. Translate the core issue to English. "
        "3. Categorize it as 'payroll', 'equipment', 'leave', or 'other'. "
        'Output ONLY valid JSON in this format: {"original_language": "te", '
        '"category": "payroll", "english_summary": "..."}. '
        "No markdown, no explanations."
    )
    prompt = f"{system_prompt}\nText: {raw_text}\nJSON:"
    response = llm(prompt, max_tokens=200, temperature=0.1)
    try:
        output_text = response["choices"][0]["text"].strip()
        parsed = json.loads(output_text)
        return parsed
    except Exception:
        return {
            "original_language": "unknown",
            "category": "other",
            "english_summary": "Failed to parse AI output",
        }


