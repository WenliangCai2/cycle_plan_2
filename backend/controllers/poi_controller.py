"""
POI controller for handling Points of Interest
"""
from flask import jsonify, request
from models.poi import POI
from controllers.auth_controller import verify_session

def get_poi_categories():
    """
    Get available POI categories from HERE Places API
    
    Returns:
        JSON response with POI categories
    """
    categories = POI.get_poi_categories()
    
    return jsonify({
        'success': True,
        'categories': categories
    })

def get_pois_near_route():
    """
    Get POIs near a cycling route
    
    Expects:
        JSON object with:
        - route: list of coordinates along the route
        - categories: list of POI categories to search for
        - radius: search radius in meters (optional, default 500)
    
    Returns:
        JSON response with POIs
    """
    # User authentication is optional, but recommended for caching
    user_id = verify_session(request)
    
    # Get request data
    data = request.get_json()
    if not data or 'route' not in data or 'categories' not in data:
        return jsonify({
            'success': False,
            'message': 'Missing route or categories'
        }), 400
    
    route_coordinates = data.get('route')
    categories = data.get('categories', [])
    radius = data.get('radius', 500)
    
    # Validate route coordinates
    if not route_coordinates or len(route_coordinates) < 2:
        return jsonify({
            'success': False,
            'message': 'Route must have at least 2 points'
        }), 400
    
    # Get POIs near route
    pois = POI.get_pois_near_route(route_coordinates, categories, radius)
    
    return jsonify({
        'success': True,
        'pois': pois
    })