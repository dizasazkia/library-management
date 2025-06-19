from flask import Blueprint, request, jsonify
from config.db import get_db_connection
from flask_jwt_extended import jwt_required, get_jwt_identity
from routes import admin_required
from datetime import datetime, timedelta
import json
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

borrows_bp = Blueprint('borrows', __name__)

@borrows_bp.route('/', methods=['POST'])
@jwt_required()
def borrow_book():
    conn = None
    cursor = None
    try:
        # Validate request
        data = request.get_json()
        logger.info(f"Received borrow request data: {data}")
        
        if not data:
            return jsonify({
                'success': False, 
                'message': 'Data tidak boleh kosong'
            }), 400

        book_id = data.get('book_id')
        if not book_id or not str(book_id).isdigit():
            return jsonify({
                'success': False, 
                'message': 'ID buku tidak valid'
            }), 400

        # Get and validate user identity
        identity = get_jwt_identity()
        logger.info(f"User identity from JWT: {identity}")
        
        if not identity:
            return jsonify({
                'success': False, 
                'message': 'Token tidak valid'
            }), 401

        # Handle different identity formats
        if isinstance(identity, str):
            try:
                identity = json.loads(identity)
            except json.JSONDecodeError:
                identity = {'id': identity}

        user_id = identity.get('id')
        if not user_id:
            return jsonify({
                'success': False, 
                'message': 'ID user tidak ditemukan dalam token'
            }), 401

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. Check book availability
        cursor.execute('SELECT id, title, stock FROM books WHERE id = %s', (book_id,))
        book = cursor.fetchone()
        
        if not book:
            return jsonify({
                'success': False, 
                'message': 'Buku tidak ditemukan'
            }), 404
            
        if book['stock'] <= 0:
            return jsonify({
                'success': False, 
                'message': 'Stok buku habis'
            }), 400

        # 2. Check if user already borrowed this book
        cursor.execute('''
            SELECT id FROM borrows 
            WHERE user_id = %s AND book_id = %s AND status = 'dipinjam'
            LIMIT 1
        ''', (user_id, book_id))
        if cursor.fetchone():
            return jsonify({
                'success': False,
                'message': 'Anda sudah meminjam buku ini'
            }), 400

        # 3. Check borrow limit (max 3 books)
        cursor.execute('''
            SELECT COUNT(*) as active_borrows 
            FROM borrows 
            WHERE user_id = %s AND status = 'dipinjam'
        ''', (user_id,))
        borrow_count = cursor.fetchone()['active_borrows']
        if borrow_count >= 3:
            return jsonify({
                'success': False,
                'message': 'Anda sudah mencapai batas peminjaman (3 buku)'
            }), 400

        # Process the borrow
        borrow_date = datetime.now().strftime('%Y-%m-%d')
        return_date = (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d')
        
        # Insert borrow record
        cursor.execute('''
            INSERT INTO borrows 
            (user_id, book_id, borrow_date, return_date, status) 
            VALUES (%s, %s, %s, %s, 'dipinjam')
        ''', (user_id, book_id, borrow_date, return_date))
        
        # Update book stock
        cursor.execute('UPDATE books SET stock = stock - 1 WHERE id = %s', (book_id,))
        
        conn.commit()
        
        # Get updated book info
        cursor.execute('SELECT title, stock FROM books WHERE id = %s', (book_id,))
        updated_book = cursor.fetchone()
        
        return jsonify({
            'success': True,
            'message': 'Buku berhasil dipinjam',
            'data': {
                'book_id': book_id,
                'book_title': updated_book['title'],
                'remaining_stock': updated_book['stock'],
                'return_date': return_date
            }
        }), 201

    except Exception as e:
        logger.error(f"Error in borrow_book: {str(e)}", exc_info=True)
        if conn:
            conn.rollback()
        return jsonify({
            'success': False,
            'message': 'Terjadi kesalahan saat memproses peminjaman',
            'error': str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@borrows_bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_borrows():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get all borrows with user, book, and return info
        cursor.execute('''
            SELECT 
                b.id, 
                u.username, 
                u.id as user_id,
                bk.title, 
                bk.id as book_id,
                b.borrow_date, 
                b.return_date,
                b.status,
                r.status AS return_status
            FROM borrows b 
            JOIN users u ON b.user_id = u.id 
            JOIN books bk ON b.book_id = bk.id
            LEFT JOIN returns r ON r.borrow_id = b.id
            ORDER BY b.borrow_date DESC
        ''')
        borrows = cursor.fetchall()
        
        return jsonify({
            'success': True,
            'data': borrows
        }), 200

    except Exception as e:
        logger.error(f"Error in get_borrows: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': 'Gagal mengambil data peminjaman',
            'error': str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@borrows_bp.route('/history', methods=['GET'])
@jwt_required()
def get_borrow_history():
    conn = None
    cursor = None
    try:
        identity = get_jwt_identity()
        logger.info(f"User identity for history: {identity}")
        
        if not identity:
            return jsonify({
                'success': False, 
                'message': 'Token tidak valid'
            }), 401

        # Handle different identity formats
        if isinstance(identity, str):
            try:
                identity = json.loads(identity)
            except json.JSONDecodeError:
                identity = {'id': identity}

        user_id = identity.get('id')
        if not user_id:
            return jsonify({
                'success': False, 
                'message': 'ID user tidak ditemukan dalam token'
            }), 401

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('''
            SELECT 
                b.id,
                bk.title,
                bk.id as book_id,
                b.borrow_date,
                b.return_date,
                b.status,
                r.status AS return_status
            FROM borrows b 
            JOIN books bk ON b.book_id = bk.id 
            LEFT JOIN returns r ON r.borrow_id = b.id
            WHERE b.user_id = %s
            ORDER BY b.borrow_date DESC
        ''', (user_id,))
        
        borrows = cursor.fetchall()
        
        return jsonify({
            'success': True,
            'data': borrows
        }), 200

    except Exception as e:
        logger.error(f"Error in get_borrow_history: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': 'Gagal mengambil riwayat peminjaman',
            'error': str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()