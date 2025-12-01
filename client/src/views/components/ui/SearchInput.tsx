import React, { useState, useRef, useEffect } from 'react';
import type { InputHTMLAttributes, ChangeEvent, ReactNode } from 'react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  debounce?: number;
  icon?: ReactNode;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ 
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
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
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
      const fakeEvent = {
        target: { value: '' }
      } as ChangeEvent<HTMLInputElement>;
      onChange(fakeEvent);
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
    <div className={`relative ${className}`}>
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-[#667eea] transition-colors ${
          icon ? 'pl-10' : ''
        } ${localValue ? 'pr-10' : ''}`}
        {...props}
      />
      {localValue && (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl transition-colors"
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
