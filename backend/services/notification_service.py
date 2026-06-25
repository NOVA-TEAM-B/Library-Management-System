import os
import smtplib
from email.mime.text import MIMEText
import urllib.request
import urllib.parse
import json
import uuid
import traceback

class NotificationService:
    @staticmethod
    def send_email(to_email, subject, body, otp_code=None):
        # Read SMTP Settings
        smtp_host = os.environ.get('SMTP_HOST')
        smtp_port = os.environ.get('SMTP_PORT')
        smtp_user = os.environ.get('SMTP_USER')
        smtp_pass = os.environ.get('SMTP_PASS')
        smtp_secure = os.environ.get('SMTP_SECURE', 'true').lower() == 'true'
        email_from = os.environ.get('EMAIL_FROM', 'noreply@novalibrary.com')

        # Log details to dev outbox regardless (fallback logging)
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance')
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, 'otp_outbox.log')
        
        try:
            with open(log_path, 'a', encoding='utf-8') as f:
                f.write(f"[{to_email}] EMAIL Subject: {subject} | Body: {body} | OTP: {otp_code}\n")
        except Exception:
            pass

        # Check if developer mock mode is active
        mock_mode = os.environ.get('MOCK_OTP_DELIVERY') == 'true'
        if mock_mode:
            print("Connecting SMTP...", flush=True)
            print("SMTP Connected", flush=True)
            print("Sending Email...", flush=True)
            print("Email Sent Successfully", flush=True)
            mock_msg_id = f"<mock-{uuid.uuid4()}@novalibrary.com>"
            print(f"Message ID: {mock_msg_id}", flush=True)
            print(f"Accepted: {to_email}", flush=True)
            print("Rejected: None", flush=True)
            return True, ""

        # Validate presence of credentials
        if not (smtp_host and smtp_port and smtp_user and smtp_pass and email_from):
            print("--- SMTP FAILURE LOG START ---", flush=True)
            print("Error: SMTP configuration credentials missing from environment.", flush=True)
            print("👉 DIAGNOSIS: Missing .env variables or dotenv not loaded.", flush=True)
            print("--- SMTP FAILURE LOG END ---", flush=True)
            return False, "Missing SMTP Credentials"

        try:
            port = int(smtp_port)
            
            # 1. Connect and verify SMTP connection (transporter.verify equivalent)
            print("Connecting SMTP...", flush=True)
            if smtp_secure and port == 465:
                server = smtplib.SMTP_SSL(smtp_host, port, timeout=10)
            else:
                server = smtplib.SMTP(smtp_host, port, timeout=10)
                if smtp_secure or port == 587:
                    server.starttls()
            
            # Login verification
            server.login(smtp_user, smtp_pass)
            print("SMTP Connected", flush=True)
            
            # 2. Step 5 - Send Test Email first
            test_msg = MIMEText("This is a test email.")
            test_msg['Subject'] = "SMTP TEST"
            test_msg['From'] = email_from
            test_msg['To'] = to_email
            server.send_message(test_msg)
            
            # 3. Send the actual OTP email
            msg = MIMEText(body)
            msg['Subject'] = "Library OTP"
            msg['From'] = email_from
            msg['To'] = to_email
            
            msg_id = f"<{uuid.uuid4()}@gmail.com>"
            msg['Message-ID'] = msg_id

            print("Sending Email...", flush=True)
            rejected = server.send_message(msg)
            server.quit()
            
            rejected_str = ", ".join(rejected.keys()) if rejected else "None"
            
            print("Email Sent Successfully", flush=True)
            print(f"Message ID: {msg_id}", flush=True)
            print(f"Accepted: {to_email}", flush=True)
            print(f"Rejected: {rejected_str}", flush=True)
            return True, ""
            
        except smtplib.SMTPAuthenticationError as e:
            error_stack = traceback.format_exc()
            print("--- SMTP FAILURE LOG START ---", flush=True)
            print("535 Authentication Failed", flush=True)
            print("Username and Password not accepted.", flush=True)
            print(f"Error Stack:\n{error_stack}", flush=True)
            print("\n👉 GMAIL SMTP DIAGNOSIS Checklist:", flush=True)
            print("✅ Confirm 2-Step Verification is enabled on your account.", flush=True)
            print("✅ Confirm you are using a 16-character Gmail App Password.", flush=True)
            print("❌ NEVER use your main Google account login password.", flush=True)
            print("--- SMTP FAILURE LOG END ---", flush=True)
            return False, "SMTP Authentication Failed"
            
        except smtplib.SMTPRecipientsRefused as e:
            error_stack = traceback.format_exc()
            print("--- SMTP FAILURE LOG START ---", flush=True)
            print(f"SMTP Recipient Refused: {str(e)}", flush=True)
            print(f"Error Stack:\n{error_stack}", flush=True)
            print("\n👉 DIAGNOSIS:", flush=True)
            print("Invalid recipient email address. The SMTP server refused to deliver to this address.", flush=True)
            print("--- SMTP FAILURE LOG END ---", flush=True)
            return False, f"Invalid email address: {str(e)}"
            
        except Exception as e:
            error_stack = traceback.format_exc()
            print("--- SMTP FAILURE LOG START ---", flush=True)
            print(f"SMTP Connection Failed: {str(e)}", flush=True)
            print(f"Error Stack:\n{error_stack}", flush=True)
            print("\n👉 DIAGNOSIS:", flush=True)
            print("SMTP Connection Failed. Please verify:", flush=True)
            print("1. SMTP_HOST is correct (e.g., smtp.gmail.com).", flush=True)
            print("2. SMTP_PORT is correct (e.g., 587 or 465).", flush=True)
            print("3. Outbound traffic on this port is not blocked by your firewall or ISP.", flush=True)
            print("--- SMTP FAILURE LOG END ---", flush=True)
            return False, f"Server Error: {str(e)}"

    @staticmethod
    def send_sms(to_phone, message, otp_code=None):
        # Read Twilio Settings
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        from_number = os.environ.get('TWILIO_FROM_NUMBER')

        # Log details to dev outbox regardless
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance')
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, 'otp_outbox.log')
        
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(f"[{to_phone}] SMS: {message} | OTP: {otp_code}\n")
            
        print(f"--- OUTBOX LOGGED --- To: {to_phone} | SMS: {message}")

        mock_mode = os.environ.get('MOCK_OTP_DELIVERY') == 'true'
        if mock_mode:
            print("SMS provider Connected")
            print(f"Recipient Phone: {to_phone}")
            print(f"Generated OTP: {otp_code}")
            print("Sending SMS...")
            print("SMS Sent Successfully")
            return True, ""

        if not (account_sid and auth_token and from_number):
            print("--- SMS FAILURE LOG START ---")
            print("Error: Twilio credentials missing from environment.")
            print("--- SMS FAILURE LOG END ---")
            return False, "SMS provider configuration missing."

        try:
            # Twilio API POST URL
            url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
            
            # Auth header setup
            import base64
            auth_str = f"{account_sid}:{auth_token}"
            auth_bytes = auth_str.encode('utf-8')
            auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')
            
            data = urllib.parse.urlencode({
                'To': to_phone,
                'From': from_number,
                'Body': message
            }).encode('utf-8')
            
            req = urllib.request.Request(url, data=data, method='POST')
            req.add_header('Authorization', f"Basic {auth_b64}")
            
            with urllib.request.urlopen(req) as res:
                res_body = res.read().decode('utf-8')
                print(f"Twilio API Response: {res_body}")
            
            print("SMS Sent Successfully")
            return True, ""
        except Exception as e:
            print(f"Failed to send SMS via Twilio API: {e}")
            import traceback
            traceback.print_exc()
            return False, str(e)
