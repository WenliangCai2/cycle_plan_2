"""
Comment routes
"""
from flask import Blueprint
from controllers.comment_controller import create_comment, get_comments, get_replies, delete_comment

# Create blueprint
comment_bp = Blueprint('comment_bp', __name__, url_prefix='/api/comments')

# Routes
comment_bp.route('/routes/<route_id>', methods=['POST'])(create_comment)
comment_bp.route('/routes/<route_id>', methods=['GET'])(get_comments)
comment_bp.route('/routes/<route_id>/comments/<comment_id>/replies', methods=['GET'])(get_replies)
comment_bp.route('/routes/<route_id>/comments/<comment_id>', methods=['DELETE'])(delete_comment) 