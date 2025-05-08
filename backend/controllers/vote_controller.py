"""
Vote Controller
=============
This module handles all vote-related operations including creating,
updating, and retrieving votes for routes. It manages the upvoting and
downvoting system for public routes in the cycling application.

Features:
- Create or update votes for public routes
- Toggle between upvote, downvote, and no vote
- Retrieve vote statistics for routes
- Track user's vote status for routes

Author: Zhuoyi Zhang
Contributors: [Contributors Names]
Last Modified: 07/05/2025
"""
from flask import jsonify, request
from models.vote import Vote
from models.route import Route
from controllers.auth_controller import verify_session

# This variable will be set by the init_routes function in vote_routes.py
db = None

def create_or_update_vote(route_id):
    """
    Create, update, or remove a vote for a route
    
    Process:
    1. Verifies user authentication
    2. Validates route exists and is public
    3. Processes vote action (add, update, or remove)
    4. Returns updated vote statistics
    
    Args:
        route_id: Unique identifier for the route to vote on
    
    Returns:
        JSON response with vote status and updated statistics or error message
    """
    user_id = verify_session(request)
    if not user_id:
        return jsonify({
            'success': False, 
            'message': 'Unauthorized'
        }), 401
    
    # Check if the route exists
    route = Route.get_route_by_id(route_id)
    if not route:
        return jsonify({
            'success': False,
            'message': 'Route not found'
        }), 404
    
    # Check if the route is public
    if not route.is_public:
        return jsonify({
            'success': False,
            'message': 'Cannot vote on a private route'
        }), 403
    
    # Get vote data
    data = request.get_json()
    if not data or 'vote_type' not in data:
        return jsonify({
            'success': False,
            'message': 'Missing vote_type'
        }), 400
    
    print(f"Vote request: route_id={route_id}, user_id={user_id}, vote_type={data['vote_type']}")
    
    # Create or update vote
    vote = Vote.create_or_update_vote(
        route_id=route_id,
        user_id=user_id,
        vote_type=data['vote_type']
    )
    
    # Ensure vote counts are updated and fetch the latest vote data directly from the database
    route_doc = db.routes.find_one({'route_id': route_id})
    if route_doc:
        upvotes = route_doc.get('upvotes', 0)
        downvotes = route_doc.get('downvotes', 0)
        vote_score = route_doc.get('vote_score', 0)
    else:
        upvotes = 0
        downvotes = 0
        vote_score = 0
    
    # If vote is None, the vote has been removed (toggled)
    if vote is None:
        print("Vote was removed")
        return jsonify({
            'success': True,
            'message': 'Vote removed successfully',
            'vote_removed': True,
            'upvotes': upvotes,
            'downvotes': downvotes,
            'vote_score': vote_score,
            'user_vote': None
        })
    
    print(f"Vote was successful: type={vote.vote_type}")
    print(f"Database route data: upvotes={upvotes}, downvotes={downvotes}, vote_score={vote_score}")
    
    return jsonify({
        'success': True,
        'message': 'Vote created successfully',
        'vote': vote.to_dict(),
        'upvotes': upvotes,
        'downvotes': downvotes,
        'vote_score': vote_score,
        'user_vote': vote.vote_type
    })

def get_route_votes(route_id):
    """
    Get vote statistics for a specific route
    
    Process:
    1. Validates route exists and is public
    2. Retrieves current vote statistics
    3. Includes the user's own vote if authenticated
    
    Args:
        route_id: Unique identifier for the route
    
    Returns:
        JSON response with vote statistics or error message
    """
    # Check if the route exists
    route = Route.get_route_by_id(route_id)
    if not route:
        return jsonify({
            'success': False,
            'message': 'Route not found'
        }), 404
    
    # If it is not a public route, the route should not have public votes
    if not route.is_public:
        return jsonify({
            'success': False,
            'message': 'Cannot view votes for a private route'
        }), 403
    
    # Get the latest voting data directly from the database
    route_doc = db.routes.find_one({'route_id': route_id})
    if route_doc:
        upvotes = route_doc.get('upvotes', 0)
        downvotes = route_doc.get('downvotes', 0)
        vote_score = route_doc.get('vote_score', 0)
    else:
        upvotes = 0
        downvotes = 0
        vote_score = 0
    
    # Get user's vote if authenticated
    user_id = verify_session(request)
    user_vote = None
    
    if user_id:
        user_vote_obj = Vote.get_user_vote(route_id, user_id)
        if user_vote_obj:
            user_vote = user_vote_obj.vote_type
    
    return jsonify({
        'success': True,
        'upvotes': upvotes,
        'downvotes': downvotes,
        'vote_score': vote_score,
        'user_vote': user_vote
    })