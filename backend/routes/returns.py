from flask import Blueprint, request, jsonify
from config.db import get_db_connection
from flask_jwt_extended import jwt_required
from routes import admin_required

returns_bp = Blueprint('returns', __name__)

@returns_bp.route('/', methods=['POST'])
@jwt_required()
def request_return():
    data = request.get_json()
    borrow_id = data.get('borrow_id')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO returns (borrow_id, return_date, status) VALUES (%s, CURDATE(), %s)', (borrow_id, 'pending'))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Return requested'}), 201

@returns_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def confirm_return(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE returns SET status = %s WHERE id = %s', ('confirmed', id))
    cursor.execute('UPDATE borrows SET status = %s WHERE id = (SELECT borrow_id FROM returns WHERE id = %s)', ('dikembalikan', id))
    cursor.execute('UPDATE books SET stock = stock + 1 WHERE id = (SELECT book_id FROM borrows WHERE id = (SELECT borrow_id FROM returns WHERE id = %s))', (id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Return confirmed'}), 200