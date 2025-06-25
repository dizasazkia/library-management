import { useState, useEffect, useContext } from 'react';
import { getBorrows, confirmReturn } from '../api';
import { AuthContext } from '../context/AuthContext';
import { FaSearch } from 'react-icons/fa';

const ReturnRequest = () => {
  const { user } = useContext(AuthContext);
  const [borrows, setBorrows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBorrows();
    }
  }, [user?.role]);

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      const res = await getBorrows();
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
    <div className="p-4 mt-10 px-12 py-12">
      {/* Header + Search */}
      <div className="flex flex-wrap justify-between items-center mb-10 gap-4">
        <h2 className="text-lg font-bold px-4 py-2 bg-[#CCDDFB] text-white shadow-md rounded-full inline-block max-w-fit">
          Return Request
        </h2>

        <div className="relative w-full md:w-64">
          <FaSearch className="absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 rounded-lg bg-blue-100 text-gray-700 w-full outline-none focus:ring-2 focus:ring-blue-300 transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {loading && <div className="loading loading-spinner text-black loading-lg mb-4"></div>}

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead className="bg-gray-100 text-black">
            <tr>
              <th>Username</th>
              <th>Book Title</th>
              <th>Borrow Date</th>
              <th>Borrow Status</th>
              <th>Return Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {borrows
              .filter((b) =>
                b.username.toLowerCase().includes(search.toLowerCase()) ||
                b.title.toLowerCase().includes(search.toLowerCase())
              )
              .map((borrow) => (
                <tr key={borrow.return_id}>
                  <td>{borrow.username || '-'}</td>
                  <td>{borrow.title}</td>
                  <td>
                    {borrow.borrow_date
                      ? new Date(borrow.borrow_date).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </td>
                  <td>{borrow.status}</td>
                  <td>
                    {borrow.return_status === 'pending' && (
                      <span className="badge badge-warning">Pending</span>
                    )}
                    {borrow.return_status === 'confirmed' && (
                      <span className="badge badge-success">Confirmed</span>
                    )}
                  </td>
                  <td>
                    {user?.role === 'admin' && borrow.return_status === 'pending' && (
                      <button
                        className="btn btn-success btn-xs"
                        onClick={() => handleConfirmReturn(borrow.return_id)}
                        disabled={processing === borrow.return_id}
                      >
                        {processing === borrow.return_id ? 'Memproses...' : 'Return Confirmation'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}

            {borrows.filter((b) =>
              b.username.toLowerCase().includes(search.toLowerCase()) ||
              b.title.toLowerCase().includes(search.toLowerCase())
            ).length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  No return request.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReturnRequest;
