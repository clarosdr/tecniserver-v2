
import React from 'react';
import { WorkOrder, BudgetItem, WorkOrderStatus } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { APP_NAME } from '../../constants.tsx';
import { formatCurrencyCOP } from '../../utils/formatting';

interface WorkOrderTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
}

const WorkOrderTicketModal: React.FC<WorkOrderTicketModalProps> = ({ isOpen, onClose, workOrder }) => {
  if (!workOrder) return null;

  const totalBudget = workOrder.budgetItems?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;

  const handleSimulatedAction = (action: string) => {
    console.log(`${action} para OT: ${workOrder.customId}`);
    if (action === 'Imprimir Ticket') {
        alert(`Simulación de impresión para OT ${workOrder.customId}. Contenido listo para imprimir.`);
    } else {
        alert(`${action} para OT ${workOrder.customId} (Simulado)`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ticket Orden: ${workOrder.customId}`} size="lg">
      <div className="text-sm text-slate-700 dark:text-slate-300 printable-ticket" id={`ticket-${workOrder.id}`}>
        <header className="text-center mb-6 border-b pb-4 border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-primary dark:text-primary-light">{APP_NAME}</h2>
          <p>Comprobante de Orden de Trabajo</p>
          <p>Fecha Ingreso: {new Date(workOrder.createdAt).toLocaleDateString()}</p>
          <p>ID Orden: <span className="font-semibold">{workOrder.customId}</span></p>
           {workOrder.status === WorkOrderStatus.Entregado && workOrder.deliveryDate && (
            <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-1">EQUIPO ENTREGADO EL: {new Date(workOrder.deliveryDate).toLocaleDateString()}</p>
          )}
        </header>

        <section className="mb-4">
          <h3 className="font-semibold text-md mb-1 text-slate-800 dark:text-slate-100">Datos del Cliente:</h3>
          <p>Nombre: {workOrder.clientName}</p>
        </section>

        <section className="mb-4">
          <h3 className="font-semibold text-md mb-1 text-slate-800 dark:text-slate-100">Datos del Equipo:</h3>
          <p>Tipo: {workOrder.equipmentType}</p>
          <p>Marca: {workOrder.equipmentBrand}</p>
          <p>Modelo: {workOrder.equipmentModel}</p>
          <p>Serial: {workOrder.equipmentSerial || 'N/A'}</p>
        </section>
        
        {workOrder.accessories && (
            <section className="mb-4">
                <h3 className="font-semibold text-md mb-1 text-slate-800 dark:text-slate-100">Accesorios Entregados:</h3>
                <p className="whitespace-pre-wrap">{workOrder.accessories}</p>
            </section>
        )}

        <section className="mb-4">
          <h3 className="font-semibold text-md mb-1 text-slate-800 dark:text-slate-100">Falla Reportada por el Cliente:</h3>
          <p className="whitespace-pre-wrap">{workOrder.reportedFault}</p>
        </section>

        {workOrder.externalNotes && ( // Changed from "Observaciones del Cliente (Notas Externas)" to "Observaciones del Cliente"
            <section className="mb-4">
                <h3 className="font-semibold text-md mb-1 text-slate-800 dark:text-slate-100">Observaciones del Cliente:</h3>
                <p className="whitespace-pre-wrap">{workOrder.externalNotes}</p>
            </section>
        )}

        {workOrder.budgetItems && workOrder.budgetItems.length > 0 && (
          <section className="mb-4">
            <h3 className="font-semibold text-md mb-1 text-slate-800 dark:text-slate-100">Presupuesto Detallado:</h3>
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600 text-xs">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-2 py-1 text-left font-medium text-slate-500 dark:text-slate-400">Item/Servicio</th>
                  <th className="px-2 py-1 text-left font-medium text-slate-500 dark:text-slate-400">Notas Factura</th>
                  <th className="px-2 py-1 text-right font-medium text-slate-500 dark:text-slate-400">Cant.</th>
                  <th className="px-2 py-1 text-right font-medium text-slate-500 dark:text-slate-400">P. Unit.</th>
                  <th className="px-2 py-1 text-right font-medium text-slate-500 dark:text-slate-400">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-600">
                {workOrder.budgetItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-1">{item.itemName}</td>
                    <td className="px-2 py-1 whitespace-normal max-w-[150px] break-words">{item.invoiceNotes || '-'}</td>
                    <td className="px-2 py-1 text-right">{item.quantity}</td>
                    <td className="px-2 py-1 text-right">{formatCurrencyCOP(item.unitPrice)}</td>
                    <td className="px-2 py-1 text-right">{formatCurrencyCOP(item.quantity * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 dark:border-slate-500">
                 <tr>
                    <td colSpan={4} className="px-2 py-1 text-right font-semibold text-slate-800 dark:text-slate-100">Total:</td>
                    <td className="px-2 py-1 text-right font-semibold text-slate-800 dark:text-slate-100">{formatCurrencyCOP(totalBudget)}</td>
                 </tr>
                 {workOrder.paymentStatus && workOrder.totalPaidAmount !== undefined && (
                    <>
                     <tr>
                        <td colSpan={4} className="px-2 py-1 text-right font-medium text-slate-600 dark:text-slate-300">Total Pagado:</td>
                        <td className="px-2 py-1 text-right font-medium text-slate-600 dark:text-slate-300">{formatCurrencyCOP(workOrder.totalPaidAmount)}</td>
                     </tr>
                     <tr>
                        <td colSpan={4} className="px-2 py-1 text-right font-semibold text-slate-800 dark:text-slate-100">Saldo Pendiente:</td>
                        <td className="px-2 py-1 text-right font-semibold text-slate-800 dark:text-slate-100">{formatCurrencyCOP(totalBudget - workOrder.totalPaidAmount)}</td>
                     </tr>
                    </>
                 )}
              </tfoot>
            </table>
            {workOrder.budgetApproved && <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-1 text-xs">Presupuesto Aprobado por el Cliente.</p>}
             <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Estado Pago: {workOrder.paymentStatus || 'Pendiente'}</p>
          </section>
        )}
        
        {workOrder.scheduledMaintenanceDate && workOrder.scheduledMaintenanceType && (
          <section className="mb-4">
            <h3 className="font-semibold text-md mb-1 text-slate-800 dark:text-slate-100">Próximo Mantenimiento Programado:</h3>
            <p>Fecha: {new Date(workOrder.scheduledMaintenanceDate).toLocaleDateString()}</p>
            <p>Tipo: {workOrder.scheduledMaintenanceType}</p>
          </section>
        )}

        {workOrder.notes && ( 
             <section className="mb-4">
                <h3 className="font-semibold text-md mb-1 text-slate-800 dark:text-slate-100">Observaciones Técnicas (Internas):</h3>
                <p className="whitespace-pre-wrap text-xs">{workOrder.notes}</p>
            </section>
        )}

        <section className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
          <h3 className="font-semibold text-sm mb-1 text-slate-800 dark:text-slate-100">Términos y Condiciones (Ejemplo):</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>El diagnóstico tiene un costo de X (COP), abonable al costo total de la reparación si esta es aprobada.</li>
            <li>La garantía sobre la reparación es de XX días/meses y cubre únicamente las fallas reparadas y los repuestos instalados por {APP_NAME}. No cubre daños por mal uso, sobretensión o software de terceros.</li>
            <li>{APP_NAME} no se hace responsable por pérdida de información. Se recomienda al cliente realizar un respaldo previo de sus datos.</li>
            <li>Equipos no retirados después de 30 días de notificada su reparación o diagnóstico generarán costos de almacenaje diarios. Después de 90 días, se considerarán abandonados.</li>
            <li>Al firmar este comprobante, el cliente acepta los términos y condiciones aquí descritos.</li>
          </ul>
           <div className="mt-8 flex justify-between items-end">
                <div>
                    <p className="mt-4">_________________________</p>
                    <p>Firma Cliente (Conforme)</p>
                </div>
                <div>
                    <p className="mt-4">_________________________</p>
                    <p>Recibido por ({APP_NAME})</p>
                </div>
            </div>
        </section>
      </div>
      <div className="mt-6 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 rounded-b-lg flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={() => handleSimulatedAction('Imprimir Ticket')}>Imprimir</Button>
        <Button variant="primary" onClick={() => handleSimulatedAction('Enviar por WhatsApp')}>WhatsApp</Button>
        <Button variant="primary" onClick={() => handleSimulatedAction('Enviar por Email')}>Email</Button>
        <Button variant="primary" onClick={() => handleSimulatedAction('Enviar por SMS')}>SMS</Button>
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
      </div>
    </Modal>
  );
};

export default WorkOrderTicketModal;
