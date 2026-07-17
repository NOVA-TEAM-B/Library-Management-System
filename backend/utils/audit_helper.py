from flask import request
from flask_jwt_extended import get_jwt_identity
from backend.config.database import db
from backend.models.AuditLog import AuditLog

def log_audit(action, details=None, user_id=None):
    """
    Logs administrative and user actions in the AuditLog database table.
    Captures IP address and User-Agent headers dynamically from request context.
    """
    try:
        if not user_id:
            try:
                identity = get_jwt_identity()
                if identity:
                    user_id = int(identity)
            except:
                pass
                
        ip_address = None
        browser = None
        
        if request:
            # Handle reverse proxies if present
            if request.headers.getlist("X-Forwarded-For"):
                ip_address = request.headers.getlist("X-Forwarded-For")[0]
            else:
                ip_address = request.remote_addr
            
            if request.user_agent:
                browser = request.user_agent.string
        
        log = AuditLog(
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip_address,
            browser=browser
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        print(f"Failed to write audit log event: {e}")
