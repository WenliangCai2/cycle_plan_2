"""
Email Utilities
=============
This module provides utility functions for email verification,
including generating verification codes, sending emails via Brevo API,
and managing code cache for verification.

Features:
- Generate random verification codes
- Send verification emails using Brevo API
- Cache verification codes with expiration
- Retrieve and validate cached codes

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
import random
import time
import requests
import os
from dotenv import load_dotenv

# Load environment variables only once
load_dotenv()

# Dictionary to store verification codes with timestamps
verification_cache = {}

# API credentials from environment variables
BREVO_API_KEY = os.environ.get('BREVO_API_KEY')
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
SENDER_EMAIL = "siyiguo00@gmail.com"

def generate_code():
    """
    Generate a random 6-digit verification code
    
    Returns:
        String containing a random 6-digit code
    """
    return str(random.randint(100000, 999999))

def send_verification_email(email, code):
    """
    Send verification email with code using Brevo API
    
    Process:
    1. Prepares API headers and payload with email content
    2. Sends request to Brevo API
    3. Returns success/failure status
    
    Args:
        email: Recipient email address
        code: Verification code to include in email
        
    Returns:
        Boolean indicating if email was sent successfully
    """
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
    """
    Store verification code in cache with timestamp
    
    Args:
        email: Email address as cache key
        code: Verification code to cache
    """
    verification_cache[email] = (code, time.time())

def get_cached_code(email):
    """
    Retrieve verification code from cache if not expired
    
    Process:
    1. Checks if email exists in cache
    2. Verifies if code is still valid (less than 5 minutes old)
    3. Returns code if valid, None otherwise
    
    Args:
        email: Email address to look up
        
    Returns:
        Verification code if valid, None if expired or not found
    """
    entry = verification_cache.get(email)
    if entry:
        code, ts = entry
        if time.time() - ts < 300:  # 5 minutes expiration
            return code
    return None