"""
POI (Points of Interest) Controller
=================================
This module handles operations related to points of interest near cycling routes.
It integrates with the HERE Places API to find relevant POIs along routes.

Features:
- Retrieving available POI categories
- Finding POIs near a cycling route based on categories and radius
- Supporting route-based POI discovery

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
from flask import jsonify, request
from models.poi import POI
from controllers.auth_controller import verify_session

def get_poi_categories():
    """
    Get available POI categories from HERE Places API
    
    Retrieves the list of supported POI categories that can be used
    for filtering POI searches.
    
    Returns:
        JSON response with list of supported POI categories
    """
    categories = POI.get_poi_categories()
    
    return jsonify({
        'success': True,
        'categories': categories
    })

def get_pois_near_route():
    """
    Get POIs near a cycling route
    
    Finds points of interest along a specified route based on:
    - Route coordinates (sequence of points)
    - POI categories of interest
    - Search radius from the route
    
    Authentication is optional but encouraged for caching purposes.
    
    Expected request JSON body:
    {
        "route": [[lng1, lat1], [lng2, lat2], ...],
        "categories": ["category1", "category2", ...],
        "radius": 500  // optional, default is 500 meters
    }
    
    Returns:
        JSON response with POIs found along the route
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