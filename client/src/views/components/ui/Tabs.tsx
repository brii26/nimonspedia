import React from 'react';
import type { ReactNode, HTMLAttributes } from 'react';

type TabVariant = 'default' | 'pills' | 'underline';

interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  children: ReactNode;
  defaultActiveKey?: string;
  activeKey?: string;
  onSelect?: (key: string) => void;
  className?: string;
  variant?: TabVariant;
}

interface TabListProps {
  children: ReactNode;
  activeTab: string;
  onSelect: (key: string) => void;
  variant?: TabVariant;
  className?: string;
}

interface TabNavProps {
  children: ReactNode;
  activeTab: string;
  onSelect: (key: string) => void;
  variant?: TabVariant;
}

interface TabItemProps {
  children: ReactNode;
  eventKey: string;
  activeTab: string;
  onSelect: (key: string) => void;
  disabled?: boolean;
  variant?: TabVariant;
  className?: string;
}

interface TabContentProps {
  children: ReactNode;
  activeTab: string;
  className?: string;
}

interface TabPaneProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  eventKey: string;
  activeTab: string;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ 
  children, 
  defaultActiveKey,
  activeKey,
  onSelect,
  className = '',
  variant = 'default',
  ...props 
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultActiveKey || activeKey || '');

  React.useEffect(() => {
    if (activeKey !== undefined) {
      setActiveTab(activeKey);
    }
  }, [activeKey]);

  const handleSelect = (key: string) => {
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

export const TabList: React.FC<TabListProps> = ({ children, activeTab, onSelect, variant = 'default', className = '' }) => {
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

export const Tab: React.FC<TabItemProps> = ({ 
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

  const variantStyles: Record<TabVariant, string> = {
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

export const TabPanels: React.FC<TabContentProps> = ({ children, activeTab, className = '' }) => {
  return (
    <div className={`mt-4 ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            activeTab,
          } as any);
        }
        return child;
      })}
    </div>
  );
};

export const TabPanel: React.FC<TabPaneProps> = ({ children, eventKey, activeTab, className = '', ...props }) => {
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
