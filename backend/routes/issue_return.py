from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from backend.config.database import db
from backend.models.Issue import Issue
from backend.models.Book import Book
from backend.models.User import User
from backend.models.Fine import Fine
from backend.services.fine_service import FineService
from backend.middleware.auth_middleware import role_required
from datetime import datetime, timedelta

issue_return_bp = Blueprint('issue_return', __name__)

@issue_return_bp.route('', methods=['POST'])
@jwt_required()
@role_required('admin', 'librarian')
def issue_book():
    data = request.get_json()
    if not data or not data.get('book_id') or not data.get('member_id'):
        return jsonify({"msg": "Missing book ID or member ID"}), 400
        
    book = Book.query.get(int(data['book_id']))
    member = User.query.get(int(data['member_id']))
    
    if not book:
        return jsonify({"msg": "Book not found"}), 404
    if not member or member.role != 'member' or member.status != 'active':
        return jsonify({"msg": "Invalid or inactive member"}), 400
        
    if book.quantity <= 0 or not book.availability:
        return jsonify({"msg": "Book is currently out of stock"}), 400
        
    # Deduct stock
    book.quantity -= 1
    if book.quantity <= 0:
        book.availability = False
        
    due_days = int(data.get('due_days', 14))
    
    issue = Issue(
        book_id=book.id,
        member_id=member.id,
        issue_date=datetime.utcnow(),
        due_date=datetime.utcnow() + timedelta(days=due_days),
        status='issued'
    )
    db.session.add(issue)
    db.session.commit()
    
    # Broadcast alert via socketio if accessible (will emit from app.py)
    return jsonify({"msg": "Book issued successfully", "issue": issue.to_dict()}), 201

@issue_return_bp.route('', methods=['GET'])
@jwt_required()
def get_issues():
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    
    # Run fine check periodically on load
    fine_rate = 5.0 # default
    FineService.check_and_update_overdue_fines(fine_rate)
    
    status_filter = request.args.get('status', '')
    
    if claims.get('role') in ['admin', 'librarian']:
        query = Issue.query
    else:
        query = Issue.query.filter_by(member_id=user_id)
        
    if status_filter:
        query = query.filter_by(status=status_filter)
        
    issues = query.order_by(Issue.issue_date.desc()).all()
    return jsonify([issue.to_dict() for issue in issues]), 200

@issue_return_bp.route('/<int:issue_id>/return', methods=['POST'])
@jwt_required()
@role_required('admin', 'librarian')
def return_book(issue_id):
    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"msg": "Issue record not found"}), 404
        
    if issue.status == 'returned':
        return jsonify({"msg": "Book has already been returned"}), 400
        
    now = datetime.utcnow()
    issue.return_date = now
    
    # Calculate final fine dynamically using tenant configurations
    from backend.models.Organization import Organization
    org = Organization.query.get(issue.org_id) if issue.org_id else None
    fine_rate = org.fine_rate if org else 5.0
    max_fine_limit = org.max_fine_limit if (org and hasattr(org, 'max_fine_limit')) else 500.0
    
    fine_amount = 0.0
    if now > issue.due_date:
        days_overdue = (now - issue.due_date).days
        fine_amount = days_overdue * fine_rate
        if fine_amount > max_fine_limit:
            fine_amount = max_fine_limit
        
    issue.fine_amount = fine_amount
    issue.status = 'returned'
    
    # Restock book
    book = Book.query.get(issue.book_id)
    if book:
        book.quantity += 1
        book.availability = True
        
        # Check active reservations waiting list (reservation queue)
        from backend.models.Reservation import Reservation
        from backend.models.Notification import Notification
        from backend.services.notification_service import NotificationService
        
        pending_res = Reservation.query.filter_by(book_id=book.id, status='pending').order_by(Reservation.reservation_date.asc()).first()
        if pending_res:
            # Auto assign and notify next student
            pending_res.status = 'approved'
            
            # Create in-app alert
            notif = Notification(
                user_id=pending_res.member_id,
                title="Reserved Book Available",
                message=f"The book '{book.title}' you reserved is now available! Please collect it from the counter within 48 hours.",
                org_id=pending_res.org_id
            )
            db.session.add(notif)
            
            # Send email notification
            if pending_res.member and pending_res.member.email:
                try:
                    NotificationService.send_email(
                        to_email=pending_res.member.email,
                        subject=f"Reserved Book Available: {book.title}",
                        body=f"Dear {pending_res.member.username},\n\nGood news! The book '{book.title}' by {book.author} has been returned and is now reserved for you.\n\nPlease collect it from the library desk within 48 hours.\n\nBest regards,\nNova College Library Node"
                    )
                except Exception as mail_err:
                    print(f"Error sending reservation availability email: {mail_err}", flush=True)

    # Create Fine record if penalty accrued
    fine_id = None
    if fine_amount > 0:
        fine = Fine.query.filter_by(issue_id=issue.id).first()
        if not fine:
            fine = Fine(
                issue_id=issue.id,
                member_id=issue.member_id,
                amount=fine_amount,
                status='pending',
                org_id=issue.org_id
            )
            db.session.add(fine)
            db.session.commit() # Save to get ID
        else:
            fine.amount = fine_amount
            db.session.commit()
        fine_id = fine.id
        
        # Create fine notification
        from backend.models.Notification import Notification
        notif = Notification(
            user_id=issue.member_id,
            title="Fine Generated",
            message=f"An overdue fine of INR {fine_amount} has been generated for returned book '{book.title if book else ''}'.",
            org_id=issue.org_id
        )
        db.session.add(notif)
        
    db.session.commit()
    
    return jsonify({
        "msg": "Book returned successfully",
        "fine_amount": fine_amount,
        "fine_id": fine_id,
        "issue": issue.to_dict()
    }), 200

# FINES
@issue_return_bp.route('/fines', methods=['GET'])
@jwt_required()
def get_fines():
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    
    if claims.get('role') in ['admin', 'librarian']:
        fines = Fine.query.order_by(Fine.created_at.desc()).all()
    else:
        fines = Fine.query.filter_by(member_id=user_id).order_by(Fine.created_at.desc()).all()
        
    # Calculate total billing metrics
    total_logged = db.session.query(db.func.sum(Fine.amount)).scalar() or 0.0
    collected = db.session.query(db.func.sum(Fine.amount)).filter_by(status='paid').scalar() or 0.0
    pending = db.session.query(db.func.sum(Fine.amount)).filter_by(status='pending').scalar() or 0.0
    overdue_loans = Issue.query.filter_by(status='overdue').count()
    
    return jsonify({
        "fines": [fine.to_dict() for fine in fines],
        "stats": {
            "total": total_logged,
            "collected": collected,
            "pending": pending,
            "overdue_count": overdue_loans
        }
    }), 200

@issue_return_bp.route('/fines/<int:fine_id>/pay', methods=['POST'])
@jwt_required()
@role_required('admin', 'librarian')
def pay_fine(fine_id):
    try:
        approver_id = int(get_jwt_identity())
        data = request.get_json() or {}
        transaction_reference = data.get('transaction_reference')
        
        fine = FineService.settle_fine(
            fine_id, 
            approver_id=approver_id, 
            transaction_reference=transaction_reference
        )
        return jsonify({"msg": "Fine approved and settled successfully", "fine": fine.to_dict()}), 200
    except Exception as e:
        return jsonify({"msg": str(e)}), 400

@issue_return_bp.route('/fines/<int:fine_id>/waive', methods=['POST'])
@jwt_required()
@role_required('admin', 'librarian')
def waive_fine(fine_id):
    fine = Fine.query.get(fine_id)
    if not fine:
        return jsonify({"msg": "Fine record not found"}), 404
        
    fine.amount = 0.0
    fine.status = 'paid'
    fine.transaction_reference = 'WAIVED'
    fine.payment_date = datetime.utcnow()
    fine.approver_id = int(get_jwt_identity())
    
    # Update associated issue fine amount to reflect waiver
    if fine.issue:
        fine.issue.fine_amount = 0.0
        
    db.session.commit()
    
    # Create notification for student
    from backend.models.Notification import Notification
    notif = Notification(
        user_id=fine.member_id,
        title="Fine Waived",
        message="A pending library fine on your account has been waived by the librarian.",
        org_id=fine.org_id
    )
    db.session.add(notif)
    db.session.commit()
    
    return jsonify({"msg": "Fine successfully waived", "fine": fine.to_dict()}), 200
