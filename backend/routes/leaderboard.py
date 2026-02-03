from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from bson import ObjectId
from models import users_collection, submissions_collection

leaderboard_bp = Blueprint("leaderboard", __name__)


@leaderboard_bp.route("/leaderboard", methods=["GET"])
@jwt_required()
def get_leaderboard():
    """
    Get the live leaderboard.
    
    Endpoint: GET /leaderboard
    
    Leaderboard shows:
    - User email
    - Total correct flags
    - Total points
    - Time elapsed (from first correct submission)
    - Rank
    
    Ranking priority (tiebreaker rules):
    1. Highest points
    2. Most correct flags
    3. Earliest correct submission (first to reach that score)
    """
    limit = request.args.get("limit", 100, type=int)
    limit = min(limit, 500)
    
    # Get current time for elapsed calculation
    now = datetime.utcnow()
    
    # Aggregation pipeline to compute leaderboard with proper ranking
    pipeline = [
        # Match only correct submissions
        {"$match": {"is_correct": True}},
        # Group by user to get stats
        {"$group": {
            "_id": "$user_id",
            "total_correct_flags": {"$sum": 1},
            "total_points": {"$sum": "$points"},
            "first_correct_submission": {"$min": "$timestamp"},
            "last_correct_submission": {"$max": "$timestamp"}
        }},
        # Sort by ranking priority: points DESC, correct_flags DESC, first_submission ASC
        {"$sort": {
            "total_points": -1,
            "total_correct_flags": -1,
            "last_correct_submission": 1
        }},
        # Limit results
        {"$limit": limit}
    ]
    
    aggregated = list(submissions_collection.aggregate(pipeline))
    
    # Build leaderboard with user details
    leaderboard = []
    for rank, entry in enumerate(aggregated, start=1):
        user_id = entry["_id"]
        
        # Get user email
        try:
            user = users_collection.find_one({"_id": ObjectId(user_id)})
            email = user.get("email", "unknown@psgtech.ac.in") if user else "unknown@psgtech.ac.in"
        except:
            email = "unknown@psgtech.ac.in"
        
        # Calculate time elapsed since first correct submission
        first_submission = entry.get("first_correct_submission")
        if first_submission:
            elapsed_seconds = int((now - first_submission).total_seconds())
            hours, remainder = divmod(elapsed_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            time_elapsed = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        else:
            time_elapsed = "00:00:00"
        
        leaderboard.append({
            "rank": rank,
            "email": email,
            "total_correct_flags": entry.get("total_correct_flags", 0),
            "total_points": entry.get("total_points", 0),
            "time_elapsed": time_elapsed,
            "first_solve": first_submission.isoformat() if first_submission else None
        })
    
    # Include users with 0 points at the bottom (optional)
    users_with_submissions = [e["_id"] for e in aggregated]
    
    return jsonify({
        "leaderboard": leaderboard,
        "total_participants": users_collection.count_documents({}),
        "participants_with_solves": len(leaderboard),
        "generated_at": now.isoformat()
    }), 200


@leaderboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    """
    Get overall CTF statistics.
    """
    total_users = users_collection.count_documents({})
    total_submissions = submissions_collection.count_documents({})
    correct_submissions = submissions_collection.count_documents({"is_correct": True})
    incorrect_submissions = submissions_collection.count_documents({"is_correct": False})
    
    # Get unique flags solved
    unique_flags = len(submissions_collection.distinct("flag_hash", {"is_correct": True}))
    
    # Top scorer aggregation
    pipeline = [
        {"$match": {"is_correct": True}},
        {"$group": {
            "_id": "$user_id",
            "total_points": {"$sum": "$points"}
        }},
        {"$sort": {"total_points": -1}},
        {"$limit": 1}
    ]
    
    top_result = list(submissions_collection.aggregate(pipeline))
    top_score = top_result[0]["total_points"] if top_result else 0
    
    return jsonify({
        "total_participants": total_users,
        "total_submissions": total_submissions,
        "correct_submissions": correct_submissions,
        "incorrect_submissions": incorrect_submissions,
        "unique_challenges_solved": unique_flags,
        "top_score": top_score
    }), 200


@leaderboard_bp.route("/user/<user_id>", methods=["GET"])
@jwt_required()
def get_user_rank(user_id):
    """
    Get a specific user's rank and detailed stats.
    """
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return jsonify({"error": "Invalid user ID"}), 400
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Get user's submission stats
    correct_count = submissions_collection.count_documents({"user_id": user_id, "is_correct": True})
    total_submissions = submissions_collection.count_documents({"user_id": user_id})
    
    # Calculate total points from submissions
    pipeline = [
        {"$match": {"user_id": user_id, "is_correct": True}},
        {"$group": {"_id": None, "total_points": {"$sum": "$points"}}}
    ]
    points_result = list(submissions_collection.aggregate(pipeline))
    user_points = points_result[0]["total_points"] if points_result else 0
    
    # Calculate rank using same logic as leaderboard
    rank_pipeline = [
        {"$match": {"is_correct": True}},
        {"$group": {
            "_id": "$user_id",
            "total_points": {"$sum": "$points"},
            "total_correct_flags": {"$sum": 1},
            "last_correct_submission": {"$max": "$timestamp"}
        }},
        {"$sort": {
            "total_points": -1,
            "total_correct_flags": -1,
            "last_correct_submission": 1
        }}
    ]
    
    all_rankings = list(submissions_collection.aggregate(rank_pipeline))
    
    # Find user's rank
    rank = 0
    for idx, entry in enumerate(all_rankings, start=1):
        if entry["_id"] == user_id:
            rank = idx
            break
    
    # If user has no submissions, they're unranked
    if rank == 0 and correct_count == 0:
        rank = len(all_rankings) + 1
    
    return jsonify({
        "user_id": user_id,
        "email": user.get("email", ""),
        "rank": rank,
        "total_points": user_points,
        "correct_submissions": correct_count,
        "total_submissions": total_submissions,
        "total_participants": users_collection.count_documents({})
    }), 200
