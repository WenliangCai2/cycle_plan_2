"""
POI Routes
=========
This module defines the API routes for Points of Interest (POI) operations,
allowing retrieval of POI categories and finding POIs near cycling routes.

Features:
- Get available POI categories for filtering
- Find POIs near a specified route using geographic coordinates

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
from flask import Blueprint
from controllers.poi_controller import get_poi_categories, get_pois_near_route

# Create blueprint
poi_bp = Blueprint('poi', __name__, url_prefix='/api/poi')

# Get POI categories
poi_bp.route('/categories', methods=['GET'])(get_poi_categories)

# Get POIs near route
poi_bp.route('/near-route', methods=['POST'])(get_pois_near_route)