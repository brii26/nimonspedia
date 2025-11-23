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
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
    xl: 'modal-xl',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-dialog ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ModalHeader = ({ children, onClose, className = '', ...props }) => {
  return (
    <div className={`modal-header ${className}`} {...props}>
      <h3 className="modal-title">{children}</h3>
      {onClose && (
        <button 
          type="button" 
          className="modal-close" 
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
    <div className={`modal-body ${className}`} {...props}>
      {children}
    </div>
  );
};

export const ModalFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`modal-footer ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Modal;