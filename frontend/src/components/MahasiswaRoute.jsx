import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const MahasiswaRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user && user.role === 'mahasiswa' ? children : <Navigate to="/login" />;
};

export default MahasiswaRoute;