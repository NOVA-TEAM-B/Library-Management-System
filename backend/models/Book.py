from backend.config.database import db

class Book(db.Model):
    __tablename__ = 'books'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    isbn = db.Column(db.String(50), unique=True, nullable=False)
    availability = db.Column(db.Boolean, default=True, nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    cover_url = db.Column(db.Text, nullable=True)
    
    # Ultra-Premium Metadata
    rating = db.Column(db.Float, default=4.5, nullable=False) # 1.0 to 5.0 stars
    popularity = db.Column(db.Integer, default=50, nullable=False) # reader count
    ai_recommendation_score = db.Column(db.Integer, default=85, nullable=False) # 0-100 percentage match score
    org_id = db.Column(db.Integer, db.ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True)

    # Relationships
    organization = db.relationship('Organization', back_populates='books')
    reservations = db.relationship('Reservation', back_populates='book', cascade="all, delete-orphan")
    issues = db.relationship('Issue', back_populates='book', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'category': self.category,
            'isbn': self.isbn,
            'availability': self.availability,
            'quantity': self.quantity,
            'cover_url': self.cover_url,
            'rating': self.rating,
            'popularity': self.popularity,
            'ai_recommendation_score': self.ai_recommendation_score,
            'org_id': self.org_id
        }
