
import React from 'react';
import { TableColumn } from '../../types.ts'; // Import shared TableColumn
import LoadingSpinner from './LoadingSpinner.tsx'; // Assuming LoadingSpinner is correctly imported or defined

// Local Column interface removed

interface TableProps<T> {
  columns: TableColumn<T>[]; // Use imported TableColumn
  data: T[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyStateMessage?: string;
}

const Table = <T extends { id: string | number },>(
  { columns, data, onRowClick, isLoading = false, emptyStateMessage = "No hay datos disponibles." }: TableProps<T>
): React.ReactNode => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <LoadingSpinner text="Cargando datos..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="text-center p-10 text-slate-500 dark:text-slate-400">{emptyStateMessage}</div>;
  }

  return (
    <div className="overflow-x-auto shadow-md dark:shadow-lg rounded-lg">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-700">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
          {data.map((item) => (
            <tr 
              key={item.id} 
              className={`${onRowClick ? 'hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col, index) => (
                <td key={index} className={`px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 ${col.className || ''}`}>
                  {typeof col.accessor === 'function'
                    ? col.accessor(item)
                    : col.render 
                    ? col.render(item) 
                    : String(item[col.accessor as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// LoadingSpinner definition is removed from here as it should be imported from its own file.
// Assuming it's correctly handled by the `import LoadingSpinner from './LoadingSpinner';` at the top.

export default Table;