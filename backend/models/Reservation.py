from backend.config.database import db
from datetime import datetime

class Reservation(db.Model):
    __tablename__ = 'reservations'
    
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reservation_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    status = db.Column(db.String(20), default='pending', nullable=False) # pending, approved, cancelled, completed
    org_id = db.Column(db.Integer, db.ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True)

    # Relationships
    member = db.relationship('User', back_populates='reservations')
    book = db.relationship('Book', back_populates='reservations')
    organization = db.relationship('Organization', back_populates='reservations')

    def to_dict(self):
        return {
            'id': self.id,
            'book_id': self.book_id,
            'book_title': self.book.title if self.book else None,
            'book_author': self.book.author if self.book else None,
            'member_id': self.member_id,
            'member_name': self.member.username if self.member else None,
            'member_email': self.member.email if self.member else None,
            'reservation_date': self.reservation_date.strftime('%Y-%m-%d %H:%M:%S') if self.reservation_date else None,
            'status': self.status,
            'org_id': self.org_id
        }
