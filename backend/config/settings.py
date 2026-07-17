import os
from datetime import timedelta

class Settings:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'nova-library-x-super-secret-key-987654321')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET', 'jwt-nova-library-x-super-secret-key-123456789')
    
    # Database Configuration: SQLite default, MySQL ready
    DATABASE_URL = os.environ.get('DATABASE_URL')
    
    if DATABASE_URL:
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    else:
        # Fallback to local SQLite inside backend/instance directory
        base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
        instance_dir = os.path.join(base_dir, 'instance')
        os.makedirs(instance_dir, exist_ok=True)
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(instance_dir, 'nova_library_x.db')}"
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    
    # Business logic
    FINE_RATE_PER_DAY = 5.0  # ₹5.00 or 5 credits per overdue day
