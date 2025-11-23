import React, { useState, useRef, useEffect } from 'react';

const SearchInput = ({ 
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  debounce = 300,
  icon,
  className = '',
  ...props 
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const timeoutRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (onChange) {
      onChange(e);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (onSearch) {
        onSearch(newValue);
      }
    }, debounce);
  };

  const handleClear = () => {
    setLocalValue('');
    if (onChange) {
      onChange({ target: { value: '' } });
    }
    if (onSearch) {
      onSearch('');
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`search-input ${className}`}>
      {icon && <span className="search-input-icon">{icon}</span>}
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="search-input-field"
        {...props}
      />
      {localValue && (
        <button
          type="button"
          className="search-input-clear"
          onClick={handleClear}
          aria-label="Clear"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SearchInput;
