"""
Custom point data model
"""
import uuid
from datetime import datetime

# This variable will be set in app.py
db = None

class CustomPoint:
    def __init__(self, name, location, user_id, point_id=None, is_custom=True):
        self.name = name
        self.location = location  # {lat: float, lng: float}
        self.user_id = user_id
        self.point_id = point_id or str(uuid.uuid4())
        self.is_custom = is_custom
        self.created_at = datetime.now()
    
    def to_dict(self):
        """Converts a custom point object to a dictionary representation"""
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
        """Creates a custom point object from a dictionary"""
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
        """Creates a new custom point"""
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
        """Get all points by user ID"""
        global db
        if db is None:
            print("Warning: Database connection not set, unable to get custom points")
            return []
            
        point_dicts = db.custom_points.find({'user_id': user_id})
        return [CustomPoint.from_dict(point_dict) for point_dict in point_dicts]
    
    @staticmethod
    def get_point_by_id(point_id):
        """Get a point by its ID"""
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
        """Delete a point by ID"""
        global db
        if db is None:
            print("Warning: Database connection not set, deletion failed")
            return False
            
        result = db.custom_points.delete_one({'point_id': point_id, 'user_id': user_id})
        return result.deleted_count > 0 