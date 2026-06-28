import os
import urllib.request
import urllib.parse
import urllib.error
import base64
import json
import traceback

def main():
    print("============================================================")
    print("TWILIO SMS STANDALONE DIAGNOSTIC UTILITY")
    print("============================================================")
    
    # Load .env file
    env_path = '.env'
    if os.path.exists(env_path):
        print(f"[*] Loading environment from: {os.path.abspath(env_path)}")
        with open(env_path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if '#' in line:
                    line = line.split('#', 1)[0].strip()
                if line and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ[key.strip()] = val.strip().strip('"').strip("'")
    else:
        print("[!] No .env file found in current folder.")

    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    from_number = os.environ.get('TWILIO_FROM_NUMBER')

    print(f"[*] Account SID Loaded : {'YES' if account_sid else 'NO'}")
    print(f"[*] Auth Token Loaded  : {'YES' if auth_token else 'NO'}")
    print(f"[*] From Number Loaded : {'YES' if from_number else 'NO'}")

    if not (account_sid and auth_token and from_number):
        print("[!] Missing Twilio configurations in .env file. Cannot run test.")
        return

    to_phone = input("\nEnter recipient phone number (including + and country code, e.g. +919876543210): ").strip()
    if not to_phone:
        print("[!] Recipient phone number cannot be empty.")
        return

    # Twilio API POST URL
    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    auth_str = f"{account_sid}:{auth_token}"
    auth_b64 = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
    
    message = "Nova Library System - Verification Test SMS"
    data = urllib.parse.urlencode({
        'To': to_phone,
        'From': from_number,
        'Body': message
    }).encode('utf-8')

    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Authorization', f"Basic {auth_b64}")

    print("\n[*] Sending request to Twilio API...")
    try:
        with urllib.request.urlopen(req) as res:
            res_body = res.read().decode('utf-8')
            res_data = json.loads(res_body)
            print("\n[SUCCESS] Twilio Response Status: 201 Created")
            print(f"[*] Message SID     : {res_data.get('sid')}")
            print(f"[*] Delivery Status : {res_data.get('status')}")
            print(f"[*] Queue Status    : {res_data.get('queue_status', 'N/A')}")
    except urllib.error.HTTPError as e:
        print(f"\n[HTTP ERROR] Status: {e.code} ({e.reason})")
        try:
            error_body = e.read().decode('utf-8')
            error_data = json.loads(error_body)
            print("Twilio API Payload:")
            print(json.dumps(error_data, indent=2))
            
            code = error_data.get('code')
            if code == 21608:
                print("\nDIAGNOSIS: Trial account restriction. You can only send messages to verified phone numbers.")
            elif code == 20003:
                print("\nDIAGNOSIS: Unauthorized. Your Twilio Account SID or Auth Token is incorrect.")
        except Exception:
            pass
    except Exception as e:
        print(f"\n[UNEXPECTED ERROR] {e}")
        traceback.print_exc()

if __name__ == '__main__':
    main()
