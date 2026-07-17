from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def role_required(*roles):
    """
    Decorator to restrict route access to specific roles (e.g. admin, librarian, member).
    Integrates seamlessly with Flask-JWT-Extended.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception as e:
                return jsonify({"msg": "Missing or invalid token", "error": str(e)}), 401
                
            claims = get_jwt()
            user_role = claims.get("role")
            
            if user_role not in roles:
                return jsonify({"msg": f"Access denied. Unauthorized role: '{user_role}'"}), 403
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def get_current_org_id():
    """
    Retrieves the org_id from the active JWT claims, query parameters, or request headers.
    If the user has the 'superadmin' role, it allows bypassing (returns None unless org_id is explicitly passed).
    """
    try:
        verify_jwt_in_request(optional=True)
        claims = get_jwt()
        if claims:
            if claims.get("role") == "superadmin":
                req_org = request.args.get("org_id") or (request.get_json().get("org_id") if (request.is_json and request.get_json()) else None)
                return int(req_org) if req_org else None
            return claims.get("org_id")
    except Exception:
        pass

    org_id = request.args.get("org_id") or request.headers.get("X-Organization-ID")
    if org_id:
        try:
            return int(org_id)
        except ValueError:
            pass
    return None

