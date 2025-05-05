import uuid
from datetime import datetime

# This variable will be set in app.py
db = None

class Route:
    def __init__(self, name, locations, user_id, route_id=None, is_public=False, share_count=0, avg_rating=0, review_count=0, image_url=None):
        self.name = name
        self.locations = locations  # List containing location points
        self.user_id = user_id
        self.route_id = route_id or str(uuid.uuid4())
        self.created_at = datetime.now()
        self.is_public = is_public
        self.share_count = share_count
        self.avg_rating = avg_rating
        self.review_count = review_count
        self.image_url = image_url  # 添加图片URL字段
    
    def to_dict(self):
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
        global db
        if db is None:
            return None
            
        route = Route(name=name, locations=locations, user_id=user_id, is_public=is_public, image_url=image_url)
        result = db.routes.insert_one(route.to_dict())
        print(f"success to create ，ID: {route.route_id}")
        return route
    
    @staticmethod
    def get_routes_by_user_id(user_id):
        """get all routes by user id"""
        global db
        if db is None:
            return []
            
        route_dicts = db.routes.find({'user_id': user_id})
        return [Route.from_dict(route_dict) for route_dict in route_dicts]
    
    @staticmethod
    def get_route_by_id(route_id):
        """get a route by id"""
        global db
        if db is None:
            return None
            
        route_dict = db.routes.find_one({'route_id': route_id})
        if route_dict:
            return Route.from_dict(route_dict)
        return None
    
    @staticmethod
    def delete_route(route_id, user_id):
        """delete a route by id"""
        global db
        if db is None:
            return False
            
        result = db.routes.delete_one({'route_id': route_id, 'user_id': user_id})
        return result.deleted_count > 0
    
    @staticmethod
    def update_share_count(route_id):
        """Increase route sharing count"""
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
        """Update route visibility settings"""
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
        """Get all publicly shared routes"""
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
        global db
        if db is None:
            return 0
        return db.routes.count_documents({'is_public': True})
