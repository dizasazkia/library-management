from flask import Blueprint, request, jsonify
from config.db import get_db_connection
from flask_jwt_extended import jwt_required
from routes import admin_required
from datetime import datetime

returns_bp = Blueprint('returns', __name__)

@returns_bp.route('/', methods=['POST'])
@jwt_required()
def request_return():
    data = request.get_json()
    borrow_id = data.get('borrow_id')

    conn = get_db_connection()
    cursor = conn.cursor()
    # Insert ke returns hanya jika belum ada
    cursor.execute('SELECT id FROM returns WHERE borrow_id = %s', (borrow_id,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({'error': 'Sudah mengajukan pengembalian'}), 400

    cursor.execute('INSERT INTO returns (borrow_id, status) VALUES (%s, %s)', (borrow_id, 'pending'))
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
    cursor.execute('''
        UPDATE returns 
        SET status = 'confirmed', return_date = CURDATE() 
        WHERE id = %s
    ''', (id,))
    cursor.execute('''
        UPDATE borrows 
        SET status = 'dikembalikan' 
        WHERE id = (SELECT borrow_id FROM returns WHERE id = %s)
    ''', (id,))
    cursor.execute('''
        UPDATE books 
        SET stock = stock + 1 
        WHERE id = (SELECT book_id FROM borrows WHERE id = (SELECT borrow_id FROM returns WHERE id = %s))
    ''', (id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Return confirmed'}), 200