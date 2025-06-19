import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

// ...existing code...
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Pastikan kita selalu mendapatkan object yang konsisten
        const userData = typeof decoded.sub === "string" ? JSON.parse(decoded.sub) : decoded.sub;
        setUser({ id: userData.id, role: userData.role });
      } catch (error) {
        console.error('Token decoding error:', error);
        logout();
      }
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    const userData = typeof decoded.sub === "string" ? JSON.parse(decoded.sub) : decoded.sub;
    setUser({ id: userData.id, role: userData.role });
  };


  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};