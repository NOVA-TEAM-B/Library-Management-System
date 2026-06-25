from functools import wraps
from flask import jsonify
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
