import sys
import os

# Adjust path to import correctly when running this file directly
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Try loading a local .env file if it exists in the project root
env_path = os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(__file__))), '.env')
if os.path.exists(env_path):
    with open(env_path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

# Verify required environment variables are present
REQUIRED_ENV_VARS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM', 'JWT_SECRET']
missing_vars = [var for var in REQUIRED_ENV_VARS if not os.environ.get(var)]
if missing_vars:
    import sys
    print(f"CRITICAL STARTUP ERROR: Missing required configuration variables: {', '.join(missing_vars)}")
    sys.exit(f"Server refused to start. Missing config: {', '.join(missing_vars)}")

from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os

from backend.config.settings import Settings
from backend.config.database import db

# Import Blueprints
from backend.routes.auth import auth_bp
from backend.routes.books import books_bp
from backend.routes.members import members_bp
from backend.routes.issue_return import issue_return_bp
from backend.routes.reports import reports_bp
from backend.routes.dashboard import dashboard_bp
from backend.routes.admin import admin_bp

app = Flask(__name__)
app.config.from_object(Settings)

# Enable CORS (allow React dev server on port 5173)
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# Initialize Database
db.init_app(app)

# Initialize JWT
jwt = JWTManager(app)

# Initialize WebSockets (SocketIO)
socketio = SocketIO(app, cors_allowed_origins="*")

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(books_bp, url_prefix='/api/books')
app.register_blueprint(members_bp, url_prefix='/api/members')
app.register_blueprint(issue_return_bp, url_prefix='/api/issues')
app.register_blueprint(reports_bp, url_prefix='/api/reports')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# WebSockets Event Handlers
@socketio.on('connect')
def handle_connect():
    print("Client connected via WebSockets")
    emit('status', {'msg': 'WebSockets Connected to Nova Library X Server'})

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")

# Helper to broadcast global notifications (can be called from service files)
def broadcast_notification(message_type, message_text):
    socketio.emit('notification', {
        'type': message_type,
        'message': message_text,
        'timestamp': datetime.utcnow().strftime('%H:%M:%S')
    }, broadcast=True)

# Database table creation
@app.before_request
def setup_database():
    if not hasattr(app, '_db_initialized'):
        with app.app_context():
            db.create_all()
            # Check and add columns if they don't exist
            # Column: otp_hash
            try:
                db.session.execute(db.text('SELECT otp_hash FROM users LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE users ADD COLUMN otp_hash VARCHAR(255)'))
                    db.session.commit()
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate otp_hash: {ex}")
            # Column: otp_expires_at
            try:
                db.session.execute(db.text('SELECT otp_expires_at FROM users LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE users ADD COLUMN otp_expires_at DATETIME'))
                    db.session.commit()
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate otp_expires_at: {ex}")
            # Column: otp_resend_attempts
            try:
                db.session.execute(db.text('SELECT otp_resend_attempts FROM users LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE users ADD COLUMN otp_resend_attempts INTEGER DEFAULT 0'))
                    db.session.commit()
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate otp_resend_attempts: {ex}")
            # Column: otp_last_requested_at
            try:
                db.session.execute(db.text('SELECT otp_last_requested_at FROM users LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE users ADD COLUMN otp_last_requested_at DATETIME'))
                    db.session.commit()
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate otp_last_requested_at: {ex}")
            # Column: otp_verified
            try:
                db.session.execute(db.text('SELECT otp_verified FROM users LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE users ADD COLUMN otp_verified BOOLEAN DEFAULT 0'))
                    db.session.commit()
                    print("Self-healing DB migration: added otp_verified column to users table.")
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate otp_verified: {ex}")
        app._db_initialized = True

@app.route('/api/send-otp', methods=['POST'])
def global_send_otp():
    from backend.routes.auth import generate_otp
    return generate_otp()

@app.route('/verify-otp', methods=['POST'])
def global_verify_otp():
    from backend.routes.auth import verify_otp
    return verify_otp()

@app.route('/api/verify-otp', methods=['POST'])
def global_verify_otp_api():
    from backend.routes.auth import verify_otp
    return verify_otp()

@app.after_request
def add_security_headers(response):
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'no-referrer-when-downgrade'
    return response

@app.route('/')
def index():
    return jsonify({"msg": "Welcome to NOVA LIBRARY X Enterprise REST API Console"}), 200

if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=5000, debug=True, allow_unsafe_werkzeug=True)
