from flask import Blueprint, request, jsonify
from config.db import get_db_connection
from werkzeug.security import generate_password_hash
from flask_jwt_extended import jwt_required
from routes import admin_required
import re

users_bp = Blueprint('users', __name__)

def validate_user_data(username, password, role):
    """Validate user input data"""
    if not username or not password or not role:
        return False, "All fields are required"
    if len(username) < 4 or len(username) > 20:
        return False, "Username must be 4-20 characters"
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    if role not in ['mahasiswa', 'admin']:
        return False, "Invalid role"
    if not re.match("^[a-zA-Z0-9_]+$", username):
        return False, "Username can only contain letters, numbers and underscores"
    return True, ""

@users_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def add_user():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400

        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'mahasiswa')

        # Validate input
        is_valid, message = validate_user_data(username, password, role)
        if not is_valid:
            return jsonify({'message': message}), 400

        # Check if username exists
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT id FROM users WHERE username = %s', (username,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Username already exists'}), 400

        # Create user
        hashed_password = generate_password_hash(password)
        cursor.execute(
            'INSERT INTO users (username, password, role) VALUES (%s, %s, %s)',
            (username, hashed_password, role)
        )
        conn.commit()
        
        # Get the new user's ID
        user_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'User added successfully',
            'user': {'id': user_id, 'username': username, 'role': role}
        }), 201

    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({'message': 'Server error', 'error': str(e)}), 500

@users_bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT id, username, role FROM users ORDER BY username')
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch users', 'error': str(e)}), 500

@users_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400

        username = data.get('username')
        password = data.get('password')
        role = data.get('role')

        # Validate input
        if not username or not role:
            return jsonify({'message': 'Username and role are required'}), 400
        if role not in ['mahasiswa', 'admin']:
            return jsonify({'message': 'Invalid role'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE id = %s', (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'User not found'}), 404

        # Check if username is taken by another user
        cursor.execute('SELECT id FROM users WHERE username = %s AND id != %s', (username, id))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'Username already taken'}), 400

        # Update user
        if password:
            hashed_password = generate_password_hash(password)
            cursor.execute(
                'UPDATE users SET username = %s, password = %s, role = %s WHERE id = %s',
                (username, hashed_password, role, id)
            )
        else:
            cursor.execute(
                'UPDATE users SET username = %s, role = %s WHERE id = %s',
                (username, role, id)
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': {'id': id, 'username': username, 'role': role}
        }), 200

    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({'message': 'Server error', 'error': str(e)}), 500

@users_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE id = %s', (id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'User not found'}), 404

        # Delete user
        cursor.execute('DELETE FROM users WHERE id = %s', (id,))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'User deleted successfully'}), 200

    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({'message': 'Server error', 'error': str(e)}), 500