import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  id?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className, actions, icon, onClick, id }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); // Prevent scrolling on space press
      onClick();
    }
  };

  return (
    <div
      id={id}
      className={`bg-white dark:bg-slate-800 shadow-lg dark:shadow-xl dark:shadow-slate-900/30 rounded-lg overflow-hidden transition-shadow duration-200 ${onClick ? 'cursor-pointer hover:shadow-xl dark:hover:shadow-2xl' : ''} ${className || ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {(title || icon || actions) && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center">
            {icon && <span className="mr-2 text-slate-700 dark:text-slate-200">{icon}</span>}
            {title && <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;