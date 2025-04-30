"""
User controller
"""
from flask import jsonify, request
from models.user import User
from controllers.auth_controller import verify_session

def get_user_by_id(user_id):
    """Get user details by ID"""
    user = User.get_user_by_id(user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    # Only return basic, non-sensitive user information
    return jsonify({
        'success': True,
        'username': user.username,
        'user_id': user.user_id,
        'created_at': user.created_at
    })

def get_current_user_profile():
    """Get current user profile"""
    user_id = verify_session(request)
    if not user_id:
        return jsonify({
            'success': False, 
            'message': 'Unauthorized'
        }), 401
    
    user = User.get_user_by_id(user_id)
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404
    
    # Return user profile information
    return jsonify({
        'success': True,
        'username': user.username,
        'user_id': user.user_id,
        'created_at': user.created_at
    }) 