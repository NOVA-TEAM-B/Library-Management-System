import os
import sys
import smtplib
import traceback
from email.mime.text import MIMEText

def load_local_env():
    # Use exact same .env parsing logic as app.py
    env_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        print(f"[*] Found .env file at: {env_path}")
        with open(env_path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if '#' in line:
                    line = line.split('#', 1)[0].strip()
                if line and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ[key.strip()] = val.strip().strip('"').strip("'")
    else:
        print("[!] Warning: No .env file found in this directory.")

def main():
    print("=" * 60)
    print("NOVA LIBRARY - STANDALONE SMTP DIAGNOSTIC TOOL")
    print("=" * 60)
    
    load_local_env()
    
    # Resolve keys supporting fallbacks
    smtp_host = os.environ.get('SMTP_HOST') or os.environ.get('MAIL_SERVER')
    smtp_port = os.environ.get('SMTP_PORT') or os.environ.get('MAIL_PORT')
    smtp_user = os.environ.get('SMTP_USER') or os.environ.get('MAIL_USERNAME')
    smtp_pass = os.environ.get('SMTP_PASS') or os.environ.get('MAIL_PASSWORD')
    
    smtp_secure = os.environ.get('SMTP_SECURE') or os.environ.get('MAIL_USE_TLS') or os.environ.get('MAIL_USE_SSL')
    if smtp_secure is None:
        smtp_secure = 'true'
    else:
        smtp_secure = str(smtp_secure)
    smtp_secure = smtp_secure.lower() in ('true', '1', 'yes')
    
    email_from = os.environ.get('EMAIL_FROM') or os.environ.get('MAIL_DEFAULT_SENDER')
    mock_mode = os.environ.get('MOCK_OTP_DELIVERY', 'false').lower() == 'true'

    print(f"[*] SMTP Host       : {smtp_host}")
    print(f"[*] SMTP Port       : {smtp_port}")
    print(f"[*] SMTP Username   : {smtp_user}")
    print(f"[*] SMTP Password   : {'*****' if smtp_pass else 'MISSING'}")
    print(f"[*] TLS/SSL Enabled : {smtp_secure}")
    print(f"[*] Default Sender  : {email_from}")
    print(f"[*] Mock Mode Active: {mock_mode}")
    print("-" * 60)

    if not (smtp_host and smtp_port and smtp_user and smtp_pass):
        print("[ERROR] Missing required configuration credentials. Please check your .env file.")
        sys.exit(1)

    if mock_mode:
        print("[*] Diagnostic mock test: Mock mode is currently enabled in your .env.")
        print("[*] Standalone tool will continue checking real SMTP credentials regardless...")
        print("-" * 60)

    try:
        port = int(smtp_port)
    except ValueError:
        print(f"[ERROR] SMTP_PORT must be an integer, got: {smtp_port}")
        sys.exit(1)

    try:
        print(f"[*] Step 1: Connecting to server {smtp_host} on port {port}...")
        if smtp_secure and port == 465:
            server = smtplib.SMTP_SSL(smtp_host, port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, port, timeout=10)
            if smtp_secure or port == 587:
                print("[*] Step 2: Negotiating secure TLS session (STARTTLS)...")
                server.starttls()
        
        print(f"[*] Connection established. Step 3: Attempting login for {smtp_user}...")
        server.login(smtp_user, smtp_pass)
        print("[SUCCESS] SMTP login authentication succeeded!")
        
        print(f"[*] Step 4: Testing mock message dispatch to {smtp_user}...")
        msg = MIMEText("This is a standalone SMTP connection and configuration diagnostic test for Nova Library.")
        msg['Subject'] = "Nova Library - Connection Diagnostic Test"
        msg['From'] = email_from or smtp_user
        msg['To'] = smtp_user
        
        server.send_message(msg)
        print("[SUCCESS] Test email successfully queued for delivery!")
        server.quit()
        
        print("=" * 60)
        print("STATUS: SUCCESS. Your SMTP credentials are 100% operational!")
        print("=" * 60)
        
    except smtplib.SMTPAuthenticationError as e:
        print("\n" + "!" * 60)
        print("[AUTH ERROR] SMTP Authentication Failed (535).")
        print(f"Detail: {str(e)}")
        print("\nGMAIL DIAGNOSIS CHECKLIST:")
        print("1. Confirm you are using a 16-character Gmail App Password (not your normal account password).")
        print("2. Confirm 2-Step Verification is active on the Google account.")
        print("3. Ensure there are no spaces or extra characters in your MAIL_PASSWORD / SMTP_PASS value.")
        print("!" * 60)
        sys.exit(1)
    except Exception as e:
        print("\n" + "!" * 60)
        print("[CONNECTION ERROR] Connection / SMTP failure occurred.")
        print(f"Detail: {str(e)}")
        print("\nTraceback:")
        traceback.print_exc()
        print("!" * 60)
        sys.exit(1)

if __name__ == '__main__':
    main()
