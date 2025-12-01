import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api/axios.js';

// Define interfaces
interface Admin {
  token: string;
  id?: string;
  email?: string;
  [key: string]: any;
}

interface LoginResponse {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  admin: Admin | null;
  loading: boolean;
  loginAdmin: (email: string, password: string) => Promise<LoginResponse>;
  logoutAdmin: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  console.log('AuthProvider initialized'); // Debug log

  useEffect(() => {
    console.log('AuthProvider useEffect running'); // Debug log
    const token = localStorage.getItem('admin_token');
    if (token) {
      // TODO: Validasi token ke server
      setAdmin({ token }); 
    }
    setLoading(false);
  }, []);

  const loginAdmin = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await api.post('/admin/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('admin_token', token);
      setAdmin({ ...user, token });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as any)?.response?.data?.message || 'Login failed';
      
      return { 
        success: false, 
        message: errorMessage
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};