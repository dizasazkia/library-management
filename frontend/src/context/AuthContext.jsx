import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userData = typeof decoded.sub === "string" ? JSON.parse(decoded.sub) : decoded.sub;
        setUser({ id: userData.id, role: userData.role });
        localStorage.setItem('user', JSON.stringify({ id: userData.id, role: userData.role }));
      } catch (error) {
        console.error('Token decoding error:', error);
        logout();
      }
    } else {
      setUser(null);
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    const userData = typeof decoded.sub === "string" ? JSON.parse(decoded.sub) : decoded.sub;
    setUser({ id: userData.id, role: userData.role });
    localStorage.setItem('user', JSON.stringify({ id: userData.id, role: userData.role }));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};