from flask import Blueprint, request, jsonify
from middleware import strong_auth_required
from models import game_flags_collection, teams_collection, analytics_collection
from config import Config
from extensions import limiter
from datetime import datetime
import hashlib

import re


game_bp = Blueprint("game", __name__)

def log_activity(team_name, activity_type, details=None):
    analytics_collection.insert_one({
        "team_name": team_name,
        "activity_type": activity_type,
        "timestamp": datetime.utcnow(),
        "details": details or {}
    })

@game_bp.route("/submit-flag", methods=["POST"])
@strong_auth_required
@limiter.limit("10 per minute")
def submit_flag():
    """
    Stage 1: Submit Flag -> Get Points -> Return Question
    """
    team = request.team
    data = request.get_json()
    flag = data.get("flag", "").strip()
    osint_code = (data.get("osint_code", "") or "").strip()
    
    if not flag:
        return jsonify({"error": "Flag required"}), 400
        
    flag_hash = hashlib.sha256(flag.encode('utf-8')).hexdigest()
    
    # 1. Validate Flag
    game_flag = game_flags_collection.find_one({"flag_hash": flag_hash})
    if not game_flag:
        log_activity(team['team_name'], "FLAG_FAIL", {"flag_hash": flag_hash})
        return jsonify({"success": False, "message": "Incorrect Flag"}), 400
        
    avenger = game_flag['avenger']

    # Enforce OSINT token for specific challenges (e.g., Hulk)
    required_codes = Config.OSINT_CODES.get(avenger, [])
    if required_codes:
        normalized = osint_code.upper()
        if normalized not in required_codes:
            log_activity(team['team_name'], "OSINT_FAIL", {"avenger": avenger})
            return jsonify({
                "error": "Forensics token required",
                "hint": "Check robots.txt and gamma-logs; inspect response headers."
            }), 400
    
    # 2. Check if already solved
    if avenger in team.get('solved_flags', []):
        return jsonify({"error": "Flag already submitted for this Avenger"}), 409
        
    # 3. Update Team
    # For Hulk, defer points until Advanced CTF completion.
    if avenger == 'hulk':
        teams_collection.update_one(
            {"team_name": team['team_name']},
            {
                "$addToSet": {"solved_flags": avenger}
            }
        )
    else:
        teams_collection.update_one(
            {"team_name": team['team_name']},
            {
                "$addToSet": {"solved_flags": avenger},
                "$inc": {"score": Config.POINTS_FLAG}
            }
        )
    
    log_activity(team['team_name'], "FLAG_SUCCESS", {"avenger": avenger, "points": Config.POINTS_FLAG})
    
    resp = jsonify({
        "success": True, 
        "message": "Flag Accepted! Answer the Question to get the Stone.",
        "question": game_flag['question'],
        "points_awarded": Config.POINTS_FLAG,
        "avenger": avenger
    })
    # OSINT-friendly header hint (non-critical)
    resp.headers["X-Gamma-Fingerprint"] = "SkFERV9DUlVTSA=="  # base64 of JADE_CRUSH
    return resp, 200

@game_bp.route("/submit-answer", methods=["POST"])
@strong_auth_required
@limiter.limit("10 per minute")
def submit_answer():
    """
    Stage 2: Submit Answer -> Get Stone + Bonus Points
    """
    team = request.team
    data = request.get_json()
    avenger = data.get("avenger", "").lower()
    answer = data.get("answer", "").strip().lower()
    
    if not avenger or not answer:
        return jsonify({"error": "Avenger and Answer required"}), 400
        
    # 1. Verify Flag was solved first
    if avenger not in team.get('solved_flags', []):
        return jsonify({"error": "You must find the Flag first!"}), 403
        
    # 2. Check if Stone already collected
    stone = Config.STONE_MAPPING[avenger]
    if stone in team.get('collected_stones', []):
        return jsonify({"error": "Stone already collected"}), 409
        
    # 3. Validate Answer
    game_flag = game_flags_collection.find_one({"avenger": avenger})
    answer_hash = hashlib.sha256(answer.encode('utf-8')).hexdigest()
    
    if answer_hash != game_flag['answer_hash']:
        log_activity(team['team_name'], "QUESTION_FAIL", {"avenger": avenger})
        return jsonify({"success": False, "message": "Incorrect Answer"}), 400
        
    # 4. Award Stone & Bonus Points (except Hulk, which awards in Advanced CTF route)
    if avenger == 'hulk':
        # Record that the answer was correct but do not award points or stone yet
        teams_collection.update_one(
            {"team_name": team['team_name']},
            {
                "$addToSet": {
                    "completed_avengers": avenger
                }
            }
        )
    else:
        teams_collection.update_one(
            {"team_name": team['team_name']},
            {
                "$addToSet": {
                    "collected_stones": stone,
                    "completed_avengers": avenger
                },
                "$inc": {"score": Config.POINTS_ANSWER}
            }
        )
    
    log_activity(team['team_name'], "STONE_ACQUIRED", {"avenger": avenger, "stone": stone})
    
    if avenger == 'hulk':
        resp = jsonify({
            "success": True,
            "message": "Answer accepted. Proceed to Advanced CTF for final points.",
            "stone": stone,
            "points_awarded": 0
        })
    else:
        resp = jsonify({
            "success": True,
            "message": f"{stone.upper()} STONE ACQUIRED!",
            "stone": stone,
            "total_stones": len(team.get('collected_stones', [])) + 1,
            "points_awarded": Config.POINTS_ANSWER
        })
    # OSINT-friendly header hint (non-critical)
    resp.headers["X-Gamma-Signature"] = "TNZZN_FZNFU"  # ROT13 of GAMMA_SMASH
    return resp, 200


@game_bp.route("/hulk-osint", methods=["POST"])
@strong_auth_required
@limiter.limit("30 per minute")
def hulk_osint():
    """Validate Hulk forensics/OSINT token server-side without submitting any flag."""
    team = request.team
    data = request.get_json() or {}
    osint_code = (data.get("osint_code", "") or "").strip().upper()

    required_codes = Config.OSINT_CODES.get("hulk", [])
    if not osint_code or osint_code not in required_codes:
        log_activity(team["team_name"], "OSINT_FAIL", {"avenger": "hulk"})
        return jsonify({"success": False, "message": "Invalid forensics token."}), 400

    log_activity(team["team_name"], "OSINT_OK", {"avenger": "hulk"})
    return jsonify({"success": True, "message": "Forensics token accepted."}), 200


@game_bp.route("/hulk-logic-stage", methods=["POST"])
@strong_auth_required
@limiter.limit("30 per minute")
def hulk_logic_stage():
    """Validate Hulk GammaWave logic stages server-side.

    Stages:
    1 -> HULK (binary decoding)
    2 -> GAMMA_SMASH (ROT13 of TNZZN_FZNFU)
    3 -> EMERALD_SMASH (substitution cipher)
    4 -> JADE_CRUSH (hex to ASCII)
    """
    team = request.team
    data = request.get_json() or {}
    stage = int(data.get("stage", 0))
    answer = (data.get("answer", "") or "").strip().upper()

    if stage == 1:
        ok = answer == "HULK"
        error_message = "Incorrect. Try again."
    elif stage == 2:
        normalized = re.sub(r"[_\-\s]", "", answer)
        ok = normalized == "GAMMASMASH"
        error_message = "Incorrect. Try again."
    elif stage == 3:
        normalized = re.sub(r"[_\-\s]", "", answer)
        ok = normalized == "EMERALDSMASH"
        error_message = "Incorrect. Try again."
    elif stage == 4:
        normalized = re.sub(r"[_\-\s]", "", answer)
        ok = normalized == "JADECRUSH"
        error_message = "Incorrect. Try again."
    else:
        return jsonify({"error": "Invalid stage"}), 400

    if not ok:
        log_activity(team["team_name"], "HULK_LOGIC_FAIL", {"stage": stage})
        return jsonify({"success": False, "message": error_message}), 400

    log_activity(team["team_name"], "HULK_LOGIC_STAGE_OK", {"stage": stage})
    return jsonify({"success": True}), 200

@game_bp.route("/submit-advanced-flag", methods=["POST"])
@strong_auth_required
@limiter.limit("10 per minute")
def submit_advanced_flag():
    """
    Final stage for Hulk: submit Advanced CTF flag to award points and stone,
    then mark Hulk completed.
    """
    import hashlib

    team = request.team
    data = request.get_json()
    final_flag = (data.get("flag", "") or "").strip()

    if not final_flag:
        return jsonify({"error": "Final flag required"}), 400

    # Validate Hulk Advanced flag (hash compare for consistency)
    advanced_flag_plain = "neXus{H0LK_G1MM1_ENTRY}"
    advanced_hash = hashlib.sha256(advanced_flag_plain.encode("utf-8")).hexdigest()
    submitted_hash = hashlib.sha256(final_flag.encode("utf-8")).hexdigest()
    if submitted_hash != advanced_hash:
        log_activity(team['team_name'], "ADV_FLAG_FAIL", {"avenger": "hulk"})
        return jsonify({"success": False, "message": "Incorrect Final Flag"}), 400

    stone = Config.STONE_MAPPING["hulk"]
    # Check if already collected
    if stone in team.get('collected_stones', []):
        return jsonify({"error": "Advanced CTF already completed"}), 409

    # Award combined points and stone
    teams_collection.update_one(
        {"team_name": team['team_name']},
        {
            "$addToSet": {
                "solved_flags": "hulk",
                "collected_stones": stone,
                "completed_avengers": "hulk"
            },
            "$inc": {"score": Config.POINTS_FLAG + Config.POINTS_ANSWER}
        }
    )

    log_activity(team['team_name'], "ADV_FLAG_SUCCESS", {"avenger": "hulk", "points": Config.POINTS_FLAG + Config.POINTS_ANSWER})

    resp = jsonify({
        "success": True,
        "message": "Advanced CTF completed. Points awarded.",
        "stone": stone,
        "points_awarded": Config.POINTS_FLAG + Config.POINTS_ANSWER
    })
    return resp, 200


@game_bp.route("/hulk-ctf-stage", methods=["POST"])
@strong_auth_required
@limiter.limit("30 per minute")
def hulk_ctf_stage():
    """Validate Hulk Advanced CTF stages server-side.

    Stage 1: steganography -> gamma_encrypted_xk7m
    Stage 2: decrypt text -> endpoint containing gamma-analyze
    Stage 3: specific JWT token
    Stage 4: SQL injection payload -> return final flag
    """
    team = request.team
    data = request.get_json() or {}
    stage = int(data.get("stage", 0))
    value = (data.get("value", "") or "").strip()

    if stage == 1:
        # Expect exact hidden text from stego analysis
        if value.lower() != "gamma_encrypted_xk7m":
            log_activity(team["team_name"], "HULK_CTF_FAIL", {"stage": stage})
            return jsonify({"success": False, "message": "Incorrect steganography extraction."}), 400
        log_activity(team["team_name"], "HULK_CTF_STAGE_OK", {"stage": stage})
        return jsonify({"success": True}), 200

    if stage == 2:
        lower = value.lower()
        if "gamma-analyze" not in lower and "gamma/analyze" not in lower:
            log_activity(team["team_name"], "HULK_CTF_FAIL", {"stage": stage})
            return jsonify({"success": False, "message": "Wrong endpoint."}), 400
        log_activity(team["team_name"], "HULK_CTF_STAGE_OK", {"stage": stage})
        return jsonify({"success": True}), 200

    if stage == 3:
        jwt_pattern = re.compile(r"^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$")
        if not jwt_pattern.match(value):
            return jsonify({"success": False, "message": "Invalid JWT format."}), 400

        expected_jwt = (
           "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYmFubmVyIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzcxMDUyMjM1fQ.TYamS1jIPakIgJzg7dEbn6rOSoXFPAOVa_meK4fksms"
        )

        if value != expected_jwt:
            log_activity(team["team_name"], "HULK_CTF_FAIL", {"stage": stage})
            return jsonify({"success": False, "message": "Incorrect JWT token."}), 400

        log_activity(team["team_name"], "HULK_CTF_STAGE_OK", {"stage": stage})
        return jsonify({"success": True}), 200

    if stage == 4:
        lower = value.lower()
        is_sql_injection = (
            "' or '1'='1" in lower
            or "1=1" in lower
            or " union " in f" {lower} "
        )

        if not is_sql_injection:
            log_activity(team["team_name"], "HULK_CTF_FAIL", {"stage": stage})
            return jsonify({"success": False, "message": "Query failed."}), 400

        final_flag = "neXus{H0LK_G1MM1_ENTRY}"
        log_activity(team["team_name"], "HULK_CTF_STAGE_OK", {"stage": stage})
        return jsonify({"success": True, "flag": final_flag}), 200

    return jsonify({"error": "Invalid stage"}), 400
