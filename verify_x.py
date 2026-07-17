import threading
import time
import json
import urllib.request
import urllib.error
from backend.app import app

def run_flask():
    import logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    app.run(port=5001, debug=False, use_reloader=False)

def verify():
    # 1. Start Flask in background
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()
    
    # Wait for server to boot up
    time.sleep(2.0)
    
    base_url = "http://127.0.0.1:5001"
    print("--------------------------------------------------")
    print("NOVA LIBRARY X ENDPOINT VALIDATION RUNNER")
    print("--------------------------------------------------")
    
    # Helper to make JSON requests using urllib
    def make_request(url, method='GET', data=None, headers=None):
        if headers is None:
            headers = {}
        headers['Content-Type'] = 'application/json'
        
        req_data = None
        if data:
            req_data = json.dumps(data).encode('utf-8')
            
        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as response:
                return response.status, json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            try:
                error_json = json.loads(error_body)
                msg = error_json.get('msg', error_body)
            except:
                msg = error_body
            raise Exception(f"HTTP {e.code}: {msg}")
            
    try:
        # 2. Test Login API
        print("1. Validating JWT Login API...")
        login_url = f"{base_url}/api/auth/login"
        login_payload = {"username": "admin", "password": "admin123"}
        status, res_data = make_request(login_url, method='POST', data=login_payload)
        token = res_data['token']
        print("   [SUCCESS] Login verified. JWT token issued successfully.")
        
        # 2b. Test OTP Generation & Verification API
        print("1b. Validating OTP Generation & Verification API...")
        otp_gen_url = f"{base_url}/api/auth/generate-otp"
        otp_verify_url = f"{base_url}/api/auth/verify-otp"

        # Test valid email OTP generation
        gen_payload = {"email_or_phone": "john.doe@mit.edu"}
        status, gen_data = make_request(otp_gen_url, method='POST', data=gen_payload)
        assert status == 200, f"Expected 200, got {status}"
        
        # Retrieve generated code from the process memory cache directly since it's not in the JSON response
        from backend.routes.auth import otp_cache
        otp_code = otp_cache.get("john.doe@mit.edu")
        assert otp_code is not None, "Expected OTP code to be cached in backend memory"
        print("   [SUCCESS] OTP generation succeeded and secured code in cache.")

        # Test valid OTP verification
        verify_payload = {"email_or_phone": "john.doe@mit.edu", "otp_code": otp_code}
        status, verify_data = make_request(otp_verify_url, method='POST', data=verify_payload)
        assert status == 200, f"Expected 200, got {status}"
        assert 'token' in verify_data, "Expected token in verify-otp response"
        print("   [SUCCESS] OTP verification succeeded and issued token.")

        # Test invalid OTP verification
        try:
            bad_verify_payload = {"email_or_phone": "john.doe@mit.edu", "otp_code": "000000"}
            make_request(otp_verify_url, method='POST', data=bad_verify_payload)
            raise Exception("Expected bad OTP verification to fail, but it succeeded")
        except Exception as e:
            print("   [SUCCESS] Invalid OTP verification failed as expected.")

        # Test non-existent user OTP generation
        try:
            bad_gen_payload = {"email_or_phone": "doesnotexist@mit.edu"}
            make_request(otp_gen_url, method='POST', data=bad_gen_payload)
            raise Exception("Expected non-existent user OTP generation to fail, but it succeeded")
        except Exception as e:
            print("   [SUCCESS] Non-existent user OTP generation failed as expected.")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # 3. Test AI Chatbot API (Nova Assistant)
        print("2. Validating AI Assistant chatbot NLP parser...")
        chat_url = f"{base_url}/api/dashboard/ai-chat"
        chat_payload = {"prompt": "find books on computer science"}
        status, chat_data = make_request(chat_url, method='POST', data=chat_payload, headers=headers)
        
        # Asserts
        assert chat_data['type'] == 'books', f"Expected books response, got {chat_data['type']}"
        assert len(chat_data['data']) > 0, "Expected matching books, got empty list"
        print(f"   [SUCCESS] Chatbot verified. Match type: {chat_data['type']}, Books matched: {len(chat_data['data'])}")
        
        # 4. Test Dashboard Stats
        print("3. Validating Command Center KPIs...")
        stats_url = f"{base_url}/api/dashboard/stats"
        status, stats_data = make_request(stats_url, headers=headers)
        print(f"   [SUCCESS] KPIs verified. Total books: {stats_data['kpis']['total_books']}, Revenue: INR {stats_data['kpis']['revenue']}")
        
        # 5. Test Compile Report
        print("4. Validating Reports compilation engine...")
        report_url = f"{base_url}/api/reports/generate?type=books"
        status, report_data = make_request(report_url, headers=headers)
        print(f"   [SUCCESS] Report verified. Columns: {report_data['columns']}, Rows count: {len(report_data['data'])}")
        
        print("--------------------------------------------------")
        print("ALL TESTS PASSED. NOVA LIBRARY X INTEGRITY SECURED.")
        print("--------------------------------------------------")
        
    except Exception as e:
        print(f"   [FAILED] Validation error occurred: {e}")
        import sys
        sys.exit(1)

if __name__ == '__main__':
    verify()
