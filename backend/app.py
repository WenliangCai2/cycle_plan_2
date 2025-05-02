"""
Flask application main file - route planning application
"""
import datetime
import os
from flask import Flask, jsonify, request, url_for, send_from_directory
from flask_cors import CORS
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from config.database import MONGO_URI
from werkzeug.utils import secure_filename

# Create Flask application
app = Flask(__name__)

# Configure CORS
CORS(app, 
     resources={r"/api/*": {"origins": "http://localhost:3000"}}, 
     allow_headers=["Content-Type", "Authorization"], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True)

# Configure file uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max-limit

# Create upload folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Utility function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
    import models.poi as poi_model
    import models.vote as vote_model
    
    user_model.db = db
    point_model.db = db
    route_model.db = db
    review_model.db = db
    poi_model.db = db
    vote_model.db = db

    
    # Import and register route blueprints
    from routes.auth_routes import auth_bp
    from routes.custom_point_routes import custom_point_bp
    from routes.route_routes import route_bp
    from routes.review_routes import review_bp
    from routes.poi_routes import poi_bp
    from routes.vote_routes import vote_bp
    from routes.user_routes import user_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(custom_point_bp)
    app.register_blueprint(route_bp)
    app.register_blueprint(review_bp)
    app.register_blueprint(poi_bp)
    app.register_blueprint(vote_bp)
    app.register_blueprint(user_bp)
    
    # Initialize vote routes
    from routes.vote_routes import init_routes as init_vote_routes
    init_vote_routes(db)
    
    print("MongoDB mode: Enabled")
    
except Exception as e:
    print(f"MongoDB Atlas connection failed: {e}")
    
    @app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
    def database_error(path):
        return jsonify({
            'success': False,
            'message': '数据库连接失败，请稍后再试'
        }), 503

# File upload endpoint
@app.route('/api/upload', methods=['POST'])
def upload_file():
    from controllers.auth_controller import verify_session
    
    # Check if user is authenticated
    user_id = verify_session(request)
    if not user_id:
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 401
    
    # Check if the post request has the file part
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'message': 'No file part'
        }), 400
    
    file = request.files['file']
    
    # If user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        return jsonify({
            'success': False,
            'message': 'No selected file'
        }), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add user_id and timestamp to make filename unique
        unique_filename = f"{user_id}_{int(datetime.datetime.now().timestamp())}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        # Return the URL for the uploaded file
        file_url = url_for('uploaded_file', filename=unique_filename, _external=True)
        
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'image_url': file_url
        })
    
    return jsonify({
        'success': False,
        'message': 'File type not allowed'
    }), 400

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

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
    app.run(debug=True)