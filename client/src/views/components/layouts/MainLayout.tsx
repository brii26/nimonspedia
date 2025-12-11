import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.js';
import api from '../../../services/api/axios.js';

import Navbar, { 
  NavbarBrand, 
  NavbarNav, 
  NavLink, 
  NavbarUser,
  UserDropdown, 
  DropdownItem, 
  DropdownDivider 
} from '../ui/Navbar.js';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'BUYER') {
      fetchCartCount();
    }
  }, [user]);

  const fetchCartCount = async () => {
    try {
      const res = await api.get('/cart');
      if (res.data.success) {
        const uniqueProducts = new Set(res.data.data?.map((item: any) => item.product_id) || []);
        setCartCount(uniqueProducts.size);
      }
    } catch (err) {
      console.error('Gagal fetch cart:', err);
    }
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar brand={<NavbarBrand text="Nimonspedia" href="/" logo="/assets/images/logo.svg" />}>
        <NavbarNav>
          {/* Role-based Navigation */}
          {user.role === 'BUYER' && (
            <>
              <NavLink 
                href="/" 
                icon="🏠"
                active={location.pathname === '/'}
              >
                Home
              </NavLink>
              <NavLink 
                href="/cart" 
                icon="🛒"
                active={isActive('/cart')}
                badge={cartCount > 0 ? (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#667eea] rounded-full">
                    {cartCount}
                  </span>
                ) : null}
              >
                Cart
              </NavLink>
            </>
          )}

          {user.role === 'SELLER' && (
            <>
              <NavLink 
                href="/" 
                icon="📊"
                active={location.pathname === '/'}
              >
                Dashboard
              </NavLink>
              <NavLink 
                href="/seller/products" 
                icon="📦"
                active={isActive('/seller/products')}
              >
                My Products
              </NavLink>
              <NavLink 
                href="/seller/orders" 
                icon="📋"
                active={isActive('/seller/orders')}
              >
                Orders
              </NavLink>
            </>
          )}

          {/* Shared Navigation */}
          <NavLink 
            href="/auctions" 
            icon="🔨"
            active={isActive('/auctions')}
          >
            Lelang
          </NavLink>
          <NavLink 
            href="/chat" 
            icon="💬"
            active={isActive('/chat')}
          >
            Chat
          </NavLink>
        </NavbarNav>

        {/* User Section */}
        <NavbarUser>
          {/* Balance */}
          {user.role === 'BUYER' && (
            <a 
              href="/profile#balance"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors no-underline"
            >
              <span>💰</span>
              <span>Rp 0</span>
            </a>
          )}

          {user.role === 'SELLER' && (
            <div 
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-600"
            >
              <span>🏦</span>
              <span>Rp 0</span>
            </div>
          )}

          {/* User Dropdown */}
          <UserDropdown user={{ name: user.name || 'User', email: user.email || '', role: user.role }}>
            <DropdownItem href="/profile" icon="👤">
              Profile
            </DropdownItem>

            {user.role === 'BUYER' && (
              <>
                <DropdownItem href="/profile" icon="💳">
                  Top Up Balance
                </DropdownItem>
                <DropdownItem href="/orders" icon="📦">
                  Orders
                </DropdownItem>
                <DropdownItem href="/reviews/my-reviews" icon="⭐">
                  My Ratings
                </DropdownItem>
              </>
            )}

            <DropdownDivider />

            <DropdownItem 
              icon="🚪"
              logout
              onClick={handleLogout}
            >
              Logout
            </DropdownItem>
          </UserDropdown>
        </NavbarUser>
      </Navbar>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;