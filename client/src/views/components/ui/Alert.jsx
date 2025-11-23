import React from 'react';

const Alert = ({ 
  children, 
  variant = 'success', 
  onClose,
  className = '',
  ...props 
}) => {
  const variantClasses = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info',
  };

  return (
    <div className={`alert ${variantClasses[variant] || variantClasses.success} ${className}`} {...props}>
      {children}
      {onClose && (
        <button 
          type="button" 
          className="alert-close" 
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
