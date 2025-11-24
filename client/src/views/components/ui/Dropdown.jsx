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
    left: 'left-0',
    right: 'right-0',
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef} {...props}>
      <div 
        className="cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        role="button"
      >
        {trigger}
      </div>
      <div 
        className={`absolute ${alignClasses[align]} mt-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[10rem] py-1 z-50 transition-all duration-200 origin-top ${
          isOpen 
            ? 'opacity-100 scale-100 visible' 
            : 'opacity-0 scale-95 invisible'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export const DropdownItem = ({ children, onClick, active = false, className = '', ...props }) => {
  return (
    <button
      type="button"
      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
        active ? 'bg-gray-50 text-[#667eea] font-medium' : 'text-gray-700'
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export const DropdownDivider = () => {
  return <div className="border-t border-gray-200 my-1" />;
};

export default Dropdown;
