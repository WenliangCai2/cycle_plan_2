"""
Authentication controller
"""
import uuid
from flask import jsonify, request
from models.user import User

from utils.email_utils import generate_code, send_verification_email, cache_code, get_cached_code

# Dictionary to store user sessions
USER_SESSIONS = {}

def register():
    """User registration with email verification"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    code = data.get('code')  # 用户输入的验证码

    # 检查字段完整性
    if not username or not password or not email or not code:
        return jsonify({
            'success': False,
            'message': 'Username, password, email and code are required'
        }), 400

    # 验证码验证
    cached_code = get_cached_code(email)
    if not cached_code or cached_code != code:
        return jsonify({
            'success': False,
            'message': 'Invalid or expired verification code'
        }), 401

    # 检查用户名是否已存在
    existing_user = User.get_user_by_username(username)
    if existing_user:
        return jsonify({
            'success': False,
            'message': 'Username already exists'
        }), 400

    # 检查密码长度
    if len(password) < 8:
        return jsonify({
            'success': False,
            'message': 'Password must be at least 8 characters long'
        }), 400

    # 创建用户
    user = User.create_user(username, password, email=email)  # 需支持存邮箱
    if not user:
        return jsonify({
            'success': False,
            'message': 'Registration failed'
        }), 500

    # 登录成功：创建 session
    token = str(uuid.uuid4())
    USER_SESSIONS[token] = user.user_id

    return jsonify({
        'success': True,
        'message': 'Registration successful',
        'token': token,
        'userId': user.user_id
    })


def login():
    """User login"""
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
    """Verify user session"""
    token = request.headers.get('Authorization')
    if not token or token not in USER_SESSIONS:
        return None
    
    user_id = USER_SESSIONS[token]
    user = User.get_user_by_id(user_id)
    return user_id if user else None

def reset_password():
    """Reset user password with email verification"""
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

    # 验证码验证
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

    # 修改密码
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
    """User logout"""
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
    """Send verification code via email"""
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
    """Verify email verification code"""
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
