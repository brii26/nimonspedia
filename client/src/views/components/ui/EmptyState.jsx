import React from 'react';

const EmptyState = ({ 
  icon,
  title,
  description,
  action,
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`} {...props}>
      {icon && <div className="text-gray-400 text-5xl mb-4">{icon}</div>}
      {title && <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>}
      {description && <p className="text-gray-500 text-sm max-w-md mb-6">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
