from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from functools import wraps
from flask import jsonify
import json

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        identity = get_jwt_identity()
        
        try:
            # Pastikan identity bisa di-decode
            if isinstance(identity, str):
                identity = json.loads(identity)
                
            if identity.get('role') != 'admin':
                return jsonify({'message': 'Access denied'}), 403
        except (json.JSONDecodeError, AttributeError) as e:
            return jsonify({'message': 'Invalid token format'}), 401
            
        return fn(*args, **kwargs)
    return wrapper