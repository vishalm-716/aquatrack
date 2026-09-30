import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('aquatrack_token');
    const storedUser = localStorage.getItem('aquatrack_user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('aquatrack_token');
        localStorage.removeItem('aquatrack_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('aquatrack_token', token);
    localStorage.setItem('aquatrack_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('aquatrack_token');
    localStorage.removeItem('aquatrack_user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isResearcher = user?.role === 'researcher';
  const canWrite = isAdmin || isResearcher;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isResearcher, canWrite }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
