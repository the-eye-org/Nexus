import re
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import bcrypt
from models import users_collection

auth_bp = Blueprint("auth", __name__)

# Strict email validation regex: 2[0-9]{5}@psgtech.ac.in
EMAIL_REGEX = re.compile(r"^2[a-zA-Z0-9]{5}@psgtech\.ac\.in$")


def validate_email(email: str) -> bool:
    """Validate email matches PSG Tech format: 2XXXXX@psgtech.ac.in"""
    return bool(EMAIL_REGEX.match(email))


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash."""
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


@auth_bp.route("/signup", methods=["POST"])
def signup():
    """
    User signup endpoint.
    
    Body:
    {
        "email": "2XXXXX@psgtech.ac.in",
        "password": "your_password"
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    
    # Validate email format
    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    if not validate_email(email):
        return jsonify({
            "error": "Invalid email format. Must match: 2XXXXX@psgtech.ac.in (e.g., 220123@psgtech.ac.in)"
        }), 400
    
    # Validate password
    if not password:
        return jsonify({"error": "Password is required"}), 400
    
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    
    # Check if user already exists
    existing_user = users_collection.find_one({"email": email})
    if existing_user:
        return jsonify({"error": "Email already registered"}), 409
    
    # Create new user
    user = {
        "email": email,
        "password_hash": hash_password(password),
        "created_at": datetime.utcnow()
    }
    
    result = users_collection.insert_one(user)
    
    return jsonify({
        "message": "User registered successfully",
        "user_id": str(result.inserted_id)
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    User login endpoint.
    
    Body:
    {
        "email": "2XXXXX@psgtech.ac.in",
        "password": "your_password"
    }
    
    Returns:
    {
        "access_token": "JWT_TOKEN",
        "message": "Login successful"
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    # Find user
    user = users_collection.find_one({"email": email})
    
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Verify password
    if not verify_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Create JWT token with user_id as identity
    access_token = create_access_token(identity=str(user["_id"]))
    
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "email": user["email"]
    }), 200
