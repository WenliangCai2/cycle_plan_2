"""
Review Routes
===========
This module defines the API routes for review-related operations
on cycling routes, including creating, retrieving, and deleting reviews.

Features:
- Create reviews with ratings for routes
- Retrieve reviews with pagination
- Delete reviews with proper authorization

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
from flask import Blueprint
from controllers.review_controller import create_review, get_reviews, delete_review

# Create blueprint
review_bp = Blueprint('review_bp', __name__, url_prefix='/api/reviews')

# Routes
review_bp.route('/routes/<route_id>', methods=['POST'])(create_review)
review_bp.route('/routes/<route_id>', methods=['GET'])(get_reviews)
review_bp.route('/routes/<route_id>/<review_id>', methods=['DELETE'])(delete_review)