"""
Route Controller
==============
This module handles all route-related operations including creating,
retrieving, deleting, and sharing routes, as well as updating their visibility.

Features:
- Get all routes for an authenticated user
- Create new routes with custom details
- Delete existing routes
- Share routes to social media platforms
- Update route visibility (public/private)
- Retrieve public routes with filtering and pagination
- Get detailed information for a specific route

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
from flask import jsonify, request
from models.route import Route
from controllers.auth_controller import verify_session

def get_routes():
    """
    Get all routes for the authenticated user
    
    Process:
    1. Verifies user authentication
    2. Retrieves all routes for the user
    3. Converts route objects to dictionaries
    
    Returns:
        JSON response with all user routes or error message
    """
    user_id = verify_session(request)
    if not user_id:
        return jsonify({
            'success': False, 
            'message': 'Unauthorized'
        }), 401
    
    # Get all routes for a user
    routes = Route.get_routes_by_user_id(user_id)
    
    # Convert to dictionary list
    route_dicts = [route.to_dict() for route in routes]
    
    return jsonify({
        'success': True,
        'routes': route_dicts
    })

def create_route():
    """
    Create a new cycling route
    
    Process:
    1. Verifies user authentication
    2. Validates required route data
    3. Creates a new route in the database
    
    Returns:
        JSON response with the created route or error message
    """
    user_id = verify_session(request)
    if not user_id:
        return jsonify({
            'success': False, 
            'message': 'Unauthorized'
        }), 401
    
    data = request.get_json()
    route_data = data.get('route')
    
    if not route_data or 'name' not in route_data or 'locations' not in route_data:
        return jsonify({
            'success': False,
            'message': 'Invalid route data'
        }), 400
    
    # Create a new route
    route = Route.create_route(
        name=route_data['name'],
        locations=route_data['locations'],
        user_id=user_id,
        is_public=route_data.get('is_public', False),
        image_url=route_data.get('image_url')
    )
    
    if not route:
        return jsonify({
            'success': False,
            'message': 'Failed to create route'
        }), 500
    
    return jsonify({
        'success': True,
        'message': 'Route created successfully',
        'route': route.to_dict()
    })

def delete_route(route_id):
    """
    Delete a specific route
    
    Process:
    1. Verifies user authentication
    2. Deletes the specified route if owned by the user
    
    Args:
        route_id: Unique identifier for the route to be deleted
    
    Returns:
        JSON response with deletion status or error message
    """
    user_id = verify_session(request)
    if not user_id:
        return jsonify({
            'success': False, 
            'message': 'Unauthorized'
        }), 401

    success = Route.delete_route(route_id, user_id)
    
    if not success:
        return jsonify({
            'success': False,
            'message': 'Failed to delete route'
        }), 404
    
    return jsonify({
        'success': True,
        'message': 'Route deleted successfully',
    })

def share_route(route_id):
    """
    Share route to social media platforms
    
    Process:
    1. Verifies user authentication
    2. Validates route exists
    3. Increments route's share count
    4. Generates sharing links for various platforms
    
    Args:
        route_id: Unique identifier for the route to be shared
    
    Returns:
        JSON response with sharing URLs or error message
    """
    user_id = verify_session(request)
    if not user_id:
        return jsonify({
            'success': False, 
            'message': 'Unauthorized'
        }), 401
    
    route = Route.get_route_by_id(route_id)
    if not route:
        return jsonify({
            'success': False,
            'message': 'Route not found'
        }), 404
    
    # Update sharing count
    success = Route.update_share_count(route_id)
    if not success:
        return jsonify({
            'success': False,
            'message': 'Failed to update share count'
        }), 500
    
    # Get sharing link
    frontend_url = "http://localhost:3000"
    share_url = f"{frontend_url}/routes/{route_id}"
    
    return jsonify({
        'success': True,
        'message': 'Route shared successfully',
        'share_url': share_url,
        'social_links': {
            'facebook': f"https://www.facebook.com/sharer/sharer.php?u={share_url}",
            'twitter': f"https://twitter.com/intent/tweet?url={share_url}&text=Check out this cycling route!",
            'whatsapp': f"https://api.whatsapp.com/send?text=Check out this cycling route! {share_url}"
        }
    })

def update_route_visibility(route_id):
    """
    Update route visibility (public or private)
    
    Process:
    1. Verifies user authentication
    2. Validates required visibility parameter
    3. Updates route visibility in database
    
    Args:
        route_id: Unique identifier for the route to update
    
    Returns:
        JSON response with update status or error message
    """
    user_id = verify_session(request)
    if not user_id:
        return jsonify({
            'success': False, 
            'message': 'Unauthorized'
        }), 401
    
    data = request.get_json()
    is_public = data.get('is_public')
    
    if is_public is None:
        return jsonify({
            'success': False,
            'message': 'Missing is_public parameter'
        }), 400
    
    success = Route.update_route_visibility(route_id, user_id, is_public)
    if not success:
        return jsonify({
            'success': False,
            'message': 'Failed to update route visibility'
        }), 500
    
    return jsonify({
        'success': True,
        'message': 'Route visibility updated successfully'
    })

def get_public_routes():
    """
    Get all publicly shared routes with pagination and sorting
    
    Process:
    1. Extracts pagination and sorting parameters
    2. Retrieves public routes from database
    3. Returns formatted route list with pagination info
    
    Returns:
        JSON response with public routes and total count
    """
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    sort_by = request.args.get('sort_by', 'vote_score')
    sort_order = request.args.get('sort_order', 'desc')
    skip = (page - 1) * limit
    
    routes = Route.get_public_routes(limit=limit, skip=skip, sort_by=sort_by, sort_order=sort_order)
    total = Route.count_public_routes()
    route_dicts = [route.to_dict() for route in routes]
    
    return jsonify({
        'success': True,
        'routes': route_dicts,
        'total': total
    })

def get_route_by_id(route_id):
    """
    Get detailed information for a specific route
    
    Process:
    1. Retrieves route from database
    2. For private routes, verifies user has permission
    3. Validates and formats route data
    
    Args:
        route_id: Unique identifier for the route to retrieve
    
    Returns:
        JSON response with route details or error message
    """
    route = Route.get_route_by_id(route_id)
    
    if not route:
        return jsonify({
            'success': False,
            'message': 'Route not found'
        }), 404
    
    # If it is not a public route, the user needs to be verified
    if not route.is_public:
        user_id = verify_session(request)
        if not user_id or user_id != route.user_id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized to view this route'
            }), 403
    
    # Make sure the route data is in the correct format
    route_dict = route.to_dict()
    
    # Check the locations field
    if 'locations' not in route_dict or route_dict['locations'] is None:
        route_dict['locations'] = []
    elif not isinstance(route_dict['locations'], list):
        # If it is not a list type, try converting or setting it to an empty list
        try:
            if isinstance(route_dict['locations'], str):
                import json
                route_dict['locations'] = json.loads(route_dict['locations'])
            else:
                route_dict['locations'] = []
        except:
            route_dict['locations'] = []
    
    return jsonify({
        'success': True,
        'route': route_dict
    })