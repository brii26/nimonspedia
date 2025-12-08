import React, { useState, useRef, useEffect } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface BaseSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  label?: string;
  dropUp?: boolean; // If true, dropdown opens upward
}

interface FixedSelectProps extends BaseSelectProps {
  variant: 'fixed';
}

interface EditableSelectProps extends BaseSelectProps {
  variant: 'editable';
  inputType?: 'text' | 'number';
  min?: number;
  max?: number;
  inputPlaceholder?: string;
}

export type SelectDropdownProps = FixedSelectProps | EditableSelectProps;

const SelectDropdown: React.FC<SelectDropdownProps> = (props) => {
  const {
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className = '',
    disabled = false,
    icon,
    variant,
    label,
    dropUp = false
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get display label
  const getDisplayLabel = (): string => {
    const selectedOption = options.find(opt => opt.value === value);
    if (selectedOption) return selectedOption.label;
    if (value) return value; // Custom value
    return placeholder;
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Focus input when opening editable dropdown
  useEffect(() => {
    if (isOpen && variant === 'editable' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, variant]);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setCustomInput('');
  };

  const handleCustomInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (variant !== 'editable') return;

    const val = e.target.value;
    
    if (props.inputType === 'number') {
      // Only allow numbers
      if (val && !/^\d*$/.test(val)) return;
      
      const numVal = parseInt(val);
      if (!isNaN(numVal)) {
        if (props.min !== undefined && numVal < props.min) return;
        if (props.max !== undefined && numVal > props.max) return;
      }
    }
    
    setCustomInput(val);
  };

  const handleCustomInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customInput.trim()) {
      onChange(customInput.trim());
      setIsOpen(false);
      setCustomInput('');
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setCustomInput('');
    }
  };

  const handleCustomInputSubmit = () => {
    if (customInput.trim()) {
      onChange(customInput.trim());
      setIsOpen(false);
      setCustomInput('');
    }
  };

  const isValueSelected = value !== '' && value !== undefined;

  return (
    <div ref={selectRef} className={`relative inline-block ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 
          focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-[#667eea] 
          bg-white cursor-pointer shadow-sm
          hover:border-gray-400 transition-colors
          flex items-center justify-between gap-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span className="flex items-center gap-2 truncate">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className={isValueSelected ? 'text-gray-900' : 'text-gray-500'}>
            {getDisplayLabel()}
          </span>
        </span>
        <svg
          className={`w-4 h-4 text-[#667eea] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <div 
        className={`
          absolute z-50 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden
          transition-all duration-200
          ${dropUp ? 'bottom-full mb-1 origin-bottom right-0' : 'top-full mt-1 origin-top'}
          ${isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible pointer-events-none'}
        `}
      >
        {/* Custom Input for Editable Variant */}
        {variant === 'editable' && (
          <div className="p-2 border-b border-gray-100">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type={props.inputType || 'text'}
                value={customInput}
                onChange={handleCustomInputChange}
                onKeyDown={handleCustomInputKeyDown}
                placeholder={props.inputPlaceholder || 'Enter custom value...'}
                min={props.inputType === 'number' ? props.min : undefined}
                max={props.inputType === 'number' ? props.max : undefined}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md 
                  focus:outline-none focus:ring-1 focus:ring-[#667eea] focus:border-[#667eea]"
              />
              <button
                type="button"
                onClick={handleCustomInputSubmit}
                disabled={!customInput.trim()}
                className="px-3 py-1.5 text-sm font-medium text-white bg-[#667eea] rounded-md 
                  hover:bg-[#5a6fd6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Options List */}
        <div className="max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.value)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors
                ${value === option.value 
                  ? 'bg-[#667eea] text-white font-medium' 
                  : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectDropdown;