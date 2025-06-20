import { useState, useEffect, useContext } from 'react';
import { getBorrows, confirmReturn } from '../api';
import { AuthContext } from '../context/AuthContext';

const ReturnRequest = () => {
  const { user } = useContext(AuthContext);
  const [borrows, setBorrows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBorrows();
    }
  }, [user?.role]);

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      const res = await getBorrows();
      // Filter hanya permintaan pengembalian yang pending dan punya return_id
      const filteredBorrows = res.data.data.filter(
        b => b.return_status === 'pending' && b.return_id
      );
      setBorrows(filteredBorrows);
    } catch (err) {
      setError('Gagal mengambil data pengembalian');
      console.error('Error fetching borrows:', err);
    }
    setLoading(false);
  };

  const handleConfirmReturn = async (returnId) => {
    setProcessing(returnId);
    setError('');
    try {
      await confirmReturn(returnId);
      fetchBorrows();
    } catch (err) {
      setError('Gagal mengonfirmasi pengembalian');
      console.error('Error confirming return:', err);
    }
    setProcessing(null);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Permintaan Pengembalian Buku</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading loading-spinner"></div>}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Pengguna</th>
              <th>Judul Buku</th>
              <th>Tanggal Pinjam</th>
              <th>Status Peminjaman</th>
              <th>Status Pengembalian</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {borrows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center">Tidak ada permintaan pengembalian</td>
              </tr>
            )}
            {borrows.map((borrow) => (
              <tr key={borrow.return_id}>
                <td>{borrow.id}</td>
                <td>{borrow.username || '-'}</td>
                <td>{borrow.title}</td>
                <td>
                  {borrow.borrow_date
                    ? new Date(borrow.borrow_date).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '-'}
                </td>
                <td>{borrow.status}</td>
                <td>
                  {borrow.return_status === 'pending' && (
                    <span className="badge badge-warning">Pending</span>
                  )}
                  {borrow.return_status === 'confirmed' && (
                    <span className="badge badge-success">Dikonfirmasi</span>
                  )}
                </td>
                <td>
                  {user?.role === 'admin' && borrow.return_status === 'pending' && (
                    <button
                      className="btn btn-success btn-xs"
                      onClick={() => handleConfirmReturn(borrow.return_id)}
                      disabled={processing === borrow.return_id}
                    >
                      {processing === borrow.return_id ? 'Memproses...' : 'Konfirmasi Pengembalian'}
                    </button>
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

export default ReturnRequest;