from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from backend.config.database import db
from backend.models.Issue import Issue
from backend.models.Book import Book
from backend.models.User import User
from backend.models.Reservation import Reservation
from backend.models.Notification import Notification
from backend.models.BookRequest import BookRequest
from backend.models.CalendarEvent import CalendarEvent
from backend.services.notification_service import NotificationService
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
