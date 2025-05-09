"""
Authentication Controller
=======================
This module handles user authentication operations including registration,
login, session management, password management, and email verification.

Features:
- User registration with email verification
- User login and session management
- Password reset functionality
- Email verification system
- Session validation

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
import uuid
from flask import jsonify, request
from models.user import User

from utils.email_utils import generate_code, send_verification_email, cache_code, get_cached_code

# Dictionary to store user sessions
# Maps session tokens to user IDs for authentication
USER_SESSIONS = {}

def register():
    """
    Handle user registration with email verification
    
    Process:
    1. Validates all required fields
    2. Verifies email verification code
    3. Checks username availability
    4. Validates password requirements
    5. Creates new user account
    6. Creates a user session
    
    Returns:
        JSON response with registration status and session token
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    code = data.get('code')  # Verification code entered by user

    # Check field completeness
    if not username or not password or not email or not code:
        return jsonify({
            'success': False,
            'message': 'Username, password, email and code are required'
        }), 400

    # Verify verification code
    cached_code = get_cached_code(email)
    if not cached_code or cached_code != code:
        return jsonify({
            'success': False,
            'message': 'Invalid or expired verification code'
        }), 401

    # Check if username already exists
    existing_user = User.get_user_by_username(username)
    if existing_user:
        return jsonify({
            'success': False,
            'message': 'Username already exists'
        }), 400

    # Check password length
    if len(password) < 8:
        return jsonify({
            'success': False,
            'message': 'Password must be at least 8 characters long'
        }), 400

    # Create user
    user = User.create_user(username, password, email=email)  # Should support storing email
    if not user:
        return jsonify({
            'success': False,
            'message': 'Registration failed'
        }), 500

    # Successful login: create session
    token = str(uuid.uuid4())
    USER_SESSIONS[token] = user.user_id

    return jsonify({
        'success': True,
        'message': 'Registration successful',
        'token': token,
        'userId': user.user_id
    })


def login():
    """
    Handle user login and session creation
    
    Process:
    1. Validates username exists
    2. Verifies password
    3. Creates session token
    
    Returns:
        JSON response with login status and session token
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # Find user
    user = User.get_user_by_username(username)
    if not user:
        return jsonify({
            'success': False,
            'message': 'User does not exist'
        }), 401
    
    # Verify password
    if not user.verify_password(password):
        return jsonify({
            'success': False,
            'message': 'Incorrect password'
        }), 401
    
    # Generate token
    token = str(uuid.uuid4())
    USER_SESSIONS[token] = user.user_id
    
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'token': token,
        'userId': user.user_id
    })

def verify_session(request):
    """
    Verify user session token from request headers
    
    This function is used across the application to validate
    user authentication for protected routes
    
    Args:
        request: Flask request object containing Authorization header
        
    Returns:
        user_id (str): User ID if session is valid, None otherwise
    """
    token = request.headers.get('Authorization')
    if not token or token not in USER_SESSIONS:
        return None
    
    user_id = USER_SESSIONS[token]
    user = User.get_user_by_id(user_id)
    return user_id if user else None

def reset_password():
    """
    Handle password reset with email verification
    
    Process:
    1. Validates required fields
    2. Checks password requirements
    3. Verifies email verification code
    4. Updates password
    
    Returns:
        JSON response with password reset status
    """
    data = request.get_json()
    username = data.get('username')
    new_password = data.get('new_password')
    email = data.get('email')
    code = data.get('code')

    if not username or not new_password or not email or not code:
        return jsonify({
            'success': False,
            'message': 'Missing required fields'
        }), 400

    if len(new_password) < 8:
        return jsonify({
            'success': False,
            'message': 'Password must be at least 8 characters long'
        }), 400

    # Verify verification code
    cached_code = get_cached_code(email)
    if not cached_code or cached_code != code:
        return jsonify({
            'success': False,
            'message': 'Invalid or expired verification code'
        }), 401

    user = User.get_user_by_username(username)
    if not user:
        return jsonify({
            'success': False,
            'message': 'User does not exist'
        }), 404

    # Change password
    success = user.update_password(new_password)
    if not success:
        return jsonify({
            'success': False,
            'message': 'Password update failed'
        }), 500

    return jsonify({
        'success': True,
        'message': 'Password reset successfully',
    })



def logout():
    """
    Handle user logout by invalidating session token
    
    Process:
    1. Retrieves session token from request
    2. Removes token from active sessions
    
    Returns:
        JSON response with logout status
    """
    token = request.headers.get('Authorization')
    if token and token in USER_SESSIONS:
        del USER_SESSIONS[token]
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        })
    return jsonify({
        'success': False,
        'message': 'Not logged in or session expired'
    }), 401


def send_verification_code():
    """
    Send verification code to user's email
    
    Process:
    1. Validates email
    2. Prevents code request abuse
    3. Generates and sends verification code
    4. Caches code for later verification
    
    Returns:
        JSON response with code sending status
    """
    data = request.get_json()
    email = data.get('email')
    purpose = data.get('purpose', 'register')

    if not email:
        return jsonify({
            'success': False,
            'message': 'Email is required'
        }), 400

    # Avoid resending code too frequently
    existing_code = get_cached_code(email)
    if existing_code:
        return jsonify({
            'success': False,
            'message': 'Please wait before requesting another code'
        }), 429

    code = generate_code()
    email_sent = send_verification_email(email, code)

    if email_sent:
        cache_code(email, code)
        return jsonify({
            'success': True,
            'message': 'Verification code sent'
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Failed to send verification email'
        }), 500


def verify_code():
    """
    Verify email verification code entered by user
    
    Process:
    1. Validates required fields
    2. Checks if code exists in cache
    3. Compares entered code with cached code
    
    Returns:
        JSON response with verification status
    """
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')

    if not email or not code:
        return jsonify({
            'success': False,
            'message': 'Email and code are required'
        }), 400

    cached = get_cached_code(email)
    if cached is None:
        return jsonify({
            'success': False,
            'message': 'Verification code expired or not sent'
        }), 400

    if code == cached:
        return jsonify({
            'success': True,
            'message': 'Verification successful'
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Incorrect verification code'
        }), 401