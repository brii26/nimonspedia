import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api/axios.js';

// --- Interfaces (Dipertahankan) ---
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
  admin: Admin | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  loginAdmin: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // --- 1. Fetch Admin Session (JWT) ---
  const fetchAdminSession = useCallback(async (token: string): Promise<boolean> => {
    try {
      // Set header Authorization secara eksplisit untuk call ini
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await api.get('/admin/me');
      if (response.data.status === 'success') {
        setAdmin({
          token,
          ...response.data.data,
          role: 'ADMIN'
        });
        return true; // Admin valid
      }
      return false;
    } catch (error) {
      console.warn("Sesi Admin kadaluarsa/invalid:", error);
      // Bersihkan token kotor
      localStorage.removeItem('admin_token');
      delete api.defaults.headers.common['Authorization'];
      setAdmin(null);
      return false;
    }
  }, []);

  // --- 2. Fetch User Session (PHP) ---
  const fetchUserSession = useCallback(async (): Promise<boolean> => {
    try {
      delete api.defaults.headers.common['Authorization'];
      
      const response = await api.get('/auth/user'); 
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);

      // STEP A: Cek keberadaan token Admin di storage
      const token = localStorage.getItem('admin_token');

      if (token) {
        // Jika ada token, PRIORITASKAN validasi admin
        const isAdminValid = await fetchAdminSession(token);
        
        if (isAdminValid) {
          setLoading(false);
          return; 
        }
      }

      // STEP B: Fallback ke User Session (PHP)
      // Jalan jika: Tidak ada token admin ATAU Token admin expired
      await fetchUserSession();
      
      setLoading(false);
    };

    initAuth();
  }, [fetchAdminSession, fetchUserSession]);

  // --- Actions ---

  const loginAdmin = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await api.post('/admin/login', { email, password });
      const { token, user: adminData } = response.data;
      
      if (token) {
        localStorage.setItem('admin_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setAdmin({ ...adminData, token, role: 'ADMIN' });
        setUser(null); 
        
        return { success: true };
      }
      return { success: false, message: 'No token received' };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as any)?.response?.data?.message || 'Login failed';
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    setLoading(true);

    // Skenario 1: Logout Admin
    if (admin) {
      localStorage.removeItem('admin_token');
      delete api.defaults.headers.common['Authorization'];
      setAdmin(null);
      setLoading(false);
      window.location.href = '/admin/login'; // Hard refresh ke login admin
      return;
    }

    // Skenario 2: Logout User (PHP)
    if (user) {
      // Panggil endpoint logout PHP backend agar session hancur di server
      api.post('/auth/logout').finally(() => {
        setUser(null);
        setLoading(false);
        window.location.href = '/login.php'; // Atau redirect ke halaman login user
      });
      return;
    }

    setLoading(false);
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