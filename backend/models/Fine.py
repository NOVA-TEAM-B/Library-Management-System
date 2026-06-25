from backend.config.database import db
from datetime import datetime

class Fine(db.Model):
    __tablename__ = 'fines'
    
    id = db.Column(db.Integer, primary_key=True)
    issue_id = db.Column(db.Integer, db.ForeignKey('issues.id'), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending', nullable=False) # pending, paid
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    org_id = db.Column(db.Integer, db.ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True)

    # Relationships
    issue = db.relationship('Issue', back_populates='fines')
    member = db.relationship('User', back_populates='fines')
    organization = db.relationship('Organization', back_populates='fines')

    def to_dict(self):
        return {
            'id': self.id,
            'issue_id': self.issue_id,
            'book_title': self.issue.book.title if (self.issue and self.issue.book) else None,
            'member_id': self.member_id,
            'member_name': self.member.username if self.member else None,
            'amount': self.amount,
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'org_id': self.org_id
        }
