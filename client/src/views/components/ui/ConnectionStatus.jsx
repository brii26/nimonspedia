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
      class: 'status-connected',
      text: 'Connected',
      color: 'green'
    },
    connecting: {
      class: 'status-connecting',
      text: 'Connecting...',
      color: 'yellow'
    },
    disconnected: {
      class: 'status-disconnected',
      text: 'Disconnected',
      color: 'red'
    },
    reconnecting: {
      class: 'status-reconnecting',
      text: 'Reconnecting...',
      color: 'orange'
    }
  };

  const config = statusConfig[status] || statusConfig.disconnected;
  
  const positionClasses = {
    'top-right': 'connection-status-top-right',
    'top-left': 'connection-status-top-left',
    'bottom-right': 'connection-status-bottom-right',
    'bottom-left': 'connection-status-bottom-left',
  };

  return (
    <div 
      className={`connection-status ${config.class} ${positionClasses[position]} ${className}`}
      {...props}
    >
      <span className="connection-indicator"></span>
      {showText && <span className="connection-text">{config.text}</span>}
    </div>
  );
};

export default ConnectionStatus;
