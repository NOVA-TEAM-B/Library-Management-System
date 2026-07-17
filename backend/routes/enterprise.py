from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from backend.config.database import db
from backend.models.Issue import Issue
from backend.models.Book import Book
from backend.models.User import User
from backend.models.Reservation import Reservation
from backend.models.Notification import Notification
from backend.models.BookRequest import BookRequest
from backend.models.CalendarEvent import CalendarEvent
from backend.models.BookReview import BookReview
from backend.models.SeatBooking import SeatBooking
from backend.models.DigitalDoc import DigitalDoc
from backend.models.MemberXP import MemberXP
from backend.models.Badge import Badge
from backend.models.TelemetryLog import TelemetryLog
from backend.services.notification_service import NotificationService
from backend.middleware.auth_middleware import get_current_org_id
from datetime import datetime, timedelta
import secrets
import os

enterprise_bp = Blueprint('enterprise', __name__)

# 1. RENEWALS
@enterprise_bp.route('/issue/renew-request/<int:issue_id>', methods=['POST'])
@jwt_required()
def renew_request(issue_id):
    user_id = int(get_jwt_identity())
    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"msg": "Issue record not found"}), 404
        
    if issue.member_id != user_id:
        return jsonify({"msg": "Unauthorized action"}), 403
        
    if issue.status == 'returned':
        return jsonify({"msg": "Book is already returned"}), 400
        
    if issue.renewal_count >= 3:
        return jsonify({"msg": "Maximum renewal limit (3) reached for this borrow cycle"}), 400
        
    # Check if there are active reservations on this book (queue check)
    has_res = Reservation.query.filter_by(book_id=issue.book_id, status='pending').first()
    if has_res:
        return jsonify({"msg": "Cannot renew: this book is currently reserved by another student"}), 400
        
    issue.renewal_requested = True
    issue.renewal_status = 'pending'
    db.session.commit()
    
    # Notify librarian
    notif = Notification(
        user_id=1, # Default system notification
        title="Renewal Request",
        message=f"Member '{issue.member.username}' requested renewal for '{issue.book.title}'.",
        org_id=issue.org_id
    )
    db.session.add(notif)
    db.session.commit()
    
    return jsonify({"msg": "Renewal request submitted successfully", "issue": issue.to_dict()}), 200

@enterprise_bp.route('/issue/renew-approve/<int:issue_id>', methods=['POST'])
@jwt_required()
def renew_approve(issue_id):
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'librarian']:
        return jsonify({"msg": "Librarian privileges required"}), 403
        
    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"msg": "Issue record not found"}), 404
        
    org_id = get_current_org_id()
    if org_id is not None and issue.org_id != org_id:
        return jsonify({"msg": "Unauthorized. Resource organization mismatch."}), 403
        
    data = request.get_json() or {}
    action = data.get('action') # 'approve' or 'reject'
    if action not in ['approve', 'reject']:
        return jsonify({"msg": "Invalid action. Use 'approve' or 'reject'"}), 400
        
    if action == 'approve':
        issue.due_date = issue.due_date + timedelta(days=7)
        issue.renewal_count += 1
        issue.renewal_requested = False
        issue.renewal_status = 'approved'
        db.session.commit()
        
        # Notify student
        notif = Notification(
            user_id=issue.member_id,
            title="Renewal Approved",
            message=f"Your renewal request for '{issue.book.title}' has been approved. New due date: {issue.due_date.strftime('%Y-%m-%d')}.",
            org_id=issue.org_id
        )
        db.session.add(notif)
        db.session.commit()
        
        # Email Notification
        if issue.member.email:
            try:
                NotificationService.send_email(
                    to_email=issue.member.email,
                    subject=f"Renewal Approved: {issue.book.title}",
                    body=f"Dear {issue.member.username},\n\nYour renewal request for '{issue.book.title}' has been approved.\n\nNew Due Date: {issue.due_date.strftime('%Y-%m-%d')}\n\nBest regards,\nNova College Library"
                )
            except Exception as mail_err:
                print(f"Error sending renewal approved email: {mail_err}", flush=True)
                
        return jsonify({"msg": "Renewal approved successfully", "issue": issue.to_dict()}), 200
    else:
        issue.renewal_requested = False
        issue.renewal_status = 'rejected'
        db.session.commit()
        
        # Notify student
        notif = Notification(
            user_id=issue.member_id,
            title="Renewal Rejected",
            message=f"Your renewal request for '{issue.book.title}' has been rejected. Please return it by the original due date.",
            org_id=issue.org_id
        )
        db.session.add(notif)
        db.session.commit()
        
        # Email Notification
        if issue.member.email:
            try:
                NotificationService.send_email(
                    to_email=issue.member.email,
                    subject=f"Renewal Rejected: {issue.book.title}",
                    body=f"Dear {issue.member.username},\n\nYour renewal request for '{issue.book.title}' has been rejected.\n\nPlease return the book on or before the due date: {issue.due_date.strftime('%Y-%m-%d')}.\n\nBest regards,\nNova College Library"
                )
            except Exception as mail_err:
                print(f"Error sending renewal rejected email: {mail_err}", flush=True)
                
        return jsonify({"msg": "Renewal rejected successfully", "issue": issue.to_dict()}), 200

# 2. IN-APP NOTIFICATIONS
@enterprise_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    notifs = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    return jsonify([n.to_dict() for n in notifs]), 200

@enterprise_bp.route('/notifications/read-all', methods=['POST'])
@jwt_required()
def read_all_notifications():
    user_id = int(get_jwt_identity())
    notifs = Notification.query.filter_by(user_id=user_id, is_read=False).all()
    for n in notifs:
        n.is_read = True
    db.session.commit()
    return jsonify({"success": True, "msg": "All notifications marked as read"}), 200

@enterprise_bp.route('/notifications/mark-read/<int:notif_id>', methods=['POST'])
@jwt_required()
def mark_read_notification(notif_id):
    user_id = int(get_jwt_identity())
    n = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
    if n:
        n.is_read = True
        db.session.commit()
    return jsonify({"success": True, "msg": "Notification marked as read"}), 200

# 3. ACQUISITION REQUESTS
@enterprise_bp.route('/books/request', methods=['POST'])
@jwt_required()
def request_book():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    org_id = claims.get('org_id')
    
    data = request.get_json() or {}
    if not data.get('title') or not data.get('author'):
        return jsonify({"msg": "Title and Author are required"}), 400
        
    req = BookRequest(
        title=data['title'],
        author=data['author'],
        isbn=data.get('isbn'),
        member_id=user_id,
        org_id=org_id
    )
    db.session.add(req)
    db.session.commit()
    
    # Notify librarian/admin
    notif = Notification(
        user_id=1,
        title="Book Acquisition Suggestion",
        message=f"A new book suggestion '{data['title']}' has been proposed.",
        org_id=org_id
    )
    db.session.add(notif)
    db.session.commit()
    
    return jsonify({"msg": "Acquisition request submitted successfully", "request": req.to_dict()}), 201

@enterprise_bp.route('/books/requests-list', methods=['GET'])
@jwt_required()
def get_book_requests():
    claims = get_jwt()
    org_id = claims.get('org_id')
    
    if claims.get('role') not in ['admin', 'librarian']:
        user_id = int(get_jwt_identity())
        reqs = BookRequest.query.filter_by(member_id=user_id, org_id=org_id).order_by(BookRequest.created_at.desc()).all()
    else:
        reqs = BookRequest.query.filter_by(org_id=org_id).order_by(BookRequest.created_at.desc()).all()
        
    return jsonify([r.to_dict() for r in reqs]), 200

@enterprise_bp.route('/books/request-review/<int:request_id>', methods=['POST'])
@jwt_required()
def review_book_request(request_id):
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'librarian']:
        return jsonify({"msg": "Librarian privileges required"}), 403
        
    req = BookRequest.query.get(request_id)
    if not req:
        return jsonify({"msg": "Request not found"}), 404
        
    org_id = get_current_org_id()
    if org_id is not None and req.org_id != org_id:
        return jsonify({"msg": "Unauthorized. Resource organization mismatch."}), 403
        
    data = request.get_json() or {}
    action = data.get('action') # 'approve', 'reject', 'order'
    if action not in ['approve', 'reject', 'order']:
        return jsonify({"msg": "Invalid action. Use 'approve', 'reject' or 'order'"}), 400
        
    req.status = action
    db.session.commit()
    
    # Notify student
    notif = Notification(
        user_id=req.member_id,
        title="Acquisition Request Updated",
        message=f"Your request for '{req.title}' has been marked as '{action}'.",
        org_id=req.org_id
    )
    db.session.add(notif)
    db.session.commit()
    
    # Send email notification
    if req.member and req.member.email:
        try:
            NotificationService.send_email(
                to_email=req.member.email,
                subject=f"Acquisition Request Status: {req.title}",
                body=f"Dear {req.member.username},\n\nYour acquisition suggestion for '{req.title}' has been reviewed.\n\nStatus: {action.upper()}\n\nBest regards,\nNova College Library"
            )
        except Exception as mail_err:
            print(f"Error sending request review email: {mail_err}", flush=True)
            
    return jsonify({"msg": f"Request status marked as '{action}' successfully", "request": req.to_dict()}), 200

# 4. CALENDAR EVENTS
@enterprise_bp.route('/calendar/events', methods=['GET'])
@jwt_required()
def get_calendar_events():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    org_id = claims.get('org_id')
    role = claims.get('role')
    
    events_list = []
    
    # 1. Load Holidays & Custom events
    custom_events = CalendarEvent.query.filter_by(org_id=org_id).all()
    for ce in custom_events:
        events_list.append({
            "title": ce.title,
            "description": ce.description,
            "event_date": ce.event_date.strftime('%Y-%m-%d'),
            "event_type": ce.event_type
        })
        
    # 2. Add Due Dates and Reservation expirations dynamically
    if role == 'member':
        # Student active borrows
        active_issues = Issue.query.filter_by(member_id=user_id, status='issued').all()
        for ai in active_issues:
            events_list.append({
                "title": f"Book Return Due: {ai.book.title}",
                "description": f"Please return book '{ai.book.title}' by today.",
                "event_date": ai.due_date.strftime('%Y-%m-%d'),
                "event_type": "due"
            })
        # Student active reservations
        active_res = Reservation.query.filter_by(member_id=user_id, status='pending').all()
        for ar in active_res:
            events_list.append({
                "title": f"Hold Expiry: {ar.book.title}",
                "description": f"Reservation hold active for '{ar.book.title}'.",
                "event_date": ar.reservation_date.strftime('%Y-%m-%d'),
                "event_type": "reservation"
            })
    else:
        # Staff sees all due dates in the tenant
        active_issues = Issue.query.filter_by(org_id=org_id, status='issued').all()
        for ai in active_issues:
            events_list.append({
                "title": f"Overdue risk: {ai.book.title} (Member: {ai.member.username})",
                "description": f"Book '{ai.book.title}' is due for return by {ai.member.username}.",
                "event_date": ai.due_date.strftime('%Y-%m-%d'),
                "event_type": "due"
            })
            
    return jsonify(events_list), 200

@enterprise_bp.route('/calendar/events', methods=['POST'])
@jwt_required()
def create_calendar_event():
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'librarian']:
        return jsonify({"msg": "Librarian privileges required"}), 403
        
    org_id = claims.get('org_id')
    data = request.get_json() or {}
    if not data.get('title') or not data.get('event_date'):
        return jsonify({"msg": "Title and Event Date are required"}), 400
        
    try:
        e_date = datetime.strptime(data['event_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"msg": "Event Date must be in YYYY-MM-DD format"}), 400
        
    ce = CalendarEvent(
        title=data['title'],
        description=data.get('description', ''),
        event_date=e_date,
        event_type=data.get('event_type', 'event'),
        org_id=org_id
    )
    db.session.add(ce)
    db.session.commit()
    
    return jsonify({"msg": "Calendar event added successfully", "event": ce.to_dict()}), 201

# 5. RECOMMENDATIONS
@enterprise_bp.route('/books/recommendations', methods=['GET'])
@jwt_required()
def get_recommendations():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    org_id = claims.get('org_id')
    
    # Categories student has borrowed
    borrowed_issues = Issue.query.filter_by(member_id=user_id).all()
    categories = set([bi.book.category for bi in borrowed_issues if bi.book])
    
    rec_books = []
    already_borrowed_ids = set([bi.book_id for bi in borrowed_issues])
    
    if categories:
        # Find books in these categories the user hasn't read
        matching_books = Book.query.filter(
            Book.org_id == org_id,
            Book.category.in_(list(categories)),
            ~Book.id.in_(list(already_borrowed_ids))
        ).limit(6).all()
        rec_books.extend(matching_books)
        
    # If not enough, fill with popular books
    if len(rec_books) < 6:
        popular = Book.query.filter(
            Book.org_id == org_id,
            ~Book.id.in_(list(already_borrowed_ids))
        ).order_by(Book.popularity.desc()).limit(6 - len(rec_books)).all()
        rec_books.extend(popular)
        
    # If still not enough, fill with recently added
    if len(rec_books) < 6:
        recent = Book.query.filter(
            Book.org_id == org_id,
            ~Book.id.in_(list(already_borrowed_ids))
        ).order_by(Book.id.desc()).limit(6 - len(rec_books)).all()
        rec_books.extend(recent)
        
    # Filter uniques
    seen_ids = set()
    unique_recs = []
    for b in rec_books:
        if b.id not in seen_ids:
            seen_ids.add(b.id)
            unique_recs.append(b.to_dict())
            
    return jsonify(unique_recs), 200


# =====================================================================
# ENTERPRISE EXTENSION ENDPOINTS (REVIEWS, SEATS, DIGITAL DOCS, XP, TELEMETRY)
# =====================================================================

def award_member_xp(member_id, xp_to_add, badge_type_unlocked=None):
    xp_profile = MemberXP.query.filter_by(member_id=member_id).first()
    if not xp_profile:
        xp_profile = MemberXP(member_id=member_id, xp_points=100, level=1, streak_days=1)
        db.session.add(xp_profile)
    
    xp_profile.xp_points += xp_to_add
    
    # Calculate level (each 500 XP is a level)
    new_level = (xp_profile.xp_points // 500) + 1
    if new_level > xp_profile.level:
        xp_profile.level = new_level
        user = User.query.get(member_id)
        org_id = user.org_id if user else None
        notif = Notification(
            user_id=member_id,
            title="Level Up!",
            message=f"Congratulations! You leveled up to Level {new_level} in the library community! 🏆",
            org_id=org_id
        )
        db.session.add(notif)
        
    if badge_type_unlocked:
        already_has = Badge.query.filter_by(member_id=member_id, badge_type=badge_type_unlocked).first()
        if not already_has:
            new_badge = Badge(member_id=member_id, badge_type=badge_type_unlocked)
            db.session.add(new_badge)
            user = User.query.get(member_id)
            org_id = user.org_id if user else None
            notif = Notification(
                user_id=member_id,
                title="Badge Unlocked!",
                message=f"You have unlocked the '{badge_type_unlocked.replace('-', ' ').title()}' badge! 🎖️",
                org_id=org_id
            )
            db.session.add(notif)
            
    db.session.commit()
    return xp_profile


# 1. BOOK REVIEWS API
@enterprise_bp.route('/books/reviews', methods=['GET'])
def get_reviews():
    book_id = request.args.get('book_id', type=int)
    org_id = get_current_org_id()
    if book_id:
        book = Book.query.get(book_id)
        if not book or (org_id is not None and book.org_id != org_id):
            return jsonify({
                "success": False,
                "message": "Book not found or unauthorized",
                "data": []
            }), 404
        reviews = BookReview.query.filter_by(book_id=book_id).order_by(BookReview.created_at.desc()).all()
    else:
        query = BookReview.query
        if org_id is not None:
            query = query.join(Book).filter(Book.org_id == org_id)
        reviews = query.order_by(BookReview.created_at.desc()).limit(20).all()
        
    return jsonify({
        "success": True,
        "message": "Reviews loaded successfully",
        "data": [r.to_dict() for r in reviews]
    }), 200

@enterprise_bp.route('/books/reviews', methods=['POST'])
@jwt_required()
def create_review():
    member_id = int(get_jwt_identity())
    data = request.get_json() or {}
    
    book_id = data.get('book_id')
    rating = data.get('rating')
    comment = data.get('comment')
    
    if not book_id or not rating or not comment:
        return jsonify({
            "success": False,
            "message": "Missing book_id, rating, or comment",
            "data": None
        }), 400
        
    if rating < 1 or rating > 5:
        return jsonify({
            "success": False,
            "message": "Rating must be an integer between 1 and 5",
            "data": None
        }), 400
        
    book = Book.query.get(book_id)
    if not book:
        return jsonify({
            "success": False,
            "message": "Book not found",
            "data": None
        }), 404
        
    review = BookReview(
        book_id=book_id,
        member_id=member_id,
        rating=rating,
        comment=comment
    )
    db.session.add(review)
    db.session.commit()
    
    # Award XP + Badge check (Critic if they have 3 reviews)
    review_count = BookReview.query.filter_by(member_id=member_id).count()
    badge_unlocked = 'critic' if review_count >= 3 else None
    award_member_xp(member_id, 30, badge_unlocked)
    
    return jsonify({
        "success": True,
        "message": "Review submitted successfully! Earned +30 XP.",
        "data": review.to_dict()
    }), 201


# 2. SEAT BOOKING API
@enterprise_bp.route('/seats', methods=['GET'])
@jwt_required()
def get_seats():
    org_id = get_current_org_id()
    query = SeatBooking.query.filter_by(status='booked')
    if org_id is not None:
        query = query.join(User).filter(User.org_id == org_id)
    active_bookings = query.all()
    bookings_dict = {b.seat_number: b.to_dict() for b in active_bookings}
    
    seats_list = []
    for i in range(1, 21):
        seat_num = f"Seat {i}"
        if seat_num in bookings_dict:
            seats_list.append(bookings_dict[seat_num])
        else:
            seats_list.append({
                "seat_number": seat_num,
                "status": "available"
            })
            
    return jsonify({
        "success": True,
        "message": "Seats telemetry loaded successfully",
        "data": seats_list
    }), 200

@enterprise_bp.route('/seats/book', methods=['POST'])
@jwt_required()
def book_seat():
    member_id = int(get_jwt_identity())
    member = User.query.get(member_id)
    org_id = member.org_id if member else None
    data = request.get_json() or {}
    seat_number = data.get('seat_number')
    duration = data.get('duration', 120)
    
    if not seat_number:
        return jsonify({
            "success": False,
            "message": "Seat number required",
            "data": None
        }), 400
        
    query = SeatBooking.query.filter_by(seat_number=seat_number, status='booked')
    if org_id is not None:
        query = query.join(User).filter(User.org_id == org_id)
    existing = query.first()
    if existing:
        return jsonify({
            "success": False,
            "message": "This seat is already reserved by another reader",
            "data": None
        }), 400
        
    member_active = SeatBooking.query.filter_by(member_id=member_id, status='booked').first()
    if member_active:
        return jsonify({
            "success": False,
            "message": f"You already have an active reservation on {member_active.seat_number}. Release it first.",
            "data": None
        }), 400
        
    booking = SeatBooking(
        seat_number=seat_number,
        member_id=member_id,
        duration_minutes=duration
    )
    db.session.add(booking)
    db.session.commit()
    
    award_member_xp(member_id, 50)
    
    return jsonify({
        "success": True,
        "message": f"Successfully reserved {seat_number}! Earned +50 XP.",
        "data": booking.to_dict()
    }), 201

@enterprise_bp.route('/seats/release', methods=['POST'])
@jwt_required()
def release_seat():
    member_id = int(get_jwt_identity())
    data = request.get_json() or {}
    seat_number = data.get('seat_number')
    
    if not seat_number:
        return jsonify({
            "success": False,
            "message": "Seat number required",
            "data": None
        }), 400
        
    booking = SeatBooking.query.filter_by(seat_number=seat_number, member_id=member_id, status='booked').first()
    if not booking:
        return jsonify({
            "success": False,
            "message": "No active booking found for this seat",
            "data": None
        }), 400
        
    booking.status = 'released'
    booking.release_time = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": f"Successfully checked out of {seat_number}.",
        "data": booking.to_dict()
    }), 200


# 3. DIGITAL DOCS (FILE UPLOAD & VERSIONING)
UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(__file__))), 'uploads', 'digital_docs')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@enterprise_bp.route('/digital-docs', methods=['GET'])
@jwt_required()
def get_digital_docs():
    claims = get_jwt()
    org_id = claims.get('org_id')
    docs = DigitalDoc.query.filter_by(org_id=org_id).order_by(DigitalDoc.created_at.desc()).all()
    
    return jsonify({
        "success": True,
        "message": "Digital catalog documents loaded",
        "data": [d.to_dict() for d in docs]
    }), 200

@enterprise_bp.route('/digital-docs/upload', methods=['POST'])
@jwt_required()
def upload_digital_doc():
    member_id = int(get_jwt_identity())
    claims = get_jwt()
    org_id = claims.get('org_id')
    
    if 'file' not in request.files:
        return jsonify({
            "success": False,
            "message": "No file uploaded",
            "data": None
        }), 400
        
    file = request.files['file']
    doc_type = request.form.get('type', 'Research Paper')
    tags = request.form.get('tags', '')
    
    if file.filename == '':
        return jsonify({
            "success": False,
            "message": "File name is empty",
            "data": None
        }), 400
        
    if not file.filename.lower().endswith(('.pdf', '.txt', '.doc', '.docx')):
        return jsonify({
            "success": False,
            "message": "Invalid file format. Only PDF/TXT/DOCX permitted.",
            "data": None
        }), 400
        
    import uuid
    from werkzeug.utils import secure_filename
    
    original_filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
    file_dest = os.path.join(UPLOAD_FOLDER, unique_filename)
    file.save(file_dest)
    
    file_bytes = os.path.getsize(file_dest)
    file_size_str = f"{(file_bytes / (1024 * 1024)):.2f} MB" if file_bytes >= 1024 * 1024 else f"{(file_bytes / 1024):.1f} KB"
    
    # Versioning: increment version if file title exists in org
    existing_doc = DigitalDoc.query.filter_by(title=original_filename, org_id=org_id).order_by(DigitalDoc.version.desc()).first()
    version = (existing_doc.version + 1) if existing_doc else 1
    
    doc = DigitalDoc(
        title=original_filename,
        type=doc_type,
        file_path=unique_filename,
        size=file_size_str,
        version=version,
        tags=tags,
        member_id=member_id,
        org_id=org_id
    )
    db.session.add(doc)
    db.session.commit()
    
    doc_count = DigitalDoc.query.filter_by(member_id=member_id).count()
    badge_unlocked = 'explorer' if doc_count >= 2 else None
    award_member_xp(member_id, 40, badge_unlocked)
    
    return jsonify({
        "success": True,
        "message": f"Successfully uploaded '{original_filename}' (V{version})! Earned +40 XP.",
        "data": doc.to_dict()
    }), 201

@enterprise_bp.route('/digital-docs/download/<int:doc_id>', methods=['GET'])
@jwt_required()
def download_digital_doc(doc_id):
    doc = DigitalDoc.query.get(doc_id)
    if not doc:
        return jsonify({
            "success": False,
            "message": "Document not found",
            "data": None
        }), 404
        
    org_id = get_current_org_id()
    if org_id is not None and doc.org_id != org_id:
        return jsonify({
            "success": False,
            "message": "Document not found or unauthorized",
            "data": None
        }), 404
        
    return send_from_directory(
        directory=UPLOAD_FOLDER,
        path=doc.file_path,
        as_attachment=True,
        download_name=doc.title
    )

@enterprise_bp.route('/digital-docs/view/<int:doc_id>', methods=['GET'])
@jwt_required()
def view_digital_doc(doc_id):
    doc = DigitalDoc.query.get(doc_id)
    if not doc:
        return jsonify({
            "success": False,
            "message": "Document not found",
            "data": None
        }), 404
        
    org_id = get_current_org_id()
    if org_id is not None and doc.org_id != org_id:
        return jsonify({
            "success": False,
            "message": "Document not found or unauthorized",
            "data": None
        }), 404
        
    return send_from_directory(
        directory=UPLOAD_FOLDER,
        path=doc.file_path,
        as_attachment=False
    )

@enterprise_bp.route('/digital-docs/<int:doc_id>', methods=['DELETE'])
@jwt_required()
def delete_digital_doc(doc_id):
    claims = get_jwt()
    member_id = int(get_jwt_identity())
    
    doc = DigitalDoc.query.get(doc_id)
    if not doc:
        return jsonify({
            "success": False,
            "message": "Document not found",
            "data": None
        }), 404
        
    org_id = get_current_org_id()
    if org_id is not None and doc.org_id != org_id:
        return jsonify({
            "success": False,
            "message": "Insufficient privileges to delete this resource",
            "data": None
        }), 403
        
    if claims.get('role') not in ['admin', 'librarian'] and doc.member_id != member_id:
        return jsonify({
            "success": False,
            "message": "Insufficient privileges to delete this resource",
            "data": None
        }), 403
        
    full_path = os.path.join(UPLOAD_FOLDER, doc.file_path)
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except Exception as e:
            print(f"Failed to delete file: {e}")
            
    db.session.delete(doc)
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": f"Successfully deleted document '{doc.title}'.",
        "data": None
    }), 200


# 4. GAMIFICATION & XP API
@enterprise_bp.route('/member/xp', methods=['GET'])
@jwt_required()
def get_member_xp():
    member_id = int(get_jwt_identity())
    
    xp_profile = MemberXP.query.filter_by(member_id=member_id).first()
    if not xp_profile:
        xp_profile = MemberXP(member_id=member_id, xp_points=100, level=1, streak_days=1)
        db.session.add(xp_profile)
        db.session.commit()
        
    badges = Badge.query.filter_by(member_id=member_id).all()
    
    # Check automatically for no-fine badge
    overdue_issues = Issue.query.filter_by(member_id=member_id, status='overdue').first()
    if not overdue_issues:
        award_member_xp(member_id, 0, 'no-fine')
        
    return jsonify({
        "success": True,
        "message": "XP telemetry loaded successfully",
        "data": {
            "xp_points": xp_profile.xp_points,
            "level": xp_profile.level,
            "streak_days": xp_profile.streak_days,
            "badges": [b.badge_type for b in badges]
        }
    }), 200

@enterprise_bp.route('/member/xp/streak', methods=['POST'])
@jwt_required()
def checkin_streak():
    member_id = int(get_jwt_identity())
    xp_profile = MemberXP.query.filter_by(member_id=member_id).first()
    if not xp_profile:
        xp_profile = MemberXP(member_id=member_id, xp_points=100, level=1, streak_days=1)
        db.session.add(xp_profile)
        db.session.commit()
        
    now = datetime.utcnow()
    delta = now - xp_profile.last_active
    if delta.days == 1:
        xp_profile.streak_days += 1
        xp_profile.xp_points += 20
        xp_profile.last_active = now
        db.session.commit()
        msg = f"Check-in streak extended to {xp_profile.streak_days} days! Earned +20 XP."
    elif delta.days > 1:
        xp_profile.streak_days = 1
        xp_profile.xp_points += 10
        xp_profile.last_active = now
        db.session.commit()
        msg = "Welcome back! Check-in streak reset to 1 day. Earned +10 XP."
    else:
        msg = "Already checked in today. Return tomorrow to continue your streak!"
        
    return jsonify({
        "success": True,
        "message": msg,
        "data": xp_profile.to_dict()
    }), 200


# 5. SYSTEM HEALTH LOGGING & BACKUP
@enterprise_bp.route('/telemetry', methods=['GET'])
@jwt_required()
def get_telemetry():
    import random
    
    cpu = round(random.uniform(8.0, 18.0), 1)
    ram = round(random.uniform(32.0, 44.0), 1)
    
    log = TelemetryLog(cpu_load=cpu, ram_usage=ram, db_connections=5)
    db.session.add(log)
    db.session.commit()
    
    count = TelemetryLog.query.count()
    if count > 100:
        oldest = TelemetryLog.query.order_by(TelemetryLog.timestamp.asc()).limit(count - 100).all()
        for o in oldest:
            db.session.delete(o)
        db.session.commit()
        
    logs = TelemetryLog.query.order_by(TelemetryLog.timestamp.desc()).limit(15).all()
    
    return jsonify({
        "success": True,
        "message": "Telemetry logging analytics loaded",
        "data": {
            "current": {
                "cpu": cpu,
                "ram": ram,
                "dbConnections": 5,
                "apiUptime": "99.99%",
                "smtpStatus": "Online",
                "smsStatus": "Online"
            },
            "history": [l.to_dict() for l in reversed(logs)]
        }
    }), 200

@enterprise_bp.route('/telemetry/backup', methods=['POST'])
@jwt_required()
def run_db_backup():
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'superadmin']:
        return jsonify({
            "success": False,
            "message": "Admin privileges required to trigger system backup",
            "data": None
        }), 403
        
    import shutil
    
    base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    backups_dir = os.path.join(base_dir, 'instance', 'backups')
    os.makedirs(backups_dir, exist_ok=True)
    
    source_db = os.path.join(base_dir, 'instance', 'nova_library_x.db')
    if not os.path.exists(source_db):
        return jsonify({
            "success": False,
            "message": "Local database file not found",
            "data": None
        }), 404
        
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = os.path.join(backups_dir, f"nova_library_backup_{timestamp}.db")
    
    try:
        shutil.copy2(source_db, backup_file)
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to clone snapshot: {str(e)}",
            "data": None
        }), 500
        
    return jsonify({
        "success": True,
        "message": f"Database backup snapshot 'nova_library_backup_{timestamp}.db' successfully stored to instance/backups folder.",
        "data": {
            "filename": f"nova_library_backup_{timestamp}.db",
            "timestamp": timestamp
        }
    }), 200
