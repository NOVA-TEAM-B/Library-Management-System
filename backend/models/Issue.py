from backend.config.database import db
from datetime import datetime

class Issue(db.Model):
    __tablename__ = 'issues'
    
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    issue_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    due_date = db.Column(db.DateTime, nullable=False)
    return_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='issued', nullable=False) # issued, returned, overdue
    fine_amount = db.Column(db.Float, default=0.0, nullable=False)
    org_id = db.Column(db.Integer, db.ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True)

    # Reading progress tracking (NEW)
    reading_progress = db.Column(db.Integer, default=0, nullable=False)
    current_page = db.Column(db.Integer, default=1, nullable=False)

    # Renewal workflows
    renewal_requested = db.Column(db.Boolean, default=False, nullable=False)
    renewal_count = db.Column(db.Integer, default=0, nullable=False)
    renewal_status = db.Column(db.String(20), nullable=True) # pending, approved, rejected

    # Relationships
    member = db.relationship('User', back_populates='issues')
    book = db.relationship('Book', back_populates='issues')
    fines = db.relationship('Fine', back_populates='issue', cascade="all, delete-orphan")
    organization = db.relationship('Organization', back_populates='issues')

    def to_dict(self):
        return {
            'id': self.id,
            'book_id': self.book_id,
            'book_title': self.book.title if self.book else None,
            'book_author': self.book.author if self.book else None,
            'book_cover_url': self.book.cover_url if self.book else None,
            'book_pdf_url': self.book.pdf_url if self.book else None,
            'book_category': self.book.category if self.book else None,
            'member_id': self.member_id,
            'member_name': self.member.username if self.member else None,
            'membership_id': self.member.membership_id if self.member else None,
            'issue_date': self.issue_date.strftime('%Y-%m-%d %H:%M:%S') if self.issue_date else None,
            'due_date': self.due_date.strftime('%Y-%m-%d %H:%M:%S') if self.due_date else None,
            'return_date': self.return_date.strftime('%Y-%m-%d %H:%M:%S') if self.return_date else None,
            'status': self.status,
            'fine_amount': self.fine_amount,
            'org_id': self.org_id,
            'reading_progress': self.reading_progress,
            'current_page': self.current_page,
            'renewal_requested': self.renewal_requested,
            'renewal_count': self.renewal_count,
            'renewal_status': self.renewal_status
        }

