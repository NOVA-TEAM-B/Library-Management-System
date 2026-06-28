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
    current_user = User.query.get(user_id)
    
    data = request.get_json() or {}
    
    print("========== SETTINGS REQUEST ==========", flush=True)
    print(f"Current User: {current_user.username if current_user else 'Unknown'}", flush=True)
    print(f"Role: {role}", flush=True)
    print(f"Organization: {current_user.org_id if current_user else 'None'}", flush=True)
    print(f"Payload: {data}", flush=True)
    
    validation_status = "Valid"
    org = None
    
    if role == 'superadmin':
        org_id = data.get('org_id')
        if not org_id:
            if current_user and current_user.org_id:
                org_id = current_user.org_id
            else:
                first_org = Organization.query.first()
                if first_org:
                    org_id = first_org.id
        if not org_id:
            validation_status = "Failed: Missing org_id"
            print(f"Validation: {validation_status}", flush=True)
            print("======================================", flush=True)
            return jsonify({"msg": "Missing org_id for Super Admin update"}), 400
        org = Organization.query.get(org_id)
    else:
        if not current_user or not current_user.org_id:
            validation_status = "Failed: User has no organization"
            print(f"Validation: {validation_status}", flush=True)
            print("======================================", flush=True)
            return jsonify({"msg": "User does not belong to any organization"}), 400
        org = Organization.query.get(current_user.org_id)
        
    if not org:
        validation_status = "Failed: Organization not found"
        print(f"Validation: {validation_status}", flush=True)
        print("======================================", flush=True)
        return jsonify({"msg": "Organization not found"}), 404
        
    print(f"Validation: {validation_status}", flush=True)
    
    org.name = data.get('name', org.name)
    org.logo_url = data.get('logo_url', org.logo_url)
    if 'fine_rate' in data:
        org.fine_rate = float(data['fine_rate'])
        
    db.session.commit()
    
    log_audit(
        action="Settings Updated",
        details=f"Organization settings updated for '{org.name}'."
    )
    
    response_payload = {"msg": "Organization settings updated successfully", "organization": org.to_dict()}
    print(f"Database Result: Committed settings update for {org.name}", flush=True)
    print(f"Response: {response_payload}", flush=True)
    print("======================================", flush=True)
    return jsonify(response_payload), 200

@admin_bp.route('/upload-logo', methods=['POST'])
@jwt_required()
@role_required('superadmin', 'admin')
def upload_logo():
    from flask import current_app
    import os
    import uuid
    
    if 'logo' not in request.files:
        return jsonify({"msg": "No logo file in request"}), 400
        
    file = request.files['logo']
    filename = file.filename
    if not filename:
        return jsonify({"msg": "No selected file"}), 400
        
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > 5 * 1024 * 1024:
        return jsonify({"msg": "File size exceeds the 5 MB limit"}), 400
        
    ext = filename.rsplit('.', 1)[1].lower()
    unique_name = f"{uuid.uuid4()}.{ext}"
    
    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'logos')
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, unique_name)
    file.save(file_path)
    
    logo_url = f"/static/uploads/logos/{unique_name}"
    
    log_audit("Organization Logo Uploaded", details="Admin uploaded new organization logo.")
    
    return jsonify({
        "msg": "Logo uploaded successfully", 
        "logo_url": logo_url
    }), 200

# Tenants CRUD / status updates (synonyms and extensions for organizations)
@admin_bp.route('/tenants', methods=['GET'])
@jwt_required()
@role_required('superadmin')
def get_tenants():
    search_q = request.args.get('search', '').strip()
    status_q = request.args.get('status', '').strip()
    
    query = Organization.query
    if search_q:
        query = query.filter((Organization.name.ilike(f"%{search_q}%")) | (Organization.subdomain.ilike(f"%{search_q}%")))
    if status_q:
        query = query.filter(Organization.status == status_q)
        
    orgs = query.order_by(Organization.created_at.desc()).all()
    
    total_tenants = len(orgs)
    active_tenants = sum(1 for o in orgs if o.status == 'active')
    inactive_tenants = total_tenants - active_tenants
    
    results = []
    for org in orgs:
        org_dict = org.to_dict()
        org_dict['users_count'] = len(org.users)
        org_dict['books_count'] = len(org.books)
        results.append(org_dict)
        
    response_data = {
        'tenants': results,
        'stats': {
            'total': total_tenants,
            'active': active_tenants,
            'inactive': inactive_tenants
        }
    }
    return jsonify(response_data), 200

@admin_bp.route('/tenants', methods=['POST'])
@jwt_required()
@role_required('superadmin')
def create_tenant():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('subdomain'):
        return jsonify({"msg": "Missing name or subdomain"}), 400
        
    if Organization.query.filter_by(name=data['name']).first():
        return jsonify({"msg": "Organization name already exists"}), 400
        
    if Organization.query.filter_by(subdomain=data['subdomain']).first():
        return jsonify({"msg": "Subdomain already exists"}), 400
        
    org = Organization(
        name=data['name'],
        subdomain=data['subdomain'].lower().replace(' ', ''),
        logo_url=data.get('logo_url') or "/logo.svg",
        fine_rate=float(data.get('fine_rate', 5.0)),
        status=data.get('status', 'active')
    )
    db.session.add(org)
    db.session.commit()
    
    log_audit(
        action="Organization Registered",
        details=f"Super Admin registered organization '{org.name}' with subdomain '{org.subdomain}'."
    )
    return jsonify({"msg": "Organization registered successfully", "organization": org.to_dict()}), 201

@admin_bp.route('/tenants/<int:org_id>', methods=['PUT'])
@jwt_required()
@role_required('superadmin')
def update_tenant(org_id):
    org = Organization.query.get(org_id)
    if not org:
        return jsonify({"msg": "Organization not found"}), 404
        
    data = request.get_json()
    if not data:
        return jsonify({"msg": "No payload provided"}), 400
        
    if 'name' in data and data['name'] != org.name:
        if Organization.query.filter_by(name=data['name']).first():
            return jsonify({"msg": "Organization name already exists"}), 400
        org.name = data['name']
        
    if 'subdomain' in data and data['subdomain'] != org.subdomain:
        if Organization.query.filter_by(subdomain=data['subdomain']).first():
            return jsonify({"msg": "Subdomain already exists"}), 400
        org.subdomain = data['subdomain'].lower().replace(' ', '')
        
    if 'logo_url' in data:
        org.logo_url = data['logo_url']
        
    if 'fine_rate' in data:
        org.fine_rate = float(data['fine_rate'])
        
    if 'status' in data:
        org.status = data['status']
        
    db.session.commit()
    log_audit(
        action="Organization Updated",
        details=f"Super Admin updated organization '{org.name}' details."
    )
    return jsonify({"msg": "Organization updated successfully", "organization": org.to_dict()}), 200

@admin_bp.route('/tenants/<int:org_id>', methods=['DELETE'])
@jwt_required()
@role_required('superadmin')
def delete_tenant(org_id):
    org = Organization.query.get(org_id)
    if not org:
        return jsonify({"msg": "Organization not found"}), 404
        
    db.session.delete(org)
    db.session.commit()
    log_audit(
        action="Organization Deleted",
        details=f"Super Admin deleted organization '{org.name}'."
    )
    return jsonify({"msg": "Organization deleted successfully"}), 200
