import hashlib
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from middleware import session_required, update_session
from models import game_flags_collection, analytics_collection
from config import Config

game_bp = Blueprint("game", __name__)


def hash_flag(flag):
    """Hash flag using SHA-256."""
    return hashlib.sha256(flag.strip().encode('utf-8')).hexdigest()


def log_analytics(session_id, event, data=None):
    """Log analytics event."""
    log_entry = {
        "sessionId": session_id,
        "event": event,
        "timestamp": datetime.utcnow(),
        "data": data or {}
    }
    analytics_collection.insert_one(log_entry)


def check_cooldown(session, avenger):
    """Check if avenger is on cooldown."""
    attempts = session.get("attempts", {})
    avenger_attempts = attempts.get(avenger, 0)
    
    if avenger_attempts >= Config.MAX_ATTEMPTS_PER_AVENGER:
        # Check if cooldown expired
        cooldown_key = f"cooldown_{avenger}"
        cooldown_until = session.get(cooldown_key)
        
        if cooldown_until:
            if datetime.utcnow() < cooldown_until:
                remaining = (cooldown_until - datetime.utcnow()).total_seconds()
                return True, int(remaining)
            else:
                # Cooldown expired, reset attempts
                return False, 0
        else:
            # Set cooldown
            return True, Config.COOLDOWN_DURATION_MINUTES * 60
    
    return False, 0


@game_bp.route("/submit-flag", methods=["POST"])
@session_required
def submit_flag():
    """
    Submit flag for current Avenger.
    
    Body: { "avenger": "ironman", "flag": "FLAG{ARC_REACTOR_CORE}" }
    """
    data = request.get_json()
    avenger = data.get("avenger", "").lower()
    flag = data.get("flag", "").strip()
    
    session = request.session
    session_id = request.session_id
    
    # Validate inputs
    if not avenger or not flag:
        return jsonify({"error": "Avenger and flag required"}), 400
    
    if avenger not in Config.AVENGERS:
        return jsonify({"error": "Invalid avenger"}), 400
    
    # Check if active path matches
    if session.get("activePath") != avenger:
        return jsonify({"error": f"{avenger} path not active. Start the path first."}), 403
    
    # Check if already completed
    if avenger in session.get("completedAvengers", []):
        return jsonify({"error": f"{avenger} already completed"}), 409
    
    # Check cooldown
    on_cooldown, remaining_seconds = check_cooldown(session, avenger)
    if on_cooldown:
        minutes = remaining_seconds // 60
        return jsonify({
            "error": f"Too many attempts. Cooldown active for {minutes} minutes.",
            "cooldownRemaining": remaining_seconds
        }), 429
    
    # Hash and validate flag
    flag_hash = hash_flag(flag)
    correct_flag = game_flags_collection.find_one({"avenger": avenger})
    
    if not correct_flag:
        return jsonify({"error": "Flag configuration error"}), 500
    
    # Check if correct
    if flag_hash == correct_flag["flag_hash"]:
        # SUCCESS - Award stone
        stone = Config.STONE_MAPPING[avenger]
        
        # Atomic update - add stone and complete avenger
        from models import sessions_collection
        sessions_collection.update_one(
            {"sessionId": session_id},
            {
                "$addToSet": {
                    "stones": stone,
                    "completedAvengers": avenger,
                    "flagsSolved": flag
                },
                "$set": {
                    "activePath": None,
                    f"completedAt_{avenger}": datetime.utcnow()
                },
                "$unset": {
                    f"cooldown_{avenger}": ""
                }
            }
        )
        
        # Reset attempts for this avenger
        attempts = session.get("attempts", {})
        attempts[avenger] = 0
        update_session(session_id, {"attempts": attempts})
        
        # Log success
        log_analytics(session_id, "flag_correct", {
            "avenger": avenger,
            "stone": stone,
            "attempts": session.get("attempts", {}).get(avenger, 0)
        })
        
        return jsonify({
            "success": True,
            "message": f"{stone.upper()} STONE ACQUIRED!",
            "stone": stone,
            "avenger": avenger,
            "totalStones": len(session.get("stones", [])) + 1
        }), 200
    
    else:
        # WRONG FLAG - Increment attempts
        attempts = session.get("attempts", {})
        attempts[avenger] = attempts.get(avenger, 0) + 1
        
        updates = {"attempts": attempts}
        
        # Apply cooldown if max attempts reached
        if attempts[avenger] >= Config.MAX_ATTEMPTS_PER_AVENGER:
            cooldown_until = datetime.utcnow() + timedelta(minutes=Config.COOLDOWN_DURATION_MINUTES)
            updates[f"cooldown_{avenger}"] = cooldown_until
        
        update_session(session_id, updates)
        
        # Log failure
        log_analytics(session_id, "flag_wrong", {
            "avenger": avenger,
            "attempts": attempts[avenger]
        })
        
        return jsonify({
            "success": False,
            "message": "Incorrect flag",
            "attempts": attempts[avenger],
            "maxAttempts": Config.MAX_ATTEMPTS_PER_AVENGER,
            "remainingAttempts": Config.MAX_ATTEMPTS_PER_AVENGER - attempts[avenger]
        }), 200


@game_bp.route("/stones", methods=["GET"])
@session_required
def get_stones():
    """Get collected stones."""
    session = request.session
    
    stones = session.get("stones", [])
    completed = session.get("completedAvengers", [])
    
    stone_details = []
    for avenger in completed:
        stone = Config.STONE_MAPPING.get(avenger)
        if stone:
            stone_details.append({
                "avenger": avenger,
                "stone": stone,
                "completedAt": session.get(f"completedAt_{avenger}")
            })
    
    return jsonify({
        "stones": stones,
        "count": len(stones),
        "details": stone_details
    }), 200
