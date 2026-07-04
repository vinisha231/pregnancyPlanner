"""
Mama's Journey — Flask backend
Serves the static SPA and proxies AI chat requests to Anthropic.

Usage:
  export ANTHROPIC_API_KEY=sk-ant-...
  pip install -r requirements.txt
  python main.py

Then open http://localhost:5000
"""

import os
import anthropic
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder=".")
# /api/chat proxies to Anthropic using a server-side API key. Allowing every
# origin would let any website drive this endpoint and burn the key's quota,
# so restrict CORS to an explicit allowlist (comma-separated ALLOWED_ORIGINS).
_allowed_origins = [
    o.strip()
    for o in os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:5000,http://127.0.0.1:5000"
    ).split(",")
    if o.strip()
]
CORS(app, resources={r"/api/*": {"origins": _allowed_origins}})

SYSTEM_PROMPT = """You are a warm, knowledgeable pregnancy assistant called "Luna."
Provide helpful, accurate information about pregnancy, symptoms, nutrition,
baby development, and what to expect at each stage. Always remind users to
consult their healthcare provider for personal medical decisions. Be supportive,
encouraging, and compassionate — pregnancy can be both exciting and scary."""


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(".", path)


@app.route("/api/chat", methods=["POST"])
def chat():
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return jsonify({"error": "ANTHROPIC_API_KEY environment variable not set."}), 500

    try:
        body     = request.get_json(force=True)
        messages = body.get("messages", [])
        context  = body.get("context", "")

        system = SYSTEM_PROMPT
        if context:
            system += f"\n\nUser context: {context}"

        client = anthropic.Anthropic(api_key=api_key)
        resp   = client.messages.create(
            model      = "claude-haiku-4-5-20251001",
            max_tokens = 1024,
            system     = system,
            messages   = messages[-20:],   # keep last 20 turns
        )
        return jsonify({"content": resp.content[0].text})

    except anthropic.APIStatusError as e:
        return jsonify({"error": str(e)}), e.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # Never enable the Werkzeug debugger by default: it exposes an interactive
    # console that allows remote code execution. Opt in explicitly for local
    # debugging via FLASK_DEBUG=1.
    debug = os.environ.get("FLASK_DEBUG", "").lower() in ("1", "true", "yes")
    print(f"\n🤰  Mama's Journey running at http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
