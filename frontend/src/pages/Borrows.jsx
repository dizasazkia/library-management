import { useState, useEffect } from 'react';
import { getBorrows } from '../api';

const Borrows = () => {
  const [borrows, setBorrows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBorrows();
  }, []);

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      const res = await getBorrows();
      setBorrows(res.data.data);
    } catch (err) {
      setError('Gagal mengambil data peminjaman');
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Daftar Peminjaman</h2>
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
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {borrows.map((borrow) => (
              <tr key={borrow.id}>
                <td>{borrow.id}</td>
                <td>{borrow.username}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Borrows;