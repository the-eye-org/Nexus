from flask import Blueprint, request, jsonify
from middleware import session_required, update_session
from models import analytics_collection
from config import Config
from datetime import datetime

avenger_bp = Blueprint("avenger", __name__)


def log_analytics(session_id, event, data=None):
    """Log analytics event."""
    log_entry = {
        "sessionId": session_id,
        "event": event,
        "timestamp": datetime.utcnow(),
        "data": data or {}
    }
    analytics_collection.insert_one(log_entry)


@avenger_bp.route("/start", methods=["POST"])
@session_required
def start_avenger_path():
    """
    Start an Avenger path.
    
    Body: { "avenger": "thor" }
    """
    data = request.get_json()
    avenger = data.get("avenger", "").lower()
    
    session = request.session
    session_id = request.session_id
    
    # Validate avenger exists
    if avenger not in Config.AVENGERS:
        return jsonify({"error": f"Invalid avenger: {avenger}"}), 400
    
    # Check if already completed
    if avenger in session.get("completedAvengers", []):
        return jsonify({"error": f"{avenger} already completed"}), 409
    
    # Check if another path is active
    if session.get("activePath") and session.get("activePath") != avenger:
        return jsonify({
            "error": f"Another path is active: {session['activePath']}. Complete it first."
        }), 409
    
    # Activate path
    update_session(session_id, {"activePath": avenger})
    
    # Log analytics
    log_analytics(session_id, "path_started", {"avenger": avenger})
    
    return jsonify({
        "message": f"{avenger.upper()} path activated",
        "avenger": avenger,
        "nextStep": get_next_step(avenger)
    }), 200


@avenger_bp.route("/sequence", methods=["POST"])
@session_required
def validate_sequence():
    """
    Validate puzzle sequences (e.g., Thor runes).
    
    Body: { "avenger": "thor", "sequence": [4, 1, 8, 3] }
    """
    data = request.get_json()
    avenger = data.get("avenger", "").lower()
    sequence = data.get("sequence", [])
    
    session = request.session
    session_id = request.session_id
    
    # Validate active path
    if session.get("activePath") != avenger:
        return jsonify({"error": f"{avenger} path not active"}), 403
    
    # Thor rune validation
    if avenger == "thor":
        correct_sequence = Config.THOR_RUNE_SEQUENCE
        
        if sequence == correct_sequence:
            # Success - unlock next stage
            update_session(session_id, {
                f"sequences.thorRunes": sequence,
                "thorRunesCompleted": True
            })
            
            log_analytics(session_id, "sequence_completed", {
                "avenger": "thor",
                "sequence": "runes"
            })
            
            return jsonify({
                "success": True,
                "message": "Bifrost unlocked!",
                "nextStep": "/bifrost"
            }), 200
        else:
            # Wrong sequence - reset
            log_analytics(session_id, "sequence_failed", {
                "avenger": "thor",
                "attempted": sequence
            })
            
            return jsonify({
                "success": False,
                "message": "Wrong rune sequence. Try again.",
                "redirect": "/struck"
            }), 200
    
    # Add more sequence validations for other Avengers here
    
    return jsonify({"error": "No sequence validation for this avenger"}), 400


@avenger_bp.route("/status", methods=["GET"])
@session_required
def get_status():
    """Get current game status."""
    session = request.session
    
    return jsonify({
        "activePath": session.get("activePath"),
        "completedAvengers": session.get("completedAvengers", []),
        "stones": session.get("stones", []),
        "attempts": session.get("attempts", {}),
        "totalStones": len(session.get("stones", [])),
        "progress": f"{len(session.get('completedAvengers', []))}/6"
    }), 200


@avenger_bp.route("/reset", methods=["POST"])
@session_required
def reset_path():
    """Reset current active path (for debugging/testing)."""
    session_id = request.session_id
    
    update_session(session_id, {"activePath": None})
    
    return jsonify({"message": "Active path cleared"}), 200


def get_next_step(avenger):
    """Get next step for each Avenger path."""
    next_steps = {
        "ironman": "/workshop",
        "thor": "/asgard",
        "hulk": "/lab",
        "captainamerica": "/brooklyn",
        "blackwidow": "/redroom",
        "hawkeye": "/farm"
    }
    
    return next_steps.get(avenger, "/")
