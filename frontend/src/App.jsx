import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import BookDetail from './components/BookDetail';
import Users from './pages/Users';
import Borrows from './pages/Borrows';
import Returns from './pages/Returns';
import BorrowHistory from './components/BorrowHistory';
import AdminRoute from './components/AdminRoute';
import MahasiswaRoute from './components/MahasiswaRoute';
import './index.css';

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

const AppRoutes = () => {
  const { loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/books" element={<Books />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
        <Route path="/borrows" element={<AdminRoute><Borrows /></AdminRoute>} />
        <Route path="/returns" element={<AdminRoute><Returns /></AdminRoute>} />
        <Route path="/history" element={<MahasiswaRoute><BorrowHistory /></MahasiswaRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;