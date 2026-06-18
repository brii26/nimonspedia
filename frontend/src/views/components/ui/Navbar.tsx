import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext.js';
import api from '../../../services/api/axios.js';

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4.5 10.5V21h5v-5h5v5h5V10.5"/></svg>
);
const LoginIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>
);
const RegisterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"/></svg>
);
const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
);
const AuctionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"/></svg>
);
const ProductsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg>
);
const OrdersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
);
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>
);
const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"/></svg>
);
const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
);
const TopUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>
);
const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
);
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
);

const NavLink = ({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) => (
  <a
    href={href}
    style={{
      display: 'flex', alignItems: 'flex-end', gap: '0.5rem',
      padding: '0.5rem 0.75rem', textDecoration: active ? 'underline' : 'none',
      textUnderlineOffset: '3px',
      color: active ? '#42b549' : '#374151',
      fontWeight: active ? 600 : 500, fontSize: '0.95rem',
      borderRadius: '6px', transition: 'all 0.2s',
    }}
    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#42b549'; (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; } }}
    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#374151'; (e.currentTarget as HTMLElement).style.textDecoration = 'none'; } }}
  >
    {children}
  </a>
);

const DropdownItem = ({ href, onClick, danger, children }: { href?: string; onClick?: (e: React.MouseEvent) => void; danger?: boolean; children: React.ReactNode }) => {
  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 1rem', textDecoration: 'none',
    color: danger ? '#dc2626' : '#374151',
    transition: 'all 0.2s', background: 'none',
    border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
  };
  if (href) return <a href={href} style={style} onMouseEnter={e => (e.currentTarget.style.background = danger ? '#fef2f2' : '#f9fafb')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>{children}</a>;
  return <button type={onClick ? 'button' : 'submit'} style={style} onClick={onClick} onMouseEnter={e => (e.currentTarget.style.background = danger ? '#fef2f2' : '#f9fafb')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>{children}</button>;
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [flags, setFlags] = useState({ checkout_enabled: true, chat_enabled: true, auction_enabled: true });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(amount);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await api.get('/api/session-meta', { baseURL: '/' });
        if (res.data) setFlags({ checkout_enabled: res.data.checkout_enabled ?? true, chat_enabled: res.data.chat_enabled ?? true, auction_enabled: res.data.auction_enabled ?? true });
        if (user?.role === 'BUYER') {
          const cartRes = await api.get('/api/cart/count', { baseURL: '/' });
          if (cartRes.data) setCartCount(cartRes.data.unique || 0);
        }
      } catch {}
    };
    fetchMeta();
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const path = window.location.pathname;
  const active = (p: string) => path === p;

  const navLinkIcon = { fontSize: '1.1rem', position: 'relative' as const };

  return (
    <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

          {/* Brand */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none', color: '#111' }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'none')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            <img src="/assets/images/mascot.png" alt="Nimonspedia" style={{ height: '40px', width: 'auto' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', transform: 'translateY(4px)', lineHeight: 1 }}>Nimonspedia</span>
          </a>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1, justifyContent: 'flex-end', marginLeft: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              {!user ? (
                <>
                  <NavLink href="/" active={active('/')}><span style={navLinkIcon}><HomeIcon /></span><span>Home</span></NavLink>
                  <NavLink href="/login" active={active('/login')}><span style={navLinkIcon}><LoginIcon /></span><span>Login</span></NavLink>
                  <NavLink href="/register" active={active('/register')}><span style={navLinkIcon}><RegisterIcon /></span><span>Register</span></NavLink>
                </>
              ) : user.role === 'BUYER' ? (
                <>
                  <NavLink href="/" active={active('/')}><span style={navLinkIcon}><HomeIcon /></span><span>Home</span></NavLink>
                  {flags.checkout_enabled && (
                    <NavLink href="/cart" active={active('/cart')}>
                      <span style={{ ...navLinkIcon }}>
                        <CartIcon />
                        {cartCount > 0 && (
                          <span style={{ position: 'absolute', top: -5, right: -5, background: '#42b549', color: 'white', fontSize: '0.75rem', fontWeight: 600, padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center' }}>{cartCount}</span>
                        )}
                      </span>
                      <span>Cart</span>
                    </NavLink>
                  )}
                  {flags.auction_enabled && (
                    <NavLink href="/auction" active={active('/auction')}><span style={navLinkIcon}><AuctionIcon /></span><span>Auction</span></NavLink>
                  )}
                </>
              ) : user.role === 'SELLER' ? (
                <>
                  <NavLink href="/seller/products" active={active('/seller/products')}><span style={navLinkIcon}><ProductsIcon /></span><span>Products</span></NavLink>
                  <NavLink href="/seller/orders" active={active('/seller/orders')}><span style={navLinkIcon}><OrdersIcon /></span><span>Orders</span></NavLink>
                </>
              ) : null}

              {user && (user.role === 'BUYER' || user.role === 'SELLER') && flags.chat_enabled && (
                <NavLink href="/chat" active={active('/chat')}><span style={navLinkIcon}><ChatIcon /></span><span>Chat</span></NavLink>
              )}
            </div>

            {/* User section */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {user.role === 'BUYER' ? (
                  <a href="/profile#balance" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f3f4f6', color: '#111111', borderRadius: '20px', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                    <WalletIcon /><span>{formatCurrency(user.balance || 0)}</span>
                  </a>
                ) : user.role === 'SELLER' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f3f4f6', color: '#111111', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem' }}>
                    <WalletIcon /><span>{formatCurrency(user.balance || 0)}</span>
                  </div>
                ) : null}

                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#42b549', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden' }}>
                      {user.avatar
                        ? <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ color: '#ffffff' }}>{(user.name || 'U').charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0', fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111', lineHeight: 1.2, WebkitFontSmoothing: 'auto', MozOsxFontSmoothing: 'auto' } as React.CSSProperties}>{user.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.2, WebkitFontSmoothing: 'auto', MozOsxFontSmoothing: 'auto' } as React.CSSProperties}>{user.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : ''}</span>
                    </div>
                    <span style={{ color: '#6b7280' }}><ChevronIcon open={isDropdownOpen} /></span>
                  </button>

                  <div style={{
                    position: 'absolute', top: '100%', right: 0, minWidth: '220px',
                    background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '0.5rem 0',
                    opacity: isDropdownOpen ? 1 : 0, visibility: isDropdownOpen ? 'visible' : 'hidden',
                    transform: isDropdownOpen ? 'translateY(0)' : 'translateY(-10px)',
                    transition: 'all 0.2s', zIndex: 1100,
                  }}>
                    <DropdownItem href="/profile"><span style={{ width: 16 }}><ProfileIcon /></span><span>Profile</span></DropdownItem>
                    {user.role === 'BUYER' && (
                      <>
                        <DropdownItem href="/profile"><span style={{ width: 16 }}><TopUpIcon /></span><span>Top Up Balance</span></DropdownItem>
                        <DropdownItem href="/orders"><span style={{ width: 16 }}><ProductsIcon /></span><span>Orders</span></DropdownItem>
                        <DropdownItem href="/reviews/my-reviews"><span style={{ width: 16 }}><StarIcon /></span><span>My Reviews</span></DropdownItem>
                      </>
                    )}
                    {user.role === 'SELLER' && (
                      <DropdownItem href="/seller/reviews"><span style={{ width: 16 }}><StarIcon /></span><span>Reviews</span></DropdownItem>
                    )}
                    <div style={{ height: 1, background: '#e5e7eb', margin: '0.25rem 0' }}></div>
                    <form onSubmit={(e) => { e.preventDefault(); logout(); }} style={{ margin: 0 }}>
                      <DropdownItem danger><span style={{ width: 16 }}><LogoutIcon /></span><span>Logout</span></DropdownItem>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            type="button"
            className="lg:hidden"
            style={{ display: 'none', flexDirection: 'column', gap: '3px', background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', borderRadius: '4px' }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span style={{ width: 20, height: 2, background: '#374151', borderRadius: 1, display: 'block', transition: 'all 0.3s', transform: isMobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : undefined }}></span>
            <span style={{ width: 20, height: 2, background: '#374151', borderRadius: 1, display: 'block', transition: 'all 0.3s', opacity: isMobileMenuOpen ? 0 : 1 }}></span>
            <span style={{ width: 20, height: 2, background: '#374151', borderRadius: 1, display: 'block', transition: 'all 0.3s', transform: isMobileMenuOpen ? 'rotate(-45deg) translate(7px, -6px)' : undefined }}></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
