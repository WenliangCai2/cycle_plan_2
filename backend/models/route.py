"""
Route Model
==========
This module defines the data model for cycling routes, handling
creation, retrieval, and management of route information.

Features:
- Create new routes with waypoints and metadata
- Retrieve routes by user or ID
- Delete routes
- Update route visibility (public/private)
- Track route sharing statistics
- Manage route ratings and reviews
- Query public routes with pagination and sorting

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
import uuid
from datetime import datetime

# This variable will be set in app.py
db = None

class Route:
    def __init__(self, name, locations, user_id, route_id=None, is_public=False, share_count=0, avg_rating=0, review_count=0, image_url=None):
        """
        Initialize a new Route object
        
        Args:
            name: Name of the route
            locations: List of location coordinates along the route
            user_id: ID of the user who created the route
            route_id: Unique identifier for the route (auto-generated if None)
            is_public: Whether the route is publicly visible (default: False)
            share_count: Number of times the route has been shared (default: 0)
            avg_rating: Average rating from user reviews (default: 0)
            review_count: Number of reviews (default: 0)
            image_url: URL to an image of the route (default: None)
        """
        self.name = name
        self.locations = locations  # List containing location points
        self.user_id = user_id
        self.route_id = route_id or str(uuid.uuid4())
        self.created_at = datetime.now()
        self.is_public = is_public
        self.share_count = share_count
        self.avg_rating = avg_rating
        self.review_count = review_count
        self.image_url = image_url  # Add image URL field
    
    def to_dict(self):
        """
        Convert route object to dictionary for serialization
        
        Returns:
            Dictionary representation of the route
        """
        return {
            'name': self.name,
            'locations': self.locations,
            'user_id': self.user_id,
            'route_id': self.route_id,
            'created_at': self.created_at,
            'is_public': self.is_public,
            'share_count': self.share_count,
            'avg_rating': self.avg_rating,
            'review_count': self.review_count,
            'image_url': self.image_url
        }
    
    @staticmethod
    def from_dict(route_dict):
        """
        Create a Route object from a dictionary
        
        Args:
            route_dict: Dictionary containing route data
            
        Returns:
            Route object populated with dictionary data
        """
        route = Route(
            name=route_dict['name'],
            locations=route_dict['locations'],
            user_id=route_dict['user_id'],
            route_id=route_dict['route_id'],
            is_public=route_dict.get('is_public', False),
            share_count=route_dict.get('share_count', 0),
            avg_rating=route_dict.get('avg_rating', 0),
            review_count=route_dict.get('review_count', 0),
            image_url=route_dict.get('image_url')
        )
        route.created_at = route_dict.get('created_at', datetime.now())
        return route
    
    @staticmethod
    def create_route(name, locations, user_id, is_public=False, image_url=None):
        """
        Create a new route in the database
        
        Args:
            name: Name of the route
            locations: List of location coordinates along the route
            user_id: ID of the user creating the route
            is_public: Whether the route is publicly visible (default: False)
            image_url: URL to an image of the route (default: None)
            
        Returns:
            New Route object if successful, None otherwise
        """
        global db
        if db is None:
            return None
            
        route = Route(name=name, locations=locations, user_id=user_id, is_public=is_public, image_url=image_url)
        result = db.routes.insert_one(route.to_dict())
        print(f"success to create, ID: {route.route_id}")
        return route
    
    @staticmethod
    def get_routes_by_user_id(user_id):
        """
        Get all routes created by a specific user
        
        Args:
            user_id: ID of the user
            
        Returns:
            List of Route objects belonging to the user
        """
        global db
        if db is None:
            return []
            
        route_dicts = db.routes.find({'user_id': user_id})
        return [Route.from_dict(route_dict) for route_dict in route_dicts]
    
    @staticmethod
    def get_route_by_id(route_id):
        """
        Get a specific route by its ID
        
        Args:
            route_id: Unique identifier for the route
            
        Returns:
            Route object if found, None otherwise
        """
        global db
        if db is None:
            return None
            
        route_dict = db.routes.find_one({'route_id': route_id})
        if route_dict:
            return Route.from_dict(route_dict)
        return None
    
    @staticmethod
    def delete_route(route_id, user_id):
        """
        Delete a specific route
        
        Args:
            route_id: Unique identifier for the route
            user_id: ID of the user attempting deletion (for ownership verification)
            
        Returns:
            Boolean indicating if deletion was successful
        """
        global db
        if db is None:
            return False
            
        result = db.routes.delete_one({'route_id': route_id, 'user_id': user_id})
        return result.deleted_count > 0
    
    @staticmethod
    def update_share_count(route_id):
        """
        Increment the share count for a route
        
        Args:
            route_id: Unique identifier for the route
            
        Returns:
            Boolean indicating if update was successful
        """
        global db
        if db is None:
            return False
            
        result = db.routes.update_one(
            {'route_id': route_id},
            {'$inc': {'share_count': 1}}
        )
        return result.modified_count > 0
    
    @staticmethod
    def update_route_visibility(route_id, user_id, is_public):
        """
        Update the visibility of a route (public or private)
        
        Args:
            route_id: Unique identifier for the route
            user_id: ID of the user attempting update (for ownership verification)
            is_public: Boolean indicating if the route should be public
            
        Returns:
            Boolean indicating if update was successful
        """
        global db
        if db is None:
            return False
            
        result = db.routes.update_one(
            {'route_id': route_id, 'user_id': user_id},
            {'$set': {'is_public': is_public}}
        )
        return result.modified_count > 0
    
    @staticmethod
    def get_public_routes(limit=20, skip=0, sort_by='vote_score', sort_order='desc'):
        """
        Get all publicly shared routes with pagination and sorting
        
        Args:
            limit: Maximum number of routes to return (default: 20)
            skip: Number of routes to skip for pagination (default: 0)
            sort_by: Field to sort by (default: 'vote_score')
            sort_order: Direction to sort ('asc' or 'desc', default: 'desc')
            
        Returns:
            List of public Route objects
        """
        global db
        if db is None:
            return []
            
        # Determine sort direction
        sort_direction = -1 if sort_order.lower() == 'desc' else 1
        
        # Ensure sort field is valid
        valid_sort_fields = ['vote_score', 'share_count', 'avg_rating', 'created_at']
        if sort_by not in valid_sort_fields:
            sort_by = 'vote_score'  # Default to sort by vote score
        
        route_dicts = db.routes.find(
            {'is_public': True}
        ).sort(sort_by, sort_direction).skip(skip).limit(limit)
        
        return [Route.from_dict(route_dict) for route_dict in route_dicts]

    @staticmethod
    def count_public_routes():
        """
        Count the total number of public routes
        
        Returns:
            Integer count of public routes
        """
        global db
        if db is None:
            return 0
        return db.routes.count_documents({'is_public': True})