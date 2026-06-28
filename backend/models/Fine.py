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
    
    # New audit fields for verification
    payment_date = db.Column(db.DateTime, nullable=True)
    transaction_reference = db.Column(db.String(100), nullable=True)
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Relationships
    issue = db.relationship('Issue', back_populates='fines')
    member = db.relationship('User', foreign_keys=[member_id], back_populates='fines')
    organization = db.relationship('Organization', back_populates='fines')
    approver = db.relationship('User', foreign_keys=[approver_id])

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
            'payment_date': self.payment_date.strftime('%Y-%m-%d %H:%M:%S') if self.payment_date else None,
            'transaction_reference': self.transaction_reference,
            'approver_id': self.approver_id,
            'approver_name': self.approver.username if self.approver else None,
            'org_id': self.org_id
        }
