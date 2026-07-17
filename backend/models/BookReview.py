from backend.config.database import db
from datetime import datetime

class BookReview(db.Model):
    __tablename__ = 'book_reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id', ondelete='CASCADE'), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    rating = db.Column(db.Integer, nullable=False) # 1 to 5 stars
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    book = db.relationship('Book', backref=db.backref('reviews', lazy=True, cascade="all, delete-orphan"))
    member = db.relationship('User', backref=db.backref('reviews', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'book_id': self.book_id,
            'book_title': self.book.title if self.book else 'Unknown Book',
            'member_id': self.member_id,
            'member_username': self.member.username if self.member else 'Anonymous',
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }
