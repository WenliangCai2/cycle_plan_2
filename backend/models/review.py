"""
Review Model
==========
This module defines the data model for reviews on cycling routes,
allowing users to rate and provide feedback on routes.

Features:
- Create and update reviews with ratings
- Retrieve reviews by route
- Delete reviews
- Calculate and update route average ratings
- Associate reviews with usernames for display

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
import uuid
from datetime import datetime

# This variable will be set in app.py
db = None

class Review:
    def __init__(self, route_id, user_id, content, rating, review_id=None):
        """
        Initialize a new Review object
        
        Args:
            route_id: ID of the route being reviewed
            user_id: ID of the user creating the review
            content: Text content of the review
            rating: Numeric rating from 1-5 stars
            review_id: Unique identifier (auto-generated if None)
        """
        self.route_id = route_id
        self.user_id = user_id
        self.content = content
        self.rating = rating  # 1-5 star rating
        self.review_id = review_id or str(uuid.uuid4())
        self.created_at = datetime.now()
        self.username = None  # Add username field
    
    def to_dict(self):
        """
        Convert review object to dictionary for serialization
        
        Returns:
            Dictionary containing all review properties
        """
        result = {
            'review_id': self.review_id,
            'route_id': self.route_id,
            'user_id': self.user_id,
            'content': self.content,
            'rating': self.rating,
            'created_at': self.created_at
        }
        
        # Include username if available
        if hasattr(self, 'username') and self.username:
            result['username'] = self.username
        
        return result
    
    @staticmethod
    def from_dict(review_dict):
        """
        Create a Review object from a dictionary
        
        Args:
            review_dict: Dictionary containing review data
            
        Returns:
            Review object populated with dictionary data
        """
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
        """
        Create a new review or update existing one
        
        Process:
        1. Validates database connection and constrains rating to valid range
        2. Checks if user has already reviewed this route
        3. Updates existing review or creates new one
        4. Updates route's average rating
        
        Args:
            route_id: ID of the route being reviewed
            user_id: ID of the user creating the review
            content: Text content of the review
            rating: Numeric rating from 1-5 stars
            
        Returns:
            Review object if successful, None otherwise
        """
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
        """
        Get all reviews for a route with pagination
        
        Process:
        1. Validates database connection
        2. Retrieves reviews with pagination and sorting
        3. Fetches usernames for each review
        
        Args:
            route_id: ID of the route to get reviews for
            limit: Maximum number of reviews to return
            skip: Number of reviews to skip for pagination
            
        Returns:
            List of Review objects with username information
        """
        global db
        if db is None:
            return []
        
        # Get reviews for the route
        review_dicts = db.reviews.find(
            {'route_id': route_id}
        ).sort('created_at', -1).skip(skip).limit(limit)
        
        reviews = []
        for review_dict in review_dicts:
            review = Review.from_dict(review_dict)
            
            # Try to get the user's username
            user_dict = db.users.find_one({'user_id': review.user_id})
            if user_dict:
                # Add username to the review object
                review.username = user_dict.get('username', review.user_id)
            else:
                review.username = review.user_id
            
            reviews.append(review)
        
        return reviews
    
    @staticmethod
    def delete_review(review_id, user_id):
        """
        Delete a review
        
        Process:
        1. Validates review exists and belongs to the user
        2. Deletes the review from the database
        3. Updates the route's average rating
        
        Args:
            review_id: ID of the review to delete
            user_id: ID of the user attempting deletion
            
        Returns:
            Boolean indicating if deletion was successful
        """
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
        """
        Update route average score based on review ratings
        
        Process:
        1. Uses aggregation pipeline to calculate average rating
        2. Updates route document with new average and review count
        3. Resets rating to zero if no reviews exist
        
        Args:
            route_id: ID of the route to update ratings for
            
        Returns:
            Boolean indicating if update was successful
        """
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