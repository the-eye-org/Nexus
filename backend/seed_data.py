import hashlib
from datetime import datetime
from pymongo import MongoClient
from config import Config
import bcrypt
import random

# Setup DB connection
client = MongoClient(Config.MONGO_URI)
db = client[Config.MONGO_DB_NAME]
users_collection = db["users"]
flags_collection = db["flags"]
submissions_collection = db["submissions"]

def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def hash_flag(flag):
    return hashlib.sha256(flag.strip().encode("utf-8")).hexdigest()

def seed():
    print("Clearing existing data...")
    users_collection.delete_many({})
    flags_collection.delete_many({})
    submissions_collection.delete_many({})

    print("Creating Flags...")
    flags = [
        {"flag": "FLAG{welcome_to_ctf}", "points": 50, "challenge_name": "Sanity Check", "category": "Sanity"},
        {"flag": "FLAG{web_exploitation_is_fun}", "points": 100, "challenge_name": "Web Basic", "category": "Web"},
        {"flag": "FLAG{crypto_master_2024}", "points": 200, "challenge_name": "Caesar Cipher", "category": "Crypto"},
        {"flag": "FLAG{admin_panel_bypass}", "points": 300, "challenge_name": "Admin Login", "category": "Web"},
    ]
    
    flag_hashes = []
    for f in flags:
        flag_hash = hash_flag(f["flag"])
        flag_hashes.append(flag_hash)
        flags_collection.insert_one({
            "flag_hash": flag_hash,
            "points": f["points"],
            "challenge_name": f["challenge_name"],
            "category": f["category"],
            "created_at": datetime.utcnow()
        })
    
    print("Creating Users...")
    users = [
        ("220001@psgtech.ac.in", "password123"),
        ("220002@psgtech.ac.in", "password123"),
        ("220003@psgtech.ac.in", "password123"),
        ("220004@psgtech.ac.in", "password123"),
    ]
    
    user_ids = []
    for email, pwd in users:
        result = users_collection.insert_one({
            "email": email,
            "password_hash": hash_password(pwd),
            "created_at": datetime.utcnow(),
            "score": 0
        })
        user_ids.append(result.inserted_id)

    print("Simulating Submissions...")
    # User 1 solves all
    for i, f_hash in enumerate(flag_hashes):
        submissions_collection.insert_one({
            "user_id": user_ids[0],
            "flag_hash": f_hash,
            "is_correct": True,
            "timestamp": datetime.utcnow(),
            "points": flags[i]["points"]
        })
        users_collection.update_one(
            {"_id": user_ids[0]}, 
            {"$inc": {"score": flags[i]["points"]}}
        )

    # User 2 solves 2
    for i in range(2):
        submissions_collection.insert_one({
            "user_id": user_ids[1],
            "flag_hash": flag_hashes[i],
            "is_correct": True,
            "timestamp": datetime.utcnow(),
            "points": flags[i]["points"]
        })
        users_collection.update_one(
            {"_id": user_ids[1]}, 
            {"$inc": {"score": flags[i]["points"]}}
        )
        
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed()
