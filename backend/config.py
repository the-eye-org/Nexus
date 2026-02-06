import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY", "nexus-secret-key-change-in-production")
    
    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "nexus_game")
    
    # Session Configuration
    SESSION_COOKIE_NAME = "nexus_session"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = False  # Set True in production with HTTPS
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_EXPIRY_HOURS = 2  # Session expires after 2 hours of inactivity
    
    # Game Configuration
    AVENGERS = ["ironman", "thor", "hulk", "captainamerica", "blackwidow", "hawkeye"]
    
    # Stone to Avenger mapping
    STONE_MAPPING = {
        "ironman": "power",
        "thor": "space",
        "hulk": "mind",
        "captainamerica": "time",
        "blackwidow": "soul",
        "hawkeye": "reality"
    }
    
    # Puzzle Sequences
    THOR_RUNE_SEQUENCE = [4, 1, 8, 3]  # Correct order for Thor's runes
    
    # Anti-Cheat Configuration
    MAX_ATTEMPTS_PER_AVENGER = 5  # Max wrong attempts before cooldown
    COOLDOWN_DURATION_MINUTES = 5  # Cooldown after max attempts
    RATE_LIMIT_FLAG_SUBMISSIONS = "10 per minute"  # Per session
    MIN_COMPLETION_TIME_SECONDS = 10  # Flags completed faster = suspicious
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "100 per hour"
    RATELIMIT_STORAGE_URI = "memory://"
