import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getBookById } from '../api';

const BookDetail = () => {
    const { id } = useParams();
    const [book, setBook] = useState(null);

    useEffect(() => {
    getBookById(id).then(res => setBook(res.data));
    }, [id]);

    if (!book) return <div>Loading...</div>;

    return (
    <div className="p-4">
        <h2 className="text-2xl font-bold mb-2">{book.title}</h2>
        <p className="mb-2"><b>Penulis:</b> {book.author}</p>
        <p className="mb-2"><b>Stok:</b> {book.stock}</p>
        <p className="mb-2"><b>Deskripsi:</b> {book.description}</p>
        {book.image && <img src={`http://localhost:5000${book.image}`} alt={book.title} className="w-64 mt-4" />}
    </div>
    );
};

export default BookDetail;