from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from backend.config.database import db
from backend.models.AuditLog import AuditLog
from backend.models.Organization import Organization
from backend.models.User import User
from backend.middleware.auth_middleware import role_required
from backend.utils.audit_helper import log_audit

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@role_required('superadmin', 'admin')
def get_audit_logs():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())
    
    query = AuditLog.query
    
    if role == 'admin':
        current_user = User.query.get(user_id)
        if current_user and current_user.org_id:
            query = query.join(User).filter(User.org_id == current_user.org_id)
        else:
            return jsonify([]), 200
            
    logs = query.order_by(AuditLog.created_at.desc()).limit(100).all()
    return jsonify([log.to_dict() for log in logs]), 200

@admin_bp.route('/organizations', methods=['GET'])
@jwt_required()
@role_required('superadmin')
def get_organizations():
    orgs = Organization.query.order_by(Organization.created_at.desc()).all()
    return jsonify([org.to_dict() for org in orgs]), 200

@admin_bp.route('/organizations', methods=['POST'])
@jwt_required()
@role_required('superadmin')
def create_organization():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('subdomain'):
        return jsonify({"msg": "Missing name or subdomain"}), 400
        
    if Organization.query.filter_by(name=data['name']).first():
        return jsonify({"msg": "Organization name already exists"}), 400
        
    if Organization.query.filter_by(subdomain=data['subdomain']).first():
        return jsonify({"msg": "Subdomain already exists"}), 400
        
    org = Organization(
        name=data['name'],
        subdomain=data['subdomain'],
        logo_url=data.get('logo_url') or "/logo.svg",
        fine_rate=float(data.get('fine_rate', 5.0))
    )
    db.session.add(org)
    db.session.commit()
    
    log_audit(
        action="Organization Registered",
        details=f"Super Admin registered organization '{org.name}' with subdomain '{org.subdomain}'."
    )
    
    return jsonify({"msg": "Organization registered successfully", "organization": org.to_dict()}), 201

@admin_bp.route('/settings', methods=['PUT'])
@jwt_required()
@role_required('superadmin', 'admin')
def update_settings():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    role = claims.get('role')
    
    data = request.get_json()
    if not data:
        return jsonify({"msg": "No settings payload provided"}), 400
        
    if role == 'superadmin':
        org_id = data.get('org_id')
        if not org_id:
            return jsonify({"msg": "Missing org_id for Super Admin update"}), 400
        org = Organization.query.get(org_id)
    else:
        current_user = User.query.get(user_id)
        if not current_user or not current_user.org_id:
            return jsonify({"msg": "User does not belong to any organization"}), 400
        org = Organization.query.get(current_user.org_id)
        
    if not org:
        return jsonify({"msg": "Organization not found"}), 404
        
    org.name = data.get('name', org.name)
    org.logo_url = data.get('logo_url', org.logo_url)
    if 'fine_rate' in data:
        org.fine_rate = float(data['fine_rate'])
        
    db.session.commit()
    
    log_audit(
        action="Settings Updated",
        details=f"Organization settings updated for '{org.name}'."
    )
    
    return jsonify({"msg": "Organization settings updated successfully", "organization": org.to_dict()}), 200
