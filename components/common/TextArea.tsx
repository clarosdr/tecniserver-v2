import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

const TextArea: React.FC<TextAreaProps> = ({ label, name, error, containerClassName, className, ...props }) => {
  return (
    <div className={`mb-4 ${containerClassName || ''}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        rows={3}
        className={`block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm
                   bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                   focus:outline-none focus:ring-primary dark:focus:ring-primary-light focus:border-primary dark:focus:border-primary-light 
                   sm:text-sm ${error ? 'border-red-500 dark:border-red-400' : ''} ${className || ''}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default TextArea;