from backend.config.database import db
from datetime import datetime

class Badge(db.Model):
    __tablename__ = 'badges'
    
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    badge_type = db.Column(db.String(100), nullable=False) # 'top-reader', 'fast-return', 'no-fine', 'explorer', 'critic'
    unlocked_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    member = db.relationship('User', backref=db.backref('badges', lazy=True, cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            'id': self.id,
            'member_id': self.member_id,
            'badge_type': self.badge_type,
            'unlocked_at': self.unlocked_at.strftime('%Y-%m-%d %H:%M:%S') if self.unlocked_at else None
        }
