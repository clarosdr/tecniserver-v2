
import React, { useState } from 'react';
import Card from '../../components/common/Card.tsx';
import Button from '../../components/common/Button.tsx';
import TextArea from '../../components/common/TextArea.tsx';
import { Link } from 'react-router-dom';
import { formatCurrencyCOP } from '../../utils/formatting';

// Dummy data for budget approval
const budgetItems = [
  { id: 'B001', workOrderId: 'OT-1025', equipment: 'Laptop HP Pavilion (SN: HP123XYZ)', description: 'Reemplazo de teclado y limpieza interna.', amount: 185000, status: 'Pendiente de Aprobación', dateIssued: '2024-07-29',
    details: [
        { item: 'Teclado Laptop HP Genuino', qty: 1, unitPrice: 120000, total: 120000 },
        { item: 'Servicio de Limpieza Interna Avanzada', qty: 1, unitPrice: 65000, total: 65000 },
    ]
  },
  { id: 'B002', workOrderId: 'OT-1020', equipment: 'PC Gamer Alienware (SN: DELL777XYZ)', description: 'Cambio de tarjeta gráfica y fuente de poder.', amount: 1250000, status: 'Aprobado', dateIssued: '2024-07-25',
    details: [
        { item: 'Tarjeta Gráfica RTX 4060', qty: 1, unitPrice: 980000, total: 980000 },
        { item: 'Fuente de Poder 750W Gold', qty: 1, unitPrice: 270000, total: 270000 },
    ]
  },
];

const ClientPortalBudgetApprovalPage: React.FC = () => {
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});

  const handleDecision = (budgetId: string, decision: 'approve' | 'reject') => {
    setSubmitting(prev => ({...prev, [budgetId]: true}));
    // Simulate API Call
    console.log({ budgetId, decision, comment: comments[budgetId] || '' });
    setTimeout(() => {
      alert(`Presupuesto ${budgetId} ${decision === 'approve' ? 'aprobado' : 'rechazado'} con comentario: "${comments[budgetId] || 'Sin comentarios'}"`);
      // Update budget status in a real app
      setSubmitting(prev => ({...prev, [budgetId]: false}));
    }, 1500);
  };

  const handleCommentChange = (budgetId: string, value: string) => {
    setComments(prev => ({ ...prev, [budgetId]: value }));
  };

  const pendingApprovalBudgets = budgetItems.filter(b => b.status === 'Pendiente de Aprobación');

  return (
    <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <header className="mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
        <Link to="/client-portal" className="text-sm text-primary hover:underline dark:text-primary-light mb-2 block">&larr; Volver al Dashboard del Portal</Link>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Aprobación de Presupuestos</h1>
        <p className="text-slate-600 dark:text-slate-400">Revisa y aprueba los presupuestos para los servicios de tus equipos.</p>
      </header>

      {pendingApprovalBudgets.length > 0 ? (
        <div className="space-y-6">
          {pendingApprovalBudgets.map(budget => (
            <Card key={budget.id} title={`Presupuesto OT: ${budget.workOrderId} - ${budget.equipment}`} className="shadow-lg">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Fecha de Emisión: {budget.dateIssued}</p>
              <p className="text-md text-slate-700 dark:text-slate-200 mb-3">Descripción General: {budget.description}</p>

              <div className="mb-4 overflow-x-auto">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Detalle del Presupuesto:</h4>
                <table className="min-w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-700">
                        <tr>
                            <th className="p-2">Item/Servicio</th>
                            <th className="p-2 text-right">Cantidad</th>
                            <th className="p-2 text-right">P. Unitario</th>
                            <th className="p-2 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {budget.details.map(detail => (
                            <tr key={detail.item} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                <td className="p-2 text-slate-700 dark:text-slate-300">{detail.item}</td>
                                <td className="p-2 text-slate-700 dark:text-slate-300 text-right">{detail.qty}</td>
                                <td className="p-2 text-slate-700 dark:text-slate-300 text-right">{formatCurrencyCOP(detail.unitPrice)}</td>
                                <td className="p-2 text-slate-700 dark:text-slate-300 text-right">{formatCurrencyCOP(detail.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>

              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                Monto Total: {formatCurrencyCOP(budget.amount)}
              </p>

              <TextArea
                label="Comentarios (Opcional)"
                value={comments[budget.id] || ''}
                onChange={(e) => handleCommentChange(budget.id, e.target.value)}
                rows={2}
                placeholder="Si rechazas, por favor indica el motivo..."
                containerClassName="mb-4"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="success"
                  onClick={() => handleDecision(budget.id, 'approve')}
                  isLoading={submitting[budget.id]}
                  className="flex-1"
                >
                  Aprobar Presupuesto
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDecision(budget.id, 'reject')}
                  isLoading={submitting[budget.id]}
                  className="flex-1"
                >
                  Rechazar Presupuesto
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
         <Card>
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            No tienes presupuestos pendientes de aprobación en este momento.
          </p>
        </Card>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">Presupuestos Anteriores</h2>
         <div className="space-y-4">
         {budgetItems.filter(b => b.status !== 'Pendiente de Aprobación').map(budget => (
            <Card key={budget.id} className="bg-slate-100 dark:bg-slate-800 shadow-sm">
                 <p className="font-semibold text-slate-700 dark:text-slate-200">OT: {budget.workOrderId} - {budget.equipment}</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Monto: {formatCurrencyCOP(budget.amount)} - Estado: <span className="font-medium">{budget.status}</span></p>
            </Card>
         ))}
         {budgetItems.filter(b => b.status !== 'Pendiente de Aprobación').length === 0 && (
             <p className="text-slate-500 dark:text-slate-400">No hay presupuestos anteriores.</p>
         )}
         </div>
      </div>
    </div>
  );
};

export default ClientPortalBudgetApprovalPage;
