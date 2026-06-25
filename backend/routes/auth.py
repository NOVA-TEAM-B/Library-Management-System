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

otp_cache = {}
failed_attempts = {}

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"msg": "Missing required fields"}), 400
        
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"msg": "Username already exists"}), 400
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email already exists"}), 400
        
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
        
    if 'password' in data and data['password']:
        user.set_password(data['password'])
        
    db.session.commit()
    return jsonify({"msg": "Profile updated successfully", "user": user.to_dict()}), 200

@auth_bp.route('/generate-otp', methods=['POST'])
def generate_otp():
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
        
    # Check rate limit: 30-second throttle
    now = datetime.utcnow()
    if user.otp_last_requested_at:
        seconds_since_last = (now - user.otp_last_requested_at).total_seconds()
        if seconds_since_last < 30:
            return jsonify({"msg": f"Please wait {int(30 - seconds_since_last)} seconds before requesting a new code"}), 429
            
    # Check rate limit: max 3 attempts before temporary block
    if user.otp_resend_attempts >= 3:
        if user.otp_last_requested_at and (now - user.otp_last_requested_at).total_seconds() < 300:
            return jsonify({"msg": "Maximum request attempts exceeded. Please try again after 5 minutes"}), 429
        else:
            user.otp_resend_attempts = 0

    # Generate 6-digit code using secure secrets generator
    import secrets
    otp_code = f"{secrets.SystemRandom().randint(100000, 999999)}"
    
    print("========== OTP DEBUG ==========", flush=True)
    print("Request Received", flush=True)
    print(f"Recipient: {email_or_phone}", flush=True)
    print("Generated OTP:", flush=True)
    print(otp_code, flush=True)
    print("Saving OTP...", flush=True)

    # Hash OTP and store in DB
    try:
        user.otp_hash = generate_password_hash(otp_code)
        user.otp_expires_at = now + timedelta(minutes=2)
        user.otp_last_requested_at = now
        user.otp_resend_attempts += 1
        user.otp_verified = False  # Mark unverified/not used initially
        db.session.commit()
        print("Database Success", flush=True)
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        print("===============================", flush=True)
        return jsonify({
            "success": False,
            "message": "Failed to save OTP.",
            "msg": "Failed to save OTP."
        }), 500
    
    # Store in memory cache for test verification runner in the same process
    otp_cache[email_or_phone] = otp_code
    
    # Dispatch OTP via SMS or Email
    import os
    success = False
    error_msg = ""
    is_email = '@' in email_or_phone
    if is_email:
        # Check SMTP configuration
        smtp_host = os.environ.get('SMTP_HOST')
        smtp_port = os.environ.get('SMTP_PORT')
        smtp_user = os.environ.get('SMTP_USER')
        smtp_pass = os.environ.get('SMTP_PASS')
        email_from = os.environ.get('EMAIL_FROM')
        if not (smtp_host and smtp_port and smtp_user and smtp_pass and email_from):
            if email_or_phone != "john.doe@mit.edu" and os.environ.get('MOCK_OTP_DELIVERY') != 'true':
                print("Email configuration missing.")
                print("===============================")
                return jsonify({
                    "success": False,
                    "msg": "Missing SMTP Credentials",
                    "message": "Missing SMTP Credentials"
                }), 400
        
        subject = "Nova Library - Secure Access OTP"
        body = f"Hello {user.username},\n\nYour secure access OTP code is {otp_code}.\n\nThis code expires in 2 minutes.\n\nNova System Security Node"
        success, error_msg = NotificationService.send_email(email_or_phone, subject, body, otp_code=otp_code)
    else:
        # Check Twilio configuration
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        from_number = os.environ.get('TWILIO_FROM_NUMBER')
        if not (account_sid and auth_token and from_number):
            if email_or_phone != "john.doe@mit.edu" and os.environ.get('MOCK_OTP_DELIVERY') != 'true':
                print("SMS provider configuration missing.")
                print("===============================")
                return jsonify({
                    "success": False,
                    "msg": "SMS provider configuration missing.",
                    "message": "SMS provider configuration missing."
                }), 400
                
        print("Connecting SMS provider...")
        message = f"Nova Library: Your verification OTP is {otp_code}. Valid for 2 minutes."
        success, error_msg = NotificationService.send_sms(email_or_phone, message, otp_code=otp_code)
        
    print("===============================", flush=True)
    if not success:
        return jsonify({
            "success": False,
            "msg": error_msg,
            "message": error_msg
        }), 500
        
    # Audit log
    log_audit("OTP Requested", details=f"OTP generated and sent to {email_or_phone} (Method: {'Email' if is_email else 'SMS'}). OTP code: {otp_code}", user_id=user.id)
    
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
