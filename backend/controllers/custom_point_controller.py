"""
Custom Point Controller
=====================
This module handles operations related to user-defined custom points on maps.
It provides functionality for creating, retrieving, and deleting custom points.

Custom points allow users to save specific locations for later use in routes.

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
from flask import jsonify, request
from models.custom_point import CustomPoint
from controllers.auth_controller import verify_session

def get_custom_points():
    """
    Retrieve all custom points for the authenticated user
    
    Returns all custom points created by the current user,
    with location data and other properties.
    Authentication is required.
    
    Returns:
        JSON response with list of user's custom points
    """
    user_id = verify_session(request)
    if not user_id:
        return jsonify({
            'success': False, 
            'message': 'Unauthorized'
        }), 401
    
    # Get all custom points for a user
    points = CustomPoint.get_points_by_user_id(user_id)
    
    # Convert to dictionary list
    point_dicts = [point.to_dict() for point in points]
    
    return jsonify({
        'success': True,
        'customPoints': point_dicts
    })

def create_custom_point():
    """
    Create a new custom point for the authenticated user
    
    Required point data:
    - name: Display name for the point
    - location: Geographic coordinates (lat/lng)
    
    Authentication is required.
    
    Returns:
        JSON response with creation status and point data
    """
    user_id = verify_session(request)
    if not user_id:
        return jsonify({
            'success': False, 
            'message': 'Unauthorized'
        }), 401
    
    data = request.get_json()
    point_data = data.get('point')
    
    if not point_data or 'name' not in point_data or 'location' not in point_data:
        return jsonify({
            'success': False,
            'message': 'Invalid point data'
        }), 400
    
    # Create a new custom point
    point = CustomPoint.create_point(
        name=point_data['name'],
        location=point_data['location'],
        user_id=user_id
    )
    
    if not point:
        return jsonify({
            'success': False,
            'message': 'fail to create point'
        }), 500
    
    return jsonify({
        'success': True,
        'message': 'success to create point',
        'point': point.to_dict()
    })

def delete_custom_point(point_id):
    """
    Delete a custom point
    
    Users can only delete their own custom points.
    Authentication is required.
    
    Args:
        point_id (str): ID of the custom point to delete
        
    Returns:
        JSON response with deletion status
    """
    user_id = verify_session(request)
    if not user_id:
        return jsonify({
            'success': False, 
            'message': 'not registered user'
        }), 401
    
    # Point usage check removed
    success = CustomPoint.delete_point(point_id, user_id)
    
    if not success:
        return jsonify({
            'success': False,
            'message': 'Failed to delete point. It may not exist or you do not have permission to delete it.'
        }), 404
    
    return jsonify({
        'success': True,
        'message': 'success to delete point',
    })