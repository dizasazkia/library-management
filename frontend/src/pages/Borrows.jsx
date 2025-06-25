import { useState, useEffect } from 'react';
import { getBorrows } from '../api';
import { FaSearch } from 'react-icons/fa';

const Borrows = () => {
  const [borrows, setBorrows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

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
    <div className="p-4 mt-10 px-12 py-12">
      <div className="flex flex-wrap justify-between items-center mb-10 gap-4">
        <h2 className="text-lg font-bold px-4 py-2 bg-[#CCDDFB] text-white shadow-md rounded-full inline-block max-w-fit">
          Borrowing List
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

      {/* Error & Loading */}
      {error && <div className="alert alert-error mb-4">{error}</div>}
      {loading && <div className="loading loading-spinner text-black loading-lg mb-4"></div>}

      {/* Tabel Data */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead className="bg-gray-100 text-black">
            <tr>
              <th>Username</th>
              <th>Book Title</th>
              <th>Borrow Date</th>
              <th>Status</th>
              <th>Return Date</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {borrows
              .filter((b) =>
                b.username.toLowerCase().includes(search.toLowerCase()) ||
                b.title.toLowerCase().includes(search.toLowerCase())
              )
              .map((borrow) => (
                <tr key={borrow.id}>
                  <td>{borrow.username}</td>
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
                    {borrow.status === 'dikembalikan' && borrow.actual_return_date
                      ? new Date(borrow.actual_return_date).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Borrows;
