from flask import Blueprint, jsonify, request
from models import teams_collection, analytics_collection, game_flags_collection
from middleware import strong_auth_required
from datetime import datetime

leaderboard_bp = Blueprint("leaderboard", __name__)

@leaderboard_bp.route("/", methods=["GET"])
def get_leaderboard():
    """
    Public Leaderboard: Top Teams by Score with Ranking Logic.
    
    Ranking Criteria:
    1. Primary: Total Score (descending)
    2. Tiebreaker 1: Number of stones collected (descending)
    3. Tiebreaker 2: Number of flags solved (descending)
    4. Tiebreaker 3: Team creation timestamp (earliest wins)
    """
    # Fetch all teams with relevant fields
    teams = list(teams_collection.find(
        {}, 
        {
            "team_name": 1, 
            "score": 1, 
            "collected_stones": 1, 
            "solved_flags": 1,
            "completed_avengers": 1,
            "created_at": 1,
            "_id": 0
        }
    ))
    
    # Calculate additional statistics for each team
    for team in teams:
        team["stones_count"] = len(team.get("collected_stones", []))
        team["flags_count"] = len(team.get("solved_flags", []))
        team["completed_count"] = len(team.get("completed_avengers", []))
        
        # Calculate progress percentage (6 avengers total)
        total_avengers = 6
        team["progress_percentage"] = round((team["completed_count"] / total_avengers) * 100, 1)
    
    # Sort teams with proper tiebreaker logic
    sorted_teams = sorted(
        teams,
        key=lambda x: (
            -x.get("score", 0),                    # Primary: Score (descending)
            -x["stones_count"],                     # Tiebreaker 1: Stones (descending)
            -x["flags_count"],                      # Tiebreaker 2: Flags (descending)
            x.get("created_at", datetime.max)       # Tiebreaker 3: Created time (ascending)
        )
    )
    
    # Add rank to each team
    for idx, team in enumerate(sorted_teams, start=1):
        team["rank"] = idx
    
    # Limit to top 20 teams
    top_teams = sorted_teams[:20]
    
    # Remove internal fields from response
    for team in top_teams:
        team.pop("created_at", None)
    
    return jsonify({
        "leaderboard": top_teams,
        "total_teams": len(teams),
        "timestamp": datetime.utcnow().isoformat()
    }), 200


@leaderboard_bp.route("/team/<team_name>", methods=["GET"])
def get_team_stats(team_name):
    """
    Public Team Statistics: Get detailed stats for a specific team.
    """
    team = teams_collection.find_one(
        {"team_name": team_name},
        {"_id": 0, "password_hash": 0}
    )
    
    if not team:
        return jsonify({"error": "Team not found"}), 404
    
    # Calculate statistics
    stats = {
        "team_name": team["team_name"],
        "score": team.get("score", 0),
        "stones_collected": len(team.get("collected_stones", [])),
        "flags_solved": len(team.get("solved_flags", [])),
        "avengers_completed": len(team.get("completed_avengers", [])),
        "progress_percentage": round((len(team.get("completed_avengers", [])) / 6) * 100, 1),
        "collected_stones_list": team.get("collected_stones", []),
        "solved_flags_list": team.get("solved_flags", []),
        "completed_avengers_list": team.get("completed_avengers", [])
    }
    
    # Get team's rank
    all_teams = list(teams_collection.find({}, {"team_name": 1, "score": 1, "collected_stones": 1, "solved_flags": 1, "created_at": 1}))
    for t in all_teams:
        t["stones_count"] = len(t.get("collected_stones", []))
        t["flags_count"] = len(t.get("solved_flags", []))
    
    sorted_teams = sorted(
        all_teams,
        key=lambda x: (
            -x.get("score", 0),
            -x["stones_count"],
            -x["flags_count"],
            x.get("created_at", datetime.max)
        )
    )
    
    rank = next((idx + 1 for idx, t in enumerate(sorted_teams) if t["team_name"] == team_name), None)
    stats["rank"] = rank
    stats["total_teams"] = len(all_teams)
    
    return jsonify(stats), 200


@leaderboard_bp.route("/activity", methods=["GET"])
@strong_auth_required
def get_team_activity():
    """
    Private Activity Log for Logged-In Team with Enhanced Details.
    """
    team_name = request.team['team_name']
    
    # Get activity logs
    logs = list(analytics_collection.find(
        {"team_name": team_name},
        {"_id": 0}
    ).sort("timestamp", -1).limit(100))
    
    # Format timestamps for better readability
    for log in logs:
        if "timestamp" in log:
            log["timestamp"] = log["timestamp"].isoformat() if isinstance(log["timestamp"], datetime) else log["timestamp"]
    
    # Get activity summary
    activity_summary = {
        "total_activities": len(logs),
        "flag_successes": len([l for l in logs if l.get("activity_type") == "FLAG_SUCCESS"]),
        "flag_failures": len([l for l in logs if l.get("activity_type") == "FLAG_FAIL"]),
        "stones_acquired": len([l for l in logs if l.get("activity_type") == "STONE_ACQUIRED"]),
        "question_failures": len([l for l in logs if l.get("activity_type") == "QUESTION_FAIL"]),
        "logins": len([l for l in logs if l.get("activity_type") == "LOGIN"])
    }
    
    return jsonify({
        "team": team_name,
        "logs": logs,
        "summary": activity_summary
    }), 200


@leaderboard_bp.route("/stats", methods=["GET"])
def get_global_stats():
    """
    Global Game Statistics: Overall game progress and statistics.
    """
    total_teams = teams_collection.count_documents({})
    
    # Get teams that have collected all 6 stones
    perfect_teams = teams_collection.count_documents({
        "collected_stones": {"$size": 6}
    })
    
    # Get average score
    pipeline = [
        {"$group": {"_id": None, "avg_score": {"$avg": "$score"}}}
    ]
    avg_result = list(teams_collection.aggregate(pipeline))
    avg_score = round(avg_result[0]["avg_score"], 2) if avg_result else 0
    
    # Get stone collection stats
    stone_stats = {}
    stones = ["power", "space", "mind", "time", "soul", "reality"]
    for stone in stones:
        count = teams_collection.count_documents({
            "collected_stones": stone
        })
        stone_stats[stone] = count
    
    # Get avenger completion stats
    avenger_stats = {}
    avengers = ["ironman", "captainamerica", "thor", "deadpool", "hulk", "hawkeye"]
    for avenger in avengers:
        count = teams_collection.count_documents({
            "completed_avengers": avenger
        })
        avenger_stats[avenger] = count
    
    return jsonify({
        "total_teams": total_teams,
        "perfect_teams": perfect_teams,
        "average_score": avg_score,
        "stone_collection_stats": stone_stats,
        "avenger_completion_stats": avenger_stats,
        "timestamp": datetime.utcnow().isoformat()
    }), 200

