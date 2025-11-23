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
    <div className={`accordion ${className}`} {...props}>
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
    <div className={`accordion-item ${isOpen ? 'accordion-item-open' : ''} ${className}`} {...props}>
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
      className={`accordion-header ${className}`}
      onClick={onToggle}
      aria-expanded={isOpen}
      {...props}
    >
      <span className="accordion-title">{children}</span>
      <span className={`accordion-icon ${isOpen ? 'accordion-icon-open' : ''}`}>
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
    <div className={`accordion-body ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Accordion;
