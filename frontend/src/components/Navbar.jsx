import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Kiri - Logo */}
        <div className="text-xl font-bold text-black">
          <Link to="/">ReadWay</Link>
        </div>

        {/* Tengah - Menu */}
        <div className="flex space-x-8 text-lg font-medium">
          {user?.role === 'mahasiswa' && (
            <>
              <Link to="/dashboard" className="text-black hover:text-blue-600">Home</Link>
              <Link to="/books" className="text-black hover:text-blue-600">Book</Link>
              <Link to="/history" className="text-black hover:text-blue-600">History</Link>
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <Link to="/books" className="text-black hover:text-blue-600">Books</Link>
              <Link to="/users" className="text-black hover:text-blue-600">Users</Link>
              <Link to="/borrows" className="text-black hover:text-blue-600">Borrowing</Link>
              <Link to="/returns" className="text-black hover:text-blue-600">Return</Link>
            </>
          )}
        </div>

        {/* Kanan - User Profile / Login */}
        <div className="relative">
          {user ? (
            <div className="group inline-block relative">
              {/* Avatar + Info */}
              <div className="flex items-center cursor-pointer space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center font-semibold text-lg">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-black font-bold text-md">{user.username}</span>
                  <span className="text-xs text-gray-600 capitalize">{user.role}</span>
                </div>
              </div>

              {/* Dropdown Logout */}
              <div className="absolute right-0 mt-2 bg-white border shadow-md rounded-md opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 w-40 z-50">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-md text-left px-3 py-2 bg-[#CCDDFB] text-white rounded-md hover:bg-blue-400 transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
