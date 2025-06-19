from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from routes.auth import auth_bp
from routes.books import books_bp
from routes.users import users_bp
from routes.borrows import borrows_bp
from routes.returns import returns_bp
from dotenv import load_dotenv
import os
import json
from pathlib import Path

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, 
    origins=['http://localhost:5173'], 
    supports_credentials=True,
    allow_headers=['Content-Type', 'Authorization'],
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET')
jwt = JWTManager(app)

# File Upload Configuration
BASE_DIR = Path(__file__).parent
UPLOAD_FOLDER = BASE_DIR.parent / 'uploads'  # Points to LIBRA/uploads
app.config['UPLOAD_FOLDER'] = str(UPLOAD_FOLDER)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching for development

# Ensure upload directory exists
if not UPLOAD_FOLDER.exists():
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

# File serving route
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """Serve uploaded files from the uploads directory."""
    # Remove any leading uploads/ prefix
    filename = filename.replace('uploads/', '', 1)
    
    # Security check
    filename = os.path.basename(filename)
    if not filename:
        return "Invalid filename", 400
    
    try:
        return send_from_directory(
            app.config['UPLOAD_FOLDER'],
            filename,
            as_attachment=False
        )
    except FileNotFoundError:
        return "File not found", 404

# JWT identity loader
@jwt.user_identity_loader
def user_identity_lookup(user):
    """Ensure JWT identity is properly formatted."""
    if isinstance(user, dict):
        return json.dumps(user)
    try:
        # If it's already JSON string, parse and re-dump to ensure consistency
        json.loads(user)
        return user
    except json.JSONDecodeError:
        return json.dumps({'id': str(user)})

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(books_bp, url_prefix='/api/books')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(borrows_bp, url_prefix='/api/borrows')
app.register_blueprint(returns_bp, url_prefix='/api/returns')

if __name__ == '__main__':
    app.run(debug=True, port=5000)