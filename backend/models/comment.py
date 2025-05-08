"""
Comment Model
===========
This module defines the data model for comments on cycling routes,
supporting a threaded comment system with media attachments and ratings.

Features:
- Create comments and replies on routes
- Store and retrieve media attachments with comments
- Support for 1-5 star ratings
- Calculate and update route average ratings
- Manage nested replies and reply counts
- Delete comments with cascading effect on replies

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
import uuid
from datetime import datetime

# This variable will be set in app.py
db = None

class Comment:
    def __init__(self, route_id, user_id, content, rating=5, media_urls=None, parent_id=None, comment_id=None):
        """
        Initialize a new Comment object
        
        Args:
            route_id: ID of the route being commented on
            user_id: ID of the user creating the comment
            content: Text content of the comment
            rating: Numeric rating from 1-5 stars
            media_urls: List of URLs to attached media files
            parent_id: ID of parent comment if this is a reply
            comment_id: Unique identifier (auto-generated if None)
        """
        self.route_id = route_id
        self.user_id = user_id
        self.content = content
        self.rating = rating  # 1-5 star rating
        self.media_urls = media_urls or []  # List of media URLs (images/videos)
        self.parent_id = parent_id  # Parent comment ID for replies
        self.comment_id = comment_id or str(uuid.uuid4())
        self.created_at = datetime.now()
        self.username = None  # Add username field
        self.reply_count = 0  # Count of replies
    
    def to_dict(self):
        """
        Convert comment object to dictionary for serialization
        
        Returns:
            Dictionary containing all comment properties
        """
        result = {
            'comment_id': self.comment_id,
            'route_id': self.route_id,
            'user_id': self.user_id,
            'content': self.content,
            'rating': self.rating,
            'media_urls': self.media_urls,
            'parent_id': self.parent_id,
            'created_at': self.created_at,
            'reply_count': self.reply_count
        }
        
        # Include username if available
        if hasattr(self, 'username') and self.username:
            result['username'] = self.username
        
        return result
    
    @staticmethod
    def from_dict(comment_dict):
        """
        Create a Comment object from a dictionary
        
        Args:
            comment_dict: Dictionary containing comment data
            
        Returns:
            Comment object populated with dictionary data
        """
        comment = Comment(
            route_id=comment_dict['route_id'],
            user_id=comment_dict['user_id'],
            content=comment_dict['content'],
            rating=comment_dict.get('rating', 5),
            media_urls=comment_dict.get('media_urls', []),
            parent_id=comment_dict.get('parent_id', None),
            comment_id=comment_dict['comment_id']
        )
        comment.created_at = comment_dict.get('created_at', datetime.now())
        comment.reply_count = comment_dict.get('reply_count', 0)
        return comment
    
    @staticmethod
    def create_comment(route_id, user_id, content, rating=5, media_urls=None, parent_id=None):
        """
        Create new comment or reply
        
        Process:
        1. Validates database connection and constrains rating to valid range
        2. Creates new comment object and stores in database
        3. Updates parent comment reply count if this is a reply
        4. Updates route rating if this is a top-level comment
        
        Args:
            route_id: ID of the route being commented on
            user_id: ID of the user creating the comment
            content: Text content of the comment
            rating: Numeric rating from 1-5 stars
            media_urls: List of URLs to attached media files
            parent_id: ID of parent comment if this is a reply
            
        Returns:
            New Comment object if successful, None otherwise
        """
        global db
        if db is None:
            return None
        
        # Make sure the rating is between 1-5
        rating = max(1, min(5, rating))
        
        # Create new comment
        comment = Comment(
            route_id=route_id,
            user_id=user_id,
            content=content,
            rating=rating,
            media_urls=media_urls or [],
            parent_id=parent_id
        )
        
        db.comments.insert_one(comment.to_dict())
        
        # If this is a reply, increment the parent comment's reply count
        if parent_id:
            db.comments.update_one(
                {'comment_id': parent_id},
                {'$inc': {'reply_count': 1}}
            )
        else:
            # Update route's average score if this is a top-level comment
            Comment.update_route_rating(route_id)
        
        return comment
    
    @staticmethod
    def get_comments_by_route_id(route_id, limit=20, skip=0, parent_id=None):
        """
        Get comments for a route with optional parent_id filter
        
        Process:
        1. Builds query filter based on route_id and optional parent_id
        2. Retrieves comments from database with pagination
        3. Fetches usernames for each comment
        
        Args:
            route_id: ID of the route to get comments for
            limit: Maximum number of comments to return
            skip: Number of comments to skip for pagination
            parent_id: If specified, get only replies to this comment
            
        Returns:
            List of Comment objects with username information
        """
        global db
        if db is None:
            return []
        
        # Prepare filter query
        query = {'route_id': route_id}
        
        # If parent_id is None, get top-level comments, otherwise get replies
        if parent_id is None:
            query['parent_id'] = None
        else:
            query['parent_id'] = parent_id
        
        # Get comments
        comment_dicts = db.comments.find(query).sort('created_at', -1).skip(skip).limit(limit)
        
        comments = []
        for comment_dict in comment_dicts:
            comment = Comment.from_dict(comment_dict)
            
            # Try to get the user's username
            user_dict = db.users.find_one({'user_id': comment.user_id})
            if user_dict:
                # Add username to the comment object
                comment.username = user_dict.get('username', comment.user_id)
            else:
                comment.username = comment.user_id
            
            comments.append(comment)
        
        return comments
    
    @staticmethod
    def get_comment_by_id(comment_id):
        """
        Get a specific comment by ID
        
        Process:
        1. Retrieves comment from database by ID
        2. Fetches username information for the comment
        
        Args:
            comment_id: Unique identifier for the comment
            
        Returns:
            Comment object if found, None otherwise
        """
        global db
        if db is None:
            return None
        
        comment_dict = db.comments.find_one({'comment_id': comment_id})
        if not comment_dict:
            return None
        
        comment = Comment.from_dict(comment_dict)
        
        # Try to get the user's username
        user_dict = db.users.find_one({'user_id': comment.user_id})
        if user_dict:
            # Add username to the comment object
            comment.username = user_dict.get('username', comment.user_id)
        else:
            comment.username = comment.user_id
            
        return comment
    
    @staticmethod
    def delete_comment(comment_id, user_id):
        """
        Delete a comment and its replies
        
        Process:
        1. Verifies comment exists and gets its metadata
        2. Deletes the comment if owned by the user
        3. Updates parent reply count if this was a reply
        4. Cascades deletion to all replies
        5. Updates route rating if this was a top-level comment
        
        Args:
            comment_id: Unique identifier for the comment to delete
            user_id: ID of the user attempting deletion
            
        Returns:
            Boolean indicating if deletion was successful
        """
        global db
        if db is None:
            return False
        
        # Get the comment to check if it's a reply
        comment = db.comments.find_one({'comment_id': comment_id})
        if not comment:
            return False
        
        # Check if this is a reply and get parent_id
        parent_id = comment.get('parent_id')
        route_id = comment.get('route_id')
        
        # Delete the comment
        result = db.comments.delete_one({
            'comment_id': comment_id,
            'user_id': user_id
        })
        
        if result.deleted_count > 0:
            # If this was a reply, decrement the parent's reply count
            if parent_id:
                db.comments.update_one(
                    {'comment_id': parent_id},
                    {'$inc': {'reply_count': -1}}
                )
                
            # Also delete all replies to this comment if it was a parent
            db.comments.delete_many({'parent_id': comment_id})
            
            # Update route average score if it was a top-level comment
            if not parent_id:
                Comment.update_route_rating(route_id)
                
            return True
        
        return False
    
    @staticmethod
    def count_comments_by_route_id(route_id, parent_id=None):
        """
        Count comments for a route with optional parent_id filter
        
        Process:
        1. Builds query filter based on route_id and optional parent_id
        2. Counts matching comments in database
        
        Args:
            route_id: ID of the route to count comments for
            parent_id: If specified, count only replies to this comment
            
        Returns:
            Integer count of matching comments
        """
        global db
        if db is None:
            return 0
        
        # Prepare filter query
        query = {'route_id': route_id}
        
        # If parent_id is None, count top-level comments, otherwise count replies
        if parent_id is None:
            query['parent_id'] = None
        else:
            query['parent_id'] = parent_id
        
        # Count comments
        return db.comments.count_documents(query)
        
    @staticmethod
    def update_route_rating(route_id):
        """
        Update route average score based on comment ratings
        
        Process:
        1. Uses aggregation pipeline to calculate average rating
        2. Updates route document with new average and review count
        3. Resets rating to zero if no comments exist
        
        Args:
            route_id: ID of the route to update ratings for
            
        Returns:
            Boolean indicating if update was successful
        """
        global db
        if db is None:
            return False
        
        # Calculate the average score of top-level comments (not replies)
        pipeline = [
            {'$match': {'route_id': route_id, 'parent_id': None}},
            {'$group': {
                '_id': None,
                'avg_rating': {'$avg': '$rating'},
                'comment_count': {'$sum': 1}
            }}
        ]
        
        result = list(db.comments.aggregate(pipeline))
        
        if not result:
            # If there are no comments, reset the rating
            db.routes.update_one(
                {'route_id': route_id},
                {'$set': {
                    'avg_rating': 0,
                    'review_count': 0
                }}
            )
            return True
        
        # Update route ratings
        stats = result[0]
        db.routes.update_one(
            {'route_id': route_id},
            {'$set': {
                'avg_rating': round(stats['avg_rating'], 1),
                'review_count': stats['comment_count']
            }}
        )
        
        return True