from backend.config.database import db
from datetime import datetime

class Organization(db.Model):
    __tablename__ = 'organizations'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    subdomain = db.Column(db.String(50), unique=True, nullable=False)
    logo_url = db.Column(db.String(255), nullable=True)
    fine_rate = db.Column(db.Float, default=5.0, nullable=False) # Fine per day
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    users = db.relationship('User', back_populates='organization', cascade="all, delete-orphan")
    books = db.relationship('Book', back_populates='organization', cascade="all, delete-orphan")
    issues = db.relationship('Issue', back_populates='organization', cascade="all, delete-orphan")
    reservations = db.relationship('Reservation', back_populates='organization', cascade="all, delete-orphan")
    fines = db.relationship('Fine', back_populates='organization', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'subdomain': self.subdomain,
            'logo_url': self.logo_url,
            'fine_rate': self.fine_rate,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }
