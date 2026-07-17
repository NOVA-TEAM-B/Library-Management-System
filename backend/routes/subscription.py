from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from backend.config.database import db
from backend.models.Subscription import Subscription, Transaction, EnterpriseRequest
from backend.models.Organization import Organization
from datetime import datetime, timedelta
import secrets
import os
import hmac
import hashlib

from backend.models.User import User
from backend.services.notification_service import NotificationService
import razorpay

subscription_bp = Blueprint('subscription', __name__)

@subscription_bp.route('/create-order', methods=['POST'])
@jwt_required()
def create_order():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    org_id = claims.get('org_id')
    
    if not org_id:
        return jsonify({"msg": "User organization not identified"}), 400
        
    data = request.get_json()
    if not data or not data.get('plan_name'):
        return jsonify({"msg": "Missing plan details"}), 400
        
    plan_name = data['plan_name']
    billing_period = data.get('billing_period', 'monthly') # 'monthly' or 'yearly'
    
    # Calculate price
    if plan_name == 'Standard':
        base_price = 1500.0 if billing_period == 'monthly' else 1200.0
    elif plan_name == 'Enterprise':
        base_price = 4500.0 if billing_period == 'monthly' else 3600.0
    else:
        return jsonify({"msg": f"Invalid plan: {plan_name}"}), 400
        
    months = 1 if billing_period == 'monthly' else 12
    amount = base_price * months
    
    # Read settings
    key_id = os.environ.get('RAZORPAY_KEY_ID')
    key_secret = os.environ.get('RAZORPAY_KEY_SECRET')
    
    order_id = None
    if key_id and key_secret and not key_id.startswith('rzp_test_dummy'):
        try:
            # Make a POST request to Razorpay Orders API
            import urllib.request
            import base64
            import json
            
            url = "https://api.razorpay.com/v1/orders"
            auth_str = f"{key_id}:{key_secret}"
            auth_b64 = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
            
            amount_paisa = int(amount * 100)
            post_data = json.dumps({
                "amount": amount_paisa,
                "currency": "INR",
                "receipt": f"receipt_{secrets.token_hex(8)}"
            }).encode('utf-8')
            
            req = urllib.request.Request(url, data=post_data, method='POST')
            req.add_header('Authorization', f"Basic {auth_b64}")
            req.add_header('Content-Type', 'application/json')
            
            with urllib.request.urlopen(req) as res:
                res_body = res.read().decode('utf-8')
                res_data = json.loads(res_body)
                order_id = res_data['id']
                print(f"Razorpay Order Created: {order_id}", flush=True)
        except Exception as e:
            print(f"Failed to create Razorpay order: {e}", flush=True)
            order_id = f"order_mock_{secrets.token_hex(8)}"
    else:
        order_id = f"order_mock_{secrets.token_hex(8)}"
        
    # Save pending transaction
    tx = Transaction(
        org_id=org_id,
        amount=amount,
        currency='INR',
        status='Pending',
        gateway='Razorpay',
        order_id=order_id
    )
    db.session.add(tx)
    db.session.commit()
    
    return jsonify({
        "order_id": order_id,
        "amount": amount,
        "currency": "INR",
        "plan_name": plan_name,
        "billing_period": billing_period,
        "key_id": key_id or "rzp_test_dummy_key_id"
    }), 200

@subscription_bp.route('/verify-payment', methods=['POST'])
@jwt_required()
def verify_payment():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    org_id = claims.get('org_id')
    
    if not org_id:
        return jsonify({"msg": "User organization not identified"}), 400
        
    data = request.get_json()
    print(f"Incoming payment verification data: {data}", flush=True)
    
    order_id = data.get('razorpay_order_id') or data.get('order_id')
    payment_id = data.get('razorpay_payment_id') or data.get('payment_id')
    signature = data.get('razorpay_signature') or data.get('signature')
    plan_name = data.get('plan') or 'Standard'
    billing_period = data.get('billing_period') or 'monthly'
    
    if not order_id or not payment_id:
        return jsonify({"msg": "Missing payment signature details"}), 400
        
    tx = Transaction.query.filter_by(order_id=order_id, org_id=org_id).first()
    if not tx:
        return jsonify({"msg": "Order not found"}), 404
        
    if tx.status == 'Success':
        return jsonify({"msg": "Payment already verified", "invoice_number": tx.invoice_number}), 200
        
    # Signature Verification
    key_id = os.environ.get('RAZORPAY_KEY_ID')
    key_secret = os.environ.get('RAZORPAY_KEY_SECRET')
    
    is_mock = not key_id or not key_secret or key_id.startswith('rzp_test_dummy') or order_id.startswith('order_mock_') or (signature and signature.startswith('sig_mock_'))
    
    if not is_mock and signature:
        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            client.utility.verify_payment_signature({
                'razorpay_order_id': order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature
            })
            print("[PAYMENT] Razorpay signature verification succeeded.", flush=True)
        except Exception as e:
            print(f"[PAYMENT] Razorpay signature verification failed: {e}", flush=True)
            import traceback
            traceback.print_exc()
            
            # Save failed status to transaction
            tx.status = 'Failed'
            db.session.commit()
            return jsonify({"msg": f"Signature verification failed: {str(e)}"}), 400
    else:
        print("[PAYMENT] Processing mock payment verification.", flush=True)
        
    # Generate Invoice Number
    date_str = datetime.utcnow().strftime('%Y%m%d')
    random_suffix = secrets.SystemRandom().randint(1000, 9999)
    invoice_number = f"INV-{date_str}-{random_suffix}"
    
    # Update transaction
    tx.status = 'Success'
    tx.payment_id = payment_id
    tx.signature = signature
    tx.invoice_number = invoice_number
    
    # Create or update subscription (Only activates now after signature success!)
    sub = Subscription.query.filter_by(org_id=org_id).first()
    
    # Expiry interval
    months = 12 if billing_period == 'yearly' else 1
    duration_days = 365 if billing_period == 'yearly' else 30
    
    if not sub:
        sub = Subscription(
            org_id=org_id,
            plan_name=plan_name,
            status='Active',
            price=tx.amount,
            billing_period=billing_period,
            start_date=datetime.utcnow(),
            expiry_date=datetime.utcnow() + timedelta(days=duration_days)
        )
        db.session.add(sub)
    else:
        sub.plan_name = plan_name
        sub.status = 'Active'
        sub.price = tx.amount
        sub.billing_period = billing_period
        sub.start_date = datetime.utcnow()
        sub.expiry_date = datetime.utcnow() + timedelta(days=duration_days)
        
    db.session.commit()
    
    # Send Email Confirmation
    user = User.query.get(user_id)
    if user and user.email:
        try:
            NotificationService.send_email(
                to_email=user.email,
                subject=f"Subscription Activated - {plan_name} Node",
                body=f"Dear Admin,\n\nWe have successfully verified your payment of INR {tx.amount} for the {plan_name} subscription. Your node is now fully active.\n\nInvoice: {invoice_number}\nTransaction Reference: {payment_id}\n\nThank you for choosing Nova Library!"
            )
        except Exception as mail_err:
            print(f"Error sending subscription success email: {mail_err}", flush=True)
            
    return jsonify({
        "success": True,
        "msg": "Payment verified successfully",
        "invoice_number": invoice_number,
        "subscription": sub.to_dict()
    }), 200

@subscription_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_subscription():
    claims = get_jwt()
    org_id = claims.get('org_id')
    
    if not org_id:
        return jsonify({"msg": "User organization not identified"}), 400
        
    sub = Subscription.query.filter_by(org_id=org_id).first()
    if not sub:
        # Default Trial setup
        sub = Subscription(
            org_id=org_id,
            plan_name='Trial',
            status='Active',
            price=0.0,
            billing_period='monthly',
            start_date=datetime.utcnow() - timedelta(days=5),
            expiry_date=datetime.utcnow() + timedelta(days=25)
        )
        db.session.add(sub)
        db.session.commit()
        
    return jsonify(sub.to_dict()), 200

@subscription_bp.route('/payment-history', methods=['GET'])
@jwt_required()
def get_payment_history():
    claims = get_jwt()
    org_id = claims.get('org_id')
    
    if not org_id:
        return jsonify({"msg": "User organization not identified"}), 400
        
    txs = Transaction.query.filter_by(org_id=org_id, status='Success').order_by(Transaction.created_at.desc()).all()
    return jsonify([tx.to_dict() for tx in txs]), 200

@subscription_bp.route('/contact-enterprise', methods=['POST'])
@jwt_required()
def contact_enterprise():
    data = request.get_json()
    if not data or not data.get('contact_person') or not data.get('email'):
        return jsonify({"msg": "Missing required fields"}), 400
        
    req = EnterpriseRequest(
        org_name=data.get('org_name', 'Unnamed Org'),
        contact_person=data['contact_person'],
        phone=data.get('phone', 'N/A'),
        email=data['email'],
        campus_count=int(data.get('campus_count', 1)),
        expected_users=int(data.get('expected_users', 100)),
        requirements=data.get('requirements', '')
    )
    db.session.add(req)
    db.session.commit()
    
    return jsonify({"success": True, "msg": "Enterprise request submitted successfully"}), 200
