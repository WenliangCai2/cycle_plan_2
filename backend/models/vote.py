"""
Vote Model
=========
This module defines the data model for votes on routes, implementing
an upvote/downvote system for public cycling routes.

Features:
- Create, update, and remove votes
- Toggle votes by clicking the same vote type twice
- Track upvotes, downvotes, and overall vote score
- Retrieve user's vote status for routes
- Update route documents with current vote counts

Author: Zhuoyi Zhang
Contributors: [Contributors Names]
Last Modified: 07/05/2025
"""
import uuid
from datetime import datetime

# This variable will be set in app.py
db = None

class Vote:
    def __init__(self, route_id, user_id, vote_type, vote_id=None):
        """
        Initialize a new Vote object
        
        Args:
            route_id: ID of the route being voted on
            user_id: ID of the user creating the vote
            vote_type: Integer (1 for upvote, -1 for downvote)
            vote_id: Unique identifier (auto-generated if None)
        """
        self.route_id = route_id
        self.user_id = user_id
        self.vote_type = vote_type  # 1 for upvote, -1 for downvote
        self.vote_id = vote_id or str(uuid.uuid4())
        self.created_at = datetime.now()
    
    def to_dict(self):
        """
        Convert vote object to dictionary for serialization
        
        Returns:
            Dictionary containing all vote properties
        """
        return {
            'vote_id': self.vote_id,
            'route_id': self.route_id,
            'user_id': self.user_id,
            'vote_type': self.vote_type,
            'created_at': self.created_at
        }
    
    @staticmethod
    def from_dict(vote_dict):
        """
        Create a Vote object from a dictionary
        
        Args:
            vote_dict: Dictionary containing vote data
            
        Returns:
            Vote object populated with dictionary data
        """
        vote = Vote(
            route_id=vote_dict['route_id'],
            user_id=vote_dict['user_id'],
            vote_type=vote_dict['vote_type'],
            vote_id=vote_dict['vote_id']
        )
        vote.created_at = vote_dict.get('created_at', datetime.now())
        return vote
    
    @staticmethod
    def create_or_update_vote(route_id, user_id, vote_type):
        """
        Create, update, or remove a vote
        
        Process:
        1. Validates database connection and normalizes vote type
        2. Checks for existing vote from the user
        3. Removes vote if clicking same type (toggle behavior)
        4. Updates vote if changing from upvote to downvote or vice versa
        5. Creates new vote if user hasn't voted before
        6. Updates route's vote counts
        
        Args:
            route_id: ID of the route to vote on
            user_id: ID of the user voting
            vote_type: Integer (positive for upvote, negative for downvote)
            
        Returns:
            Vote object if created/updated, None if vote was removed
        """
        global db
        if db is None:
            return None
        
        # Make sure vote_type is either 1 (upvote) or -1 (downvote)
        vote_type = 1 if vote_type > 0 else -1
        
        print(f"Processing vote for route_id={route_id}, user_id={user_id}, vote_type={vote_type}")
        
        # Check if the user has already voted on this route
        existing = db.votes.find_one({
            'route_id': route_id,
            'user_id': user_id
        })
        
        if existing:
            print(f"User has existing vote: {existing}")
            # If the vote type is the same, remove the vote (toggle)
            if existing['vote_type'] == vote_type:
                print(f"Removing vote {existing['vote_id']} as user clicked same type")
                db.votes.delete_one({'vote_id': existing['vote_id']})
                Vote.update_route_votes(route_id)
                return None
            
            # Update the existing vote
            print(f"Updating vote from {existing['vote_type']} to {vote_type}")
            db.votes.update_one(
                {'vote_id': existing['vote_id']},
                {'$set': {
                    'vote_type': vote_type,
                    'created_at': datetime.now()
                }}
            )
            vote = Vote.from_dict(existing)
            vote.vote_type = vote_type
            
            # Update route's vote count - Make sure the count is updated
            Vote.update_route_votes(route_id)
            
            return vote
        
        # Create new vote
        print(f"Creating new vote for route {route_id}")
        vote = Vote(
            route_id=route_id,
            user_id=user_id,
            vote_type=vote_type
        )
        
        db.votes.insert_one(vote.to_dict())
        
        # Update route's vote count - Make sure the count is updated
        Vote.update_route_votes(route_id)
        
        return vote
    
    @staticmethod
    def get_user_vote(route_id, user_id):
        """
        Get user's vote for a specific route
        
        Process:
        1. Validates database connection
        2. Retrieves user's vote for the specified route
        
        Args:
            route_id: ID of the route
            user_id: ID of the user
            
        Returns:
            Vote object if user has voted, None otherwise
        """
        global db
        if db is None:
            return None
        
        vote_dict = db.votes.find_one({
            'route_id': route_id,
            'user_id': user_id
        })
        
        if not vote_dict:
            return None
        
        return Vote.from_dict(vote_dict)
    
    @staticmethod
    def get_votes_by_route_id(route_id):
        """
        Get all votes for a route
        
        Process:
        1. Validates database connection
        2. Retrieves all votes for the specified route
        
        Args:
            route_id: ID of the route
            
        Returns:
            List of Vote objects for the route
        """
        global db
        if db is None:
            return []
        
        vote_dicts = db.votes.find({'route_id': route_id})
        
        return [Vote.from_dict(vote_dict) for vote_dict in vote_dicts]
    
    @staticmethod
    def update_route_votes(route_id):
        """
        Update route votes count
        
        Process:
        1. Validates database connection
        2. Counts upvotes and downvotes for the route
        3. Calculates overall vote score
        4. Updates route document with vote statistics
        5. Verifies update was successful
        
        Args:
            route_id: ID of the route to update
            
        Returns:
            Boolean indicating if update was successful
        """
        global db
        if db is None:
            return False
        
        print(f"Updating vote counts for route {route_id}")
        
        # Calculate upvotes and downvotes
        upvotes = db.votes.count_documents({
            'route_id': route_id,
            'vote_type': 1
        })
        
        downvotes = db.votes.count_documents({
            'route_id': route_id,
            'vote_type': -1
        })
        
        vote_score = upvotes - downvotes
        
        print(f"Vote counts: upvotes={upvotes}, downvotes={downvotes}, score={vote_score}")
        
        # Update the vote count for a route
        result = db.routes.update_one(
            {'route_id': route_id},
            {'$set': {
                'upvotes': upvotes,
                'downvotes': downvotes,
                'vote_score': vote_score
            }}
        )
        
        print(f"Update result: modified_count={result.modified_count}, matched_count={result.matched_count}")
        
        # Verify that the update was successful
        route = db.routes.find_one({'route_id': route_id})
        if route:
            print(f"Route after update: upvotes={route.get('upvotes')}, downvotes={route.get('downvotes')}, vote_score={route.get('vote_score')}")
        else:
            print(f"Warning: Could not find route {route_id} after update")
        
        return True