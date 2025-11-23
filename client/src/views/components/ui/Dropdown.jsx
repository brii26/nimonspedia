import React, { useState, useRef, useEffect } from 'react';

const Dropdown = ({ 
  trigger, 
  children, 
  className = '',
  align = 'left',
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const alignClasses = {
    left: '',
    right: 'dropdown-menu-right',
  };

  return (
    <div className={`dropdown ${className}`} ref={dropdownRef} {...props}>
      <div 
        className="dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        role="button"
      >
        {trigger}
      </div>
      <div className={`dropdown-menu ${alignClasses[align]} ${isOpen ? 'show' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export const DropdownItem = ({ children, onClick, active = false, className = '', ...props }) => {
  return (
    <button
      type="button"
      className={`dropdown-item ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export const DropdownDivider = () => {
  return <div className="dropdown-divider" />;
};

export default Dropdown;
