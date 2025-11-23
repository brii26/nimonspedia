import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      // TODO: Validasi token ke server
      setAdmin({ token }); 
    }
    setLoading(false);
  }, []);

  const loginAdmin = async (email, password) => {
    try {
      const response = await api.post('/admin/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('admin_token', token);
      setAdmin({ ...user, token });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
    window.location.href = '/admin/login';
  };

  return (
    <AuthContext.Provider value={{ admin, loginAdmin, logoutAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);