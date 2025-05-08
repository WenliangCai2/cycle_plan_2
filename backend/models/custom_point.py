"""
Custom Point Model
===============
This module defines the data model for custom points that users can
create and manage on cycling routes. These points can represent
landmarks, rest stops, or other locations of interest.

Features:
- Create custom points with geographic coordinates
- Retrieve points created by a user
- Delete user-created points
- Associate points with users for personalization

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
import uuid
from datetime import datetime

# This variable will be set in app.py
db = None

class CustomPoint:
    def __init__(self, name, location, user_id, point_id=None, is_custom=True):
        """
        Initialize a new CustomPoint object
        
        Args:
            name: Display name for the custom point
            location: Dictionary containing lat and lng coordinates
            user_id: ID of the user who created the point
            point_id: Unique identifier (auto-generated if None)
            is_custom: Boolean indicating if this is a user-created point
        """
        self.name = name
        self.location = location  # {lat: float, lng: float}
        self.user_id = user_id
        self.point_id = point_id or str(uuid.uuid4())
        self.is_custom = is_custom
        self.created_at = datetime.now()
    
    def to_dict(self):
        """
        Convert custom point object to dictionary for serialization
        
        Returns:
            Dictionary containing all point properties
        """
        return {
            'name': self.name,
            'location': self.location,
            'user_id': self.user_id,
            'point_id': self.point_id,
            'is_custom': self.is_custom,
            'created_at': self.created_at
        }
    
    @staticmethod
    def from_dict(point_dict):
        """
        Create a CustomPoint object from a dictionary
        
        Args:
            point_dict: Dictionary containing point data
            
        Returns:
            CustomPoint object populated with dictionary data
        """
        point = CustomPoint(
            name=point_dict['name'],
            location=point_dict['location'],
            user_id=point_dict['user_id'],
            point_id=point_dict['point_id'],
            is_custom=point_dict.get('is_custom', True)
        )
        point.created_at = point_dict.get('created_at', datetime.now())
        return point
    
    @staticmethod
    def create_point(name, location, user_id):
        """
        Create a new custom point
        
        Process:
        1. Validates database connection
        2. Creates new point object
        3. Stores point in database
        
        Args:
            name: Display name for the custom point
            location: Dictionary containing lat and lng coordinates
            user_id: ID of the user creating the point
            
        Returns:
            New CustomPoint object if successful, None otherwise
        """
        global db
        if db is None:
            print("Warning: Database connection not set, custom point creation failed")
            return None
            
        point = CustomPoint(name=name, location=location, user_id=user_id)
        result = db.custom_points.insert_one(point.to_dict())
        print(f"Custom point created successfully, ID: {point.point_id}")
        return point
    
    @staticmethod
    def get_points_by_user_id(user_id):
        """
        Get all custom points created by a specific user
        
        Process:
        1. Validates database connection
        2. Retrieves all points matching the user ID
        3. Converts database results to CustomPoint objects
        
        Args:
            user_id: ID of the user
            
        Returns:
            List of CustomPoint objects belonging to the user
        """
        global db
        if db is None:
            print("Warning: Database connection not set, unable to get custom points")
            return []
            
        point_dicts = db.custom_points.find({'user_id': user_id})
        return [CustomPoint.from_dict(point_dict) for point_dict in point_dicts]
    
    @staticmethod
    def get_point_by_id(point_id):
        """
        Get a specific custom point by its ID
        
        Process:
        1. Validates database connection
        2. Retrieves point from database by ID
        
        Args:
            point_id: Unique identifier for the point
            
        Returns:
            CustomPoint object if found, None otherwise
        """
        global db
        if db is None:
            print("Warning: Database connection not set")
            return None
            
        point_dict = db.custom_points.find_one({'point_id': point_id})
        if point_dict:
            return CustomPoint.from_dict(point_dict)
        return None
    
    @staticmethod
    def delete_point(point_id, user_id):
        """
        Delete a custom point
        
        Process:
        1. Validates database connection
        2. Deletes point if it exists and is owned by the user
        
        Args:
            point_id: Unique identifier for the point to delete
            user_id: ID of the user attempting deletion
            
        Returns:
            Boolean indicating if deletion was successful
        """
        global db
        if db is None:
            print("Warning: Database connection not set, deletion failed")
            return False
        
        result = db.custom_points.delete_one({'point_id': point_id, 'user_id': user_id})
        return result.deleted_count > 0