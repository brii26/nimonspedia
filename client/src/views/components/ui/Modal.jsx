import React, { useEffect } from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  className = '',
  size = 'md',
  ...props 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-200"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all duration-200 ${className}`}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

export const ModalHeader = ({ children, onClose, className = '', ...props }) => {
  return (
    <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-200 ${className}`} {...props}>
      <h3 className="text-xl font-semibold text-gray-900">{children}</h3>
      {onClose && (
        <button 
          type="button" 
          className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none transition-colors" 
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      )}
    </div>
  );
};

export const ModalBody = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const ModalFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Modal;