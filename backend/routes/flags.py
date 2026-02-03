import hashlib
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from bson import ObjectId
from models import flags_collection, submissions_collection, users_collection

flags_bp = Blueprint("flags", __name__)


def hash_flag(flag: str) -> str:
    """Hash flag using SHA-256 for secure storage and comparison."""
    return hashlib.sha256(flag.strip().encode("utf-8")).hexdigest()


@flags_bp.route("/submit-flag", methods=["POST"])
@jwt_required()
def submit_flag():
    """
    Submit a flag for validation.
    
    Endpoint: POST /submit-flag
    Headers: Authorization: Bearer <JWT_TOKEN>
    
    Body:
    {
        "flag": "FLAG{example}"
    }
    
    Backend logic:
    - Verify JWT
    - Hash submitted flag using SHA-256
    - Check correctness against flags collection
    - Reject duplicate correct flags per user
    - Store submission with is_correct status
    - Update leaderboard (user score)
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    
    flag = data.get("flag", "").strip()
    
    if not flag:
        return jsonify({"error": "Flag is required"}), 400
    
    # Hash the submitted flag using SHA-256
    flag_hash = hash_flag(flag)
    timestamp = datetime.utcnow()
    
    # Check if flag exists in database (correct flag)
    flag_doc = flags_collection.find_one({"flag_hash": flag_hash})
    is_correct = flag_doc is not None
    
    if is_correct:
        # Check if user already submitted this CORRECT flag (prevent replay)
        existing_correct = submissions_collection.find_one({
            "user_id": user_id,
            "flag_hash": flag_hash,
            "is_correct": True
        })
        
        if existing_correct:
            return jsonify({
                "error": "You have already submitted this flag correctly",
                "is_correct": True,
                "duplicate": True
            }), 409
    
    # Record the submission (ALL submissions - correct and incorrect)
    submission = {
        "user_id": user_id,
        "flag_hash": flag_hash,
        "is_correct": is_correct,
        "timestamp": timestamp,
        "points": flag_doc.get("points", 0) if is_correct else 0
    }
    
    submissions_collection.insert_one(submission)
    
    if is_correct:
        # Update user's total score
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$inc": {"score": flag_doc.get("points", 0)},
                "$set": {"last_correct_submission": timestamp}
            }
        )
        
        return jsonify({
            "message": "Correct flag!",
            "is_correct": True,
            "points_awarded": flag_doc.get("points", 0)
        }), 200
    else:
        return jsonify({
            "message": "Incorrect flag",
            "is_correct": False,
            "points_awarded": 0
        }), 200


@flags_bp.route("/submissions", methods=["GET"])
@jwt_required()
def get_submissions():
    """
    Get submission history for the logged-in user.
    
    Endpoint: GET /submissions
    Headers: Authorization: Bearer <JWT_TOKEN>
    
    Returns:
    - All submissions of logged-in user
    - Correct / incorrect status
    - Timestamps
    """
    user_id = get_jwt_identity()
    
    # Get all submissions for this user, sorted by timestamp (newest first)
    submissions = list(submissions_collection.find(
        {"user_id": user_id}
    ).sort("timestamp", -1))
    
    result = []
    for sub in submissions:
        result.append({
            "flag_hash": sub.get("flag_hash", "")[:16] + "...",  # Partial hash for reference
            "is_correct": sub.get("is_correct", False),
            "points": sub.get("points", 0),
            "timestamp": sub.get("timestamp").isoformat() if sub.get("timestamp") else None
        })
    
    # Get user stats
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    total_score = user.get("score", 0) if user else 0
    correct_count = submissions_collection.count_documents({"user_id": user_id, "is_correct": True})
    
    return jsonify({
        "submissions": result,
        "total_submissions": len(result),
        "correct_submissions": correct_count,
        "total_score": total_score
    }), 200
