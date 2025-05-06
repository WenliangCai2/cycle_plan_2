"""
MongoDB database configuration file
===================================
This module contains MongoDB connection configuration and collection names
for the route planning application.

The connection URI uses the MongoDB Atlas cloud database service with
appropriate credentials and database name.

Author: [Author Name]
Contributors: [Contributors Names]
Last Modified: [Date]
"""
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

# MongoDB Atlas connection URI
# Contains credentials for database access and specifies the route_planner database
MONGO_URI = "mongodb+srv://zzhang133:KRSRZw7WFmwTGc0i@cluster0.bdi7u.mongodb.net/route_planner?retryWrites=true&w=majority&appName=Cluster0"

# Collection names
# These constants define the MongoDB collections used by the application
USERS_COLLECTION = 'users'            # Stores user account data
CUSTOM_POINTS_COLLECTION = 'custom_points'  # Stores user-defined map points
ROUTES_COLLECTION = 'routes'          # Stores route planning data


# Database instance placeholder
# This will be populated at runtime when the connection is established
db = None