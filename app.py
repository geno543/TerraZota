from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime

app = Flask(__name__, static_folder='.')
# Configure CORS to allow credentials
CORS(app, supports_credentials=True, resources={
    r"/api/*": {
        "origins": ["http://localhost:8000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this to a secure secret key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///terrazota.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# User Model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fullname = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes for serving static files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# Authentication routes
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        
        if not data or not all(key in data for key in ['fullname', 'email', 'password']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        user = User(
            fullname=data['fullname'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        login_user(user)
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'fullname': user.fullname,
                'email': user.email
            }
        })
    except Exception as e:
        db.session.rollback()
        print(f"Signup error: {str(e)}")
        return jsonify({'error': 'An error occurred during signup'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not all(key in data for key in ['email', 'password']):
            return jsonify({'error': 'Missing email or password'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            login_user(user)
            return jsonify({
                'message': 'Logged in successfully',
                'user': {
                    'fullname': user.fullname,
                    'email': user.email
                }
            })
        
        return jsonify({'error': 'Invalid email or password'}), 401
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'An error occurred during login'}), 500

@app.route('/api/logout')
@login_required
def logout():
    try:
        logout_user()
        return jsonify({'message': 'Logged out successfully'})
    except Exception as e:
        print(f"Logout error: {str(e)}")
        return jsonify({'error': 'An error occurred during logout'}), 500

@app.route('/api/user')
@login_required
def get_user():
    try:
        return jsonify({
            'user': {
                'fullname': current_user.fullname,
                'email': current_user.email
            }
        })
    except Exception as e:
        print(f"Get user error: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching user data'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
