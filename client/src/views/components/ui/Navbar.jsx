import React, { useState, useEffect } from 'react';

const Navbar = ({ 
  brand, 
  children, 
  className = '',
  ...props 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('navbar-open');
    } else {
      document.body.classList.remove('navbar-open');
    }

    return () => {
      document.body.classList.remove('navbar-open');
    };
  }, [isMobileMenuOpen]);

  return (
    <nav className={`navbar ${className}`} {...props}>
      <div className="container">
        <div className="navbar-content">
          <button 
            className="navbar-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggle-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          <div className="navbar-brand">
            {brand}
          </div>

          <div className={`navbar-menu ${isMobileMenuOpen ? 'show' : ''}`}>
            {children}
          </div>
        </div>
      </div>

      <div 
        className={`navbar-overlay ${isMobileMenuOpen ? 'show' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
    </nav>
  );
};

export const NavbarBrand = ({ logo, text, href = '/', className = '' }) => {
  return (
    <a href={href} className={`brand-link ${className}`}>
      {logo && <img src={logo} alt={text} className="brand-logo" />}
      {text && <span className="brand-text">{text}</span>}
    </a>
  );
};

export const NavbarNav = ({ children, className = '' }) => {
  return (
    <div className={`navbar-nav ${className}`}>
      {children}
    </div>
  );
};

export const NavLink = ({ 
  href, 
  icon, 
  children, 
  active = false, 
  badge,
  className = '',
  onClick,
  ...props 
}) => {
  return (
    <a 
      href={href} 
      className={`nav-link ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="nav-icon">{icon}</span>}
      {children && <span className="nav-text">{children}</span>}
      {badge && badge}
    </a>
  );
};

export const NavbarUser = ({ children, className = '' }) => {
  return (
    <div className={`navbar-user ${className}`}>
      {children}
    </div>
  );
};

export const UserBalance = ({ amount, icon, className = '' }) => {
  return (
    <div className={`user-balance ${className}`}>
      {icon && <span className="balance-icon">{icon}</span>}
      <span className="balance-amount">{amount}</span>
    </div>
  );
};

export const UserDropdown = ({ 
  user, 
  children, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`user-dropdown ${className}`}>
      <button 
        className="user-dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="user-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <span className="avatar-text">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="user-info">
          <div className="user-name">{user.name}</div>
          {user.role && <div className="user-role">{user.role}</div>}
        </div>
        <span className="dropdown-arrow">▼</span>
      </button>

      <div className={`user-dropdown-menu ${isOpen ? 'show' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export const DropdownItem = ({ 
  href, 
  icon, 
  children, 
  onClick,
  active = false,
  logout = false,
  className = '',
  ...props 
}) => {
  const classes = [
    'dropdown-item',
    active ? 'active' : '',
    logout ? 'dropdown-item-logout' : '',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <a 
      href={href} 
      className={classes}
      onClick={handleClick}
      {...props}
    >
      {icon && <span className="dropdown-icon">{icon}</span>}
      <span className="dropdown-text">{children}</span>
    </a>
  );
};

export const DropdownDivider = () => {
  return <div className="dropdown-divider" />;
};

export default Navbar;
