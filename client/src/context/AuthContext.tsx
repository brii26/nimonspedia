import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios'; // Import raw axios to bypass interceptors
import api from '../services/api/axios.js';
import { notificationService } from '../services/notification.js';

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
  user_id?: string | number; // Added to match PHP backend response
  name: string;
  role: 'BUYER' | 'SELLER';
  email?: string;
  balance?: number;
  avatar?: string;
  // Add feature flags
  auction_enabled?: boolean;
  chat_enabled?: boolean;
  checkout_enabled?: boolean;
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
        // Enforce Exclusive Session: Clear User if Admin is valid
        setUser(null);
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
      console.log('[Auth] Fetching user session from Node (bypassing admin token)...');
      
      // Use raw axios to bypass the interceptor that injects Authorization header
      // This ensures we rely ONLY on the PHPSESSID cookie
      const response = await axios.get('/api/node/auth/user', {
        withCredentials: true
      }); 
      console.log('[Auth] Node response:', response.data);

      if (response.data.success && response.data.user) {
        const userData = response.data.user;
        
        // Fetch additional session meta (feature flags)
        let flags = { auction_enabled: true, chat_enabled: true, checkout_enabled: true };
        try {
            console.log('[Auth] Fetching session meta from PHP...');
            // Also use raw axios for PHP call to ensure no pollution
            const metaRes = await axios.get('/api/session-meta', { 
              withCredentials: true 
            });
            console.log('[Auth] PHP meta response:', metaRes.data);
            if (metaRes.data) {
                flags = {
                    auction_enabled: metaRes.data.auction_enabled ?? true,
                    chat_enabled: metaRes.data.chat_enabled ?? true,
                    checkout_enabled: metaRes.data.checkout_enabled ?? true
                };
            }
        } catch (e) {
            console.warn("[Auth] Failed to fetch session meta", e);
        }

        const finalUser = {
            ...userData,
            id: userData.user_id || userData.id, // Ensure id is populated
            ...flags
        };
        console.log('[Auth] Setting user:', finalUser);

        setUser(finalUser);
        
        // Enforce Exclusive Session: Clear Admin if User is valid
        setAdmin(null);
        localStorage.removeItem('admin_token');
        delete api.defaults.headers.common['Authorization'];
        
        return true;
      }
      console.log('[Auth] Node response success=false or no user');
      return false;
    } catch (error) {
      // Don't log 401s as errors, just means not logged in
      // console.error('[Auth] fetchUserSession failed:', error);
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);

      // STEP A: Cek keberadaan token Admin di storage
      const token = localStorage.getItem('admin_token');
      let isAdmin = false;

      if (token) {
        // Jika ada token, PRIORITASKAN validasi admin
        isAdmin = await fetchAdminSession(token);
      }

      // STEP B: If Admin is NOT logged in, Check User Session (PHP)
      // Exclusive session: If Admin is logged in, we skip User check.
      if (!isAdmin) {
        await fetchUserSession();
      }
      
      setLoading(false);
    };

    initAuth();
  }, [fetchAdminSession, fetchUserSession]);

  // Separate effect for Push Notifications to ensure it runs with updated state
  useEffect(() => {
    if (!loading && (admin || user) && 'Notification' in window && Notification.permission !== 'denied') {
        const subscribe = async () => {
            try {
                await notificationService.registerWorker();
                await notificationService.subscribeToPush();
                console.log('[Auth] Push notification subscription initiated globally.');
            } catch (error) {
                console.error('[Auth] Failed to subscribe to push notifications:', error);
            }
        };
        subscribe();
    }
  }, [loading, admin, user]);


  // --- Redirect Logic for Feature Flags & Auth ---
  useEffect(() => {
    if (loading) return;

    const path = window.location.pathname;
    const isAuction = path.startsWith('/auction');
    const isChat = path.startsWith('/chat');
    const isCart = path.startsWith('/cart'); // New
    const isAdminPath = path.startsWith('/admin');

    // 1. Protection for Admin Routes
    if (isAdminPath && !path.includes('/login') && !admin) {
        window.location.href = '/admin/login';
        return;
    }

    // 2. Protection for User Routes (Auction/Chat/Cart - requires login)
    if ((isAuction || isChat || isCart) && !user) {
      console.log('[Auth] Unauthenticated access to protected route. Redirecting to /login');
      window.location.href = '/login';
      return;
    }

    // 3. Feature Flag Checks (Only if User is logged in)
    if (user) {
        if (isAuction && user.auction_enabled === false) {
            console.log('[Auth] Auction disabled for user. Redirecting to /');
            window.location.href = '/';
            return;
        }
        if (isChat && user.chat_enabled === false) {
            console.log('[Auth] Chat disabled for user. Redirecting to /');
            window.location.href = '/';
            return;
        }
        if (isCart && user.checkout_enabled === false) {
          console.log('[Auth] Checkout disabled for user. Redirecting to /');
          window.location.href = '/';
          return;
      }
    }
  }, [loading, user, admin]);

  // --- Actions ---

  const loginAdmin = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await api.post('/admin/login', { email, password });
      const { token, user: adminData } = response.data;
      
      if (token) {
        localStorage.setItem('admin_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setAdmin({ ...adminData, token, role: 'ADMIN' });
        
        // Enforce Exclusive Session: Clear User
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

    const path = window.location.pathname;
    
    // Context-aware logout
    if (path.startsWith('/admin') || admin) {
        // Logout Admin
        localStorage.removeItem('admin_token');
        delete api.defaults.headers.common['Authorization'];
        setAdmin(null);
        setLoading(false);
        window.location.href = '/admin/login';
    } else {
        // Logout User (PHP)
        if (user) {
            // Use raw axios here too for consistency, though logout endpoint might not care
            axios.get('/api/session-meta', { baseURL: '/' }).then(res => {
                const csrfToken = res.data.csrf_token;
                
                axios.post('/logout', 
                { csrf_token: csrfToken }, 
                { withCredentials: true, baseURL: '/' } 
                ).finally(() => {
                setUser(null);
                setLoading(false);
                window.location.href = '/'; 
                });
            }).catch(() => {
                setUser(null);
                setLoading(false);
                window.location.href = '/';
            });
        } else {
            setLoading(false);
            window.location.href = '/';
        }
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