import React from 'react';

const Spinner = ({ 
  size = 'md', 
  variant = 'primary',
  className = '',
  ...props 
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  };

  const variantMap = {
    primary: 'border-[#667eea] border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  return (
    <div 
      className={`inline-block rounded-full animate-spin ${sizeMap[size]} ${variantMap[variant]} ${className}`}
      role="status"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const LoadingOverlay = ({ isLoading, children, text = 'Loading...' }) => {
  if (!isLoading) return children;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          {text && <p className="text-sm font-medium text-gray-700">{text}</p>}
        </div>
      </div>
    </div>
  );
};

export default Spinner;
