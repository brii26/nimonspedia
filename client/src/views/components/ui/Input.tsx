import React from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ChangeEvent } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  inputClassName?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  error?: string;
  inputClassName?: string;
  rows?: number;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  inputClassName?: string;
  options?: SelectOption[];
  placeholder?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const Input: React.FC<InputProps> = ({ 
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  ...props 
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
          error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-[#667eea] focus:border-[#667eea]'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${inputClassName}`}
        {...props}
      />
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};

export const Textarea: React.FC<TextareaProps> = ({ 
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  inputClassName = '',
  ...props 
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors resize-y ${
          error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-[#667eea] focus:border-[#667eea]'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${inputClassName}`}
        {...props}
      />
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};

export const Select: React.FC<SelectProps> = ({ 
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  error,
  required = false,
  disabled = false,
  placeholder,
  className = '',
  inputClassName = '',
  ...props 
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
          error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-[#667eea] focus:border-[#667eea]'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${inputClassName}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};

export default Input;