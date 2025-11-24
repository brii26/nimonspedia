import React from 'react';

const ConnectionStatus = ({ 
  status = 'connected',
  showText = true,
  position = 'top-right',
  className = '',
  ...props 
}) => {
  const statusConfig = {
    connected: {
      bgColor: 'bg-green-500',
      text: 'Connected',
      textColor: 'text-green-700'
    },
    connecting: {
      bgColor: 'bg-yellow-500 animate-pulse',
      text: 'Connecting...',
      textColor: 'text-yellow-700'
    },
    disconnected: {
      bgColor: 'bg-red-500',
      text: 'Disconnected',
      textColor: 'text-red-700'
    },
    reconnecting: {
      bgColor: 'bg-orange-500 animate-pulse',
      text: 'Reconnecting...',
      textColor: 'text-orange-700'
    }
  };

  const config = statusConfig[status] || statusConfig.disconnected;
  
  const positionClasses = {
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4',
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
  };

  return (
    <div 
      className={`flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm ${positionClasses[position]} ${className}`}
      {...props}
    >
      <span className={`w-2 h-2 rounded-full ${config.bgColor}`}></span>
      {showText && <span className={`text-xs font-medium ${config.textColor}`}>{config.text}</span>}
    </div>
  );
};

export default ConnectionStatus;
