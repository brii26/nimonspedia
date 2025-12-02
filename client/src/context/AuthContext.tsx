import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api/axios.js';

// Define interfaces
interface Admin {
  token: string;
  id?: string;
  email?: string;
  role: 'ADMIN';
  [key: string]: any;
}

interface User {
  id: string | number;
  name: string;
  role: 'BUYER' | 'SELLER';
  email?: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  admin: Admin | null; // Khusus state Admin
  user: User | null;   // Khusus state Buyer/Seller
  isAuthenticated: boolean;
  loading: boolean;
  loginAdmin: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      // 1. CEK ADMIN (JWT)
      const token = localStorage.getItem('admin_token');
      if (token) {
        try {
          const response = await api.get('/admin/me');
          if (response.data.status === 'success') {
            setAdmin({
              token,
              ...response.data.data,
              role: 'ADMIN' 
            });
            setLoading(false);
            return; // Jika admin login, stop di sini (asumsi admin tidak perlu load user session)
          }
        } catch (error) {
          console.error("Token admin tidak valid:", error);
          localStorage.removeItem('admin_token');
          setAdmin(null);
        }
      }

      // 2. CEK USER BUYER/SELLER (PHP SESSION)
      try {
        const response = await api.get('/auth/user'); 
        
        if (response.data.success && response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.log("Tidak ada sesi user PHP yang aktif.");
        setUser(null);
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
      setAdmin({ ...user, token, role: 'ADMIN' });
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

  const logout = () => {
    // Logout Admin
    if (admin) {
      localStorage.removeItem('admin_token');
      setAdmin(null);
      window.location.href = '/admin/login';
      return;
    }

    // Logout User (Redirect ke logout PHP)
    if (user) {
      setUser(null);
      // Ganti URL ini sesuai route logout PHP kamu
      window.location.href = '/logout.php'; 
    }
  };

  const value = {
    admin,
    user,
    isAuthenticated: !!admin || !!user,
    loading,
    loginAdmin,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
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