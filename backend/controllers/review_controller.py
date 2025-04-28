"""
Review controller
"""
from flask import jsonify, request
from models.review import Review
from models.route import Route
from controllers.auth_controller import verify_session

def create_review(route_id):
    """Create or update comment"""
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
    
    # Get data of comment
    data = request.get_json()
    if not data or 'content' not in data or 'rating' not in data:
        return jsonify({
            'success': False,
            'message': 'Missing content or rating'
        }), 400
    
    # Create comment
    review = Review.create_review(
        route_id=route_id,
        user_id=user_id,
        content=data['content'],
        rating=data['rating']
    )
    
    if not review:
        return jsonify({
            'success': False,
            'message': 'Failed to create review'
        }), 500
    
    return jsonify({
        'success': True,
        'message': 'Review created successfully',
        'review': review.to_dict()
    })

def get_reviews(route_id):
    """Get all comments of the route"""
    # Check if the route exists
    route = Route.get_route_by_id(route_id)
    if not route:
        return jsonify({
            'success': False,
            'message': 'Route not found'
        }), 404
    
    # If it is not a public route, authentication is required
    if not route.is_public:
        user_id = verify_session(request)
        if not user_id or user_id != route.user_id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized to view reviews for this route'
            }), 403
    
    # Get the paging parameters
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    skip = (page - 1) * limit
    
    # Get comments
    reviews = Review.get_reviews_by_route_id(route_id, limit=limit, skip=skip)
    review_dicts = [review.to_dict() for review in reviews]
    
    return jsonify({
        'success': True,
        'reviews': review_dicts,
        'avg_rating': route.avg_rating,
        'review_count': route.review_count
    })

def delete_review(route_id, review_id):
    """Delete comment"""
    user_id = verify_session(request)
    if not user_id:
        return jsonify({
            'success': False, 
            'message': 'Unauthorized'
        }), 401
    
    # Delete comment
    success = Review.delete_review(review_id, user_id)
    if not success:
        return jsonify({
            'success': False,
            'message': 'Failed to delete review or review not found'
        }), 404
    
    return jsonify({
        'success': True,
        'message': 'Review deleted successfully'
    }) 