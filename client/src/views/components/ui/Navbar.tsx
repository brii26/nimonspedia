import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.js';
import api from '../../../services/api/axios.js';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [flags, setFlags] = useState({
    checkout_enabled: true,
    chat_enabled: true,
    auction_enabled: true
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Helper currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  // Fetch Meta (Flags & Cart)
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await api.get('/api/session-meta');
        if (res.data) {
            setFlags({
                checkout_enabled: res.data.checkout_enabled ?? true,
                chat_enabled: true, 
                auction_enabled: true 
            });
        }

        if (user && user.role === 'BUYER') {
            const cartRes = await api.get('/api/cart/count');
            if (cartRes.data) {
                setCartCount(cartRes.data.unique || 0);
            }
        }
      } catch (err) {
        console.error("Failed to fetch navbar meta", err);
      }
    };

    fetchMeta();
  }, [user]);

  // Handle Mobile Menu Body Class
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isMobileMenuOpen]);

  // Handle Logout
  const handleLogout = (e: React.FormEvent) => {
    e.preventDefault();
    logout();
  };

  const currentPath = window.location.pathname;
  const isActive = (path: string) => currentPath === path ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-[1000] shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand/Logo */}
          <div className="flex items-center flex-shrink-0">
            <a href="/" className="flex items-center gap-2 text-blue-600 no-underline" aria-label="Nimonspedia Home">
              <img 
                src="/assets/images/logo.svg" 
                alt="Nimonspedia Logo" 
                className="h-8 w-auto"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
              />
              <span className="text-xl font-bold text-blue-600">Nimonspedia</span>
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            type="button" 
            className="flex flex-col gap-1 p-2 rounded-md hover:bg-gray-100 lg:hidden focus:outline-none" 
            aria-label="Toggle navigation menu" 
            aria-expanded={isMobileMenuOpen} 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className={`block w-6 h-0.5 bg-gray-600 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-gray-600 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-gray-600 transition-transform duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
          </button>

          {/* Navigation Menu (Desktop) */}
          <div className="hidden lg:flex lg:items-center lg:gap-8 flex-1 justify-between ml-8">
            <div className="flex items-center gap-6">
              {!user ? (
                // Guest Navigation
                <>
                  <a href="/" className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${isActive('/')}`}>
                    <span className="text-lg">🏠</span>
                    <span>Home</span>
                  </a>
                  <a href="/login" className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${isActive('/login')}`}>
                    <span className="text-lg">🔑</span>
                    <span>Login</span>
                  </a>
                  <a href="/register" className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${isActive('/register')}`}>
                    <span className="text-lg">✨</span>
                    <span>Register</span>
                  </a>
                </>
              ) : user.role === 'BUYER' ? (
                // Buyer Navigation
                <>
                  <a href="/" className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${isActive('/')}`}>
                    <span className="text-lg">🏠</span>
                    <span>Home</span>
                  </a>
                  {flags.checkout_enabled && (
                    <a href="/cart" className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all relative ${isActive('/cart')}`}>
                      <span className="text-lg relative">
                        🛒
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white">
                                {cartCount}
                            </span>
                        )}
                      </span>
                      <span>Cart</span>
                    </a>
                  )}
                  {flags.auction_enabled && (
                    <a href="/auction" className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${isActive('/auction')}`}>
                      <span className="text-lg">🛎️</span>
                      <span>Auction</span>
                    </a>
                  )}
                </>
              ) : user.role === 'SELLER' ? (
                // Seller Navigation
                <>
                  <a href="/seller/products" className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${isActive('/seller/products')}`}>
                    <span className="text-lg">📦</span>
                    <span>Products</span>
                  </a>
                  <a href="/seller/orders" className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${isActive('/seller/orders')}`}>
                    <span className="text-lg">📋</span>
                    <span>Orders</span>
                  </a>
                </>
              ) : null}

              {/* Chat Link (Buyer & Seller) */}
              {user && (user.role === 'BUYER' || user.role === 'SELLER') && flags.chat_enabled && (
                <a href="/chat" className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${isActive('/chat')}`}>
                  <span className="text-lg">💬</span>
                  <span>Chat</span>
                </a>
              )}
            </div>

            {/* User Section (Desktop) */}
            {user && (
              <div className="flex items-center gap-4">
                {user.role === 'BUYER' ? (
                  <a className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-semibold hover:bg-green-100 transition-colors no-underline" href="/profile#balance">
                    <span className="text-lg">💰</span>
                    <span>{formatCurrency(user.balance || 0)}</span>
                  </a>
                ) : user.role === 'SELLER' ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold cursor-default">
                    <span className="text-lg">🏦</span>
                    <span>{formatCurrency(user.balance || 0)}</span>
                  </div>
                ) : null}

                {/* Profile Dropdown */}
                <div className="relative">
                  <button 
                    type="button" 
                    className="flex items-center gap-3 bg-transparent border-none p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors focus:outline-none"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-sm">
                      {user.avatar ? (
                          <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                          (user.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="hidden xl:flex flex-col items-start">
                      <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                      <span className="text-xs text-gray-500">{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : ''}</span>
                    </div>
                    <span className={`text-xs text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>

                  {/* Dropdown Menu */}
                  <div className={`absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl py-1 transform transition-all duration-200 origin-top-right ${isDropdownOpen ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible'}`}>
                    <a href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                      <span className="w-5 text-center">👤</span>
                      <span>Profile</span>
                    </a>

                    {user.role === 'BUYER' && (
                        <>
                            <a href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                <span className="w-5 text-center">💳</span>
                                <span>Top Up Balance</span>
                            </a>
                            <a href="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                <span className="w-5 text-center">📦</span>
                                <span>Orders</span>
                            </a>
                            <a href="/reviews/my-reviews" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                <span className="w-5 text-center">⭐</span>
                                <span>My Reviews</span>
                            </a>
                        </>
                    )}

                    {user.role === 'SELLER' && (
                        <a href="/seller/reviews" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                            <span className="w-5 text-center">⭐</span>
                            <span>Reviews</span>
                        </a>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>

                    <form onSubmit={handleLogout} className="m-0">
                      <button type="submit" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left bg-transparent border-none cursor-pointer">
                        <span className="w-5 text-center">🚪</span>
                        <span>Logout</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-y-0 left-0 w-[75%] max-w-xs bg-gradient-to-b from-blue-600 to-blue-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-[1002] lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-6 text-white overflow-y-auto">
            {/* User Info Mobile */}
            {user && (
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/20">
                    <div className="w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-lg shadow-md">
                        {user.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            (user.name || 'U').charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <div className="font-semibold text-lg">{user.name}</div>
                        <div className="text-sm text-blue-100">{user.role}</div>
                    </div>
                </div>
            )}

            {/* Nav Links Mobile */}
            <div className="flex flex-col gap-2">
                {!user ? (
                    <>
                        <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                            <span className="text-xl">🏠</span>
                            <span>Home</span>
                        </a>
                        <a href="/login" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                            <span className="text-xl">🔑</span>
                            <span>Login</span>
                        </a>
                        <a href="/register" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                            <span className="text-xl">✨</span>
                            <span>Register</span>
                        </a>
                    </>
                ) : user.role === 'BUYER' ? (
                    <>
                        <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                            <span className="text-xl">🏠</span>
                            <span>Home</span>
                        </a>
                        {flags.checkout_enabled && (
                            <a href="/cart" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors relative">
                                <span className="text-xl relative">
                                    🛒
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border border-white">
                                            {cartCount}
                                        </span>
                                    )}
                                </span>
                                <span>Cart</span>
                            </a>
                        )}
                        {flags.auction_enabled && (
                            <a href="/auction" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                                <span className="text-xl">🛎️</span>
                                <span>Auction</span>
                            </a>
                        )}
                    </>
                ) : user.role === 'SELLER' ? (
                    <>
                        <a href="/seller/products" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                            <span className="text-xl">📦</span>
                            <span>Products</span>
                        </a>
                        <a href="/seller/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                            <span className="text-xl">📋</span>
                            <span>Orders</span>
                        </a>
                    </>
                ) : null}

                {user && (user.role === 'BUYER' || user.role === 'SELLER') && flags.chat_enabled && (
                    <a href="/chat" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                        <span className="text-xl">💬</span>
                        <span>Chat</span>
                    </a>
                )}
            </div>

            {/* User Links Mobile */}
            {user && (
                <div className="mt-8 pt-6 border-t border-white/20 flex flex-col gap-2">
                    <a href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                        <span className="text-xl">👤</span>
                        <span>Profile</span>
                    </a>
                    
                    {user.role === 'BUYER' && (
                        <>
                            <a href="/profile#balance" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-500/20 text-green-100 hover:bg-green-500/30 transition-colors mb-2">
                                <span className="text-xl">💰</span>
                                <span>{formatCurrency(user.balance || 0)}</span>
                            </a>
                            <a href="/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                                <span className="text-xl">📦</span>
                                <span>Orders</span>
                            </a>
                            <a href="/reviews/my-reviews" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                                <span className="text-xl">⭐</span>
                                <span>My Reviews</span>
                            </a>
                        </>
                    )}

                    {user.role === 'SELLER' && (
                        <>
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-white mb-2">
                                <span className="text-xl">🏦</span>
                                <span>{formatCurrency(user.balance || 0)}</span>
                            </div>
                            <a href="/seller/reviews" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                                <span className="text-xl">⭐</span>
                                <span>Reviews</span>
                            </a>
                        </>
                    )}

                    <form onSubmit={handleLogout} className="mt-4">
                        <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/20 text-red-100 hover:bg-red-500/30 transition-colors text-left border-none cursor-pointer">
                            <span className="text-xl">🚪</span>
                            <span>Logout</span>
                        </button>
                    </form>
                </div>
            )}
        </div>
      </div>

      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[1001] transition-opacity duration-300 lg:hidden ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>
    </nav>
  );
};

export default Navbar;