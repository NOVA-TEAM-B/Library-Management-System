from backend.config.database import db
from datetime import datetime

class BookRequest(db.Model):
    __tablename__ = 'book_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(150), nullable=False)
    isbn = db.Column(db.String(50), nullable=True)
    member_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending', nullable=False) # 'pending', 'approved', 'rejected', 'ordered'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    org_id = db.Column(db.Integer, db.ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True)

    # Relationships
    member = db.relationship('User', backref=db.backref('book_requests', lazy=True))
    organization = db.relationship('Organization', backref=db.backref('book_requests', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'isbn': self.isbn,
            'member_id': self.member_id,
            'member_name': self.member.username if self.member else None,
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'org_id': self.org_id
        }
