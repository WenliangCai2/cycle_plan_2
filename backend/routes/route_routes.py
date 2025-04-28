"""
Route routes
"""
from flask import Blueprint
from controllers.route_controller import (
    get_routes, create_route, delete_route, 
    share_route, update_route_visibility, 
    get_public_routes, get_route_by_id
)

# Create blueprint
route_bp = Blueprint('route_bp', __name__, url_prefix='/api/routes')

# Routes
route_bp.route('/', methods=['GET'])(get_routes)
route_bp.route('/', methods=['POST'])(create_route)
route_bp.route('/<route_id>', methods=['DELETE'])(delete_route)
route_bp.route('/<route_id>/share', methods=['POST'])(share_route)
route_bp.route('/<route_id>/visibility', methods=['PUT'])(update_route_visibility)
route_bp.route('/public', methods=['GET'])(get_public_routes)
route_bp.route('/<route_id>', methods=['GET'])(get_route_by_id) 