import React from 'react';

const Checkbox = ({ 
  id,
  name,
  label,
  checked,
  onChange,
  disabled = false,
  indeterminate = false,
  className = '',
  ...props 
}) => {
  const checkboxRef = React.useRef(null);

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        ref={checkboxRef}
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 text-[#667eea] bg-gray-100 border-gray-300 rounded focus:ring-[#667eea] focus:ring-2 disabled:opacity-50 cursor-pointer"
        {...props}
      />
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
};

export const Radio = ({ 
  id,
  name,
  label,
  value,
  checked,
  onChange,
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 text-[#667eea] bg-gray-100 border-gray-300 focus:ring-[#667eea] focus:ring-2 disabled:opacity-50 cursor-pointer"
        {...props}
      />
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
};

export const Switch = ({ 
  id,
  name,
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-11 h-6 appearance-none bg-gray-300 rounded-full relative cursor-pointer transition-colors duration-200 checked:bg-[#667eea] disabled:opacity-50 disabled:cursor-not-allowed before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform before:duration-200 checked:before:translate-x-5"
        role="switch"
        {...props}
      />
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
