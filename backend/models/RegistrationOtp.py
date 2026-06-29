from backend.config.database import db
from datetime import datetime

class RegistrationOtp(db.Model):
    __tablename__ = 'registration_otps'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    otp = db.Column(db.String(255), nullable=False) # store hashed OTP
    purpose = db.Column(db.String(50), default='registration')
    expires_at = db.Column(db.DateTime, nullable=False)
    verified = db.Column(db.Boolean, default=False)
    attempts = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'phone': self.phone,
            'purpose': self.purpose,
            'expires_at': self.expires_at.strftime('%Y-%m-%d %H:%M:%S') if self.expires_at else None,
            'verified': self.verified,
            'attempts': self.attempts,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }
