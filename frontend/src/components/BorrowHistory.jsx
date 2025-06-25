import { useState, useEffect, useContext } from 'react';
import { getBorrowHistory, requestReturn, getBookRating, rateBook } from '../api';
import { AuthContext } from '../context/AuthContext';

const BorrowHistory = () => {
  const { user } = useContext(AuthContext);
  const [borrows, setBorrows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [ratingInput, setRatingInput] = useState({});
  const [ratingLoading, setRatingLoading] = useState({});

  useEffect(() => {
    fetchBorrows();
    // eslint-disable-next-line
  }, []);

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      const res = await getBorrowHistory();
      setBorrows(res.data.data);
    } catch (err) {
      setError('Gagal mengambil riwayat peminjaman');
    }
    setLoading(false);
  };

  const handleRequestReturn = async (borrowId) => {
    setProcessing(borrowId);
    setError('');
    try {
      await requestReturn(borrowId);
      fetchBorrows();
    } catch (err) {
      setError('Gagal mengajukan pengembalian');
    }
    setProcessing(null);
  };

  const handleRateBook = async (bookId, rating) => {
    setRatingLoading((prev) => ({ ...prev, [bookId]: true }));
    try {
      await rateBook(bookId, rating);
      fetchBorrows(); // Refresh data
    } catch (err) {
      setError('Gagal menyimpan rating');
    }
    setRatingLoading((prev) => ({ ...prev, [bookId]: false }));
  };

    return (
    <div className="p-4 px-12 py-12">
      <h2 className="text-lg font-bold text-left px-4 py-2 bg-[#CCDDFB] text-white shadow-md rounded-full inline-block max-w-fit ml-0 mb-10 mt-8">
        Riwayat Peminjaman
      </h2>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading loading-spinner"></div>}

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead className="bg-gray-200 text-black">
            <tr>
              <th className="text-left w-1/6 pl-20">Judul Buku</th>
              <th className="text-center w-1/6">Tanggal Pinjam</th>
              <th className="text-center w-1/6">Status</th>
              <th className="text-center w-1/6">Tanggal Pengembalian</th>
              <th className="text-right w-1/6 pr-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {borrows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  Tidak ada riwayat peminjaman
                </td>
              </tr>
            )}

            {borrows.map((borrow) => (
              <tr key={`${borrow.id}-${borrow.return_status}`}>
                <td className="text-left pl-12">{borrow.title}</td>

                <td className="text-center">
                  {borrow.borrow_date
                    ? new Date(borrow.borrow_date).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '-'}
                </td>

                <td className="text-center">
                  {borrow.status === 'dikembalikan' ? (
                    <span className="badge badge-success">Dikembalikan</span>
                  ) : borrow.return_status === 'pending' ? (
                    <span className="badge badge-warning">Menunggu Konfirmasi</span>
                  ) : (
                    <span className="badge badge-info">Dipinjam</span>
                  )}
                </td>

                <td className="text-center">
                  {borrow.status === 'dikembalikan' && borrow.actual_return_date
                    ? new Date(borrow.actual_return_date).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '-'}
                </td>

                <td className="text-right pr-12">
                  {borrow.status === 'dikembalikan' ? (
                    borrow.user_rating ? (
                      <span>
                        {'★'.repeat(borrow.user_rating)}
                        {'☆'.repeat(5 - borrow.user_rating)}
                        <span className="ml-2 text-green-600">Terima kasih atas ratingnya!</span>
                      </span>
                    ) : (
                      <div>
                        <span className="mr-1">Beri rating: </span>
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            className={`text-xl ${
                              val <= (ratingInput[borrow.book_id] || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-400'
                            }`}
                            disabled={ratingLoading[borrow.book_id]}
                            onClick={() => {
                              setRatingInput((prev) => ({
                                ...prev,
                                [borrow.book_id]: val
                              }));
                              handleRateBook(borrow.book_id, val);
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    )
                  ) : borrow.return_status === 'pending' ? (
                    <span className="text-yellow-600">Menunggu konfirmasi admin</span>
                  ) : (
                    user?.role === 'mahasiswa' && (
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => handleRequestReturn(borrow.id)}
                        disabled={processing === borrow.id}
                      >
                        {processing === borrow.id ? 'Memproses...' : 'Ajukan Pengembalian'}
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BorrowHistory;