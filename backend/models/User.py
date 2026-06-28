from backend.config.database import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='member', nullable=False) # superadmin, admin, librarian, member
    org_id = db.Column(db.Integer, db.ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True)
    
    # Member specific fields
    membership_id = db.Column(db.String(50), unique=True, nullable=True) # e.g. MEM-1001
    department = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(20), default='active', nullable=False) # active, inactive, pending
    
    # OTP Access configuration
    otp_hash = db.Column(db.String(255), nullable=True)
    otp_expires_at = db.Column(db.DateTime, nullable=True)
    otp_resend_attempts = db.Column(db.Integer, default=0, nullable=False)
    otp_last_requested_at = db.Column(db.DateTime, nullable=True)
    otp_verified = db.Column(db.Boolean, default=False, nullable=True)
    
    # AI Analytics Metrics
    reading_score = db.Column(db.Integer, default=75, nullable=False) # 0-100 score
    achievement_level = db.Column(db.String(30), default='Bronze Reader', nullable=False) # Bronze, Silver, Gold, Platinum, Knowledge Master
    late_return_risk = db.Column(db.String(20), default='Low', nullable=False) # Low, Medium, High
    
    # Custom Preferences & Security (NEW)
    avatar_url = db.Column(db.String(255), nullable=True)
    theme_preference = db.Column(db.String(50), default='dark', nullable=False)
    language_preference = db.Column(db.String(10), default='en', nullable=False)
    two_factor_enabled = db.Column(db.Boolean, default=False, nullable=False)
    notify_email = db.Column(db.Boolean, default=True, nullable=False)
    notify_sms = db.Column(db.Boolean, default=False, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    organization = db.relationship('Organization', back_populates='users')
    audit_logs = db.relationship('AuditLog', back_populates='user', cascade="all, delete-orphan")
    reservations = db.relationship('Reservation', back_populates='member', cascade="all, delete-orphan")
    issues = db.relationship('Issue', back_populates='member', cascade="all, delete-orphan")
    fines = db.relationship('Fine', foreign_keys='Fine.member_id', back_populates='member', cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
        
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'org_id': self.org_id,
            'org_name': self.organization.name if self.organization else None,
            'org_logo': self.organization.logo_url if self.organization else None,
            'fine_rate': self.organization.fine_rate if self.organization else 5.0,
            'membership_id': self.membership_id,
            'department': self.department,
            'phone': self.phone,
            'status': self.status,
            'reading_score': self.reading_score,
            'achievement_level': self.achievement_level,
            'late_return_risk': self.late_return_risk,
            'avatar_url': self.avatar_url,
            'theme_preference': self.theme_preference,
            'language_preference': self.language_preference,
            'two_factor_enabled': self.two_factor_enabled,
            'notify_email': self.notify_email,
            'notify_sms': self.notify_sms,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }

