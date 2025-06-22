import { useState, useEffect, useContext, useRef } from 'react';
import { getBooks, searchBooks, addBook, updateBook, deleteBook, borrowBook } from '../api';
import { getCategories, addCategory } from '../api';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const BookList = () => {
  const { user } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [newBook, setNewBook] = useState({ title: '', author: '', stock: '', file: null, category_id: '', newCategory: '', description: '' });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBooks();
  }, [search]);

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
      const res = search ? await searchBooks(search) : await getBooks();
      setBooks(res.data);
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
        // Refresh kategori agar langsung muncul di dropdown
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
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Daftar Buku</h2>
      
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
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Cari buku..."
          className="input input-bordered w-full md:w-96"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari buku berdasarkan judul"
        />
      </div>

      {user.role === 'admin' && (
        <div className="mb-8 p-4 bg-base-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">
            {editingBook ? 'Edit Buku' : 'Tambah Buku Baru'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Judul</span>
              </label>
              <input
                type="text"
                placeholder="Judul buku"
                className="input input-bordered"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Penulis</span>
              </label>
              <input
                type="text"
                placeholder="Penulis buku"
                className="input input-bordered"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Stok</span>
              </label>
              <input
                type="number"
                placeholder="Jumlah stok"
                className="input input-bordered"
                value={newBook.stock}
                onChange={(e) => setNewBook({ ...newBook, stock: e.target.value })}
                min="0"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Deskripsi</span>
              </label>
              <textarea
                className="textarea textarea-bordered"
                placeholder="Deskripsi buku"
                value={newBook.description || ''}
                onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Kategori</span>
              </label>
              <select
                className="select select-bordered"
                value={newBook.category_id || ''}
                onChange={e => setNewBook({ ...newBook, category_id: e.target.value })}
                required
              >
                <option value="">Pilih Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
                <option value="other">Other</option>
              </select>
              {newBook.category_id === "other" && (
                <input
                  type="text"
                  className="input input-bordered mt-2"
                  placeholder="Kategori baru"
                  value={newBook.newCategory || ''}
                  onChange={e => setNewBook({ ...newBook, newCategory: e.target.value })}
                  required
                />
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Sampul Buku</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="file-input file-input-bordered w-full"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {preview && (
            <div className="mt-4">
              <p className="text-sm mb-2">Pratinjau:</p>
              <img
                src={preview}
                alt="Pratinjau sampul buku"
                className="w-32 h-32 object-contain border rounded"
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
              <button className="btn btn-ghost" onClick={resetForm}>
                Batal
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <div key={book.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <figure className="px-4 pt-4">
              {book.image ? (
                <img
                  src={`http://localhost:5000${book.image}`}
                  alt={`Sampul buku ${book.title}`}
                  className="rounded-xl h-48 w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-book.jpg';
                  }}
                />
              ) : (
                <div className="h-48 w-full bg-gray-200 rounded-xl flex items-center justify-center">
                  <span className="text-gray-500">Tidak ada gambar</span>
                </div>
              )}
            </figure>
            <div className="card-body">
              <h3 className="card-title">{book.title}</h3>
              <p><span className="font-semibold">Penulis:</span> {book.author}</p>
              <p><span className="font-semibold">Stok:</span> {book.stock}</p>
              <p><span className="font-semibold">Kategori:</span> {book.category || '-'}</p>
              <div className="card-actions justify-end mt-2">
                <Link to={`/books/${book.id}`} className="btn btn-info btn-sm">
                  Detail
                </Link>
                {user.role === 'mahasiswa' && book.stock > 0 && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleBorrow(book.id)}
                    disabled={operationLoading}
                  >
                    {operationLoading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      'Pinjam'
                    )}
                  </button>
                )}
                {user.role === 'admin' && (
                  <div className="flex gap-2">
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => handleEditClick(book)}
                      disabled={operationLoading}
                    >
                      {operationLoading ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        'Edit'
                      )}
                    </button>
                    <button
                      className="btn btn-error btn-sm"
                      onClick={() => handleDeleteBook(book.id)}
                      disabled={operationLoading}
                    >
                      {operationLoading ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        'Hapus'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookList;