"""
Comment model for routes, supporting media uploads and replies
"""
import uuid
from datetime import datetime

# This variable will be set in app.py
db = None

class Comment:
    def __init__(self, route_id, user_id, content, rating=5, media_urls=None, parent_id=None, comment_id=None):
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
        """Create new comment"""
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
        """Get comments for a route with optional parent_id filter"""
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
        """Get a specific comment by ID"""
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
        """Delete comment"""
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
        """Count comments for a route with optional parent_id filter"""
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
        """Update route average score"""
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