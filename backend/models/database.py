from pymongo import MongoClient
from config import Config

client = MongoClient(Config.MONGO_URI)
db = client[Config.MONGO_DB_NAME]

# Collections
users_collection = db["users"]
flags_collection = db["flags"]
submissions_collection = db["submissions"]

# Create indexes for performance
def init_db():
    """Initialize database indexes."""
    # Unique index on email
    users_collection.create_index("email", unique=True)
    
    # Unique index on flag_hash
    flags_collection.create_index("flag_hash", unique=True)
    
    # Compound index for submissions (user_id + flag_hash for duplicate check)
    submissions_collection.create_index([("user_id", 1), ("flag_hash", 1)])
    
    # Index on timestamp for sorting
    submissions_collection.create_index("timestamp")
    
    print("Database indexes initialized.")
