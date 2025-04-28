"""
MongoDB database configuration file
"""
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

# MongoDB Atlas connection URI
MONGO_URI = "mongodb+srv://zzhang133:KRSRZw7WFmwTGc0i@cluster0.bdi7u.mongodb.net/route_planner?retryWrites=true&w=majority&appName=Cluster0"
# Collection names
USERS_COLLECTION = 'users'
CUSTOM_POINTS_COLLECTION = 'custom_points'
ROUTES_COLLECTION = 'routes'


db = None 