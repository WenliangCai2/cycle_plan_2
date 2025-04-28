"""
Custom point controller
"""
from flask import jsonify, request
from models.custom_point import CustomPoint
from controllers.auth_controller import verify_session

def get_custom_points():
    """Get all custom points for a user"""
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
    """Create a new custom point"""
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
    """delete a custom point"""
    user_id = verify_session(request)
    if not user_id:
        return jsonify({
            'success': False, 
            'message': 'not registered user'
        }), 401

    success = CustomPoint.delete_point(point_id, user_id)
    
    if not success:
        return jsonify({
            'success': False,
            'message': 'fail to delete point'
        }), 404
    
    return jsonify({
        'success': True,
        'message': 'success to delete point',
    }) 