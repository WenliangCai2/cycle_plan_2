"""
User routes - defines API endpoints for user-related functionality
"""
from flask import Blueprint
from controllers.user_controller import get_user_by_id, get_current_user_profile

# Create blueprint
user_bp = Blueprint('user_bp', __name__, url_prefix='/api/users')

# Routes
user_bp.route('/<user_id>', methods=['GET'])(get_user_by_id)
user_bp.route('/profile', methods=['GET'])(get_current_user_profile) 