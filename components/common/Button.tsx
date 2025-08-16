
import React, { ElementType, ComponentPropsWithoutRef } from 'react';

// Define the props specific to our Button component
interface ButtonOwnProps<E extends ElementType = ElementType> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: E; // The 'as' prop allows rendering as a different component/element
  className?: string;
}

// Combine ButtonOwnProps with the props of the element it will render as (E)
// Omit any props from the target element that are already defined in ButtonOwnProps
export type ButtonProps<E extends ElementType> = ButtonOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof ButtonOwnProps<E>>;

// Default the element type to 'button' if 'as' is not provided
const Button = <E extends ElementType = 'button'>({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  as, // Destructure the 'as' prop
  className,
  ...props // Spread the rest of the props (could include 'to' for Link, 'href' for 'a', etc.)
}: ButtonProps<E>) => {
  // Determine the component to render. Fallback to 'button' if 'as' is not provided.
  const Component = as || 'button';

  const baseStyles = 'font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center';

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-light focus:ring-primary dark:bg-primary-dark dark:hover:bg-primary dark:focus:ring-primary-light',
    secondary: 'bg-slate-200 text-slate-700 hover:bg-slate-300 focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 dark:focus:ring-slate-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 dark:hover:bg-red-400',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 dark:hover:bg-emerald-400',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 dark:hover:bg-amber-400',
    ghost: 'bg-transparent text-primary dark:text-primary-light hover:bg-primary-light hover:bg-opacity-10 dark:hover:bg-primary-light dark:hover:bg-opacity-20 focus:ring-primary dark:focus:ring-primary-light',
    outline: 'bg-transparent text-primary dark:text-primary-light border border-primary dark:border-primary-light hover:bg-primary-light hover:bg-opacity-10 dark:hover:bg-primary-light dark:hover:bg-opacity-20 focus:ring-primary dark:focus:ring-primary-light',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // If the component is a button, we can directly use the disabled prop.
  // For other components, this might not be applicable or might have a different name.
  // We cast props to any for disabled to avoid TypeScript errors when Component is not 'button'.
  // A more robust solution might involve checking if 'disabled' is a valid prop for Component.
  const isDisabled = isLoading || (props as any).disabled;


  return (
    <Component
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`}
      disabled={Component === 'button' ? isDisabled : undefined} // Only apply HTML disabled if it's actually a button
      {...props} // Pass down all other props
    >
      {isLoading && (
        <SpinnerIcon className="animate-spin h-5 w-5 mr-2" />
      )}
      {leftIcon && !isLoading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
    </Component>
  );
};

const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);


export default Button;
