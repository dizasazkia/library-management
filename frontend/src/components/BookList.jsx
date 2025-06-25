import { useState, useEffect, useContext, useRef } from 'react';
import { getBooks, searchBooks, addBook, updateBook, deleteBook, borrowBook } from '../api';
import { getCategories, addCategory, getBookRating } from '../api';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaSearch, FaChevronDown } from 'react-icons/fa';

const BookList = () => {
  const { user } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', stock: '', file: null, category_id: '', newCategory: '', description: '' });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookRatings, setBookRatings] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBooks();
  }, [search, selectedCategory]); // Add selectedCategory as dependency

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data));
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = search 
        ? await searchBooks(search, selectedCategory) // Pass selectedCategory to searchBooks
        : await getBooks(selectedCategory); // Pass selectedCategory to getBooks
      setBooks(res.data);
      const ratings = {};
      await Promise.all(
        res.data.map(async (book) => {
          try {
            const ratingRes = await getBookRating(book.id);
            ratings[book.id] = ratingRes.data.avg_rating;
          } catch {
            ratings[book.id] = null;
          }
        })
      );
      setBookRatings(ratings);
    } catch (err) {
      console.error('Fetch error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Gagal mengambil data buku');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async () => {
    if (!newBook.title.trim() || !newBook.author.trim()) {
      setError('Judul dan penulis harus diisi');
      return;
    }
    if (newBook.stock === '' || isNaN(newBook.stock) || Number(newBook.stock) < 0) {
      setError('Stok harus berupa angka tidak negatif');
      return;
    }
    if (!newBook.category_id) {
      setError('Kategori harus dipilih');
      return;
    }
    if (newBook.category_id === "other" && !newBook.newCategory.trim()) {
      setError('Kategori baru harus diisi');
      return;
    }

    setOperationLoading(true);
    try {
      let categoryId = newBook.category_id;
      if (categoryId === "other" && newBook.newCategory) {
        const res = await addCategory({ name: newBook.newCategory });
        categoryId = res.data.id;
        getCategories().then(res => setCategories(res.data));
      }

      const formData = new FormData();
      formData.append('title', newBook.title.trim());
      formData.append('author', newBook.author.trim());
      formData.append('stock', Number(newBook.stock));
      formData.append('description', newBook.description || '');
      formData.append('category_id', categoryId);
      if (newBook.file) {
        formData.append('file', newBook.file);
      }

      await addBook(formData);
      resetForm();
      fetchBooks();
    } catch (err) {
      console.error('Add book error:', err);
      setError(err.response?.data?.error || 'Gagal menambah buku');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleUpdateBook = async (id) => {
    if (!newBook.title.trim() || !newBook.author.trim()) {
      setError('Judul dan penulis harus diisi');
      return;
    }
    if (newBook.stock === '' || isNaN(newBook.stock) || Number(newBook.stock) < 0) {
      setError('Stok harus berupa angka tidak negatif');
      return;
    }
    if (!newBook.category_id) {
      setError('Kategori harus dipilih');
      return;
    }
    if (newBook.category_id === "other" && !newBook.newCategory.trim()) {
      setError('Kategori baru harus diisi');
      return;
    }

    setOperationLoading(true);
    try {
      let categoryId = newBook.category_id;
      if (categoryId === "other" && newBook.newCategory) {
        const res = await addCategory({ name: newBook.newCategory });
        categoryId = res.data.id;
        getCategories().then(res => setCategories(res.data));
      }

      const formData = new FormData();
      formData.append('title', newBook.title.trim());
      formData.append('author', newBook.author.trim());
      formData.append('stock', Number(newBook.stock));
      formData.append('description', newBook.description || '');
      formData.append('category_id', categoryId);
      if (newBook.file) {
        formData.append('file', newBook.file);
      }

      await updateBook(id, formData);
      resetForm();
      fetchBooks();
    } catch (err) {
      console.error('Update book error:', err);
      setError(err.response?.data?.error || 'Gagal memperbarui buku');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteBook = async (id) => {
    setOperationLoading(true);
    try {
      await deleteBook(id);
      fetchBooks();
    } catch (err) {
      console.error('Delete book error:', err);
      setError(err.response?.data?.error || 'Gagal menghapus buku');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleBorrow = async (bookId) => {
    setOperationLoading(true);
    try {
      const response = await borrowBook(bookId);
      if (response.data.success) {
        setError('');
        fetchBooks();
        alert(`Buku "${response.data.data.book_title}" berhasil dipinjam! 
              Tanggal pengembalian: ${response.data.data.return_date}
              Stok tersisa: ${response.data.data.remaining_stock}`);
      } else {
        setError(response.data.message || 'Gagal meminjam buku');
      }
    } catch (err) {
      console.error('Borrow error:', err);
      if (err.response) {
        setError(err.response.data?.message || err.response.data?.error || 'Terjadi kesalahan pada server');
      } else {
        setError('Tidak dapat terhubung ke server');
      }
    } finally {
      setOperationLoading(false);
    }
  };

  const handleEditClick = (book) => {
    setEditingBook(book.id);
    setNewBook({ 
      title: book.title, 
      author: book.author, 
      stock: book.stock, 
      file: null,
      category_id: book.category_id || '',
      newCategory: '',
      description: book.description || ''
    });
    setPreview(book.image ? `http://localhost:5000${book.image}` : null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setError('File harus berupa gambar (PNG, JPG, JPEG)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file tidak boleh melebihi 5MB');
        return;
      }
      setNewBook({ ...newBook, file });
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const resetForm = () => {
    setNewBook({ title: '', author: '', stock: '', file: null, category_id: '', newCategory: '', description: '' });
    setPreview(null);
    setEditingBook(null);
    setShowForm(false); // <- tutup form saat batal
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-white px-12 py-12">
      {/* Header dan Search */}
      <div className="flex flex-wrap justify-between items-center mb-10 mt-10">
        {/* Judul Daftar Buku */}
        <h2 className="text-lg font-bold px-4 py-2 bg-[#CCDDFB] text-white shadow-md rounded-full inline-block max-w-fit">
          Book List
        </h2>

        {/* Kategori Dropdown + Search */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* Kategori Dropdown */}
          <div className="relative">
            <select
              className="bg-blue-200 text-white font-semibold rounded-lg px-4 py-2 pr-7 shadow outline-none appearance-none cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <FaChevronDown className="absolute right-3 top-3 text-white text-sm pointer-events-none" />
          </div>

          {/* Search input */}
          <div className="relative w-full md:w-64">
            <FaSearch className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search book by title..."
              className="pl-10 pr-4 py-2 rounded-lg bg-blue-100 text-gray-700 w-full outline-none focus:ring-2 focus:ring-blue-300 transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tombol Tambah Buku Baru */}
      {user.role === 'admin' && !showForm && !editingBook && (
        <div className="flex justify-end mb-6">
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            Add New Book
          </button>
        </div>
      )}

      {/* Error & Loading */}
      {error && (
        <div role="alert" className="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      {loading && (
        <div className="flex justify-center mb-4">
          <span className="loading loading-spinner text-black loading-lg"></span>
        </div>
      )}

      {user.role === 'admin' && (showForm || editingBook) && (
        <div className="relative mb-8 p-6 bg-white rounded-xl border border-gray-300 shadow-md">
          {/* Tombol close */}
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition text-xl font-bold"
            onClick={resetForm}
            title="Tutup Form"
          >
            ×
          </button>

          <h3 className="text-lg font-semibold mb-3 text-blue-800">
            {editingBook ? 'Edit Book' : 'Tambah Buku Baru'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="form-control text-black">
              <label className="label">
                <span className="label-text">Title</span>
              </label>
              <input
                type="text"
                placeholder="Judul buku"
                className="input input-bordered bg-blue-100 text-gray-700"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                required
              />
            </div>

            <div className="form-control text-black">
              <label className="label">
                <span className="label-text">Author</span>
              </label>
              <input
                type="text"
                placeholder="Penulis buku"
                className="input input-bordered bg-blue-100 text-gray-700"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                required
              />
            </div>

            <div className="form-control text-black">
              <label className="label">
                <span className="label-text">Stock</span>
              </label>
              <input
                type="number"
                placeholder="Jumlah stok"
                className="input input-bordered bg-blue-100 text-gray-700"
                value={newBook.stock}
                onChange={(e) => setNewBook({ ...newBook, stock: e.target.value })}
                min="0"
                required
              />
            </div>

            <div className="form-control text-black ">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered bg-blue-100 text-gray-700"
                placeholder="Deskripsi buku"
                value={newBook.description || ''}
                onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
              />
            </div>

            <div className="form-control text-black">
              <label className="label">
                <span className="label-text">Category</span>
              </label>
              <select
                className="select select-bordered bg-blue-100 text-gray-700"
                value={newBook.category_id || ''}
                onChange={e => setNewBook({ ...newBook, category_id: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
                <option value="other">Other</option>
              </select>
              {newBook.category_id === "other" && (
                <input
                  type="text"
                  className="input input-bordered mt-2 bg-blue-100 text-gray-700"
                  placeholder="Kategori baru"
                  value={newBook.newCategory || ''}
                  onChange={e => setNewBook({ ...newBook, newCategory: e.target.value })}
                  required
                />
              )}
            </div>

            <div className="form-control text-black">
              <label className="label">
                <span className="label-text">Book Cover</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="file-input file-input-bordered w-full bg-blue-100 text-gray-700"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {preview && (
            <div className="mt-4">
              <p className="text-sm mb-2 text-black">Preview:</p>
              <img
                src={preview}
                alt="Pratinjau sampul buku"
                className="w-32 h-48 object-contain border rounded"
              />
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              className="btn btn-primary"
              onClick={editingBook ? () => handleUpdateBook(editingBook) : handleAddBook}
              disabled={operationLoading}
            >
              {operationLoading ? (
                <span className="loading loading-spinner"></span>
              ) : editingBook ? (
                'Perbarui Buku'
              ) : (
                'Tambah Buku'
              )}
            </button>
            
            {editingBook && (
              <button className="btn btn-ghost text-white bg-slate-400" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => (
          <div key={book.id} className="flex items-center text-left w-full mb-4 mt-6">
            <div className="flex-shrink-0 mr-6">
              <div
                className="bg-gray-300 rounded-lg flex items-center justify-center"
                style={{ width: 140, height: 210 }}
              >
                {book.image ? (
                  <img
                    src={`http://localhost:5000${book.image}`}
                    alt={book.title}
                    className="rounded-lg object-cover shadow-lg"
                    style={{ width: 140, height: 210 }}
                  />
                ) : (
                  <svg width="90" height="135" fill="none" viewBox="0 0 24 24">
                    <rect width="90" height="135" rx="10" fill="#d1d5db" />
                    <rect x="20" y="40" width="50" height="12" rx="3" fill="#fff" />
                    <rect x="20" y="70" width="50" height="12" rx="3" fill="#fff" />
                  </svg>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1 text-black">{book.title}</h3>
              <p className="text-sm text-gray-600 mb-1">{book.category || 'Category'}</p>
              <p className="text-sm text-gray-600 mb-1">Stock: {book.stock}</p>

              <div className="flex items-center mb-2">
                {Array(5)
                  .fill()
                  .map((_, i) => (
                    <span
                      key={i}
                      className={
                        bookRatings[book.id] && i < Math.round(bookRatings[book.id])
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }
                    >
                      ★
                    </span>
                  ))}
              </div>

              {/* Tombol Aksi */}
              <div className="mt-2 space-y-2">
                {user.role === 'admin' && (
                  <div className="flex gap-2 mb-3">
                    <button
                      className="text-yellow-400 hover:text-yellow-500 transition"
                      onClick={() => handleEditClick(book)}
                      aria-label="Edit Book"
                    >
                      <FaEdit size={18} />
                    </button>

                    <button
                      className="text-red-500 hover:text-red-700 transition"
                      onClick={() => handleDeleteBook(book.id)}
                      aria-label="Delete Book"
                    >
                      <FaTrash size={18} />
                    </button>
                  </div>
                )}
                <Link
                  to={`/books/${book.id}`}
                  className="inline-block px-4 py-1 bg-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-300 transition"
                >
                  More
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookList;