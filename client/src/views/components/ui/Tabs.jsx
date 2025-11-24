import React from 'react';

const Tabs = ({ 
  children, 
  defaultActiveKey,
  activeKey,
  onSelect,
  className = '',
  variant = 'default',
  ...props 
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultActiveKey || activeKey);

  React.useEffect(() => {
    if (activeKey !== undefined) {
      setActiveTab(activeKey);
    }
  }, [activeKey]);

  const handleSelect = (key) => {
    if (activeKey === undefined) {
      setActiveTab(key);
    }
    if (onSelect) {
      onSelect(key);
    }
  };

  const variantClasses = {
    default: 'border-b border-gray-200',
    pills: '',
    underline: 'border-b-2 border-gray-200',
  };

  return (
    <div className={`${className}`} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            activeTab,
            onSelect: handleSelect,
            variant,
          });
        }
        return child;
      })}
    </div>
  );
};

export const TabList = ({ children, activeTab, onSelect, variant = 'default', className = '' }) => {
  return (
    <div className={`flex gap-1 ${variant === 'default' ? 'border-b border-gray-200' : ''} ${className}`} role="tablist">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            activeTab,
            onSelect,
            variant,
          });
        }
        return child;
      })}
    </div>
  );
};

export const Tab = ({ 
  children, 
  eventKey, 
  activeTab, 
  onSelect, 
  disabled = false,
  variant = 'default',
  className = '',
  ...props 
}) => {
  const isActive = activeTab === eventKey;

  const variantStyles = {
    default: isActive 
      ? 'border-b-2 border-[#667eea] text-[#667eea]' 
      : 'border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300',
    pills: isActive
      ? 'bg-[#667eea] text-white'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    underline: isActive
      ? 'border-b-2 border-[#667eea] text-[#667eea]'
      : 'border-b-2 border-transparent text-gray-600 hover:text-gray-900',
  };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      className={`px-4 py-2 font-medium text-sm transition-colors ${variantStyles[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      onClick={() => !disabled && onSelect && onSelect(eventKey)}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabPanels = ({ children, activeTab, className = '' }) => {
  return (
    <div className={`mt-4 ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            activeTab,
          });
        }
        return child;
      })}
    </div>
  );
};

export const TabPanel = ({ children, eventKey, activeTab, className = '', ...props }) => {
  if (activeTab !== eventKey) return null;

  return (
    <div 
      role="tabpanel"
      className={`${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Tabs;
