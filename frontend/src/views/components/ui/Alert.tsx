import React from 'react';
import type { ReactNode, HTMLAttributes } from 'react';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: AlertVariant;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ 
  children, 
  variant = 'success', 
  onClose,
  className = '',
  ...props 
}) => {
  const variantClasses: Record<AlertVariant, string> = {
    success: 'bg-[#d4edda] text-[#155724] border-l-4 border-[#28a745]',
    error: 'bg-[#f8d7da] text-[#721c24] border-l-4 border-[#dc3545]',
    warning: 'bg-[#fff3cd] text-[#856404] border-l-4 border-[#ffc107]',
    info: 'bg-[#d1ecf1] text-[#0c5460] border-l-4 border-[#17a2b8]',
  };

  return (
    <div className={`rounded-md px-4 py-3.5 mb-6 flex items-start justify-between ${variantClasses[variant] || variantClasses.success} ${className}`} {...props}>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button 
          type="button" 
          className="ml-4 text-current opacity-70 hover:opacity-100 font-bold text-xl leading-none transition-opacity" 
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
