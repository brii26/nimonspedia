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
    default: 'tabs-default',
    pills: 'tabs-pills',
    underline: 'tabs-underline',
  };

  return (
    <div className={`tabs ${variantClasses[variant]} ${className}`} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            activeTab,
            onSelect: handleSelect,
          });
        }
        return child;
      })}
    </div>
  );
};

export const TabList = ({ children, activeTab, onSelect, className = '' }) => {
  return (
    <div className={`tab-list ${className}`} role="tablist">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            activeTab,
            onSelect,
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
  className = '',
  ...props 
}) => {
  const isActive = activeTab === eventKey;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      className={`tab ${isActive ? 'tab-active' : ''} ${disabled ? 'tab-disabled' : ''} ${className}`}
      onClick={() => !disabled && onSelect && onSelect(eventKey)}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabPanels = ({ children, activeTab, className = '' }) => {
  return (
    <div className={`tab-panels ${className}`}>
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
      className={`tab-panel ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Tabs;
