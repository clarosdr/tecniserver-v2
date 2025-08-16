
import React from 'react';

interface CardProps {
  title?: React.ReactNode; // Changed from string to React.ReactNode
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode; // e.g., buttons or links in the header
  icon?: React.ReactNode; // Added optional icon prop
  onClick?: () => void;
  id?: string; // Added optional id prop
}

const Card: React.FC<CardProps> = ({ title, children, className, actions, icon, onClick, id }) => {
  return (
    <div
      id={id} // Pass id to the root div
      className={`bg-white dark:bg-slate-800 shadow-lg dark:shadow-xl dark:shadow-slate-900/30 rounded-lg overflow-hidden ${className || ''} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {(title || icon || actions) && ( // Render header if any of these are present
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
