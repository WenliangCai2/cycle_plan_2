"""
User data model
"""
import uuid
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

# This variable will be set in app.py
db = None

class User:
    def __init__(self, username, password=None, user_id=None):
        self.username = username
        self.password_hash = generate_password_hash(password) if password else None
        self.user_id = user_id or str(uuid.uuid4())
        self.created_at = datetime.now()
    
    def to_dict(self):
        """Convert user object to dictionary representation"""
        return {
            'username': self.username,
            'user_id': self.user_id,
            'password_hash': self.password_hash,
            'created_at': self.created_at
        }
    
    @staticmethod
    def from_dict(user_dict):
        """Create user object from dictionary"""
        user = User(username=user_dict['username'], user_id=user_dict['user_id'])
        user.password_hash = user_dict['password_hash']
        user.created_at = user_dict.get('created_at', datetime.now())
        return user
    
    def verify_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    @staticmethod
    def create_user(username, password):
        """Create new user"""
        global db
        if db is None:
            print("Warning: Database connection not set, user creation failed")
            return None
            
        # Check if username exists
        if db.users.find_one({'username': username}):
            return None
        
        # Create new user
        user = User(username=username, password=password)
        result = db.users.insert_one(user.to_dict())
        print(f"User created successfully, ID: {user.user_id}")
        return user
    
    @staticmethod
    def get_user_by_username(username):
        """Get user by username"""
        global db
        if db is None:
            print("Warning: Database connection not set, unable to get user")
            return None
            
        user_dict = db.users.find_one({'username': username})
        if user_dict:
            return User.from_dict(user_dict)
        return None
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by user ID"""
        global db
        if db is None:
            print("Warning: Database connection not set, unable to get user")
            return None
            
        user_dict = db.users.find_one({'user_id': user_id})
        if user_dict:
            return User.from_dict(user_dict)
        return None

    def update_password(self, new_password):
        """Update password"""
        global db
        if db is None:
            print("Warning: Database connection not set, unable to update password")
            return False

        # Update the records corresponding to user_id in the database
        new_password_hash = generate_password_hash(new_password)
        result = db.users.update_one(
            {'user_id': self.user_id},
            {'$set': {'password_hash': new_password_hash}}
        )

        # Update password_hash of the current object
        if result.modified_count > 0:
            self.password_hash = new_password_hash
            return True
        return False