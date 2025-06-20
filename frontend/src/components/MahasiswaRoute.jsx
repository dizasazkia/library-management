import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const MahasiswaRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return user && user.role === 'mahasiswa' ? children : <Navigate to="/login" />;
};

export default MahasiswaRoute;