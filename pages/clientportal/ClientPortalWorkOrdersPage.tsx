


import React, { useState, useEffect, useContext, useCallback } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { WorkOrder, WorkOrderStatus, BudgetItem, TableColumn } from '../../types';
import { getWorkOrdersByClientId } from '../../services/apiService'; // Removed approve/reject client functions
import { AuthContext } from '../../contexts/AuthContext';
import { formatCurrencyCOP } from '../../utils/formatting';
import WorkOrderStatusBadge from '../../components/workorders/WorkOrderStatusBadge';
import Modal from '../../components/common/Modal';
// TextArea removed as rejection reason is no longer needed here
import Table from '../../components/common/Table';
import { WrenchScrewdriverIcon, EyeIcon } from '../../constants'; // Removed CheckCircleIcon, XCircleIcon

const ClientPortalWorkOrdersPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null); // For details view
  const [isBudgetDetailModalOpen, setIsBudgetDetailModalOpen] = useState(false);
  const [selectedWorkOrderForModal, setSelectedWorkOrderForModal] = useState<WorkOrder | null>(null);

  const fetchClientWorkOrders = useCallback(async () => {
    if (auth?.user?.id && auth.user.role === 'Client') {
      setIsLoading(true);
      try {
        const data = await getWorkOrdersByClientId(auth.user.id);
        setWorkOrders(data);
      } catch (error) {
        console.error("Error fetching client work orders:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [auth?.user?.id, auth?.user?.role]);

  useEffect(() => {
    fetchClientWorkOrders();
  }, [fetchClientWorkOrders]);

  const toggleBudgetDetails = (workOrderId: string) => {
    setExpandedBudgetId(prevId => (prevId === workOrderId ? null : workOrderId));
  };

  const handleOpenBudgetDetailModal = (workOrder: WorkOrder) => {
    setSelectedWorkOrderForModal(workOrder);
    setIsBudgetDetailModalOpen(true);
  };
  
  const handleCloseBudgetDetailModal = () => {
    setIsBudgetDetailModalOpen(false);
    setSelectedWorkOrderForModal(null);
  };

  const columns: TableColumn<WorkOrder>[] = [
    { header: 'ID OT', accessor: 'customId', className: 'font-semibold' },
    { header: 'Equipo', accessor: (item) => `${item.equipmentType} ${item.equipmentBrand} ${item.equipmentModel}` },
    { header: 'Serial', accessor: 'equipmentSerial' },
    { header: 'Estado', accessor: (item) => <WorkOrderStatusBadge status={item.status} /> },
    { header: 'Fecha Ingreso', accessor: (item) => new Date(item.createdAt).toLocaleDateString() },
    {
      header: 'Presupuesto',
      accessor: (item) => {
        const totalBudget = item.budgetItems?.reduce((sum, bi) => sum + (bi.quantity * bi.unitPrice), 0) || 0;
        if (item.status === WorkOrderStatus.EsperandoAprobacion && !item.budgetApproved) {
          return (
            <Button size="sm" variant="warning" onClick={(e) => { e.stopPropagation(); handleOpenBudgetDetailModal(item); }}>
              Presupuesto Pendiente ({formatCurrencyCOP(totalBudget)})
            </Button>
          );
        }
        if (item.budgetApproved) return <span className="text-emerald-600 dark:text-emerald-400">Aprobado ({formatCurrencyCOP(totalBudget)})</span>;
        if (item.budgetNotes?.toLowerCase().includes('rechazado')) return <span className="text-red-500 dark:text-red-400">Rechazado ({formatCurrencyCOP(totalBudget)})</span>;
        if (totalBudget > 0) return formatCurrencyCOP(totalBudget);
        return 'N/D';
      }
    },
    {
        header: 'Detalles',
        accessor: (item) => (
            <Button size="sm" variant="ghost" onClick={(e) => {e.stopPropagation(); toggleBudgetDetails(item.id);}} title="Ver Detalles Completos">
                <EyeIcon className="h-5 w-5"/>
            </Button>
        )
    }
  ];

  if (isLoading) {
    return <LoadingSpinner text="Cargando órdenes de trabajo..." className="mt-10" />;
  }
  if (!auth?.user || auth.user.role !== 'Client') {
    return (
      <Card title="Acceso Denegado">
        <p className="text-red-500">Debes iniciar sesión como cliente para ver esta página.</p>
      </Card>
    );
  }

  return (
    <div>
      <header className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <WrenchScrewdriverIcon className="h-8 w-8 mr-3 text-primary dark:text-primary-light" />
          Mis Órdenes de Trabajo y Servicios
        </h1>
        <p className="text-slate-600 dark:text-slate-400">Aquí puedes ver el estado de tus servicios y detalles de presupuestos.</p>
      </header>

      {workOrders.length > 0 ? (
        <div className="space-y-1">
          <Card>
            <Table 
                columns={columns} 
                data={workOrders} 
                onRowClick={(item) => toggleBudgetDetails(item.id)}
            />
          </Card>
          {expandedBudgetId && workOrders.find(wo => wo.id === expandedBudgetId) && (
            <Card title={`Detalles OT: ${workOrders.find(wo => wo.id === expandedBudgetId)?.customId}`} className="mt-4">
              <WorkOrderDetails wo={workOrders.find(wo => wo.id === expandedBudgetId)!} />
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            No tienes órdenes de trabajo activas o historial disponible.
          </p>
        </Card>
      )}

      {isBudgetDetailModalOpen && selectedWorkOrderForModal && (
        <Modal
          isOpen={isBudgetDetailModalOpen}
          onClose={handleCloseBudgetDetailModal}
          title={`Detalles del Presupuesto: OT ${selectedWorkOrderForModal.customId}`}
          size="lg"
          footer={<Button variant="secondary" onClick={handleCloseBudgetDetailModal}>Cerrar</Button>}
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Equipo: {selectedWorkOrderForModal.equipmentType} {selectedWorkOrderForModal.equipmentBrand} {selectedWorkOrderForModal.equipmentModel} (S/N: {selectedWorkOrderForModal.equipmentSerial})
            </h3>
            
            <p className="text-sm text-slate-600 dark:text-slate-400">Falla Reportada: {selectedWorkOrderForModal.reportedFault}</p>

            {selectedWorkOrderForModal.budgetItems && selectedWorkOrderForModal.budgetItems.length > 0 && (
              <div className="border rounded-md p-3 bg-slate-50 dark:bg-slate-700/50">
                <h4 className="font-medium text-slate-700 dark:text-slate-200 mb-1">Detalle del Presupuesto:</h4>
                <ul className="space-y-1 text-sm">
                  {selectedWorkOrderForModal.budgetItems.map(item => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.itemName} (x{item.quantity})</span>
                      <span className="font-medium">{formatCurrencyCOP(item.unitPrice * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <hr className="my-2 border-slate-300 dark:border-slate-600"/>
                <div className="flex justify-between font-bold text-md text-slate-800 dark:text-slate-100">
                  <span>Total Presupuesto:</span>
                  <span>{formatCurrencyCOP(selectedWorkOrderForModal.budgetItems.reduce((sum, bi) => sum + bi.unitPrice * bi.quantity, 0))}</span>
                </div>
              </div>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Estado del presupuesto: 
                {selectedWorkOrderForModal.budgetApproved 
                    ? <span className="font-semibold text-emerald-600 dark:text-emerald-400"> Aprobado.</span>
                    : selectedWorkOrderForModal.budgetNotes?.toLowerCase().includes('rechazado') 
                    ? <span className="font-semibold text-red-600 dark:text-red-400"> Rechazado. {selectedWorkOrderForModal.budgetNotes}</span>
                    : <span className="font-semibold text-amber-600 dark:text-amber-400"> Pendiente de aprobación.</span>
                }
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
                Para aprobar o discutir este presupuesto, por favor contacte al taller.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

const WorkOrderDetails: React.FC<{wo: WorkOrder}> = ({wo}) => {
    const totalBudget = wo.budgetItems?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
    return (
        <div className="text-sm text-slate-700 dark:text-slate-300 p-2 space-y-2">
            <p><strong>Falla Reportada:</strong> {wo.reportedFault}</p>
            {wo.externalNotes && <p><strong>Observaciones Cliente:</strong> {wo.externalNotes}</p>}
            {wo.accessories && <p><strong>Accesorios:</strong> {wo.accessories}</p>}
            {wo.notes && <p><strong>Notas Técnicas:</strong> {wo.notes}</p>}
            <p><strong>Prioridad:</strong> {wo.priority}</p>
            <p><strong>Estado Pago:</strong> {wo.paymentStatus || 'Pendiente'} - {formatCurrencyCOP(wo.totalPaidAmount || 0)} pagado de {formatCurrencyCOP(totalBudget)}</p>
            {wo.budgetNotes && <p className="italic text-slate-500 dark:text-slate-400"><strong>Notas del Presupuesto:</strong> {wo.budgetNotes}</p>}

            {wo.budgetItems && wo.budgetItems.length > 0 && (
              <div className="border rounded-md p-2 my-2 bg-slate-50 dark:bg-slate-700/30">
                <h4 className="font-medium text-slate-600 dark:text-slate-200 mb-1 text-xs">Items del Presupuesto:</h4>
                <ul className="space-y-0.5 text-xs">
                  {wo.budgetItems.map(item => (
                    <li key={item.id} className="flex justify-between items-start">
                      <span className="flex-1 pr-2">{item.itemName} (x{item.quantity}) <em className="text-slate-500 dark:text-slate-400 text-[10px] block whitespace-normal break-words">{item.invoiceNotes || ''}</em></span>
                      <span className="font-medium whitespace-nowrap">{formatCurrencyCOP(item.unitPrice * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
             {wo.deliveryDate && <p><strong>Fecha Entrega:</strong> {new Date(wo.deliveryDate).toLocaleDateString()}</p>}
        </div>
    );
};


export default ClientPortalWorkOrdersPage;
