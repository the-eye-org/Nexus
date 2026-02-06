import uuid
import hashlib
from datetime import datetime, timedelta
from functools import wraps
from flask import request, make_response, jsonify
from models import sessions_collection
from config import Config


def generate_fingerprint(request):
    """Generate a soft browser fingerprint from request headers."""
    user_agent = request.headers.get('User-Agent', '')
    accept_language = request.headers.get('Accept-Language', '')
    accept_encoding = request.headers.get('Accept-Encoding', '')
    
    fingerprint_string = f"{user_agent}|{accept_language}|{accept_encoding}"
    return hashlib.md5(fingerprint_string.encode()).hexdigest()


def create_session(request):
    """Create a new game session."""
    session_id = str(uuid.uuid4())
    fingerprint = generate_fingerprint(request)
    ip_address = request.remote_addr
    
    session_data = {
        "sessionId": session_id,
        "createdAt": datetime.utcnow(),
        "lastActivity": datetime.utcnow(),
        "completedAvengers": [],
        "stones": [],
        "attempts": {},
        "activePath": None,
        "flagsSolved": [],
        "sequences": {},
        "fingerprint": fingerprint,
        "ip": ip_address,
        "status": "ACTIVE"
    }
    
    sessions_collection.insert_one(session_data)
    return session_id, session_data


def get_session_from_cookie(request):
    """Retrieve session from cookie."""
    session_id = request.cookies.get(Config.SESSION_COOKIE_NAME)
    
    if not session_id:
        return None
    
    session = sessions_collection.find_one({"sessionId": session_id})
    
    if not session:
        return None
    
    # Check if session expired
    expiry_threshold = datetime.utcnow() - timedelta(hours=Config.SESSION_EXPIRY_HOURS)
    if session.get("lastActivity", datetime.utcnow()) < expiry_threshold:
        sessions_collection.delete_one({"sessionId": session_id})
        return None
    
    return session


def update_session(session_id, updates):
    """Update session data in database."""
    updates["lastActivity"] = datetime.utcnow()
    
    sessions_collection.update_one(
        {"sessionId": session_id},
        {"$set": updates}
    )


def get_or_create_session(request):
    """Get existing session or create new one."""
    session = get_session_from_cookie(request)
    
    if session:
        # Update last activity
        update_session(session["sessionId"], {})
        return session["sessionId"], session
    
    # Create new session
    return create_session(request)


def session_required(f):
    """Decorator to ensure session exists for route."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        session_id, session = get_or_create_session(request)
        
        # Attach session to request context
        request.session_id = session_id
        request.session = session
        
        # Execute route function
        response = make_response(f(*args, **kwargs))
        
        # Set session cookie in response
        response.set_cookie(
            Config.SESSION_COOKIE_NAME,
            session_id,
            httponly=Config.SESSION_COOKIE_HTTPONLY,
            secure=Config.SESSION_COOKIE_SECURE,
            samesite=Config.SESSION_COOKIE_SAMESITE,
            max_age=Config.SESSION_EXPIRY_HOURS * 3600
        )
        
        return response
    
    return decorated_function


def validate_session_integrity(request, session):
    """Validate session hasn't been tampered with (soft check)."""
    current_fingerprint = generate_fingerprint(request)
    stored_fingerprint = session.get("fingerprint", "")
    
    # Soft validation - log if mismatch but don't block
    if current_fingerprint != stored_fingerprint:
        print(f"⚠️ Session fingerprint mismatch: {session['sessionId']}")
        return False
    
    return True
