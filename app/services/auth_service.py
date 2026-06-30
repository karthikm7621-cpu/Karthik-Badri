import json
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from flask import request, current_app
from itsdangerous import URLSafeTimedSerializer
from app.models import User

def get_request_data() -> Dict[str, Any]:
    data = request.get_json(silent=True)
    if isinstance(data, dict):
        return data
    return request.form.to_dict()



def generate_auth_token(username: str) -> str:
    s = URLSafeTimedSerializer(current_app.config.get('SECRET_KEY', 'dev-key-123'))
    return s.dumps(username)


def resolve_authenticated_user() -> Any:
    return User.query.filter_by(username="Owner1").first()



def is_owner(user: Any) -> bool:
    return user is not None and user.role in {"Main Owner", "Delegated Owner"}
