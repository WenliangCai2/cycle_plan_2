"""
Authentication related routes
"""
from flask import Blueprint
from controllers.auth_controller import register, login, logout, reset_password

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