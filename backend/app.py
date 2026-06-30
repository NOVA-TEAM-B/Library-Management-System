import sys
import os

# Adjust path to import correctly when running this file directly
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Try loading a local .env file if it exists in the project root
env_path = os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(__file__))), '.env')
try:
    from dotenv import load_dotenv
    load_dotenv(env_path)
except ImportError:
    pass

if os.path.exists(env_path):
    with open(env_path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            # Strip inline comments
            if '#' in line:
                line = line.split('#', 1)[0].strip()
            if line and '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

# Verify required environment variables are present (allowing MAIL_* fallbacks)
REQUIRED_ENV_VARS = {
    'SMTP_HOST': 'MAIL_SERVER',
    'SMTP_PORT': 'MAIL_PORT',
    'SMTP_USER': 'MAIL_USERNAME',
    'SMTP_PASS': 'MAIL_PASSWORD',
    'EMAIL_FROM': 'MAIL_DEFAULT_SENDER',
    'JWT_SECRET': 'JWT_SECRET'
}
missing_vars = []
for primary, fallback in REQUIRED_ENV_VARS.items():
    if not os.environ.get(primary) and not os.environ.get(fallback):
        missing_vars.append(primary)

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
from backend.routes.subscription import subscription_bp
from backend.routes.enterprise import enterprise_bp

app = Flask(__name__)
app.config.from_object(Settings)

# Enable CORS (allow React dev server on port 5173-5176)
CORS(app, supports_credentials=True, resources={r"/api/*": {
    "origins": [
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
        "http://localhost:5176", "http://127.0.0.1:5176"
    ]
}})

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
app.register_blueprint(subscription_bp, url_prefix='/api/subscription')
app.register_blueprint(enterprise_bp, url_prefix='/api')

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

            # Column: avatar_url
            try:
                db.session.execute(db.text('SELECT avatar_url FROM users LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255)'))
                    db.session.commit()
                    print("Self-healing DB migration: added avatar_url column to users table.")
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate avatar_url: {ex}")

            # Column: theme_preference
            try:
                db.session.execute(db.text('SELECT theme_preference FROM users LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE users ADD COLUMN theme_preference VARCHAR(50) DEFAULT "dark"'))
                    db.session.commit()
                    print("Self-healing DB migration: added theme_preference column to users table.")
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate theme_preference: {ex}")

            # Column: language_preference
            try:
                db.session.execute(db.text('SELECT language_preference FROM users LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE users ADD COLUMN language_preference VARCHAR(10) DEFAULT "en"'))
                    db.session.commit()
                    print("Self-healing DB migration: added language_preference column to users table.")
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate language_preference: {ex}")

            # Column: two_factor_enabled
            try:
                db.session.execute(db.text('SELECT two_factor_enabled FROM users LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0'))
                    db.session.commit()
                    print("Self-healing DB migration: added two_factor_enabled column to users table.")
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate two_factor_enabled: {ex}")

            # Column: notify_email
            try:
                db.session.execute(db.text('SELECT notify_email FROM users LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE users ADD COLUMN notify_email BOOLEAN DEFAULT 1'))
                    db.session.commit()
                    print("Self-healing DB migration: added notify_email column to users table.")
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate notify_email: {ex}")

            # Column: notify_sms
            try:
                db.session.execute(db.text('SELECT notify_sms FROM users LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE users ADD COLUMN notify_sms BOOLEAN DEFAULT 0'))
                    db.session.commit()
                    print("Self-healing DB migration: added notify_sms column to users table.")
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate notify_sms: {ex}")

            # Column: payment_date (fines table)
            try:
                db.session.execute(db.text('SELECT payment_date FROM fines LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE fines ADD COLUMN payment_date DATETIME'))
                    db.session.commit()
                    print("Self-healing DB migration: added payment_date column to fines table.")
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate payment_date: {ex}")

            # Column: transaction_reference (fines table)
            try:
                db.session.execute(db.text('SELECT transaction_reference FROM fines LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE fines ADD COLUMN transaction_reference VARCHAR(100)'))
                    db.session.commit()
                    print("Self-healing DB migration: added transaction_reference column to fines table.")
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate transaction_reference: {ex}")

            # Column: approver_id (fines table)
            try:
                db.session.execute(db.text('SELECT approver_id FROM fines LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE fines ADD COLUMN approver_id INTEGER'))
                    db.session.commit()
                    print("Self-healing DB migration: added approver_id column to fines table.")
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate approver_id: {ex}")

            # Column: status (organizations table)
            try:
                db.session.execute(db.text('SELECT status FROM organizations LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE organizations ADD COLUMN status VARCHAR(20) DEFAULT "active"'))
                    db.session.commit()
                    print("Self-healing DB migration: added status column to organizations table.")
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate status column to organizations: {ex}")

            # Column: max_fine_limit (organizations table)
            try:
                db.session.execute(db.text('SELECT max_fine_limit FROM organizations LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE organizations ADD COLUMN max_fine_limit FLOAT DEFAULT 500.0'))
                    db.session.commit()
                    print("Self-healing DB migration: added max_fine_limit column to organizations table.")
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate max_fine_limit: {ex}")

            # Column: publisher (books table)
            try:
                db.session.execute(db.text('SELECT publisher FROM books LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN publisher VARCHAR(150)'))
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN edition VARCHAR(50)'))
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN rack_number VARCHAR(50)'))
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN shelf_number VARCHAR(50)'))
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN floor VARCHAR(50)'))
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN library_branch VARCHAR(100)'))
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN lost_copies INTEGER DEFAULT 0'))
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN damaged_copies INTEGER DEFAULT 0'))
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN repair_copies INTEGER DEFAULT 0'))
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN replacement_cost FLOAT DEFAULT 0.0'))
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN subject VARCHAR(100)'))
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN accession_number VARCHAR(50)'))
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN is_digital BOOLEAN DEFAULT 0'))
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN pdf_url TEXT'))
                    db.session.execute(db.text('ALTER TABLE books ADD COLUMN allow_download BOOLEAN DEFAULT 1'))
                    db.session.commit()
                    print("Self-healing DB migration: added enterprise and digital library columns to books table.")
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate books table: {ex}")

            # Column: renewal_requested (issues table)
            try:
                db.session.execute(db.text('SELECT renewal_requested FROM issues LIMIT 1'))
            except Exception:
                db.session.rollback()
                try:
                    db.session.execute(db.text('ALTER TABLE issues ADD COLUMN renewal_requested BOOLEAN DEFAULT 0'))
                    db.session.execute(db.text('ALTER TABLE issues ADD COLUMN renewal_count INTEGER DEFAULT 0'))
                    db.session.execute(db.text('ALTER TABLE issues ADD COLUMN renewal_status VARCHAR(20)'))
                    db.session.commit()
                    print("Self-healing DB migration: added renewal tracking columns to issues table.")
                except Exception as ex:
                    db.session.rollback()
                    print(f"Failed to migrate issues table: {ex}")

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
