import React from 'react';

const TypingIndicator = ({ 
  userName,
  variant = 'default',
  className = '',
  ...props 
}) => {
  if (variant === 'bubble') {
    return (
      <div className={`flex items-center gap-1 bg-gray-200 rounded-full px-4 py-2 ${className}`} {...props}>
        <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`} {...props}>
      {userName && <span className="font-medium">{userName}</span>}
      <span>sedang mengetik</span>
      <span className="flex gap-1">
        <span className="animate-pulse" style={{ animationDelay: '0ms' }}>.</span>
        <span className="animate-pulse" style={{ animationDelay: '200ms' }}>.</span>
        <span className="animate-pulse" style={{ animationDelay: '400ms' }}>.</span>
      </span>
    </div>
  );
};

export default TypingIndicator;
