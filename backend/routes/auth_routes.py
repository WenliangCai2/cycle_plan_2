"""
Authentication Routes
=================
This module defines the API routes for authentication-related operations
including user registration, login, logout, and password management.

Features:
- User registration endpoint
- Login and logout endpoints
- Password reset functionality
- Email verification endpoints

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
from flask import Blueprint
from controllers.auth_controller import register, login, logout, reset_password, send_verification_code, verify_code

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api')

# Register route
auth_bp.route('/register', methods=['POST'])(register)

# Login route
auth_bp.route('/login', methods=['POST'])(login)

# Logout route
auth_bp.route('/logout', methods=['POST'])(logout)

# Reset_password route
auth_bp.route('/reset_password', methods=['POST'])(reset_password)

# Send verification code route
auth_bp.route('/send_verification_code', methods=['POST'])(send_verification_code)

# Verify code route
auth_bp.route('/verify_code', methods=['POST'])(verify_code)