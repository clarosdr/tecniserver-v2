
import React from 'react';
import Card from '../../components/common/Card.tsx';
import { Link } from 'react-router-dom';
import { formatCurrencyCOP } from '../../utils/formatting';

// Dummy data for repair history
const repairHistory = [
  { id: 'H001', workOrderId: 'OT-1007', equipment: 'Impresora Epson L3150 (SN: EPS789DEF)', serviceDate: '2024-07-10', problem: 'No encendía', solution: 'Reemplazo de fuente de poder.', cost: 120000, status: 'Entregado' },
  { id: 'H002', workOrderId: 'OT-0952', equipment: 'Laptop HP Pavilion (SN: HP123XYZ)', serviceDate: '2024-05-20', problem: 'Pantalla rota', solution: 'Cambio de display.', cost: 350000, status: 'Entregado' },
  { id: 'H003', workOrderId: 'OT-0911', equipment: 'PC Escritorio Dell (SN: DELL456ABC)', serviceDate: '2024-03-01', problem: 'Mantenimiento preventivo', solution: 'Limpieza interna, optimización de sistema.', cost: 80000, status: 'Entregado' },
];

const ClientPortalHistoryPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <header className="mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
        <Link to="/client-portal" className="text-sm text-primary hover:underline dark:text-primary-light mb-2 block">&larr; Volver al Dashboard del Portal</Link>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Historial de Reparaciones</h1>
        <p className="text-slate-600 dark:text-slate-400">Consulta todas las órdenes de trabajo y servicios realizados para tus equipos.</p>
      </header>

      {repairHistory.length > 0 ? (
        <div className="space-y-6">
          {repairHistory.map(item => (
            <Card key={item.id} className="shadow-md">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-3 mb-3">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{item.equipment}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ID Orden de Trabajo: {item.workOrderId} | Fecha de Servicio: {item.serviceDate}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-slate-600 dark:text-slate-300">Problema Reportado:</p>
                  <p className="text-slate-700 dark:text-slate-200">{item.problem}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-600 dark:text-slate-300">Solución Aplicada:</p>
                  <p className="text-slate-700 dark:text-slate-200">{item.solution}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-600 dark:text-slate-300">Costo Total:</p>
                  <p className="text-slate-700 dark:text-slate-200 font-semibold">{formatCurrencyCOP(item.cost)}</p>
                   <p className="font-medium text-slate-600 dark:text-slate-300 mt-1">Estado:</p>
                  <p className="text-slate-700 dark:text-slate-200">{item.status}</p>
                </div>
              </div>
               <div className="mt-4 text-right">
                 <Link to={`#`} className="text-sm text-primary hover:underline dark:text-primary-light">Ver Ticket Completo &rarr;</Link>
               </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            No tienes historial de reparaciones registrado.
          </p>
        </Card>
      )}
    </div>
  );
};

export default ClientPortalHistoryPage;
