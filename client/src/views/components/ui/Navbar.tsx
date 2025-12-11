import React, { useState, useEffect } from 'react';
import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes, MouseEvent } from 'react';

interface NavbarProps extends HTMLAttributes<HTMLElement> {
  brand: ReactNode;
  children: ReactNode;
  className?: string;
}

interface NavbarBrandProps {
  logo?: string;
  text: string;
  href?: string;
  className?: string;
}

interface NavbarMenuProps {
  children: ReactNode;
  className?: string;
}

interface NavbarLinkProps {
  href?: string;
  icon?: ReactNode;
  children: ReactNode;
  active?: boolean;
  badge?: ReactNode;
  external?: boolean;
  onClick?: () => void;
  className?: string;
}

interface NavbarNotificationProps {
  amount: number;
  icon: ReactNode;
  className?: string;
}

interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface NavbarUserProps {
  user: UserInfo;
  children: ReactNode;
  className?: string;
}

interface NavbarUserLinkProps {
  href?: string;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
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
    <nav className={`bg-white border-b border-gray-200 shadow-sm ${className}`} {...props}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden flex flex-col gap-1 p-2 rounded hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation"
          >
            <span className={`block w-6 h-0.5 bg-gray-600 transition-transform ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-gray-600 transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-gray-600 transition-transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
          </button>

          {/* Brand */}
          <div className="flex items-center">
            {brand}
          </div>

          {/* Desktop: Navigation + User Section in one line */}
          <div className="hidden md:flex md:items-center md:flex-1 md:justify-between md:ml-8">
            {children}
          </div>

          {/* Mobile Menu */}
          <div className={`fixed md:hidden top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-md transition-transform duration-200 z-40 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 md:hidden transition-opacity duration-200 z-30 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
    </nav>
  );
};

export const NavbarBrand: React.FC<NavbarBrandProps> = ({ logo, text, href = '/', className = '' }) => {
  return (
    <a href={href} className={`flex items-center gap-2 text-lg font-bold text-gray-900 hover:text-[#667eea] transition-colors ${className}`}>
      {logo && <img src={logo} alt={text} className="h-8 w-auto" />}
      {text && <span>{text}</span>}
    </a>
  );
};

export const NavbarNav: React.FC<NavbarMenuProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:gap-1 p-4 md:p-0 ${className}`}>
      {children}
    </div>
  );
};

export const NavLink: React.FC<NavbarLinkProps> = ({ 
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
      className={`flex items-center gap-2 px-4 py-2 md:px-3 md:py-2 rounded-md text-sm font-medium transition-colors ${
        active 
          ? 'text-[#667eea] bg-purple-50 md:bg-transparent' 
          : 'text-gray-700 hover:text-[#667eea] hover:bg-gray-50'
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children && <span>{children}</span>}
      {badge && badge}
    </a>
  );
};

export const NavbarUser: React.FC<NavbarMenuProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-col md:flex-row items-start md:items-center gap-3 p-4 md:p-0 border-t md:border-t-0 border-gray-200 mt-4 md:mt-0 pt-4 md:pt-0 ${className}`}>
      {children}
    </div>
  );
};

export const UserBalance: React.FC<NavbarNotificationProps> = ({ amount, icon, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg ${className}`}>
      {icon && <span className="text-[#667eea]">{icon}</span>}
      <span className="text-sm font-semibold text-gray-900">{amount}</span>
    </div>
  );
};

export const UserDropdown: React.FC<NavbarUserProps> = ({ 
  user, 
  children, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button 
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-[#667eea] flex items-center justify-center overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-semibold text-sm">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">{user.name}</div>
          {user.role && <div className="text-xs text-gray-500">{user.role}</div>}
        </div>
        <span className="text-xs text-gray-400">▼</span>
      </button>

      <div className={`absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 transition-all duration-200 origin-top-right ${
        isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
      }`}>
        {children}
      </div>
    </div>
  );
};

export const DropdownItem: React.FC<NavbarUserLinkProps & { active?: boolean; logout?: boolean }> = ({ 
  href, 
  icon, 
  children, 
  onClick,
  active = false,
  logout = false,
  className = '',
  ...props 
}) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <a 
      href={href} 
      className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
        active ? 'bg-gray-50 text-[#667eea] font-medium' : 
        logout ? 'text-red-600 hover:bg-red-50' : 
        'text-gray-700 hover:bg-gray-50'
      } ${className}`}
      onClick={onClick ? (e) => {e.preventDefault(); onClick();} : undefined}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{children}</span>
    </a>
  );
};

export const DropdownDivider = () => {
  return <div className="border-t border-gray-200 my-1" />;
};

export default Navbar;