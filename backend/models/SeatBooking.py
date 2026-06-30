from backend.config.database import db
from datetime import datetime

class SeatBooking(db.Model):
    __tablename__ = 'seat_bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    seat_number = db.Column(db.String(50), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String(50), default='booked', nullable=False) # 'booked', 'released'
    booking_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    release_time = db.Column(db.DateTime, nullable=True)
    duration_minutes = db.Column(db.Integer, default=120, nullable=False)

    # Relationships
    member = db.relationship('User', backref=db.backref('seat_bookings', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'seat_number': self.seat_number,
            'member_id': self.member_id,
            'member_username': self.member.username if self.member else 'Unknown',
            'status': self.status,
            'booking_time': self.booking_time.strftime('%Y-%m-%d %H:%M:%S') if self.booking_time else None,
            'release_time': self.release_time.strftime('%Y-%m-%d %H:%M:%S') if self.release_time else None,
            'duration_minutes': self.duration_minutes
        }
