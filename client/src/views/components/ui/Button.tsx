import React from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  type = 'button',
  onClick,
  ...props 
}) => {
  const baseClasses = 'inline-block border-none rounded-md text-sm font-semibold text-center no-underline cursor-pointer transition-all duration-300 ease-in-out';
  
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-[#667eea] text-white hover:bg-[#5a67d8] hover:-translate-y-px',
    secondary: 'bg-[#6c757d] text-white hover:bg-[#5a6268]',
    success: 'bg-[#28a745] text-white hover:bg-[#218838]',
    warning: 'bg-[#ffc107] text-[#212529] hover:bg-[#e0a800]',
    danger: 'bg-[#dc3545] text-white hover:bg-[#c82333]',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-none',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;