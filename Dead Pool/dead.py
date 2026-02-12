from flask import Flask, request, jsonify, Response
import jwt
import sqlite3
import os

app = Flask(__name__)

JWT_SECRET = "deadpool"

# ─── Initialize Database ───
def init_db():
    conn = sqlite3.connect("vault.db")
    c = conn.cursor()
    c.execute("DROP TABLE IF EXISTS menu")
    c.execute("DROP TABLE IF EXISTS secrets")
    c.execute("""
        CREATE TABLE menu (
            id INTEGER PRIMARY KEY,
            item TEXT,
            price TEXT,
            description TEXT
        )
    """)
    c.execute("""
        CREATE TABLE secrets (
            id INTEGER PRIMARY KEY,
            flag TEXT
        )
    """)
    items = [
        ("chimichanga", "$9.99", "Wade's favorite. Extra crispy."),
        ("taco", "$4.99", "Just a regular taco. Boring."),
        ("burrito", "$7.99", "Big enough to hide a katana in."),
        ("nachos", "$5.99", "Covered in maximum cheese effort."),
    ]
    for i in items:
        c.execute("INSERT INTO menu (item, price, description) VALUES (?, ?, ?)", i)
    c.execute("INSERT INTO secrets (flag) VALUES (?)",
              ("flag{w4d3_l0v3s_ch1m1ch4ng4s_4nd_sqli}",))
    conn.commit()
    conn.close()

if not os.path.exists("vault.db"):
    init_db()


# ─── Main Page ───
@app.route("/")
def index():
    return Response("""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Wade's Chimichanga Shack</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    background-color: #1a1a1a;
    color: #f0f0f0;
    font-family: 'Courier New', monospace;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.container { max-width: 700px; width: 90%; padding: 20px; }

.header { text-align: center; margin-bottom: 30px; }
.header h1 {
    color: #e23636;
    font-size: 2.2em;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}
.subtitle { color: #888; font-style: italic; margin-top: 5px; }

.deadpool-box {
    background: linear-gradient(135deg, #2a0a0a, #1a1a2e);
    border: 2px solid #e23636;
    border-radius: 10px;
    padding: 25px;
    margin-bottom: 25px;
}
.deadpool-box h2 { color: #e23636; margin-bottom: 15px; }
.deadpool-box p { line-height: 1.6; margin-bottom: 10px; }

.quote {
    color: #e8a838;
    font-style: italic;
    border-left: 3px solid #e23636;
    padding-left: 15px;
    margin-top: 15px;
}

.menu {
    background: #222;
    border: 1px solid #333;
    border-radius: 10px;
    padding: 25px;
    margin-bottom: 25px;
}
.menu h2 { color: #e23636; margin-bottom: 20px; text-align: center; }

.menu-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px dashed #444;
}
.menu-item:last-child { border-bottom: none; }
.item-name { color: #f0f0f0; }
.item-price { color: #e8a838; font-weight: bold; }

.footer-quote {
    text-align: center;
    color: #666;
    font-size: 0.85em;
    font-style: italic;
}

.try-section {
    background: #1a1a2e;
    border: 1px solid #e23636;
    border-radius: 10px;
    padding: 25px;
    margin-bottom: 25px;
}
.try-section h2 { color: #e23636; margin-bottom: 15px; text-align: center; }

input[type="text"] {
    width: 100%;
    padding: 12px;
    background: #111;
    border: 1px solid #444;
    color: #0f0;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    border-radius: 5px;
    margin-bottom: 10px;
}

button {
    padding: 10px 25px;
    background: #e23636;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    font-weight: bold;
    width: 100%;
}
button:hover { background: #ff4444; }

.response-box {
    margin-top: 15px;
    padding: 15px;
    background: #111;
    border: 1px solid #333;
    border-radius: 5px;
    color: #0f0;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 13px;
    min-height: 50px;
    display: none;
}

.flag-found {
    color: #e8a838 !important;
    border-color: #e8a838 !important;
    font-size: 16px !important;
    text-align: center;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

.tabs {
    display: flex;
    gap: 5px;
    margin-bottom: 15px;
}
.tab {
    flex: 1;
    padding: 10px;
    background: #333;
    border: 1px solid #555;
    color: #aaa;
    text-align: center;
    cursor: pointer;
    border-radius: 5px 5px 0 0;
    font-family: 'Courier New', monospace;
}
.tab.active {
    background: #e23636;
    color: white;
    border-color: #e23636;
}
.tab-content { display: none; }
.tab-content.active { display: block; }
</style>
</head>
<body>
<div class="container">

    <div class="header">
        <h1>&#127790; Wade's Chimichanga Shack &#127790;</h1>
        <p class="subtitle">"Maximum Effort Tacos Since 2016"</p>
    </div>

    <div class="deadpool-box">
        <h2>&#128128; Welcome, Bub!</h2>
        <p>
            You've found Wade Wilson's totally legitimate taco business.
            Nothing suspicious here. Definitely no secret recipes hidden
            in poorly secured APIs.
        </p>
        <p class="quote">
            "I'm not saying there's a hidden API... but I'm also not NOT saying it." - Wade
        </p>
    </div>

    <div class="menu">
        <h2>Today's Menu</h2>
        <div class="menu-item">
            <span class="item-name">&#127791; Chimichanga Supreme</span>
            <span class="item-price">$9.99</span>
        </div>
        <div class="menu-item">
            <span class="item-name">&#127790; Regular Taco</span>
            <span class="item-price">$4.99</span>
        </div>
        <div class="menu-item">
            <span class="item-name">&#127791; Katana Burrito</span>
            <span class="item-price">$7.99</span>
        </div>
        <div class="menu-item">
            <span class="item-name">&#129472; Maximum Nachos</span>
            <span class="item-price">$5.99</span>
        </div>
    </div>

    <div class="try-section">
        <h2>&#128187; API Tester</h2>

        <div class="tabs">
            <div class="tab active" onclick="switchTab('recipe')">Recipe Lookup</div>
            <div class="tab" onclick="switchTab('vault')">Vault Search</div>
        </div>

        <div id="recipe-tab" class="tab-content active">
            <input type="text" id="token-input" placeholder="Enter JWT token here...">
            <button onclick="fetchRecipe()">&#128274; Get Recipe</button>
            <div class="response-box" id="recipe-response"></div>
        </div>

        <div id="vault-tab" class="tab-content">
            <input type="text" id="vault-input" placeholder="Enter item name..." value="chimichanga">
            <button onclick="fetchVault()">&#128269; Search Vault</button>
            <div class="response-box" id="vault-response"></div>
        </div>
    </div>

    <div class="footer-quote">
        <p>"If I had a nickel for every chimichanga I've eaten, I'd have... a lot of nickels." - Wade Wilson</p>
    </div>

</div>

<!-- TODO: Remove before deployment - Wade's API docs at /api/docs -->
<!-- Note to self: Wade insisted the JWT secret be his own name. What an idiot. -->
<!-- Reminder: Tell Wade to stop leaving hints everywhere -->

<script>
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

    if (tab === 'recipe') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('recipe-tab').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('vault-tab').classList.add('active');
    }
}

async function fetchRecipe() {
    const token = document.getElementById('token-input').value.trim();
    const box = document.getElementById('recipe-response');
    box.style.display = 'block';
    box.className = 'response-box';

    if (!token) {
        box.textContent = 'Wade says: "Put a token in there, dummy!"';
        return;
    }

    try {
        const res = await fetch('/api/recipe?token=' + encodeURIComponent(token));
        const data = await res.json();
        box.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
        box.textContent = 'Error: ' + e.message;
    }
}

async function fetchVault() {
    const item = document.getElementById('vault-input').value.trim();
    const box = document.getElementById('vault-response');
    box.style.display = 'block';
    box.className = 'response-box';

    if (!item) {
        box.textContent = 'Wade says: "Search for SOMETHING at least!"';
        return;
    }

    try {
        const res = await fetch('/api/vault?item=' + encodeURIComponent(item));
        const data = await res.json();
        const text = JSON.stringify(data, null, 2);

        if (text.includes('flag{')) {
            box.classList.add('flag-found');
            box.textContent = '🎉 FLAG FOUND! 🎉\\n\\n' + text;
        } else {
            box.textContent = text;
        }
    } catch (e) {
        box.textContent = 'Error: ' + e.message;
    }
}
</script>

</body>
</html>
""", content_type="text/html")


# ─── Hidden API Docs ───
@app.route("/api/docs")
def api_docs():
    sample_token = jwt.encode(
        {"user": "customer_bob", "role": "customer"},
        JWT_SECRET,
        algorithm="HS256"
    )
    return jsonify({
        "message": "Wade's API docs. Shh, don't tell Cable.",
        "endpoints": [
            {
                "path": "/api/recipe",
                "method": "GET",
                "params": "token (JWT - HS256)",
                "description": "Get Wade's secret recipe. Need admin role.",
                "sample_token": sample_token
            }
        ],
        "hint": "The JWT secret is something Wade would never shut up about... his name maybe? 🤔"
    })


# ─── JWT Protected Endpoint ───
@app.route("/api/recipe")
def recipe():
    token = request.args.get("token")
    if not token:
        return jsonify({"error": "No token provided. Wade is disappointed."}), 401

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token. Nice try, Francis."}), 403

    if payload.get("role") != "admin":
        return jsonify({
            "message": f"Hey {payload.get('user', 'nobody')}, you're just a {payload.get('role', 'nobody')}.",
            "wade_says": "You need to be admin! Forge something better!"
        }), 403

    return jsonify({
        "message": "Well well well, look who figured out JWT forgery!",
        "wade_says": "The REAL recipe is in the vault. Try /api/vault?item=chimichanga",
        "hint": "The vault has more than just menu items... there might be a 'secrets' table too 😏"
    })


# ─── Vulnerable Vault Endpoint (SQLi) ───
@app.route("/api/vault")
def vault():
    item = request.args.get("item", "")
    if not item:
        return jsonify({"error": "Specify an item, genius."}), 400

    # INTENTIONALLY VULNERABLE
    query = f"SELECT item, price, description FROM menu WHERE item = '{item}'"

    try:
        conn = sqlite3.connect("vault.db")
        conn.row_factory = sqlite3.Row
        results = conn.execute(query).fetchall()
        conn.close()

        if results:
            data = [dict(row) for row in results]
            return jsonify({"results": data, "wade_says": "Here's what I found!"})
        else:
            return jsonify({"results": [], "wade_says": "Nothing here... or is there? 🤔"})

    except Exception as e:
        return jsonify({
            "error": str(e),
            "wade_says": "Something broke. But breaking things is kind of the point right?"
        }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)