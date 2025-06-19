import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="navbar bg-white shadow-md border-b border-blue-200">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl text-blue-600">Sistem Perpustakaan</Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          {user ? (
            <>
              {user.role === 'admin' && (
                <>
                  <li><Link to="/books" className="text-blue-600 hover:bg-blue-100">Kelola Buku</Link></li>
                  <li><Link to="/users" className="text-blue-600 hover:bg-blue-100">Kelola Pengguna</Link></li>
                  <li><Link to="/borrows" className="text-blue-600 hover:bg-blue-100">Peminjaman</Link></li>
                  <li><Link to="/returns" className="text-blue-600 hover:bg-blue-100">Pengembalian</Link></li>
                </>
              )}
              {user.role === 'mahasiswa' && (
                <>
                  <li><Link to="/books" className="text-blue-600 hover:bg-blue-100">Buku</Link></li>
                  <li><Link to="/history" className="text-blue-600 hover:bg-blue-100">Riwayat Peminjaman</Link></li>
                </>
              )}
              <li>
                <button className="btn bg-blue-500 text-white hover:bg-blue-600" onClick={handleLogout}>Keluar</button>
              </li>
            </>
          ) : (
            <li><Link to="/login" className="text-blue-600 hover:bg-blue-100">Masuk</Link></li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Navbar;