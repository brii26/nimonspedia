import React, { useState, useEffect } from 'react';

const Toast = ({ 
  message, 
  variant = 'success', 
  duration = 3000,
  onClose,
  position = 'top-right',
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const variantClasses = {
    success: 'toast-success',
    error: 'toast-error',
    warning: 'toast-warning',
    info: 'toast-info',
  };

  const positionClasses = {
    'top-right': 'toast-top-right',
    'top-left': 'toast-top-left',
    'bottom-right': 'toast-bottom-right',
    'bottom-left': 'toast-bottom-left',
    'top-center': 'toast-top-center',
    'bottom-center': 'toast-bottom-center',
  };

  return (
    <div 
      className={`toast ${variantClasses[variant]} ${positionClasses[position]} ${isExiting ? 'toast-exit' : ''}`}
      {...props}
    >
      <div className="toast-content">
        {message}
      </div>
      <button 
        type="button" 
        className="toast-close" 
        onClick={handleClose}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

export const ToastContainer = ({ children, position = 'top-right' }) => {
  const positionClasses = {
    'top-right': 'toast-container-top-right',
    'top-left': 'toast-container-top-left',
    'bottom-right': 'toast-container-bottom-right',
    'bottom-left': 'toast-container-bottom-left',
    'top-center': 'toast-container-top-center',
    'bottom-center': 'toast-container-bottom-center',
  };

  return (
    <div className={`toast-container ${positionClasses[position]}`}>
      {children}
    </div>
  );
};

export default Toast;
