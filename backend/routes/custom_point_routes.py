"""
Custom Point Routes
===============
This module defines the API routes for custom point operations,
allowing users to create, retrieve, and delete custom points on cycling routes.

Features:
- Get all custom points for a user
- Create new custom points
- Delete custom points with proper authorization

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
from flask import Blueprint
from controllers.custom_point_controller import get_custom_points, create_custom_point, delete_custom_point

# Create blueprint
custom_point_bp = Blueprint('custom_points', __name__, url_prefix='/api')

# Get all custom points for a user
custom_point_bp.route('/custom-points', methods=['GET'])(get_custom_points)

# Create a new custom point
custom_point_bp.route('/custom-points', methods=['POST'])(create_custom_point)

# Delete a custom point
custom_point_bp.route('/custom-points/<point_id>', methods=['DELETE'])(delete_custom_point)