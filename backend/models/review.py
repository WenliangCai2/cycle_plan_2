"""
Review model for routes
"""
import uuid
from datetime import datetime

# This variable will be set in app.py
db = None

class Review:
    def __init__(self, route_id, user_id, content, rating, review_id=None):
        self.route_id = route_id
        self.user_id = user_id
        self.content = content
        self.rating = rating  # 1-5 星级评分
        self.review_id = review_id or str(uuid.uuid4())
        self.created_at = datetime.now()
    
    def to_dict(self):
        return {
            'review_id': self.review_id,
            'route_id': self.route_id,
            'user_id': self.user_id,
            'content': self.content,
            'rating': self.rating,
            'created_at': self.created_at
        }
    
    @staticmethod
    def from_dict(review_dict):
        review = Review(
            route_id=review_dict['route_id'],
            user_id=review_dict['user_id'],
            content=review_dict['content'],
            rating=review_dict['rating'],
            review_id=review_dict['review_id']
        )
        review.created_at = review_dict.get('created_at', datetime.now())
        return review
    
    @staticmethod
    def create_review(route_id, user_id, content, rating):
        """Create new comment"""
        global db
        if db is None:
            return None
        
        # Make sure the rating is between 1-5
        rating = max(1, min(5, rating))
        
        # Check if the user has commented on this route
        existing = db.reviews.find_one({
            'route_id': route_id,
            'user_id': user_id
        })
        
        if existing:
            # Update the existing comment
            db.reviews.update_one(
                {'review_id': existing['review_id']},
                {'$set': {
                    'content': content,
                    'rating': rating,
                    'created_at': datetime.now()
                }}
            )
            return Review.from_dict(existing)
        
        # Create new comment
        review = Review(
            route_id=route_id,
            user_id=user_id,
            content=content,
            rating=rating
        )
        
        db.reviews.insert_one(review.to_dict())
        
        # Update route's average score
        Review.update_route_rating(route_id)
        
        return review
    
    @staticmethod
    def get_reviews_by_route_id(route_id, limit=20, skip=0):
        """Get all comments of the route"""
        global db
        if db is None:
            return []
        
        review_dicts = db.reviews.find(
            {'route_id': route_id}
        ).sort('created_at', -1).skip(skip).limit(limit)
        
        return [Review.from_dict(review_dict) for review_dict in review_dicts]
    
    @staticmethod
    def delete_review(review_id, user_id):
        """Delete review"""
        global db
        if db is None:
            return False
        
        review = db.reviews.find_one({'review_id': review_id})
        if not review:
            return False
        
        route_id = review['route_id']
        
        result = db.reviews.delete_one({
            'review_id': review_id,
            'user_id': user_id
        })
        
        if result.deleted_count > 0:
            # Update route average score
            Review.update_route_rating(route_id)
            return True
        
        return False
    
    @staticmethod
    def update_route_rating(route_id):
        """Update route average score"""
        global db
        if db is None:
            return False
        
        # Calculate the average score
        pipeline = [
            {'$match': {'route_id': route_id}},
            {'$group': {
                '_id': None,
                'avg_rating': {'$avg': '$rating'},
                'review_count': {'$sum': 1}
            }}
        ]
        
        result = list(db.reviews.aggregate(pipeline))
        
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
                'review_count': stats['review_count']
            }}
        )
        
        return True 