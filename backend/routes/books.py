from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from backend.config.database import db
from backend.models.Book import Book
from backend.models.User import User
from backend.models.Reservation import Reservation
from backend.models.Issue import Issue
from backend.middleware.auth_middleware import role_required
from datetime import datetime, timedelta

books_bp = Blueprint('books', __name__)

@books_bp.route('', methods=['GET'])
def get_books():
    title = request.args.get('title', '')
    author = request.args.get('author', '')
    isbn = request.args.get('isbn', '')
    category = request.args.get('category', '')
    availability = request.args.get('availability')
    
    query = Book.query
    if title:
        query = query.filter(Book.title.ilike(f'%{title}%'))
    if author:
        query = query.filter(Book.author.ilike(f'%{author}%'))
    if isbn:
        query = query.filter(Book.isbn.ilike(f'%{isbn}%'))
    if category:
        query = query.filter(Book.category.ilike(f'%{category}%'))
    if availability is not None:
        val = availability.lower() == 'true'
        query = query.filter(Book.availability == val)
        
    books = query.all()
    return jsonify([book.to_dict() for book in books]), 200

@books_bp.route('', methods=['POST'])
@jwt_required()
@role_required('admin', 'librarian')
def add_book():
    data = request.get_json()
    if not data or not data.get('title') or not data.get('author') or not data.get('isbn') or not data.get('category'):
        return jsonify({"msg": "Missing required fields"}), 400
        
    if Book.query.filter_by(isbn=data['isbn']).first():
        return jsonify({"msg": "Book with this ISBN already exists"}), 400
        
    cover_url = data.get('cover_url') or "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400"
    qty = int(data.get('quantity', 1))
    
    # Generate mock AI values for visual demo
    import random
    rating = round(random.uniform(4.0, 5.0), 1)
    popularity = random.randint(10, 150)
    ai_score = random.randint(70, 99)

    book = Book(
        title=data['title'],
        author=data['author'],
        category=data['category'],
        isbn=data['isbn'],
        availability=qty > 0,
        quantity=qty,
        cover_url=cover_url,
        rating=rating,
        popularity=popularity,
        ai_recommendation_score=ai_score
    )
    db.session.add(book)
    db.session.commit()
    
    return jsonify({"msg": "Book added successfully", "book": book.to_dict()}), 201

@books_bp.route('/<int:book_id>', methods=['PUT'])
@jwt_required()
@role_required('admin', 'librarian')
def update_book(book_id):
    book = Book.query.get(book_id)
    if not book:
        return jsonify({"msg": "Book not found"}), 404
        
    data = request.get_json()
    if not data:
        return jsonify({"msg": "No data provided"}), 400
        
    book.title = data.get('title', book.title)
    book.author = data.get('author', book.author)
    book.category = data.get('category', book.category)
    
    isbn = data.get('isbn')
    if isbn and isbn != book.isbn:
        if Book.query.filter_by(isbn=isbn).first():
            return jsonify({"msg": "ISBN already exists"}), 400
        book.isbn = isbn
        
    book.quantity = int(data.get('quantity', book.quantity))
    book.availability = book.quantity > 0
    
    if 'cover_url' in data:
        book.cover_url = data['cover_url']
        
    db.session.commit()
    return jsonify({"msg": "Book catalog updated", "book": book.to_dict()}), 200

@books_bp.route('/<int:book_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin', 'librarian')
def delete_book(book_id):
    book = Book.query.get(book_id)
    if not book:
        return jsonify({"msg": "Book not found"}), 404
        
    db.session.delete(book)
    db.session.commit()
    return jsonify({"msg": "Book deleted successfully"}), 200

# RESERVATIONS
@books_bp.route('/reservations', methods=['GET'])
@jwt_required()
def get_reservations():
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    
    if claims.get('role') in ['admin', 'librarian']:
        reservations = Reservation.query.order_by(Reservation.reservation_date.desc()).all()
    else:
        reservations = Reservation.query.filter_by(member_id=user_id).order_by(Reservation.reservation_date.desc()).all()
        
    return jsonify([res.to_dict() for res in reservations]), 200

@books_bp.route('/reservations', methods=['POST'])
@jwt_required()
def create_reservation():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    
    data = request.get_json()
    if not data or not data.get('book_id'):
        return jsonify({"msg": "Missing book ID"}), 400
        
    book_id = int(data['book_id'])
    book = Book.query.get(book_id)
    if not book:
        return jsonify({"msg": "Book not found"}), 404
        
    # Check if admin/librarian is booking on behalf of member
    target_member_id = user_id
    if claims.get('role') in ['admin', 'librarian'] and data.get('member_id'):
        target_member_id = int(data['member_id'])
        
    member = User.query.get(target_member_id)
    if not member or member.status != 'active':
        return jsonify({"msg": "Invalid or inactive member"}), 400
        
    # Check if member already has a pending reservation for the same book
    existing = Reservation.query.filter_by(book_id=book_id, member_id=target_member_id, status='pending').first()
    if existing:
        return jsonify({"msg": "You already have a pending reservation holds request for this book"}), 400
        
    res = Reservation(
        book_id=book_id,
        member_id=target_member_id,
        status='pending'
    )
    db.session.add(res)
    db.session.commit()
    
    return jsonify({"msg": "Hold request queued successfully", "reservation": res.to_dict()}), 201

@books_bp.route('/reservations/<int:res_id>/approve', methods=['POST'])
@jwt_required()
@role_required('admin', 'librarian')
def approve_reservation(res_id):
    res = Reservation.query.get(res_id)
    if not res:
        return jsonify({"msg": "Reservation holds request not found"}), 404
        
    if res.status != 'pending':
        return jsonify({"msg": f"Reservation holds request is already {res.status}"}), 400
        
    book = Book.query.get(res.book_id)
    if not book or book.quantity <= 0:
        return jsonify({"msg": "Book is out of stock. Cannot approve reservation."}), 400
        
    # Deduct stock
    book.quantity -= 1
    if book.quantity <= 0:
        book.availability = False
        
    res.status = 'approved'
    
    # Create checkout issue
    issue = Issue(
        book_id=res.book_id,
        member_id=res.member_id,
        issue_date=datetime.utcnow(),
        due_date=datetime.utcnow() + timedelta(days=14),
        status='issued'
    )
    db.session.add(issue)
    db.session.commit()
    
    return jsonify({"msg": "Reservation hold approved, book issued successfully", "issue": issue.to_dict()}), 200

@books_bp.route('/reservations/<int:res_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_reservation(res_id):
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    
    res = Reservation.query.get(res_id)
    if not res:
        return jsonify({"msg": "Reservation not found"}), 404
        
    if claims.get('role') not in ['admin', 'librarian'] and res.member_id != user_id:
        return jsonify({"msg": "Unauthorized"}), 403
        
    if res.status not in ['pending', 'approved']:
        return jsonify({"msg": f"Reservation cannot be cancelled from status '{res.status}'"}), 400
        
    res.status = 'cancelled'
    db.session.commit()
    return jsonify({"msg": "Reservation cancelled successfully"}), 200
