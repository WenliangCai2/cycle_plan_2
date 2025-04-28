"""
Flask application main file - route planning application
"""
import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from config.database import MONGO_URI

# Create Flask application
app = Flask(__name__)

# Configure CORS
CORS(app, 
     resources={r"/api/*": {"origins": "http://localhost:3000"}}, 
     allow_headers=["Content-Type", "Authorization"], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True)

# Connect to MongoDB Atlas
try:
    print("Attempting to connect to MongoDB Atlas...")
    # Create MongoDB client
    client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
    
    # Select database - Database name route_planner is specified in URI
    db = client.get_database()
    
    # Test connection
    client.admin.command('ping')
    print("Successfully connected to MongoDB Atlas!")
    
    # Pass MongoDB instance to model module
    import models.user as user_model
    import models.custom_point as point_model
    import models.route as route_model
    import models.review as review_model
    import models.vote as vote_model


    user_model.db = db
    point_model.db = db
    route_model.db = db
    review_model.db = db
    vote_model.db = db
    
    
    # Import and register route blueprints
    from routes.auth_routes import auth_bp
    from routes.custom_point_routes import custom_point_bp
    from routes.route_routes import route_bp
    from routes.review_routes import review_bp
    from routes.vote_routes import vote_bp, init_routes

    init_routes(db)
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(custom_point_bp)
    app.register_blueprint(route_bp)
    app.register_blueprint(review_bp)
    app.register_blueprint(vote_bp)
    
    print("MongoDB mode: Enabled")
    
except Exception as e:
    print(f"MongoDB Atlas connection failed: {e}")
    
    @app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
    def database_error(path):
        return jsonify({
            'success': False,
            'message': 'Database connection failed, please try again later!'
        }), 503

# Common time interface
@app.route('/time')
def get_time():
    now_time = datetime.datetime.now()
    return jsonify({
        'Task': 'Connect the frontend and the backend successfully!',
        'Date': now_time,
        'Frontend': 'React',
        'Backend': 'Flask'
    })

# Only execute when running this file directly
if __name__ == '__main__':
    # Start application
    app.run(debug=True, port=5001)