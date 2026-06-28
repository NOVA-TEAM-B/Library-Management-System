import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, set_access_cookies, unset_jwt_cookies
from backend.config.database import db
from backend.models.User import User
from backend.models.Organization import Organization
from backend.utils.audit_helper import log_audit
from werkzeug.security import generate_password_hash, check_password_hash
from backend.services.notification_service import NotificationService
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

import re
import time

otp_cache = {}
failed_attempts = {}
otp_rate_limiter = {}
registration_otps = {}

def validate_email_format(email):
    pattern = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
    return bool(pattern.match(email))

def validate_phone_format(phone):
    pattern = re.compile(r'^\+[1-9]\d{7,14}$')
    return bool(pattern.match(phone))

def check_otp_rate_limit(identifier):
    now = time.time()
    timestamps = otp_rate_limiter.get(identifier, [])
    timestamps = [t for t in timestamps if now - t < 3600]
    otp_rate_limiter[identifier] = timestamps
    if len(timestamps) >= 5:
        return False
    timestamps.append(now)
    return True

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"msg": "Missing required fields"}), 400
        
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"msg": "Username already exists"}), 400
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email already exists"}), 400
        
    # Verify registration OTP
    otp_code = data.get('otp_code')
    if not otp_code:
        return jsonify({"msg": "Verification OTP code is required for registration"}), 400
        
    reg_email = data['email'].strip()
    reg_record = registration_otps.get(reg_email)
    if not reg_record:
        reg_record = registration_otps.get(data.get('phone', '').strip())
        
    if not reg_record:
        return jsonify({"msg": "No active registration verification found. Please request a new OTP"}), 400
        
    if datetime.utcnow() > reg_record['expires_at']:
        registration_otps.pop(reg_email, None)
        return jsonify({"msg": "Registration OTP has expired. Please request a new code"}), 400
        
    if not check_password_hash(reg_record['hash'], otp_code.strip()):
        return jsonify({"msg": "Invalid verification code"}), 400
        
    # Valid and verified! Clear registry entry to prevent reuse
    registration_otps.pop(reg_email, None)
    if data.get('phone'):
        registration_otps.pop(data['phone'].strip(), None)

    # Generate unique membership ID
    last_user = User.query.filter(User.membership_id.like('MEM-%')).order_by(User.id.desc()).first()
    if last_user and last_user.membership_id:
        last_num = int(last_user.membership_id.split('-')[1])
        new_mem_id = f"MEM-{last_num + 1:04d}"
    else:
        new_mem_id = "MEM-1001"
        
    # Pick a random reading habit/score for gamification demo
    import random
    reading_score = random.randint(65, 95)
    levels = ['Bronze Reader', 'Silver Reader', 'Gold Reader', 'Platinum Reader']
    achievement_level = levels[random.randint(0, 2)]
    late_risks = ['Low', 'Medium', 'High']
    late_risk = late_risks[random.randint(0, 1)] # mostly low/medium for new

    first_org = Organization.query.first()
    default_org_id = first_org.id if first_org else None

    user = User(
        username=data['username'],
        email=data['email'],
        role=data.get('role', 'member'),
        org_id=data.get('org_id') or default_org_id,
        membership_id=new_mem_id,
        department=data.get('department', 'General'),
        phone=data.get('phone', ''),
        status='active',
        reading_score=reading_score,
        achievement_level=achievement_level,
        late_return_risk=late_risk
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    
    return jsonify({"msg": "User registered successfully", "user": user.to_dict()}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"msg": "Missing username or password"}), 400
        
    username_or_email = data['username'].strip()
    password = data['password']
    
    # Check Lockout Policy
    now = datetime.utcnow()
    lockout_info = failed_attempts.get(username_or_email)
    if lockout_info:
        attempts, lockout_until = lockout_info
        if attempts >= 3 and lockout_until and now < lockout_until:
            seconds_left = int((lockout_until - now).total_seconds())
            return jsonify({
                "success": False,
                "msg": f"Too many failed login attempts. Please wait {seconds_left}s",
                "message": f"Too many failed login attempts. Please wait {seconds_left}s"
            }), 429
            
    # Lookup by username OR email
    user = User.query.filter((User.username == username_or_email) | (User.email == username_or_email)).first()
    if not user or not user.check_password(password):
        # Track failures
        attempts, lockout_until = failed_attempts.get(username_or_email, (0, None))
        attempts += 1
        if attempts >= 3:
            lockout_until = datetime.utcnow() + timedelta(seconds=30) # 30s Cooldown
        failed_attempts[username_or_email] = (attempts, lockout_until)
        
        log_audit("Failed Login Attempt", details=f"Failed login attempt for identifier '{username_or_email}'.")
        return jsonify({"msg": "Invalid credentials", "message": "Invalid credentials"}), 401
        
    if user.status != 'active':
        return jsonify({"msg": "Account is inactive or pending approval", "message": "Account is inactive or pending approval"}), 403
        
    # Reset attempts on success
    failed_attempts.pop(username_or_email, None)
        
    # Generate JWT
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "username": user.username, "org_id": user.org_id}
    )
    
    # Audit log
    log_audit("User Logged In", details=f"User '{user.username}' logged in successfully.", user_id=user.id)
    
    response = jsonify({
        "msg": "Login successful",
        "token": access_token,
        "user": user.to_dict(),
        "organization": {
            "name": user.organization.name if user.organization else "Nova System Console",
            "logo_url": user.organization.logo_url if user.organization else "/logo.svg",
            "fine_rate": user.organization.fine_rate if user.organization else 5.0
        }
    })
    
    set_access_cookies(response, access_token)
    return response, 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required(optional=True)
def logout():
    user_id = None
    try:
        identity = get_jwt_identity()
        if identity:
            user_id = int(identity)
    except:
        pass
        
    log_audit("User Logged Out", details="User session cleared.", user_id=user_id)
    
    response = jsonify({"msg": "Logout successful"})
    unset_jwt_cookies(response)
    return response, 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    return jsonify(user.to_dict()), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    data = request.get_json()
    if not data:
        return jsonify({"msg": "No data provided"}), 400
        
    if 'email' in data and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"msg": "Email already exists"}), 400
        user.email = data['email']
        
    if 'phone' in data:
        user.phone = data['phone']
    if 'department' in data:
        user.department = data['department']
        
    # Preferences and new fields (NEW)
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']
    if 'theme_preference' in data:
        user.theme_preference = data['theme_preference']
    if 'language_preference' in data:
        user.language_preference = data['language_preference']
    if 'two_factor_enabled' in data:
        user.two_factor_enabled = bool(data['two_factor_enabled'])
    if 'notify_email' in data:
        user.notify_email = bool(data['notify_email'])
    if 'notify_sms' in data:
        user.notify_sms = bool(data['notify_sms'])
        
    if 'password' in data and data['password']:
        user.set_password(data['password'])
        
    db.session.commit()
    return jsonify({"msg": "Profile updated successfully", "user": user.to_dict()}), 200

@auth_bp.route('/generate-otp', methods=['POST'])
def generate_otp():
    print("==============================", flush=True)
    print("OTP REQUEST START", flush=True)
    print("==============================", flush=True)
    
    data = request.get_json()
    print(f"Incoming JSON: {data}", flush=True)
    
    if not data or not data.get('email_or_phone'):
        print("Returning HTTP Response: 400 (Missing email_or_phone)", flush=True)
        print("==============================", flush=True)
        return jsonify({"msg": "Email or phone number is required"}), 400
        
    email_or_phone = data['email_or_phone'].strip()
    
    # Normalize value: trim whitespace and lowercase email
    is_phone = email_or_phone.startswith('+') or email_or_phone.replace('-', '').replace(' ', '').replace('(', '').replace(')', '').isdigit()
    is_email = not is_phone
    if is_email:
        email_or_phone = email_or_phone.lower()
        print(f"Normalized email_or_phone: {email_or_phone} (Type: Email)", flush=True)
        if not validate_email_format(email_or_phone):
            print("Returning HTTP Response: 400 (Invalid Email Format)", flush=True)
            print("==============================", flush=True)
            return jsonify({"msg": "Invalid email address format"}), 400
    else:
        # Normalize phone: remove spaces/hyphens and prepend '+' if missing
        email_or_phone = email_or_phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        if not email_or_phone.startswith('+'):
            email_or_phone = '+' + email_or_phone
        print(f"Normalized email_or_phone: {email_or_phone} (Type: Phone)", flush=True)
        if not validate_phone_format(email_or_phone):
            print("Returning HTTP Response: 400 (Invalid Phone Format)", flush=True)
            print("==============================", flush=True)
            return jsonify({"msg": "Invalid phone number format. Must start with '+' followed by country code (e.g. +91XXXXXXXXXX)"}), 400

    # Query user by email or phone
    user = User.query.filter((User.email == email_or_phone) | (User.phone == email_or_phone)).first()
    print(f"User Found: {user.username if user else 'None'}", flush=True)
    if not user:
        print("Returning HTTP Response: 404 (User Not Found)", flush=True)
        print("==============================", flush=True)
        return jsonify({"msg": "No account associated with this email or phone"}), 404
        
    print(f"User Status: {user.status}", flush=True)
    if user.status != 'active':
        print("Returning HTTP Response: 403 (User Inactive)", flush=True)
        print("==============================", flush=True)
        return jsonify({"msg": "Account is inactive or pending approval"}), 403

    # Hourly rate limit check (max 5 requests per hour)
    if not check_otp_rate_limit(email_or_phone):
        print("Returning HTTP Response: 429 (Hourly limit exceeded)", flush=True)
        print("==============================", flush=True)
        return jsonify({"msg": "Maximum of 5 OTP requests per hour exceeded"}), 429

    # Check rate limit: 30-second throttle
    now = datetime.utcnow()
    if user.otp_last_requested_at:
        seconds_since_last = (now - user.otp_last_requested_at).total_seconds()
        if seconds_since_last < 30:
            print("Returning HTTP Response: 429 (Throttle limit active)", flush=True)
            print("==============================", flush=True)
            return jsonify({"msg": f"Please wait {int(30 - seconds_since_last)} seconds before requesting a new code"}), 429

    # Generate 6-digit code using secure secrets generator
    import secrets
    otp_code = f"{secrets.SystemRandom().randint(100000, 999999)}"
    print(f"OTP Generated: {otp_code if os.environ.get('FLASK_ENV') == 'development' else '******'}", flush=True)

    # Assign user attributes in-memory (do not commit yet)
    user.otp_hash = generate_password_hash(otp_code)
    user.otp_expires_at = now + timedelta(minutes=2)
    user.otp_last_requested_at = now
    user.otp_resend_attempts += 1
    user.otp_verified = False  # Mark unverified/not used initially
    
    # Store in memory cache for test verification runner in the same process
    otp_cache[email_or_phone] = otp_code
    
    # Dispatch OTP via SMS or Email
    success = False
    error_msg = ""
    if is_email:
        # Check SMTP configuration
        smtp_host = os.environ.get('SMTP_HOST') or os.environ.get('MAIL_SERVER')
        smtp_port = os.environ.get('SMTP_PORT') or os.environ.get('MAIL_PORT')
        smtp_user = os.environ.get('SMTP_USER') or os.environ.get('MAIL_USERNAME')
        smtp_pass = os.environ.get('SMTP_PASS') or os.environ.get('MAIL_PASSWORD')
        email_from = os.environ.get('EMAIL_FROM') or os.environ.get('MAIL_DEFAULT_SENDER')
        if not (smtp_host and smtp_port and smtp_user and smtp_pass and email_from):
            if os.environ.get('MOCK_OTP_DELIVERY') == 'true':
                pass
            else:
                print("Returning HTTP Response: 500 (Missing SMTP credentials)", flush=True)
                print("==============================", flush=True)
                return jsonify({
                    "success": False,
                    "msg": "Configuration Error: SMTP credentials are not configured in .env",
                    "message": "Configuration Error: SMTP credentials are not configured in .env"
                }), 500
        
        subject = "Nova Library - Secure Access OTP"
        body = f"Hello {user.username},\n\nYour secure access OTP code is {otp_code}.\n\nThis code expires in 2 minutes.\n\nNova System Security Node"
        print("Calling NotificationService.send_email()", flush=True)
        success, error_msg = NotificationService.send_email(email_or_phone, subject, body, otp_code=otp_code)
    else:
        # Check Twilio configuration
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        from_number = os.environ.get('TWILIO_FROM_NUMBER')
        if not (account_sid and auth_token and from_number):
            if os.environ.get('MOCK_OTP_DELIVERY') == 'true':
                pass
            else:
                print("Returning HTTP Response: 500 (Missing Twilio credentials)", flush=True)
                print("==============================", flush=True)
                return jsonify({
                    "success": False,
                    "msg": "Configuration Error: Twilio credentials are not configured in .env",
                    "message": "Configuration Error: Twilio credentials are not configured in .env"
                }), 500
                
        message = f"Nova Library: Your verification OTP is {otp_code}. Valid for 2 minutes."
        print("Calling NotificationService.send_sms()", flush=True)
        success, error_msg = NotificationService.send_sms(email_or_phone, message, otp_code=otp_code)
        
    print(f"Returned Success Value: {success}", flush=True)
    print(f"Returned Error Message: {error_msg}", flush=True)
    
    if not success:
        # Rollback changes to user object on failure (i.e. do not commit to DB)
        db.session.rollback()
        print(f"Returning HTTP Response: 500 ({error_msg})", flush=True)
        print("==============================", flush=True)
        return jsonify({
            "success": False,
            "msg": error_msg or "Failed to deliver OTP",
            "message": error_msg or "Failed to deliver OTP"
        }), 500
        
    # Commit changes on success
    try:
        print("Database Commit Started", flush=True)
        db.session.commit()
        print("Database Commit Success", flush=True)
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        print("Returning HTTP Response: 500 (Database Commit Failed)", flush=True)
        print("==============================", flush=True)
        return jsonify({
            "success": False,
            "message": "Failed to save OTP.",
            "msg": "Failed to save OTP."
        }), 500
        
    # Audit log
    log_audit("OTP Requested", details=f"OTP generated and sent to {email_or_phone} (Method: {'Email' if is_email else 'SMS'}).", user_id=user.id)
    
    print("Returning HTTP Response: 200 (Success)", flush=True)
    print("==============================", flush=True)
    return jsonify({
        "success": True,
        "msg": "OTP email delivered." if is_email else "OTP SMS delivered.",
        "message": "OTP email delivered." if is_email else "OTP SMS delivered."
    }), 200

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    if not data or not data.get('email_or_phone') or not data.get('otp_code'):
        return jsonify({"msg": "Email/phone and OTP code are required"}), 400
        
    email_or_phone = data['email_or_phone'].strip()
    otp_code = data['otp_code'].strip()
    
    user = User.query.filter((User.email == email_or_phone) | (User.phone == email_or_phone)).first()
    if not user:
        return jsonify({"msg": "Account error occurred during login"}), 400
        
    if user.status != 'active':
        return jsonify({"msg": "Account is inactive or pending approval"}), 403
        
    # 1. Reads latest OTP & 3. Checks used flag
    if not user.otp_hash or not user.otp_expires_at:
        return jsonify({"msg": "No active OTP request found for this account"}), 400
        
    if getattr(user, 'otp_verified', False):
        return jsonify({"msg": "OTP has already been used"}), 400
        
    # 2. Checks expiry
    now = datetime.utcnow()
    if now > user.otp_expires_at:
        # Clear expired OTP
        user.otp_hash = None
        user.otp_expires_at = None
        db.session.commit()
        return jsonify({"msg": "OTP has expired. Please request a new code"}), 400
        
    # Validate verification code
    if not check_password_hash(user.otp_hash, otp_code):
        return jsonify({"msg": "Invalid verification code"}), 401
        
    # 4. Marks OTP verified & 5. Deletes or expires OTP
    user.otp_verified = True
    user.otp_hash = None
    user.otp_expires_at = now - timedelta(seconds=1)
    user.otp_resend_attempts = 0
    db.session.commit()
    
    # Generate JWT
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "username": user.username, "org_id": user.org_id}
    )
    
    # Audit log
    log_audit("User Logged In (OTP)", details=f"User '{user.username}' logged in via OTP verification.", user_id=user.id)
    
    response = jsonify({
        "msg": "Login successful",
        "token": access_token,
        "user": user.to_dict(),
        "organization": {
            "name": user.organization.name if user.organization else "Nova System Console",
            "logo_url": user.organization.logo_url if user.organization else "/logo.svg",
            "fine_rate": user.organization.fine_rate if user.organization else 5.0
        }
    })
    
    set_access_cookies(response, access_token)
    return response, 200

@auth_bp.route('/upload-avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    from flask import current_app
    import os
    import uuid
    
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    if 'avatar' not in request.files:
        return jsonify({"msg": "No file part in the request"}), 400
        
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400
        
    filename = file.filename
    allowed_extensions = {'png', 'jpg', 'jpeg', 'webp'}
    if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({"msg": "Invalid file type. Allowed formats: JPG, JPEG, PNG, WEBP"}), 400
        
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > 5 * 1024 * 1024:
        return jsonify({"msg": "File size exceeds the 5 MB limit"}), 400
        
    # Delete old custom avatar if exists
    if user.avatar_url and user.avatar_url.startswith('/static/uploads/avatars/'):
        old_path = os.path.join(current_app.root_path, user.avatar_url.lstrip('/'))
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception as e:
                print(f"Failed to delete old avatar file: {e}", flush=True)

    ext = filename.rsplit('.', 1)[1].lower()
    unique_name = f"{uuid.uuid4()}.{ext}"
    
    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'avatars')
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, unique_name)
    file.save(file_path)
    
    avatar_url = f"/static/uploads/avatars/{unique_name}"
    user.avatar_url = avatar_url
    db.session.commit()
    
    log_audit("Avatar Uploaded", details=f"User '{user.username}' uploaded a new avatar.", user_id=user.id)
    
    return jsonify({
        "msg": "Avatar uploaded successfully", 
        "avatar_url": avatar_url,
        "user": user.to_dict()
    }), 200

@auth_bp.route('/organization-branding', methods=['GET'])
def get_organization_branding():
    subdomain = request.args.get('subdomain')
    if not subdomain or subdomain in ['localhost', '127.0.0.1']:
        return jsonify({"name": "Nova Library", "logo_url": "/logo.svg"}), 200
        
    org = Organization.query.filter_by(subdomain=subdomain).first()
    if not org:
        return jsonify({"name": "Nova Library", "logo_url": "/logo.svg"}), 200
        
    return jsonify({
        "name": org.name,
        "logo_url": org.logo_url or "/logo.svg"
    }), 200

@auth_bp.route('/register-otp', methods=['POST'])
def register_otp():
    data = request.get_json()
    if not data or not data.get('email_or_phone'):
        return jsonify({"msg": "Email or phone number is required"}), 400
        
    email_or_phone = data['email_or_phone'].strip()
    
    # Check if identifier already registered
    existing_user = User.query.filter((User.email == email_or_phone) | (User.phone == email_or_phone)).first()
    if existing_user:
        return jsonify({"msg": "An account with this email or phone already exists"}), 400
        
    # Validate format
    is_phone = email_or_phone.startswith('+') or email_or_phone.replace('-', '').replace(' ', '').replace('(', '').replace(')', '').isdigit()
    is_email = not is_phone
    if is_email:
        if not validate_email_format(email_or_phone):
            return jsonify({"msg": "Invalid email address format"}), 400
    else:
        email_or_phone = email_or_phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        if not email_or_phone.startswith('+'):
            email_or_phone = '+' + email_or_phone
        if not validate_phone_format(email_or_phone):
            return jsonify({"msg": "Invalid phone number format. Must start with '+' followed by country code (e.g. +91XXXXXXXXXX)"}), 400
            
    # Check rate limit
    if not check_otp_rate_limit(email_or_phone):
        return jsonify({"msg": "Maximum of 5 OTP requests per hour exceeded"}), 429
        
    # Generate 6-digit code
    import secrets
    otp_code = f"{secrets.SystemRandom().randint(100000, 999999)}"

    # Dispatch OTP
    success = False
    error_msg = ""
    if is_email:
        smtp_host = os.environ.get('SMTP_HOST') or os.environ.get('MAIL_SERVER')
        smtp_port = os.environ.get('SMTP_PORT') or os.environ.get('MAIL_PORT')
        smtp_user = os.environ.get('SMTP_USER') or os.environ.get('MAIL_USERNAME')
        smtp_pass = os.environ.get('SMTP_PASS') or os.environ.get('MAIL_PASSWORD')
        email_from = os.environ.get('EMAIL_FROM') or os.environ.get('MAIL_DEFAULT_SENDER')
        if not (smtp_host and smtp_port and smtp_user and smtp_pass and email_from):
            if os.environ.get('MOCK_OTP_DELIVERY') == 'true':
                pass
            else:
                return jsonify({"msg": "Configuration Error: SMTP credentials are not configured in .env"}), 500
                
        subject = "Nova Library - Registration Verification OTP"
        body = f"Hello,\n\nYour registration verification OTP is {otp_code}.\n\nThis code expires in 2 minutes.\n\nNova System Security Node"
        success, error_msg = NotificationService.send_email(email_or_phone, subject, body, otp_code=otp_code)
    else:
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        from_number = os.environ.get('TWILIO_FROM_NUMBER')
        if not (account_sid and auth_token and from_number):
            if os.environ.get('MOCK_OTP_DELIVERY') == 'true':
                pass
            else:
                return jsonify({"msg": "Configuration Error: Twilio credentials are not configured in .env"}), 500
                
        message = f"Nova Library: Your registration verification OTP is {otp_code}. Valid for 2 minutes."
        success, error_msg = NotificationService.send_sms(email_or_phone, message, otp_code=otp_code)
        
    if not success:
        return jsonify({"msg": error_msg or "Failed to deliver OTP"}), 500
        
    # Store in memory cache for test verification runner in the same process
    otp_cache[email_or_phone] = otp_code
    
    # Hash OTP and store in registration cache
    now = datetime.utcnow()
    registration_otps[email_or_phone] = {
        'hash': generate_password_hash(otp_code),
        'expires_at': now + timedelta(minutes=2)
    }
        
    log_audit("Registration OTP Requested", details=f"Registration OTP sent to {email_or_phone}")
    return jsonify({"success": True, "msg": "Verification OTP sent successfully"}), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    if not data or not data.get('email_or_phone'):
        return jsonify({"msg": "Email or phone number is required"}), 400
        
    email_or_phone = data['email_or_phone'].strip()
    
    # Query user by email or phone
    user = User.query.filter((User.email == email_or_phone) | (User.phone == email_or_phone)).first()
    if not user:
        return jsonify({"msg": "No account associated with this email or phone"}), 404
        
    if user.status != 'active':
        return jsonify({"msg": "Account is inactive or pending approval"}), 403
        
    # Validate format
    is_phone = email_or_phone.startswith('+') or email_or_phone.replace('-', '').replace(' ', '').replace('(', '').replace(')', '').isdigit()
    is_email = not is_phone
    if is_email:
        if not validate_email_format(email_or_phone):
            return jsonify({"msg": "Invalid email address format"}), 400
    else:
        if not validate_phone_format(email_or_phone):
            return jsonify({"msg": "Invalid phone number format. Must start with '+' followed by country code (e.g. +91XXXXXXXXXX)"}), 400
            
    # Check rate limit
    if not check_otp_rate_limit(email_or_phone):
        return jsonify({"msg": "Maximum of 5 OTP requests per hour exceeded"}), 429
        
    # Generate 6-digit code
    import secrets
    otp_code = f"{secrets.SystemRandom().randint(100000, 999999)}"
    
    # Store in memory cache for test verification runner in the same process
    otp_cache[email_or_phone] = otp_code
    
    # Assign attributes in-memory (do not commit yet)
    now = datetime.utcnow()
    user.otp_hash = generate_password_hash(otp_code)
    user.otp_expires_at = now + timedelta(minutes=2)
    user.otp_last_requested_at = now
    user.otp_verified = False
        
    # Dispatch OTP
    success = False
    error_msg = ""
    if is_email:
        smtp_host = os.environ.get('SMTP_HOST') or os.environ.get('MAIL_SERVER')
        smtp_port = os.environ.get('SMTP_PORT') or os.environ.get('MAIL_PORT')
        smtp_user = os.environ.get('SMTP_USER') or os.environ.get('MAIL_USERNAME')
        smtp_pass = os.environ.get('SMTP_PASS') or os.environ.get('MAIL_PASSWORD')
        email_from = os.environ.get('EMAIL_FROM') or os.environ.get('MAIL_DEFAULT_SENDER')
        if not (smtp_host and smtp_port and smtp_user and smtp_pass and email_from):
            if os.environ.get('MOCK_OTP_DELIVERY') == 'true':
                pass
            else:
                return jsonify({"msg": "Configuration Error: SMTP credentials are not configured in .env"}), 500
                
        subject = "Nova Library - Password Reset OTP"
        body = f"Hello {user.username},\n\nYour password reset OTP is {otp_code}.\n\nThis code expires in 2 minutes.\n\nNova System Security Node"
        success, error_msg = NotificationService.send_email(email_or_phone, subject, body, otp_code=otp_code)
    else:
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        from_number = os.environ.get('TWILIO_FROM_NUMBER')
        if not (account_sid and auth_token and from_number):
            if os.environ.get('MOCK_OTP_DELIVERY') == 'true':
                pass
            else:
                return jsonify({"msg": "Configuration Error: Twilio credentials are not configured in .env"}), 500
                
        message = f"Nova Library: Your password reset OTP is {otp_code}. Valid for 2 minutes."
        success, error_msg = NotificationService.send_sms(email_or_phone, message, otp_code=otp_code)
        
    if not success:
        db.session.rollback()
        return jsonify({"msg": error_msg or "Failed to deliver OTP"}), 500
        
    # Commit changes on success
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Failed to save OTP"}), 500
        
    log_audit("Password Reset OTP Requested", details=f"Password Reset OTP sent to {email_or_phone}", user_id=user.id)
    return jsonify({"success": True, "msg": "Password reset OTP sent successfully"}), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    if not data or not data.get('email_or_phone') or not data.get('otp_code') or not data.get('new_password'):
        return jsonify({"msg": "Email/phone, OTP, and new password are required"}), 400
        
    email_or_phone = data['email_or_phone'].strip()
    otp_code = data['otp_code'].strip()
    new_password = data['new_password']
    
    user = User.query.filter((User.email == email_or_phone) | (User.phone == email_or_phone)).first()
    if not user:
        return jsonify({"msg": "Account not found"}), 404
        
    if user.status != 'active':
        return jsonify({"msg": "Account is inactive or pending approval"}), 403
        
    # Verify OTP
    if not user.otp_hash or not user.otp_expires_at:
        return jsonify({"msg": "No active password reset request found"}), 400
        
    if getattr(user, 'otp_verified', False):
        return jsonify({"msg": "OTP has already been used"}), 400
        
    now = datetime.utcnow()
    if now > user.otp_expires_at:
        user.otp_hash = None
        user.otp_expires_at = None
        db.session.commit()
        return jsonify({"msg": "OTP has expired. Please request a new code"}), 400
        
    if not check_password_hash(user.otp_hash, otp_code):
        return jsonify({"msg": "Invalid verification code"}), 400
        
    # Mark used/verified & update password
    try:
        user.otp_verified = True
        user.otp_hash = None
        user.otp_expires_at = now - timedelta(seconds=1)
        user.otp_resend_attempts = 0
        user.set_password(new_password)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Failed to reset password"}), 500
        
    log_audit("Password Reset Completed", details=f"User '{user.username}' reset password successfully.", user_id=user.id)
    return jsonify({"success": True, "msg": "Password reset successfully. Please log in with your new password"}), 200
