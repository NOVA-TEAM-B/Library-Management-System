from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from backend.config.database import db
from backend.models.Book import Book
from backend.models.User import User
from backend.models.Reservation import Reservation
from backend.models.Issue import Issue
from backend.middleware.auth_middleware import role_required, get_current_org_id
from datetime import datetime, timedelta

books_bp = Blueprint('books', __name__)

@books_bp.route('', methods=['GET'])
def get_books():
    title = request.args.get('title', '')
    author = request.args.get('author', '')
    isbn = request.args.get('isbn', '')
    category = request.args.get('category', '')
    availability = request.args.get('availability')
    
    org_id = get_current_org_id()
    query = Book.query
    if org_id is not None:
        query = query.filter_by(org_id=org_id)
        
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

def ensure_pdf_for_book(book):
    import os
    import re
    if not book.pdf_url:
        clean_title = re.sub(r'[^a-z0-9]', '_', book.title.lower())
        book.pdf_url = f"/books/pdfs/{clean_title}.pdf"
    
    # Ensure directory exists and compile target path
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    pdf_path = os.path.join(base_dir, 'frontend', 'public', book.pdf_url.lstrip('/'))
    
    if not os.path.exists(pdf_path):
        os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas
            
            c = canvas.Canvas(pdf_path, pagesize=letter)
            pages = 35 # High-fidelity page count
            title = book.title
            author = book.author
            
            for page_num in range(1, pages + 1):
                # Header styling
                c.setFont("Helvetica-Bold", 16)
                c.drawString(50, 750, title)
                c.setFont("Helvetica", 10)
                c.drawString(50, 730, f"By {author}")
                c.setStrokeColorRGB(0.1, 0.6, 0.8)
                c.line(50, 720, 550, 720)
                
                if page_num == 1:
                    # Proper Cover Page
                    c.setFont("Helvetica-Bold", 24)
                    c.drawCentredString(300, 480, title)
                    c.setFont("Helvetica", 14)
                    c.drawCentredString(300, 440, f"By {author}")
                    c.setStrokeColorRGB(0.1, 0.6, 0.8)
                    c.line(150, 420, 450, 420)
                    c.setFont("Helvetica-Oblique", 11)
                    c.drawCentredString(300, 395, f"Subject Field: {book.category}")
                    c.drawCentredString(300, 375, f"ISBN Code: {book.isbn}")
                    c.setFont("Helvetica", 10)
                    c.drawCentredString(300, 150, f"Nova University Academic Publishing, 2024")
                elif page_num == 2:
                    # Table of Contents
                    c.setFont("Helvetica-Bold", 18)
                    c.drawString(50, 680, "Table of Contents")
                    c.setFont("Helvetica", 11)
                    c.drawString(70, 620, "Chapter 1: Elementary Theories & Conceptual Frameworks ....... Page 3")
                    c.drawString(70, 580, "Chapter 2: Core Analytical Methodologies & Models ............. Page 10")
                    c.drawString(70, 540, "Chapter 3: Integration Systems & Practical Case Studies ....... Page 18")
                    c.drawString(70, 500, "Chapter 4: Advanced Systems Performance Optimization ......... Page 27")
                else:
                    # Chapter contents
                    chap_num = (page_num - 3) // 8 + 1
                    c.setFont("Helvetica-Bold", 14)
                    c.drawString(50, 680, f"Chapter {chap_num}: Academic Study Courseware")
                    
                    c.setFont("Helvetica", 11)
                    text_lines = [
                        f"Welcome to Page {page_num} of this textbook resource on {title}.",
                        f"This document is a legally distributable open educational resource (OER).",
                        "Please read through these sections to master the curriculum.",
                        "",
                        "Key learning outcomes for this chapter:",
                        "- Synthesizing theoretical assumptions and mathematical parameters.",
                        "- Analyzing system architecture, input models, and flow controls.",
                        "- Resolving real-world problems through targeted laboratory experiments.",
                        "",
                        "To track your academic metrics, bookmark pages and resume reading,",
                        "your reading session is saved in the Nova LMS real-time sync database.",
                        "If you have any questions, use the integrated AI study assistant node."
                    ]
                    
                    y = 630
                    for line in text_lines:
                        c.drawString(50, y, line)
                        y -= 22
                
                # Footer
                c.setStrokeColorRGB(0.2, 0.2, 0.2)
                c.line(50, 60, 550, 60)
                c.setFont("Helvetica-Oblique", 8)
                c.drawString(50, 45, "Nova Integrated Reading Room v2.0 • Digital Library Node")
                c.drawRightString(550, 45, f"Page {page_num} of {pages}")
                c.showPage()
            
            c.save()
            print(f"Automatically generated PDF for new book: {pdf_path}")
        except Exception as e:
            print(f"Failed to generate PDF for new book: {e}")

def remove_pdf_for_book(book):
    import os
    if book.pdf_url:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        pdf_path = os.path.join(base_dir, 'frontend', 'public', book.pdf_url.lstrip('/'))
        if os.path.exists(pdf_path):
            try:
                os.remove(pdf_path)
                print(f"Successfully deleted PDF file: {pdf_path}")
            except Exception as e:
                print(f"Failed to delete PDF file {pdf_path}: {e}")

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

    org_id = data.get('org_id') or get_current_org_id()
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
        ai_recommendation_score=ai_score,
        org_id=org_id,
        publisher=data.get('publisher'),
        edition=data.get('edition'),
        rack_number=data.get('rack_number'),
        shelf_number=data.get('shelf_number'),
        floor=data.get('floor'),
        library_branch=data.get('library_branch'),
        lost_copies=int(data.get('lost_copies', 0)),
        damaged_copies=int(data.get('damaged_copies', 0)),
        repair_copies=int(data.get('repair_copies', 0)),
        replacement_cost=float(data.get('replacement_cost', 0.0)),
        subject=data.get('subject'),
        accession_number=data.get('accession_number'),
        is_digital=bool(data.get('is_digital', False)),
        pdf_url=data.get('pdf_url'),
        allow_download=bool(data.get('allow_download', True))
    )
    
    if book.is_digital:
        ensure_pdf_for_book(book)
        
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
        
    org_id = get_current_org_id()
    if org_id is not None and book.org_id != org_id:
        return jsonify({"msg": "Unauthorized. Resource organization mismatch."}), 403
        
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
        
    # Update new fields
    book.publisher = data.get('publisher', book.publisher)
    book.edition = data.get('edition', book.edition)
    book.rack_number = data.get('rack_number', book.rack_number)
    book.shelf_number = data.get('shelf_number', book.shelf_number)
    book.floor = data.get('floor', book.floor)
    book.library_branch = data.get('library_branch', book.library_branch)
    book.lost_copies = int(data.get('lost_copies', book.lost_copies))
    book.damaged_copies = int(data.get('damaged_copies', book.damaged_copies))
    book.repair_copies = int(data.get('repair_copies', book.repair_copies))
    book.replacement_cost = float(data.get('replacement_cost', book.replacement_cost))
    book.subject = data.get('subject', book.subject)
    book.accession_number = data.get('accession_number', book.accession_number)
    
    old_digital = book.is_digital
    book.is_digital = bool(data.get('is_digital', book.is_digital))
    book.pdf_url = data.get('pdf_url', book.pdf_url)
    book.allow_download = bool(data.get('allow_download', book.allow_download))
    
    if book.is_digital and not old_digital:
        ensure_pdf_for_book(book)
        
    db.session.commit()
    return jsonify({"msg": "Book catalog updated", "book": book.to_dict()}), 200

@books_bp.route('/<int:book_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin', 'librarian')
def delete_book(book_id):
    book = Book.query.get(book_id)
    if not book:
        return jsonify({"msg": "Book not found"}), 404
        
    org_id = get_current_org_id()
    if org_id is not None and book.org_id != org_id:
        return jsonify({"msg": "Unauthorized. Resource organization mismatch."}), 403
        
    remove_pdf_for_book(book)
    db.session.delete(book)
    db.session.commit()
    return jsonify({"msg": "Book deleted successfully"}), 200


# RESERVATIONS
@books_bp.route('/reservations', methods=['GET'])
@jwt_required()
def get_reservations():
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    org_id = get_current_org_id()
    
    if claims.get('role') in ['admin', 'librarian']:
        query = Reservation.query
        if org_id is not None:
            query = query.filter_by(org_id=org_id)
        reservations = query.order_by(Reservation.reservation_date.desc()).all()
    else:
        query = Reservation.query.filter_by(member_id=user_id)
        if org_id is not None:
            query = query.filter_by(org_id=org_id)
        reservations = query.order_by(Reservation.reservation_date.desc()).all()
        
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
        
    org_id = get_current_org_id()
    if org_id is not None and book.org_id != org_id:
        return jsonify({"msg": "Unauthorized. Book organization mismatch."}), 403
        
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
        status='pending',
        org_id=org_id
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
        
    org_id = get_current_org_id()
    if org_id is not None and res.org_id != org_id:
        return jsonify({"msg": "Unauthorized. Resource organization mismatch."}), 403
        
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
        status='issued',
        org_id=org_id
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
        
    org_id = get_current_org_id()
    if org_id is not None and res.org_id != org_id:
        return jsonify({"msg": "Unauthorized. Resource organization mismatch."}), 403
        
    if claims.get('role') not in ['admin', 'librarian'] and res.member_id != user_id:
        return jsonify({"msg": "Unauthorized"}), 403
        
    if res.status not in ['pending', 'approved']:
        return jsonify({"msg": f"Reservation cannot be cancelled from status '{res.status}'"}), 400
        
    res.status = 'cancelled'
    db.session.commit()
    return jsonify({"msg": "Reservation cancelled successfully"}), 200
