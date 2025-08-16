
import React from 'react';
import { ClientCategory } from '../../types';

interface ClientCategoryBadgeProps {
  category: ClientCategory;
}

const ClientCategoryBadge: React.FC<ClientCategoryBadgeProps> = ({ category }) => {
  const categoryColors: Record<ClientCategory, string> = {
    [ClientCategory.Individual]: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100',
    [ClientCategory.Empresa]: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100',
    [ClientCategory.Preferencial]: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100',
    [ClientCategory.EmpresaPlus]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100',
    [ClientCategory.Seleccional]: 'bg-slate-100 text-slate-800 dark:bg-slate-600 dark:text-slate-200',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100'}`}>
      {category}
    </span>
  );
};

export default ClientCategoryBadge;
