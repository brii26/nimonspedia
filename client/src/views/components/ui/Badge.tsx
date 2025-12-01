import React from 'react';
import type { ReactNode, HTMLAttributes } from 'react';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant | string; // Allow string for backward compatibility
  size?: BadgeSize;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const variantClasses: Record<BadgeVariant, string> = {
    primary: 'bg-[#e3e8fc] text-[#3e53a0]',
    success: 'bg-[#d4edda] text-[#155724]',
    warning: 'bg-[#fff3cd] text-[#856404]',
    danger: 'bg-[#f8d7da] text-[#721c24]',
    info: 'bg-[#d1ecf1] text-[#0c5460]',
    gray: 'bg-[#e9ecef] text-[#495057]',
  };

  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-[0.625rem]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-2 text-sm',
  };

  const classes = [
    'inline-flex items-center rounded-xl font-semibold leading-none uppercase tracking-wide',
    (variantClasses as Record<string, string>)[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export default Badge;
