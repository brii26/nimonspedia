import React from 'react';

export const Card = ({ children, className = '', compact = false, ...props }) => {
  const baseClasses = 'bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden';
  
  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-6 border-b border-gray-200 bg-gray-50 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 className={`m-0 text-xl font-semibold text-gray-900 ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardSubtitle = ({ children, className = '', ...props }) => {
  return (
    <p className={`mt-1 mb-0 text-sm text-gray-600 ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardBody = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;