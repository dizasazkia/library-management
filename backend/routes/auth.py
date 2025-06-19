from flask import Blueprint, request, jsonify
from config.db import get_db_connection
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': 'Invalid credentials'}), 401

    import json
    print("IDENTITY:", type(json.dumps({'id': user['id'], 'role': user['role']})))
    access_token = create_access_token(
        identity=json.dumps({'id': user['id'], 'role': user['role']}),
        expires_delta=timedelta(hours=1)
    )
    return jsonify({'token': access_token, 'role': user['role']}), 200