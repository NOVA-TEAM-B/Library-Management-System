from backend.config.database import db
from datetime import datetime

class CalendarEvent(db.Model):
    __tablename__ = 'calendar_events'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    event_date = db.Column(db.Date, nullable=False)
    event_type = db.Column(db.String(50), default='event', nullable=False) # 'holiday', 'event', 'workshop'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    org_id = db.Column(db.Integer, db.ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True)

    # Relationships
    organization = db.relationship('Organization', backref=db.backref('calendar_events', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'event_date': self.event_date.strftime('%Y-%m-%d') if self.event_date else None,
            'event_type': self.event_type,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'org_id': self.org_id
        }
