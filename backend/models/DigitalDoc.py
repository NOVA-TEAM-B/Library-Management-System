from backend.config.database import db
from datetime import datetime

class DigitalDoc(db.Model):
    __tablename__ = 'digital_docs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(100), nullable=False) # 'Research Paper', 'Thesis', 'Journal', 'Notes'
    file_path = db.Column(db.String(500), nullable=False)
    size = db.Column(db.String(50), nullable=False)
    version = db.Column(db.Integer, default=1, nullable=False)
    tags = db.Column(db.String(255), nullable=True) # comma separated tags
    member_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    org_id = db.Column(db.Integer, db.ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    member = db.relationship('User', backref=db.backref('digital_docs', lazy=True))
    organization = db.relationship('Organization', backref=db.backref('digital_docs', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'type': self.type,
            'file_path': self.file_path,
            'size': self.size,
            'version': self.version,
            'tags': self.tags.split(',') if self.tags else [],
            'member_id': self.member_id,
            'member_username': self.member.username if self.member else 'System',
            'org_id': self.org_id,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }
