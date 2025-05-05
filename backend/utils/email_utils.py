import random
import time
import requests
import os
from dotenv import load_dotenv
load_dotenv()

verification_cache = {}

BREVO_API_KEY = os.environ.get('BREVO_API_KEY')
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
SENDER_EMAIL = "siyiguo00@gmail.com"

def generate_code():
    return str(random.randint(100000, 999999))

def send_verification_email(email, code):
    headers = {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "sender": { "name": "Cycle Route", "email": SENDER_EMAIL },
        "to": [ { "email": email } ],
        "subject": "Your Verification Code",
        "htmlContent": f"""
            <html>
              <body>
                <p>Hello,</p>
                <p>Your verification code is:</p>
                <h2>{code}</h2>
                <p>This code will expire in 5 minutes.</p>
              </body>
            </html>
        """
    }

    response = requests.post(BREVO_API_URL, json=payload, headers=headers)
    return response.status_code == 201

def cache_code(email, code):
    verification_cache[email] = (code, time.time())

def get_cached_code(email):
    entry = verification_cache.get(email)
    if entry:
        code, ts = entry
        if time.time() - ts < 300:
            return code
    return None
