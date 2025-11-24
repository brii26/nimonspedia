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
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800',
  };

  const positionClasses = {
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4',
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'top-center': 'fixed top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'fixed bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div 
      className={`flex items-center gap-3 min-w-[300px] max-w-md px-4 py-3 border-l-4 rounded-r-lg shadow-lg z-50 transition-all duration-300 ${
        variantClasses[variant]
      } ${positionClasses[position]} ${
        isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'
      }`}
      {...props}
    >
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>
      <button 
        type="button" 
        className="text-xl leading-none opacity-50 hover:opacity-100 transition-opacity" 
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
    'top-right': 'fixed top-4 right-4 flex flex-col gap-2',
    'top-left': 'fixed top-4 left-4 flex flex-col gap-2',
    'bottom-right': 'fixed bottom-4 right-4 flex flex-col gap-2',
    'bottom-left': 'fixed bottom-4 left-4 flex flex-col gap-2',
    'top-center': 'fixed top-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center',
    'bottom-center': 'fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center',
  };

  return (
    <div className={`z-50 ${positionClasses[position]}`}>
      {children}
    </div>
  );
};

export default Toast;
