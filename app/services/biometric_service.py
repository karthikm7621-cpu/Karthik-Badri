import json
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from flask import request, current_app
from itsdangerous import URLSafeTimedSerializer
from app.models import User

def verify_face(image_file: Any, employee_id: str) -> bool:
    try:
        import cv2
        import face_recognition
        import numpy as np
    except ImportError:
        return False
    reference_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "static", "profiles", f"{employee_id}.jpg"
    )
    if not os.path.exists(reference_path):
        return False
    try:
        ref_image = face_recognition.load_image_file(reference_path)
        ref_encodings = face_recognition.face_encodings(ref_image)
        if not ref_encodings:
            return False
        file_bytes = np.frombuffer(image_file.read(), np.uint8)
        frame_image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if frame_image is None:
            return False
        rgb_frame = cv2.cvtColor(frame_image, cv2.COLOR_BGR2RGB)
        frame_encodings = face_recognition.face_encodings(rgb_frame)
        if not frame_encodings:
            return False
        distances = face_recognition.face_distance(ref_encodings, frame_encodings[0])
        return len(distances) > 0 and distances[0] < 0.6
    except Exception:
        return False


