from backend.config.database import db
from datetime import datetime

class MemberXP(db.Model):
    __tablename__ = 'member_xp'
    
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    xp_points = db.Column(db.Integer, default=0, nullable=False)
    level = db.Column(db.Integer, default=1, nullable=False)
    streak_days = db.Column(db.Integer, default=0, nullable=False)
    last_active = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    member = db.relationship('User', backref=db.backref('xp_profile', uselist=False, cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            'id': self.id,
            'member_id': self.member_id,
            'xp_points': self.xp_points,
            'level': self.level,
            'streak_days': self.streak_days,
            'last_active': self.last_active.strftime('%Y-%m-%d %H:%M:%S') if self.last_active else None
        }
