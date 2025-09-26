import React from 'react';

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ 
  children, 
  defaultValue, 
  value, 
  onValueChange, 
  className = '' 
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <div className={className}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            value: currentValue, 
            onValueChange: handleValueChange 
          } as any);
        }
        return child;
      })}
    </div>
  );
};

const TabsList: React.FC<TabsListProps & { value?: string; onValueChange?: (value: string) => void }> = ({ 
  children, 
  className = '',
  value,
  onValueChange
}) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            isActive: child.props.value === value,
            onClick: () => onValueChange?.(child.props.value)
          } as any);
        }
        return child;
      })}
    </div>
  );
};

const TabsTrigger: React.FC<TabsTriggerProps & { isActive?: boolean; onClick?: () => void }> = ({ 
  children, 
  value, 
  className = '',
  isActive,
  onClick
}) => {
  return (
    <button
      type="button"
      className={`
        inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium 
        ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 
        focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
        ${isActive 
          ? 'bg-white text-gray-950 shadow-sm' 
          : 'text-gray-500 hover:text-gray-900'
        }
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const TabsContent: React.FC<TabsContentProps & { value?: string }> = ({ 
  children, 
  value: tabValue, 
  className = '',
  value: currentValue
}) => {
  if (currentValue !== tabValue) {
    return null;
  }

  return (
    <div className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };