import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useContext } from 'react';
import { getBookById, getBookRating, borrowBook } from '../api';
import { AuthContext } from '../context/AuthContext';
import { FaArrowLeft } from 'react-icons/fa';

const BookDetail = () => {
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [rating, setRating] = useState(null);
    const [error, setError] = useState('');
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        getBookById(id).then(res => setBook(res.data));
        getBookRating(id).then(res => setRating(res.data.avg_rating));
    }, [id]);

    const handleBorrow = async () => {
        try {
            const res = await borrowBook(id);
            if (res.data.success) {
                alert('Book borrowed successfully!');
            } else {
                setError(res.data.message || 'Failed to borrow the book');
            }
        } catch (err) {
            setError('Failed to borrow the book');
        }
    };

    if (!book) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="max-w-screen-xl mx-auto mt-16 px-6">
            <div className="flex flex-col md:flex-row bg-white rounded-xl  p-8">
                {/* Gambar Buku */}
                <div className="flex-shrink-0 flex flex-col items-center ml-10">
                    {book.image ? (
                        <img
                            src={`http://localhost:5000${book.image}`}
                            alt={book.title}
                            className="rounded-lg object-cover shadow-2xl"
                            style={{ width: 240, height: 340 }}
                        />
                    ) : (
                        <div className="bg-gray-200 rounded-lg flex items-center justify-center" style={{ width: 180, height: 240 }}>
                            <span className="text-gray-400">No Image</span>
                        </div>
                    )}
                </div>

                {/* Info Buku */}
                <div className="md:ml-16 mt-6 md:mt-0 flex-1">
                    <h2 className="text-4xl font-bold text-black mb-4">{book.title}</h2>
                    <div className="text-xl mb-3 text-black">By <span className="font-medium">{book.author}</span></div>
                    <div className="text-lg mb-3 text-gray-600">Category: {book.category || '-'}</div>

                    <div className="flex items-center mb-4">
                        {rating
                            ? <>
                                <span className="text-yellow-400 text-4xl mb-12 mt-4">
                                    {'★'.repeat(Math.round(rating))}
                                    {'☆'.repeat(5 - Math.round(rating))}
                                </span>
                                <span className="ml-2 text-gray-500 text-sm mb-12 mt-4">
                                    ({Number(rating).toFixed(2)})
                                </span>
                            </>
                            : <span className="text-gray-400">No rating yet</span>
                        }
                    </div>

                    {user?.role === 'mahasiswa' && book.stock > 0 && (
                        <button
                            className="px-5 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition"
                            onClick={handleBorrow}
                        >
                            Borrow Now
                        </button>
                    )}

                    {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
                </div>
            </div>

            {/* Description */}
            <div className="mt-10">
                <div className="text-lg font-bold text-left px-4 py-2 mt-4 bg-[#CCDDFB] text-white  shadow-md rounded-full inline-block max-w-fit mb-6">
                    Description
                </div>
                <div className="bg-[#F4F7FB] rounded-xl p-5 text-gray-700 text-justify">
                    {book.description}
                </div>
            </div>

            {/* Tombol Back */}
            <div className="mt-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                    <FaArrowLeft className="mr-2" />
                    Back
                </button>
            </div>
        </div>
    );
};

export default BookDetail;
