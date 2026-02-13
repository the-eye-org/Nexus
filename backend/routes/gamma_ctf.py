# routes/gamma_ctf.py

from flask import Blueprint, request, jsonify
from middleware import strong_auth_required
import jwt
import hashlib

gamma_ctf_bp = Blueprint("gamma_ctf", __name__)

# Stage 4: Vulnerable SQL endpoint (intentionally for CTF)
@gamma_ctf_bp.route("/gamma-analyze", methods=["POST"])
def gamma_analyze():
    """
    Intentionally vulnerable SQL injection endpoint for CTF.
    DO NOT USE IN PRODUCTION!
    """
    sample_id = request.json.get("sample_id", "")
    
    # Intentionally vulnerable query (DO NOT DO THIS IN REAL APPS!)
    query = f"SELECT * FROM gamma_data WHERE sample_id = '{sample_id}'"
    
    # Check for SQL injection patterns
    sql_patterns = ["' OR '", "1=1", "UNION", "SELECT", "--", ";"]
    is_injection = any(pattern.lower() in sample_id.lower() for pattern in sql_patterns)
    
    if is_injection:
        # Successful SQL injection - return flag
        return jsonify({
            "success": True,
            "data": [{
                "id": 1,
                "flag": "FLAG{HULK_GAMMA_MASTER_2026}",
                "created_at": "2026-01-01"
            }]
        }), 200
    else:
        return jsonify({
            "success": False,
            "message": "No data found"
        }), 404

# Verify JWT token
def verify_jwt(token):
    try:
        payload = jwt.decode(token, "HULK_SECRET_2026", algorithms=["HS256"])
        if payload.get("role") == "admin" and payload.get("user") == "banner":
            return True
    except:
        return False
    return False