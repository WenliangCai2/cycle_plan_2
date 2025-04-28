"""
Review routes
"""
from flask import Blueprint
from controllers.review_controller import create_review, get_reviews, delete_review

# Create blueprint
review_bp = Blueprint('review_bp', __name__, url_prefix='/api/reviews')

# Routes
review_bp.route('/routes/<route_id>', methods=['POST'])(create_review)
review_bp.route('/routes/<route_id>', methods=['GET'])(get_reviews)
review_bp.route('/routes/<route_id>/<review_id>', methods=['DELETE'])(delete_review) 