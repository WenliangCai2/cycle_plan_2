"""
Comment Controller
================
This module handles all comment-related operations for routes in the application.
It provides functionality for creating, retrieving, and deleting comments and replies.

Features:
- Creating comments for routes
- Creating replies to comments
- Retrieving comments with pagination
- Retrieving replies with pagination
- Deleting comments

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
from flask import jsonify, request
from models.comment import Comment
from models.route import Route
from controllers.auth_controller import verify_session

def create_comment(route_id):
    """
    Create a new comment or reply for a route
    
    Handles both top-level comments and replies to existing comments.
    For top-level comments, media URLs can be included.
    For replies, media is not allowed.
    
    Args:
        route_id (str): ID of the route being commented on
        
    Returns:
        JSON response with comment creation status and comment data
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
    
    # Get data of comment
    data = request.get_json()
    if not data or 'content' not in data:
        return jsonify({
            'success': False,
            'message': 'Missing content'
        }), 400
    
    # Get optional fields
    media_urls = data.get('media_urls', [])
    parent_id = data.get('parent_id', None)
    rating = data.get('rating', 5)  # Default rating is 5
    
    # If this is a reply, validate parent exists
    if parent_id:
        parent_comment = Comment.get_comment_by_id(parent_id)
        if not parent_comment:
            return jsonify({
                'success': False,
                'message': 'Parent comment not found'
            }), 404
        
        # For replies, we don't allow media
        if media_urls and len(media_urls) > 0:
            return jsonify({
                'success': False,
                'message': 'Media not allowed in replies'
            }), 400
    
    # Create comment
    comment = Comment.create_comment(
        route_id=route_id,
        user_id=user_id,
        content=data['content'],
        rating=rating,
        media_urls=media_urls,
        parent_id=parent_id
    )
    
    if not comment:
        return jsonify({
            'success': False,
            'message': 'Failed to create comment'
        }), 500
    
    return jsonify({
        'success': True,
        'message': 'Comment created successfully',
        'comment': comment.to_dict()
    })

def get_comments(route_id):
    """
    Get top-level comments for a route with pagination
    
    Only returns top-level comments (those without a parent_id).
    Replies must be fetched separately using get_replies().
    For private routes, only the owner can view comments.
    
    Args:
        route_id (str): ID of the route to get comments for
        
    Returns:
        JSON response with comments, pagination info, and route rating data
    """
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
                'message': 'Unauthorized to view comments for this route'
            }), 403
    
    # Get the paging parameters
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    skip = (page - 1) * limit
    
    # Get top-level comments (parent_id is None)
    comments = Comment.get_comments_by_route_id(route_id, limit=limit, skip=skip, parent_id=None)
    comment_dicts = [comment.to_dict() for comment in comments]
    
    # Get total count for pagination
    total_count = Comment.count_comments_by_route_id(route_id, parent_id=None)
    
    return jsonify({
        'success': True,
        'comments': comment_dicts,
        'total': total_count,
        'page': page,
        'limit': limit,
        'avg_rating': route.avg_rating,
        'review_count': route.review_count
    })

def get_replies(route_id, comment_id):
    """
    Get replies for a specific comment with pagination
    
    Returns all comments that have the specified comment_id as their parent_id.
    For private routes, only the owner can view replies.
    
    Args:
        route_id (str): ID of the route
        comment_id (str): ID of the parent comment to get replies for
        
    Returns:
        JSON response with replies and pagination info
    """
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
                'message': 'Unauthorized to view comments for this route'
            }), 403
    
    # Check if the parent comment exists
    parent_comment = Comment.get_comment_by_id(comment_id)
    if not parent_comment:
        return jsonify({
            'success': False,
            'message': 'Parent comment not found'
        }), 404
    
    # Get the paging parameters
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    skip = (page - 1) * limit
    
    # Get replies for the comment
    replies = Comment.get_comments_by_route_id(route_id, limit=limit, skip=skip, parent_id=comment_id)
    reply_dicts = [reply.to_dict() for reply in replies]
    
    # Get total count for pagination
    total_count = Comment.count_comments_by_route_id(route_id, parent_id=comment_id)
    
    return jsonify({
        'success': True,
        'replies': reply_dicts,
        'total': total_count,
        'page': page,
        'limit': limit
    })

def delete_comment(route_id, comment_id):
    """
    Delete a comment or reply
    
    Users can only delete their own comments.
    When a parent comment is deleted, all replies are also deleted.
    
    Args:
        route_id (str): ID of the route
        comment_id (str): ID of the comment to delete
        
    Returns:
        JSON response with deletion status
    """
    user_id = verify_session(request)
    if not user_id:
        return jsonify({
            'success': False, 
            'message': 'Unauthorized'
        }), 401
    
    # Delete comment
    success = Comment.delete_comment(comment_id, user_id)
    if not success:
        return jsonify({
            'success': False,
            'message': 'Failed to delete comment or comment not found'
        }), 404
    
    return jsonify({
        'success': True,
        'message': 'Comment deleted successfully'
    })