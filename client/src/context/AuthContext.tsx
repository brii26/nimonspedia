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

  useEffect(() => {
    const initAuth = async() => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/admin/me');      
          if (response.data.status === 'success') {
            setAdmin({ 
              token, 
              ...response.data.data
            });
          } 
      } catch (error) {
        console.error("Token tidak valid atau expired:", error);
        localStorage.removeItem('admin_token');
        setAdmin(null);
      } finally {
          setLoading(false);
      }
    };
    
    initAuth();
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