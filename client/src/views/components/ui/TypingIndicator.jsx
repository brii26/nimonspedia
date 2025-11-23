import React from 'react';

const TypingIndicator = ({ 
  userName,
  variant = 'default',
  className = '',
  ...props 
}) => {
  if (variant === 'bubble') {
    return (
      <div className={`typing-indicator typing-indicator-bubble ${className}`} {...props}>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </div>
    );
  }

  return (
    <div className={`typing-indicator ${className}`} {...props}>
      {userName && <span className="typing-user">{userName}</span>}
      <span className="typing-text">sedang mengetik</span>
      <span className="typing-dots">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
    </div>
  );
};

export default TypingIndicator;
