
import React, { useState } from 'react';
import Card from '../../components/common/Card.tsx';
import Button from '../../components/common/Button.tsx';
import Select from '../../components/common/Select.tsx';
import { Link } from 'react-router-dom';

// Dummy data for equipment status
const equipmentList = [
  { id: 'EQ001', name: 'Laptop HP Pavilion (SN: HP123XYZ)', status: 'En Diagnóstico', lastUpdate: '2024-07-28', workOrderId: 'OT-1025' },
  { id: 'EQ002', name: 'PC Escritorio Dell (SN: DELL456ABC)', status: 'Reparado - Listo para retirar', lastUpdate: '2024-07-29', workOrderId: 'OT-1022' },
  { id: 'EQ003', name: 'Impresora Epson L3150 (SN: EPS789DEF)', status: 'Entregado', lastUpdate: '2024-07-15', workOrderId: 'OT-1007' },
  { id: 'EQ004', name: 'Smartphone Samsung S22 (SN: SAM012GHI)', status: 'En espera de repuesto', lastUpdate: '2024-07-27', workOrderId: 'OT-1030' },
];

const statusFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'in_workshop', label: 'En Taller' },
  { value: 'ready_pickup', label: 'Listo para Retirar' },
  { value: 'delivered', label: 'Entregado' },
];

const statusMap: { [key: string]: string[] } = {
    all: ['En Diagnóstico', 'Esperando Repuesto', 'En Progreso', 'Reparado - Listo para retirar', 'Entregado', 'Sin Solución'],
    in_workshop: ['En Diagnóstico', 'Esperando Repuesto', 'En Progreso', 'Sin Solución'],
    ready_pickup: ['Reparado - Listo para retirar'],
    delivered: ['Entregado'],
};


const ClientPortalEquipmentStatusPage: React.FC = () => {
  const [filter, setFilter] = useState('all');

  const filteredEquipment = equipmentList.filter(eq => {
    if (filter === 'all') return true;
    return statusMap[filter]?.includes(eq.status);
  });

  const getStatusColor = (status: string) => {
    if (status.includes('Listo para retirar')) return 'text-emerald-600 dark:text-emerald-400';
    if (status.includes('Entregado')) return 'text-slate-500 dark:text-slate-400';
    if (status.includes('Diagnóstico') || status.includes('espera de repuesto')) return 'text-amber-600 dark:text-amber-400';
    return 'text-blue-600 dark:text-blue-400';
  }

  return (
    <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <header className="mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
        <Link to="/client-portal" className="text-sm text-primary hover:underline dark:text-primary-light mb-2 block">&larr; Volver al Dashboard del Portal</Link>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Estado de tus Equipos</h1>
        <p className="text-slate-600 dark:text-slate-400">Consulta el estado actual de los equipos que tienes en nuestro taller.</p>
      </header>

      <div className="mb-6">
        <Select
          label="Filtrar por estado:"
          options={statusFilters}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          containerClassName="max-w-xs"
        />
      </div>

      {filteredEquipment.length > 0 ? (
        <div className="space-y-4">
          {filteredEquipment.map(eq => (
            <Card key={eq.id} className="shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{eq.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    ID Orden de Trabajo: <span className="font-medium">{eq.workOrderId}</span>
                  </p>
                  <p className={`text-md font-bold ${getStatusColor(eq.status)}`}>
                    {eq.status}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 sm:text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Última actualización: {eq.lastUpdate}</p>
                  <Button variant="ghost" size="sm" className="mt-1 text-primary dark:text-primary-light">
                    Ver Detalles de OT
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                No se encontraron equipos con el filtro seleccionado.
            </p>
        </Card>
      )}
    </div>
  );
};

export default ClientPortalEquipmentStatusPage;
