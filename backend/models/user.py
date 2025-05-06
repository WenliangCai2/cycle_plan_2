"""
User Model
=========
This module defines the data model for user accounts, handling
registration, authentication, and profile management.

Features:
- Create new user accounts with secure password hashing
- Retrieve user information by username or ID
- Verify user passwords for authentication
- Update user passwords securely

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
import uuid
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

# This variable will be set in app.py
db = None

class User:
    def __init__(self, username, password=None, user_id=None, email=None):
        """
        Initialize a new User object
        
        Args:
            username: Unique username for the user
            password: Plain text password (will be hashed)
            user_id: Unique identifier (auto-generated if None)
            email: Email address for the user
        """
        self.username = username
        self.email = email
        self.password_hash = generate_password_hash(password) if password else None
        self.user_id = user_id or str(uuid.uuid4())
        self.created_at = datetime.now()
    
    def to_dict(self):
        """
        Convert user object to dictionary for serialization
        
        Returns:
            Dictionary containing all user properties
        """
        return {
            'username': self.username,
            'email': self.email,
            'user_id': self.user_id,
            'password_hash': self.password_hash,
            'created_at': self.created_at
        }
    
    @staticmethod
    def from_dict(user_dict):
        """
        Create a User object from a dictionary
        
        Args:
            user_dict: Dictionary containing user data
            
        Returns:
            User object populated with dictionary data
        """
        user = User(username=user_dict['username'], email=user_dict.get('email'), user_id=user_dict['user_id'])
        user.password_hash = user_dict['password_hash']
        user.created_at = user_dict.get('created_at', datetime.now())
        return user
    
    def verify_password(self, password):
        """
        Verify if a given password matches the stored hash
        
        Process:
        1. Uses werkzeug's check_password_hash to verify the password
        
        Args:
            password: Plain text password to verify
            
        Returns:
            Boolean indicating if the password is correct
        """
        return check_password_hash(self.password_hash, password)
    
    @staticmethod
    def create_user(username, password, email):
        """
        Create a new user account
        
        Process:
        1. Validates database connection
        2. Checks if username already exists
        3. Creates and stores new user with hashed password
        
        Args:
            username: Unique username for the user
            password: Plain text password (will be hashed)
            email: Email address for the user
            
        Returns:
            New User object if successful, None otherwise
        """
        global db
        if db is None:
            print("Warning: Database connection not set, user creation failed")
            return None
            
        # Check if username exists
        if db.users.find_one({'username': username}):
            return None
        
        # Create new user
        user = User(username=username, password=password, email=email)
        result = db.users.insert_one(user.to_dict())
        print(f"User created successfully, ID: {user.user_id}")
        return user
    
    @staticmethod
    def get_user_by_username(username):
        """
        Get user by username
        
        Process:
        1. Validates database connection
        2. Retrieves user from database by username
        
        Args:
            username: Username of the user to retrieve
            
        Returns:
            User object if found, None otherwise
        """
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
        """
        Get user by user ID
        
        Process:
        1. Validates database connection
        2. Retrieves user from database by ID
        
        Args:
            user_id: ID of the user to retrieve
            
        Returns:
            User object if found, None otherwise
        """
        global db
        if db is None:
            print("Warning: Database connection not set, unable to get user")
            return None
            
        user_dict = db.users.find_one({'user_id': user_id})
        if user_dict:
            return User.from_dict(user_dict)
        return None

    def update_password(self, new_password):
        """
        Update user password
        
        Process:
        1. Validates database connection
        2. Generates hash for new password
        3. Updates password in database and current object
        
        Args:
            new_password: New plain text password
            
        Returns:
            Boolean indicating if update was successful
        """
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