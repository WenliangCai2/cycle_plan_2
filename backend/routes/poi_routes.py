"""
POI related routes
"""
from flask import Blueprint
from controllers.poi_controller import get_poi_categories, get_pois_near_route

# Create blueprint
poi_bp = Blueprint('poi', __name__, url_prefix='/api/poi')

# Get POI categories
poi_bp.route('/categories', methods=['GET'])(get_poi_categories)

# Get POIs near route
poi_bp.route('/near-route', methods=['POST'])(get_pois_near_route)