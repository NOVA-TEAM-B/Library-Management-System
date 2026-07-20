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

    # Enterprise Upgrade Metadata
    publisher = db.Column(db.String(150), nullable=True)
    edition = db.Column(db.String(50), nullable=True)
    rack_number = db.Column(db.String(50), nullable=True)
    shelf_number = db.Column(db.String(50), nullable=True)
    floor = db.Column(db.String(50), nullable=True)
    library_branch = db.Column(db.String(100), nullable=True)
    lost_copies = db.Column(db.Integer, default=0, nullable=False)
    damaged_copies = db.Column(db.Integer, default=0, nullable=False)
    repair_copies = db.Column(db.Integer, default=0, nullable=False)
    replacement_cost = db.Column(db.Float, default=0.0, nullable=False)
    subject = db.Column(db.String(100), nullable=True)
    accession_number = db.Column(db.String(50), nullable=True)

    # Digital Catalog settings
    is_digital = db.Column(db.Boolean, default=False, nullable=False)
    pdf_url = db.Column(db.Text, nullable=True)
    allow_download = db.Column(db.Boolean, default=True, nullable=False)

    # Relationships
    organization = db.relationship('Organization', back_populates='books')
    reservations = db.relationship('Reservation', back_populates='book', cascade="all, delete-orphan")
    issues = db.relationship('Issue', back_populates='book', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title or 'Unknown Title',
            'author': self.author or 'Unknown Author',
            'category': self.category or 'General',
            'isbn': self.isbn or 'N/A',
            'availability': self.availability if self.availability is not None else True,
            'quantity': self.quantity if self.quantity is not None else 1,
            'cover_url': self.cover_url,
            'rating': self.rating,
            'popularity': self.popularity,
            'ai_recommendation_score': self.ai_recommendation_score,
            'org_id': self.org_id,
            'publisher': self.publisher,
            'edition': self.edition,
            'rack_number': self.rack_number,
            'shelf_number': self.shelf_number,
            'floor': self.floor,
            'library_branch': self.library_branch,
            'lost_copies': self.lost_copies,
            'damaged_copies': self.damaged_copies,
            'repair_copies': self.repair_copies,
            'replacement_cost': self.replacement_cost,
            'subject': self.subject,
            'accession_number': self.accession_number,
            'is_digital': self.is_digital,
            'pdf_url': self.pdf_url,
            'allow_download': self.allow_download
        }
