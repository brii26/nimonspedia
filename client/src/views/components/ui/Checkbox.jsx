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
    <div className={`form-check ${className}`}>
      <input
        ref={checkboxRef}
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="form-check-input"
        {...props}
      />
      {label && (
        <label htmlFor={id} className="form-check-label">
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
    <div className={`form-check ${className}`}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="form-check-input"
        {...props}
      />
      {label && (
        <label htmlFor={id} className="form-check-label">
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
    <div className={`form-switch ${className}`}>
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="form-switch-input"
        role="switch"
        {...props}
      />
      {label && (
        <label htmlFor={id} className="form-switch-label">
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
