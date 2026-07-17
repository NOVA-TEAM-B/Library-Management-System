from backend.config.database import db
from datetime import datetime

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    org_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    plan_name = db.Column(db.String(50), default='Trial', nullable=False) # 'Standard', 'Enterprise', 'Venture'
    status = db.Column(db.String(20), default='Active', nullable=False) # 'Active', 'Pending', 'Expired', 'Cancelled'
    price = db.Column(db.Float, default=0.0, nullable=False)
    billing_period = db.Column(db.String(20), default='monthly', nullable=False) # 'monthly', 'yearly'
    start_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expiry_date = db.Column(db.DateTime, nullable=False)
    
    # Relationship
    organization = db.relationship('Organization', backref=db.backref('subscriptions', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'org_id': self.org_id,
            'plan_name': self.plan_name,
            'status': self.status,
            'price': self.price,
            'billing_period': self.billing_period,
            'start_date': self.start_date.strftime('%Y-%m-%d %H:%M:%S') if self.start_date else None,
            'expiry_date': self.expiry_date.strftime('%Y-%m-%d %H:%M:%S') if self.expiry_date else None
        }

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    org_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='INR', nullable=False)
    status = db.Column(db.String(20), default='Pending', nullable=False) # 'Pending', 'Success', 'Failed'
    gateway = db.Column(db.String(50), default='Razorpay', nullable=False)
    order_id = db.Column(db.String(100), nullable=True)
    payment_id = db.Column(db.String(100), nullable=True)
    signature = db.Column(db.String(255), nullable=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    organization = db.relationship('Organization', backref=db.backref('transactions', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'org_id': self.org_id,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'gateway': self.gateway,
            'order_id': self.order_id,
            'payment_id': self.payment_id,
            'invoice_number': self.invoice_number,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }

class EnterpriseRequest(db.Model):
    __tablename__ = 'enterprise_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    org_name = db.Column(db.String(100), nullable=False)
    contact_person = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    campus_count = db.Column(db.Integer, default=1)
    expected_users = db.Column(db.Integer, default=100)
    requirements = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'org_name': self.org_name,
            'contact_person': self.contact_person,
            'phone': self.phone,
            'email': self.email,
            'campus_count': self.campus_count,
            'expected_users': self.expected_users,
            'requirements': self.requirements,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }
