import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, set_access_cookies, unset_jwt_cookies
from backend.config.database import db
from backend.models.User import User
from backend.models.Organization import Organization
from backend.utils.audit_helper import log_audit
from werkzeug.security import generate_password_hash, check_password_hash
from backend.services.notification_service import NotificationService
from backend.models.RegistrationOtp import RegistrationOtp
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
        
    username = data['username'].strip()
    email = data['email'].strip().lower()
    phone = data.get('phone', '').strip()

    # Normalization of phone
    phone_clean = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '') if phone else ""
    if phone_clean and not phone_clean.startswith('+'):
        phone_clean = '+' + phone_clean

    # Enforce format validation
    if phone_clean and not validate_phone_format(phone_clean):
        return jsonify({"msg": "Invalid phone number format. Must start with '+' followed by country code (e.g. +91XXXXXXXXXX)"}), 400

    # Enforce uniqueness checks
    if User.query.filter(User.username.ilike(username)).first():
        return jsonify({"msg": "Username already exists."}), 400
        
    if User.query.filter(User.email.ilike(email)).first():
        return jsonify({"msg": "Email already registered."}), 400

    if phone_clean and User.query.filter_by(phone=phone_clean).first():
        return jsonify({"msg": "Phone already registered."}), 400
        
    # Verify registration OTP in database
    otp_entry = RegistrationOtp.query.filter(
        (RegistrationOtp.email.ilike(email)) | (RegistrationOtp.phone == phone_clean)
    ).filter_by(purpose='registration', verified=True).filter(
        RegistrationOtp.expires_at > datetime.utcnow()
    ).first()

    if not otp_entry:
        return jsonify({"msg": "Please verify your OTP first."}), 400
        
    # Valid and verified! Delete entry to prevent reuse (OTP rules: "OTP deleted after successful verification")
    db.session.delete(otp_entry)
    db.session.commit()

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
        phone=phone_clean,
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
            "logo_url": user.organization.logo_url if user.organization else "/logo.png",
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

def dispatch_dual_channel_otp(user, otp_code, purpose="login"):
    has_email = bool(user.email and user.email.strip())
    has_phone = bool(user.phone and user.phone.strip())
    
    email_success = False
    email_error = ""
    sms_success = False
    sms_error = ""
    
    # 1. Dispatch Email
    if has_email:
        smtp_host = os.environ.get('SMTP_HOST') or os.environ.get('MAIL_SERVER')
        smtp_port = os.environ.get('SMTP_PORT') or os.environ.get('MAIL_PORT')
        smtp_user = os.environ.get('SMTP_USER') or os.environ.get('MAIL_USERNAME')
        smtp_pass = os.environ.get('SMTP_PASS') or os.environ.get('MAIL_PASSWORD')
        email_from = os.environ.get('EMAIL_FROM') or os.environ.get('MAIL_DEFAULT_SENDER')
        
        if not (smtp_host and smtp_port and smtp_user and smtp_pass and email_from):
            if os.environ.get('MOCK_OTP_DELIVERY') == 'true':
                email_success = True
            else:
                email_error = "SMTP credentials are not configured in .env"
        else:
            if purpose == "password_reset":
                subject = "Nova Library - Password Reset OTP"
                body = f"Hello {user.username},\n\nYour password reset OTP is {otp_code}.\n\nThis code expires in 5 minutes.\n\nNova System Security Node"
            else:
                subject = "Nova Library - Secure Access OTP"
                body = f"Hello {user.username},\n\nYour secure access OTP code is {otp_code}.\n\nThis code expires in 5 minutes.\n\nNova System Security Node"
            
            email_success, email_error = NotificationService.send_email(user.email, subject, body, otp_code=otp_code)

    # 2. Dispatch SMS
    if has_phone:
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        from_number = os.environ.get('TWILIO_FROM_NUMBER')
        
        # Normalize phone number to E.164 format
        target_phone = user.phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        if not target_phone.startswith('+'):
            target_phone = '+' + target_phone
            
        print("--------------------------------------------------", flush=True)
        print("SMS DISPATCH LOG", flush=True)
        print(f"User ID       : {user.id}", flush=True)
        print(f"Username      : {user.username}", flush=True)
        print(f"Email         : {user.email}", flush=True)
        print(f"Phone Retrieved: {user.phone}", flush=True)
        print(f"Phone Used    : {target_phone}", flush=True)
        print("OTP Generated : ******", flush=True)
        
        if not (account_sid and auth_token and from_number):
            if os.environ.get('MOCK_OTP_DELIVERY') == 'true':
                sms_success = True
                print("SMS Provider Response: MOCK MODE ACTIVE", flush=True)
                print("SMS Status    : SUCCESS", flush=True)
                print("Delivery Result: Mocked delivery logged", flush=True)
            else:
                sms_error = "Twilio credentials are not configured in .env"
                print("SMS Provider Response: CREDENTIALS MISSING", flush=True)
                print("SMS Status    : FAILED", flush=True)
                print(f"Delivery Result: {sms_error}", flush=True)
        else:
            if purpose == "password_reset":
                message = f"Nova Library: Your password reset OTP is {otp_code}. Valid for 5 minutes."
            else:
                message = f"Nova Library: Your verification OTP is {otp_code}. Valid for 5 minutes."
            
            sms_success, sms_error = NotificationService.send_sms(target_phone, message, otp_code=otp_code)
            print(f"SMS Status    : {'SUCCESS' if sms_success else 'FAILED'}", flush=True)
            print(f"Delivery Result: {'Success' if sms_success else sms_error}", flush=True)
        print("--------------------------------------------------", flush=True)

    # 3. Determine result status and messages
    if has_email and has_phone:
        if email_success and sms_success:
            return True, "OTP sent successfully to your registered email and phone.", 200
        elif email_success and not sms_success:
            return True, "OTP sent to your registered email. SMS delivery unavailable.", 200
        elif not email_success and sms_success:
            return True, "OTP sent to your registered phone. Email delivery unavailable.", 200
        else:
            err_msg = f"Failed to deliver OTP. Email: {email_error or 'Unknown error'}. SMS: {sms_error or 'Unknown error'}."
            return False, err_msg, 500
            
    elif has_email:
        if email_success:
            return True, "OTP sent to your registered email.", 200
        else:
            return False, f"Failed to deliver OTP to email. Error: {email_error or 'Unknown error'}.", 500
            
    elif has_phone:
        if sms_success:
            return True, "OTP sent to your registered phone.", 200
        else:
            return False, f"Failed to deliver OTP to phone. Error: {sms_error or 'Unknown error'}.", 500
            
    else:
        return False, "No registered contact channel found.", 400


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
    
    # Normalize input
    is_phone = email_or_phone.startswith('+') or email_or_phone.replace('-', '').replace(' ', '').replace('(', '').replace(')', '').isdigit()
    is_email = not is_phone
    if is_email:
        email_or_phone = email_or_phone.lower()
        print(f"Normalized email_or_phone: {email_or_phone} (Type: Email)", flush=True)
        if not validate_email_format(email_or_phone):
            return jsonify({"msg": "Invalid email address format"}), 400
    else:
        email_or_phone = email_or_phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        if not email_or_phone.startswith('+'):
            email_or_phone = '+' + email_or_phone
        print(f"Normalized email_or_phone: {email_or_phone} (Type: Phone)", flush=True)
        if not validate_phone_format(email_or_phone):
            return jsonify({"msg": "Invalid phone number format. Must start with '+' followed by country code (e.g. +91XXXXXXXXXX)"}), 400

    # Query user by email or phone
    user = User.query.filter((User.email == email_or_phone) | (User.phone == email_or_phone)).first()
    print(f"User Found: {user.username if user else 'None'}", flush=True)
    if not user:
        return jsonify({"msg": "No account associated with this email or phone"}), 404
        
    print(f"User Status: {user.status}", flush=True)
    if user.status != 'active':
        return jsonify({"msg": "Account is inactive or pending approval"}), 403

    # Hourly rate limit check (max 5 requests per hour)
    if not check_otp_rate_limit(email_or_phone):
        return jsonify({"msg": "Maximum of 5 OTP requests per hour exceeded"}), 429

    # Check rate limit: 60-second throttle
    now = datetime.utcnow()
    if user.otp_last_requested_at:
        seconds_since_last = (now - user.otp_last_requested_at).total_seconds()
        if seconds_since_last < 60:
            return jsonify({"msg": f"Please wait {int(60 - seconds_since_last)} seconds before requesting a new code"}), 429

    # Generate 6-digit code using secure secrets generator
    import secrets
    otp_code = f"{secrets.SystemRandom().randint(100000, 999999)}"
    print(f"OTP Generated: {otp_code if os.environ.get('FLASK_ENV') == 'development' else '******'}", flush=True)

    # Assign user attributes in-memory (do not commit yet)
    user.otp_hash = generate_password_hash(otp_code)
    user.otp_expires_at = now + timedelta(minutes=5) # 5 minutes expiration
    user.otp_last_requested_at = now
    user.otp_resend_attempts += 1
    user.otp_verified = False  # Mark unverified/not used initially
    
    # Store in memory cache for test verification runner in the same process
    otp_cache[email_or_phone] = otp_code
    if user.email:
        otp_cache[user.email] = otp_code
    if user.phone:
        otp_cache[user.phone] = otp_code

    # Dispatch OTP via both channels independently
    success, msg, status_code = dispatch_dual_channel_otp(user, otp_code, purpose="login")
    
    if not success:
        db.session.rollback()
        return jsonify({"success": False, "msg": msg, "message": msg}), status_code
        
    # Commit changes on success
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "msg": "Failed to save OTP.", "message": "Failed to save OTP."}), 500
        
    # Audit log
    log_audit("OTP Requested", details=f"OTP generated and sent: {msg}", user_id=user.id)
    return jsonify({
        "success": True,
        "msg": msg,
        "message": msg
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
            "logo_url": user.organization.logo_url if user.organization else "/logo.png",
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
        return jsonify({"name": "Nova Library", "logo_url": "/logo.png"}), 200
        
    org = Organization.query.filter_by(subdomain=subdomain).first()
    if not org:
        return jsonify({"name": "Nova Library", "logo_url": "/logo.png"}), 200
        
    return jsonify({
        "name": org.name,
        "logo_url": org.logo_url or "/logo.png"
    }), 200

@auth_bp.route('/send-registration-otp', methods=['POST'])
def send_registration_otp():
    # Automatically remove expired OTPs
    RegistrationOtp.query.filter(RegistrationOtp.expires_at < datetime.utcnow()).delete()
    db.session.commit()

    data = request.get_json()
    if not data or not data.get('username') or not data.get('email') or not data.get('phone'):
        return jsonify({"msg": "Username, email, and phone number are required"}), 400
        
    username = data['username'].strip()
    email = data['email'].strip().lower()
    phone = data['phone'].strip()
    password = data.get('password', '').strip()

    # Backend Validation:
    # 1. Email format
    if not validate_email_format(email):
        return jsonify({"msg": "Invalid email address format"}), 400

    # 2. Phone format
    phone_clean = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
    if not phone_clean.startswith('+'):
        phone_clean = '+' + phone_clean
    if not validate_phone_format(phone_clean):
        return jsonify({"msg": "Invalid phone number format. Must start with '+' followed by country code (e.g. +91XXXXXXXXXX)"}), 400

    # 3. Password policy
    if password and len(password) < 8:
        return jsonify({"msg": "Password must be at least 8 characters long"}), 400

    # 4. Uniqueness
    if User.query.filter(User.username.ilike(username)).first():
        return jsonify({"msg": "Username already exists."}), 400

    if User.query.filter(User.email.ilike(email)).first():
        return jsonify({"msg": "Email already exists."}), 400

    if User.query.filter_by(phone=phone_clean).first():
        return jsonify({"msg": "Phone already exists."}), 400

    # Rate Limit: max 5 requests per hour per identifier
    if not check_otp_rate_limit(email) or not check_otp_rate_limit(phone_clean):
        return jsonify({"msg": "Maximum of 5 OTP requests per hour exceeded"}), 429

    # Generate secure random 6-digit OTP code
    import secrets
    otp_code = f"{secrets.SystemRandom().randint(100000, 999999)}"

    # Invalidate/delete any previous registration OTPs for this email or phone
    RegistrationOtp.query.filter((RegistrationOtp.email.ilike(email)) | (RegistrationOtp.phone == phone_clean)).delete()
    db.session.commit()

    # Hash OTP and store in DB
    now = datetime.utcnow()
    hashed_otp = generate_password_hash(otp_code)
    otp_entry = RegistrationOtp(
        email=email,
        phone=phone_clean,
        otp=hashed_otp,
        purpose='registration',
        expires_at=now + timedelta(minutes=5),
        verified=False,
        attempts=0
    )
    db.session.add(otp_entry)
    db.session.commit()

    # Maintain the in-memory cache for backwards compatibility with tests
    otp_cache[email] = otp_code
    otp_cache[phone_clean] = otp_code

    # Dispatch OTP via SMTP (Email) and Twilio (SMS)
    subject = "Nova Library Verification Code"
    body = f"Hello,\n\nYour verification code is\n\n{otp_code}\n\nThis OTP expires in 5 minutes.\n\nDo not share this code.\n\nNova Library Management System"

    email_success, email_err = NotificationService.send_email(email, subject, body, otp_code=otp_code)
    if not email_success:
        db.session.delete(otp_entry)
        db.session.commit()
        return jsonify({"msg": email_err or "Failed to deliver email OTP"}), 500

    # SMS dispatch (if Twilio configured, send SMS. If not configured, gracefully skip)
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    from_number = os.environ.get('TWILIO_FROM_NUMBER')
    
    if account_sid and auth_token and from_number:
        sms_msg = f"Nova Library: Your verification OTP is {otp_code}. Valid for 5 minutes."
        NotificationService.send_sms(phone_clean, sms_msg, otp_code=otp_code)
    else:
        print("Twilio SMS is not configured in .env. Skipping SMS dispatch gracefully.", flush=True)

    log_audit("Registration OTP Requested", details=f"Registration OTP sent to {email} and {phone_clean}")
    return jsonify({
        "success": True,
        "message": "OTP sent successfully."
    }), 200

@auth_bp.route('/verify-registration-otp', methods=['POST'])
def verify_registration_otp():
    # Automatically remove expired OTPs
    RegistrationOtp.query.filter(RegistrationOtp.expires_at < datetime.utcnow()).delete()
    db.session.commit()

    data = request.get_json()
    if not data or not data.get('email') or not data.get('otp'):
        return jsonify({"msg": "Email and OTP code are required"}), 400

    email = data['email'].strip().lower()
    otp_code = data['otp'].strip()

    # Query active OTP entry
    otp_entry = RegistrationOtp.query.filter(
        (RegistrationOtp.email.ilike(email)) | (RegistrationOtp.phone == email)
    ).filter_by(purpose='registration', verified=False).order_by(RegistrationOtp.id.desc()).first()

    if not otp_entry:
        return jsonify({"msg": "Please request a new OTP."}), 400

    if datetime.utcnow() > otp_entry.expires_at:
        return jsonify({"msg": "OTP expired."}), 400

    if otp_entry.attempts >= 5:
        return jsonify({"msg": "Too many attempts."}), 400

    # Verify code
    if not check_password_hash(otp_entry.otp, otp_code):
        otp_entry.attempts += 1
        db.session.commit()
        if otp_entry.attempts >= 5:
            return jsonify({"msg": "Too many attempts."}), 400
        return jsonify({"msg": "Invalid OTP."}), 400

    # OTP verified! Mark it as verified in database
    otp_entry.verified = True
    db.session.commit()

    log_audit("Registration OTP Verified", details=f"Registration OTP verified successfully for {email}")
    return jsonify({
        "verified": True
    }), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    if not data or not data.get('email_or_phone'):
        return jsonify({"msg": "Email or phone number is required"}), 400
        
    email_or_phone = data['email_or_phone'].strip()
    
    # Query user by email, phone, or username (case-insensitive)
    user = User.query.filter(
        (User.email.ilike(email_or_phone)) | 
        (User.phone == email_or_phone) | 
        (User.username.ilike(email_or_phone))
    ).first()
    
    if not user:
        return jsonify({"msg": "No account found."}), 404
        
    if user.status != 'active':
        return jsonify({"msg": "Account is inactive or pending approval"}), 403
        
    # Use user's primary email or phone for rate-limiting
    dispatch_target = user.email if user.email else user.phone

    # Check rate limit
    if not check_otp_rate_limit(dispatch_target):
        return jsonify({"msg": "Maximum of 5 OTP requests per hour exceeded"}), 429
        
    # Check rate limit: 60-second throttle
    now = datetime.utcnow()
    if user.otp_last_requested_at:
        seconds_since_last = (now - user.otp_last_requested_at).total_seconds()
        if seconds_since_last < 60:
            return jsonify({"msg": f"Please wait {int(60 - seconds_since_last)} seconds before requesting a new code"}), 429

    # Generate 6-digit code
    import secrets
    otp_code = f"{secrets.SystemRandom().randint(100000, 999999)}"
    
    # Store in memory cache for test verification runner in the same process
    otp_cache[dispatch_target] = otp_code
    otp_cache[email_or_phone] = otp_code
    if user.email:
        otp_cache[user.email] = otp_code
    if user.phone:
        otp_cache[user.phone] = otp_code
    
    # Assign attributes in-memory (do not commit yet)
    user.otp_hash = generate_password_hash(otp_code)
    user.otp_expires_at = now + timedelta(minutes=5) # 5 minutes expiration
    user.otp_last_requested_at = now
    user.otp_verified = False
        
    # Dispatch OTP via both channels independently
    success, msg, status_code = dispatch_dual_channel_otp(user, otp_code, purpose="password_reset")
    
    if not success:
        db.session.rollback()
        return jsonify({"msg": msg}), status_code
        
    # Commit changes on success
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Failed to save OTP"}), 500
        
    log_audit("Password Reset OTP Requested", details=f"Password Reset OTP sent: {msg}", user_id=user.id)
    return jsonify({"success": True, "msg": msg}), 200


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
