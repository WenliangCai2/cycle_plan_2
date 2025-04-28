"""
Vote routes - defines API endpoints for voting functionality
"""
from flask import Blueprint
from controllers.vote_controller import create_or_update_vote, get_route_votes

# Create blueprint
vote_bp = Blueprint('vote_bp', __name__, url_prefix='/api/votes')

# Initialize global variables
db = None

def init_routes(database):
    """Initialize routes with database"""
    global db
    db = database
    
    # Pass database to controller modules
    import controllers.vote_controller as vote_controller
    vote_controller.db = database

# Routes
vote_bp.route('/routes/<route_id>', methods=['POST'])(create_or_update_vote)
vote_bp.route('/routes/<route_id>', methods=['GET'])(get_route_votes)