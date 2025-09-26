import React from 'react';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ children, value, onValueChange, defaultValue }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            value: currentValue, 
            onValueChange: handleChange 
          } as any);
        }
        return child;
      })}
    </div>
  );
};

const SelectTrigger: React.FC<SelectTriggerProps & { value?: string; onValueChange?: (value: string) => void }> = ({ 
  children, 
  className = '',
  value,
  onValueChange
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
        <svg
          className="h-4 w-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {React.Children.map(children, child => {
            if (React.isValidElement(child) && child.type === SelectContent) {
              return React.cloneElement(child, { 
                value, 
                onValueChange: (newValue: string) => {
                  onValueChange?.(newValue);
                  setIsOpen(false);
                }
              } as any);
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

const SelectValue: React.FC<SelectValueProps & { value?: string }> = ({ 
  placeholder = "Select an option...", 
  className = '',
  value
}) => {
  return (
    <span className={className}>
      {value || placeholder}
    </span>
  );
};

const SelectContent: React.FC<SelectContentProps & { value?: string; onValueChange?: (value: string) => void }> = ({ 
  children, 
  className = '',
  value,
  onValueChange
}) => {
  return (
    <div className={`py-1 ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            isSelected: child.props.value === value,
            onSelect: () => onValueChange?.(child.props.value)
          } as any);
        }
        return child;
      })}
    </div>
  );
};

const SelectItem: React.FC<SelectItemProps & { isSelected?: boolean; onSelect?: () => void }> = ({ 
  children, 
  value, 
  className = '',
  isSelected,
  onSelect
}) => {
  return (
    <div
      className={`relative flex cursor-pointer select-none items-center py-2 px-3 text-sm outline-none hover:bg-gray-100 ${isSelected ? 'bg-blue-50 text-blue-900' : ''} ${className}`}
      onClick={onSelect}
    >
      {children}
    </div>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };