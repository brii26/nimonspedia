import React from 'react';
import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

interface CardElementProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  className?: string;
}

interface CardSubtitleProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', compact = false, ...props }) => {
  const baseClasses = 'bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden';
  
  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardElementProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-6 border-b border-gray-200 bg-gray-50 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '', ...props }) => {
  return (
    <h3 className={`m-0 text-xl font-semibold text-gray-900 ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardSubtitle: React.FC<CardSubtitleProps> = ({ children, className = '', ...props }) => {
  return (
    <p className={`mt-1 mb-0 text-sm text-gray-600 ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardBody: React.FC<CardElementProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardElementProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;