import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  containerClassName?: string;
  placeholder?: string; 
}

const Select: React.FC<SelectProps> = ({ label, name, error, options, containerClassName, className, placeholder, ...rest }) => {
  return (
    <div className={`mb-4 ${containerClassName || ''}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <select
        id={name}
        name={name}
        className={`block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 
                   bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 
                   rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-primary-light 
                   focus:border-primary dark:focus:border-primary-light sm:text-sm 
                   ${error ? 'border-red-500 dark:border-red-400' : ''} ${className || ''}`}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Select;