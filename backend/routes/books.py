from flask import Blueprint, request, jsonify, send_from_directory
from config.db import get_db_connection
from flask_jwt_extended import jwt_required
from routes import admin_required
import os
from werkzeug.utils import secure_filename

books_bp = Blueprint('books', __name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- KATEGORI ENDPOINTS ---

@books_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT id, name FROM categories')
    categories = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(categories), 200

@books_bp.route('/categories', methods=['POST'])
@jwt_required()
@admin_required
def add_category():
    name = request.json.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Nama kategori wajib diisi'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('INSERT INTO categories (name) VALUES (%s)', (name,))
        conn.commit()
        category_id = cursor.lastrowid
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
    return jsonify({'id': category_id, 'name': name}), 201

# --- BUKU ENDPOINTS ---

@books_bp.route('/', methods=['GET'])
@jwt_required()
def get_books():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # JOIN ke tabel kategori untuk ambil nama kategori
    cursor.execute('''
        SELECT b.id, b.title, b.author, b.stock, b.image, b.description, b.category_id, c.name AS category
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
    ''')
    books = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(books), 200

@books_bp.route('/search', methods=['GET'])
@jwt_required()
def search_books():
    title = request.args.get('title', '')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('''
        SELECT b.id, b.title, b.author, b.stock, b.image, b.description, b.category_id, c.name AS category
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.title LIKE %s
    ''', (f'%{title}%',))
    books = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(books), 200

@books_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_book_detail(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('''
        SELECT b.id, b.title, b.author, b.stock, b.image, b.description, b.category_id, c.name AS category
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.id = %s
    ''', (id,))
    book = cursor.fetchone()
    cursor.close()
    conn.close()
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    return jsonify(book), 200

@books_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def add_book():
    if not request.form.get('title') or not request.form.get('author'):
        return jsonify({'error': 'Title and author are required'}), 400
    
    title = request.form.get('title').strip()
    author = request.form.get('author').strip()
    stock = request.form.get('stock', type=int, default=0)
    description = request.form.get('description', '').strip()
    category_id = request.form.get('category_id') or None

    if stock < 0:
        return jsonify({'error': 'Stock cannot be negative'}), 400

    image_url = None
    if 'file' in request.files:
        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            image_url = f'/uploads/{filename}'
        else:
            return jsonify({'error': 'Invalid or no file provided'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO books (title, author, stock, image, description, category_id) VALUES (%s, %s, %s, %s, %s, %s)', 
            (title, author, stock, image_url, description, category_id)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Failed to add book: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()
    return jsonify({'message': 'Book added'}), 201

@books_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_book(id):
    if not request.form.get('title') or not request.form.get('author'):
        return jsonify({'error': 'Title and author are required'}), 400
    
    title = request.form.get('title').strip()
    author = request.form.get('author').strip()
    stock = request.form.get('stock', type=int)
    description = request.form.get('description', '').strip()
    category_id = request.form.get('category_id') or None

    if stock is None or stock < 0:
        return jsonify({'error': 'Invalid or negative stock value'}), 400

    image_url = None
    if 'file' in request.files:
        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            image_url = f'/uploads/{filename}'

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if image_url:
            cursor.execute(
                'UPDATE books SET title = %s, author = %s, stock = %s, image = %s, description = %s, category_id = %s WHERE id = %s', 
                (title, author, stock, image_url, description, category_id, id)
            )
        else:
            cursor.execute(
                'UPDATE books SET title = %s, author = %s, stock = %s, description = %s, category_id = %s WHERE id = %s', 
                (title, author, stock, description, category_id, id)
            )
        if cursor.rowcount == 0:
            return jsonify({'error': 'Book not found'}), 404
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Failed to update book: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()
    return jsonify({'message': 'Book updated'}), 200

@books_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_book(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM books WHERE id = %s', (id,))
        if cursor.rowcount == 0:
            return jsonify({'error': 'Book not found'}), 404
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Failed to delete book: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()
    return jsonify({'message': 'Book deleted'}), 200

@books_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)