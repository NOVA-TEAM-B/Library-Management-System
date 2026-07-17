from backend.config.database import db
from datetime import datetime

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    browser = db.Column(db.String(150), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    user = db.relationship('User', back_populates='audit_logs')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else "System",
            'action': self.action,
            'details': self.details,
            'ip_address': self.ip_address,
            'browser': self.browser,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }
