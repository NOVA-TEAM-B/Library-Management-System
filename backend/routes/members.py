from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from backend.config.database import db
from backend.models.User import User
from backend.models.Issue import Issue
from backend.models.Reservation import Reservation
from backend.middleware.auth_middleware import role_required, get_current_org_id
from datetime import datetime, timedelta

members_bp = Blueprint('members', __name__)

@members_bp.route('', methods=['GET'])
@jwt_required()
@role_required('admin', 'librarian')
def get_members():
    search = request.args.get('search', '')
    dept = request.args.get('department', '')
    status = request.args.get('status', '')
    
    org_id = get_current_org_id()
    query = User.query.filter(User.role == 'member')
    if org_id is not None:
        query = query.filter_by(org_id=org_id)
        
    if search:
        query = query.filter((User.username.ilike(f'%{search}%')) | (User.email.ilike(f'%{search}%')) | (User.membership_id.ilike(f'%{search}%')))
    if dept:
        query = query.filter(User.department.ilike(f'%{dept}%'))
    if status:
        query = query.filter(User.status == status)
        
    members = query.all()
    
    # Calculate stats
    total_m_q = User.query.filter_by(role='member')
    active_m_q = User.query.filter_by(role='member', status='active')
    inactive_m_q = User.query.filter_by(role='member', status='inactive')
    
    last_month = datetime.utcnow() - timedelta(days=30)
    new_reg_q = User.query.filter(User.role == 'member', User.created_at >= last_month)
    
    if org_id is not None:
        total_m_q = total_m_q.filter_by(org_id=org_id)
        active_m_q = active_m_q.filter_by(org_id=org_id)
        inactive_m_q = inactive_m_q.filter_by(org_id=org_id)
        new_reg_q = new_reg_q.filter_by(org_id=org_id)
        
    total_m = total_m_q.count()
    active_m = active_m_q.count()
    inactive_m = inactive_m_q.count()
    new_reg = new_reg_q.count()
    
    # Add count of books issued per member
    members_list = []
    for m in members:
        issued_count = Issue.query.filter_by(member_id=m.id, status='issued').count()
        m_dict = m.to_dict()
        m_dict['books_issued'] = issued_count
        members_list.append(m_dict)
        
    return jsonify({
        "members": members_list,
        "stats": {
            "total": total_m,
            "active": active_m,
            "inactive": inactive_m,
            "new_registrations": new_reg
        }
    }), 200

@members_bp.route('/<int:member_id>', methods=['GET'])
@jwt_required()
def get_member_details(member_id):
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    
    if claims.get('role') not in ['admin', 'librarian'] and user_id != member_id:
        return jsonify({"msg": "Unauthorized access"}), 403
        
    member = User.query.get(member_id)
    if not member:
        return jsonify({"msg": "Member not found"}), 404
        
    org_id = get_current_org_id()
    if org_id is not None and member.org_id != org_id:
        return jsonify({"msg": "Unauthorized. Resource organization mismatch."}), 403
        
    issues = Issue.query.filter_by(member_id=member_id).order_by(Issue.issue_date.desc()).all()
    reservations = Reservation.query.filter_by(member_id=member_id).order_by(Reservation.reservation_date.desc()).all()
    
    member_data = member.to_dict()
    member_data['issues'] = [issue.to_dict() for issue in issues]
    member_data['reservations'] = [res.to_dict() for res in reservations]
    
    return jsonify(member_data), 200

@members_bp.route('/<int:member_id>', methods=['PUT'])
@jwt_required()
@role_required('admin', 'librarian')
def edit_member(member_id):
    member = User.query.get(member_id)
    if not member:
        return jsonify({"msg": "Member not found"}), 404
        
    org_id = get_current_org_id()
    if org_id is not None and member.org_id != org_id:
        return jsonify({"msg": "Unauthorized. Resource organization mismatch."}), 403
        
    data = request.get_json()
    if not data:
        return jsonify({"msg": "No data provided"}), 400
        
    if 'username' in data:
        existing = User.query.filter_by(username=data['username']).first()
        if existing and existing.id != member_id:
            return jsonify({"msg": "Username already taken"}), 400
        member.username = data['username']
        
    if 'email' in data:
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != member_id:
            return jsonify({"msg": "Email already registered"}), 400
        member.email = data['email']
        
    if 'department' in data:
        member.department = data['department']
    if 'phone' in data:
        member.phone = data['phone']
    if 'status' in data:
        member.status = data['status']
        
    # Settle risk changes if they are editing details (AI metrics)
    if 'reading_score' in data:
        member.reading_score = int(data['reading_score'])
        # Adjust achievement level
        score = member.reading_score
        if score >= 90: member.achievement_level = 'Knowledge Master'
        elif score >= 80: member.achievement_level = 'Platinum Reader'
        elif score >= 70: member.achievement_level = 'Gold Reader'
        elif score >= 60: member.achievement_level = 'Silver Reader'
        else: member.achievement_level = 'Bronze Reader'
        
    db.session.commit()
    return jsonify({"msg": "Member updated successfully", "member": member.to_dict()}), 200

@members_bp.route('/<int:member_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin', 'librarian')
def delete_member(member_id):
    member = User.query.get(member_id)
    if not member:
        return jsonify({"msg": "Member not found"}), 404
        
    org_id = get_current_org_id()
    if org_id is not None and member.org_id != org_id:
        return jsonify({"msg": "Unauthorized. Resource organization mismatch."}), 403
        
    db.session.delete(member)
    db.session.commit()
    return jsonify({"msg": "Member deleted successfully"}), 200
