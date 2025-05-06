"""
Vote Routes
=========
This module defines the API routes for voting functionality,
allowing users to upvote or downvote cycling routes and retrieve
vote statistics.

Features:
- Create, update, or remove votes
- Get vote statistics for routes
- Initialize database connection for vote controller

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
from flask import Blueprint
from controllers.vote_controller import create_or_update_vote, get_route_votes

# Create blueprint
vote_bp = Blueprint('vote_bp', __name__, url_prefix='/api/votes')

# Initialize global variables
db = None

def init_routes(database):
    """
    Initialize routes with database connection
    
    Process:
    1. Sets global database variable
    2. Passes database connection to vote controller
    
    Args:
        database: MongoDB database connection
    """
    global db
    db = database
    
    # Pass database to controller modules
    import controllers.vote_controller as vote_controller
    vote_controller.db = database

# Routes
vote_bp.route('/routes/<route_id>', methods=['POST'])(create_or_update_vote)
vote_bp.route('/routes/<route_id>', methods=['GET'])(get_route_votes)