
import React from 'react';
import { WorkOrderStatus } from '../../types.ts';

interface WorkOrderStatusBadgeProps {
  status: WorkOrderStatus;
}

const WorkOrderStatusBadge: React.FC<WorkOrderStatusBadgeProps> = ({ status }) => {
  const statusColors: Partial<Record<WorkOrderStatus, string>> = { // Partial as some statuses might not have unique colors yet
    [WorkOrderStatus.SolicitudPendiente]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-700 dark:text-cyan-100',
    [WorkOrderStatus.PendienteDiagnostico]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100',
    [WorkOrderStatus.EnEsperaDeRepuestos]: 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-100',
    [WorkOrderStatus.EnProgreso]: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100',
    [WorkOrderStatus.EsperandoAprobacion]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100',
    [WorkOrderStatus.Reparado]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-100',
    [WorkOrderStatus.SinSolucion]: 'bg-rose-100 text-rose-800 dark:bg-rose-700 dark:text-rose-100',
    [WorkOrderStatus.Entregado]: 'bg-slate-100 text-slate-800 dark:bg-slate-600 dark:text-slate-200',
    [WorkOrderStatus.EnBodega]: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100',
    [WorkOrderStatus.Cancelado]: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100'}`}>
      {status}
    </span>
  );
};

export default WorkOrderStatusBadge;
