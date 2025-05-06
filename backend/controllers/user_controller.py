"""
User Controller
=============
This module handles all user-related operations including retrieving
user profiles by ID and accessing current user information.

Features:
- Retrieve basic public user information by ID
- Get current authenticated user's profile information

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
from flask import jsonify, request
from models.user import User
from controllers.auth_controller import verify_session

def get_user_by_id(user_id):
    """
    Get basic user information by user ID
    
    Process:
    1. Retrieves user from database by ID
    2. Returns only non-sensitive user information
    
    Args:
        user_id: Unique identifier for the user to retrieve
    
    Returns:
        JSON response with basic user information or error message
    """
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
    """
    Get profile information for the currently authenticated user
    
    Process:
    1. Verifies user authentication
    2. Retrieves user from database
    3. Returns profile information
    
    Returns:
        JSON response with user profile or error message
    """
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