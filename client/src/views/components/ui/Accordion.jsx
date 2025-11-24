import React from 'react';

const Accordion = ({ children, allowMultiple = false, className = '', ...props }) => {
  const [openItems, setOpenItems] = React.useState([]);

  const handleToggle = (index) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenItems((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`} {...props}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isOpen: openItems.includes(index),
            onToggle: () => handleToggle(index),
          });
        }
        return child;
      })}
    </div>
  );
};

export const AccordionItem = ({ 
  children, 
  isOpen, 
  onToggle, 
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`} 
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { isOpen, onToggle });
        }
        return child;
      })}
    </div>
  );
};

export const AccordionHeader = ({ 
  children, 
  isOpen, 
  onToggle, 
  className = '',
  ...props 
}) => {
  return (
    <button
      type="button"
      className={`w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 text-left ${className}`}
      onClick={onToggle}
      aria-expanded={isOpen}
      {...props}
    >
      <span className="text-base font-semibold text-gray-900">{children}</span>
      <span className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
        ▼
      </span>
    </button>
  );
};

export const AccordionBody = ({ 
  children, 
  isOpen, 
  className = '',
  ...props 
}) => {
  if (!isOpen) return null;

  return (
    <div className={`px-6 py-4 border-t border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Accordion;
