# NEXUS EYE CTF Backend

A secure backend for a Capture The Flag (CTF) platform built with Python Flask and MongoDB.

## Features
- **Strict User Authentication**: Email validation (`2XXXXX@psgtech.ac.in`) and JWT-based auth.
- **Flag Submission**: Secure flag hashing (SHA-256) and duplicate prevention.
- **Dynamic Leaderboard**: Ranks users by Points > Correct Flags > Time Elapsed.
- **Rate Limiting**: Prevents brute force attacks.

## Tech Stack
-   **Language**: Python 3.9+
-   **Framework**: Flask
-   **Database**: MongoDB
-   **Authentication**: Flask-JWT-Extended
-   **Security**: Bcrypt (Passwords), SHA-256 (Flags)

## Setup Instructions

### 1. Prerequisites
-   Python 3.x installed
-   MongoDB installed and running locally

### 2. Installation
1.  Clone the repository and navigate to `backend`:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

### 3. Configuration
The `config.py` file contains default settings. You can override them using environment variables or a `.env` file.
-   `MONGO_URI`: MongoDB connection string
-   `JWT_SECRET_KEY`: Secret key for JWT signing

### 4. Database Seeding (Optional)
To populate the database with sample users and flags:
```bash
python seed_data.py
```

### 5. Running the Application
```bash
python app.py
```
The server will start at `http://localhost:5000`.

## API Endpoints

### Authentication
-   `POST /api/auth/signup`: Register a new user (`2XXXXX@psgtech.ac.in`)
-   `POST /api/auth/login`: Login and receive JWT

### Game
-   `POST /api/flags/submit-flag`: Submit a flag (Requires JWT)
-   `GET /api/flags/submissions`: View submission history (Requires JWT)
-   `GET /api/leaderboard/leaderboard`: View live leaderboard

### Admin (Optional)
-   `POST /api/admin/flags`: Create new flags
-   `GET /api/admin/users`: Manage users

## Security Notes
-   Passwords are hashed using bcrypt.
-   Flags are stored as SHA-256 hashes.
-   JWT tokens expire in 24 hours.
