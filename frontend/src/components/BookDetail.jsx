// filepath: [BookDetail.jsx](http://_vscodecontentref_/2)
import { useParams } from 'react-router-dom';
import { useEffect, useState, useContext } from 'react';
import { getBookById, getBookRating, borrowBook } from '../api';
import { AuthContext } from '../context/AuthContext';

const BookDetail = () => {
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [rating, setRating] = useState(null);
    const [error, setError] = useState('');
    const { user } = useContext(AuthContext);

    useEffect(() => {
        getBookById(id).then(res => setBook(res.data));
        getBookRating(id).then(res => setRating(res.data.avg_rating));
    }, [id]);

    const handleBorrow = async () => {
        try {
            const res = await borrowBook(id);
            if (res.data.success) {
                alert('Buku berhasil dipinjam!');
            } else {
                setError(res.data.message || 'Gagal meminjam buku');
            }
        } catch (err) {
            setError('Gagal meminjam buku');
        }
    };

    if (!book) return <div>Loading...</div>;

    return (
        <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-md p-8 max-w-3xl mx-auto mt-8">
            {/* Gambar Buku */}
            <div className="flex-shrink-0 flex flex-col items-center">
                {book.image ? (
                    <img
                        src={`http://localhost:5000${book.image}`}
                        alt={book.title}
                        className="rounded-lg object-cover"
                        style={{ width: 160, height: 200 }}
                    />
                ) : (
                    <div className="bg-gray-200 rounded-lg flex items-center justify-center" style={{ width: 160, height: 200 }}>
                        <span className="text-gray-400">No Image</span>
                    </div>
                )}
            </div>
            {/* Info Buku */}
            <div className="ml-8 flex-1">
                <h2 className="text-3xl font-bold mb-2">{book.title}</h2>
                <div className="text-xl mb-2">By {book.author}</div>
                <div className="mb-2 text-gray-600">Kategori: {book.category || '-'}</div>
                <div className="flex items-center mb-4">
                    {rating
                        ? <>
                            <span className="text-yellow-400 text-2xl">
                                {'★'.repeat(Math.round(rating))}
                                {'☆'.repeat(5 - Math.round(rating))}
                            </span>
                            <span className="ml-2 text-gray-500 text-sm">
                                ({Number(rating).toFixed(2)})
                            </span>
                        </>
                        : <span className="text-gray-400">Belum ada rating</span>
                    }
                </div>
                {user?.role === 'mahasiswa' && book.stock > 0 && (
                    <button
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg text-lg font-semibold hover:bg-blue-600 transition mb-4"
                        onClick={handleBorrow}
                    >
                        Borrow Now
                    </button>
                )}
                {error && <div className="text-red-500 mb-2">{error}</div>}
                <div>
                    <div className="font-semibold text-lg mb-1">Description</div>
                    <div className="bg-gray-100 rounded-lg p-4 text-gray-700">{book.description}</div>
                </div>
            </div>
        </div>
    );
};

export default BookDetail;