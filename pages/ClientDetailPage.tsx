
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Changed useHistory to useNavigate
import { Client, WorkOrder, WorkOrderStatus, ClientEquipment, ScheduledService, ScheduledServiceStatus, WorkOrderArea, TableColumn } from '../types'; // Import TableColumn
import {
    getClientById, getWorkOrdersByClientId, updateClient, sendPaymentReminder,
    getClientEquipmentByClientId, createClientEquipment, updateClientEquipment, deleteClientEquipment,
    getScheduledServicesByClientId, createScheduledService, updateScheduledService, deleteScheduledService
} from '../services/apiService';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import ClientForm from '../components/clients/ClientForm';
import ClientEquipmentForm from '../components/clients/ClientEquipmentForm';
import ScheduledServiceForm from '../components/clients/ScheduledServiceForm';
import Tabs from '../components/common/Tabs'; // Import the new Tabs component
import { formatCurrencyCOP } from '../utils/formatting';
import { DeviceTabletIcon, CalendarDaysIcon, PencilIcon, TrashIcon, ArrowTopRightOnSquareIcon, TicketIcon, PlusIcon, WrenchScrewdriverIcon, UserCircleIcon, BriefcaseIcon, ListBulletIcon, CurrencyDollarIcon } from '../constants';

// Local Column interface removed

const ScheduledServiceStatusBadge: React.FC<{ status: ScheduledServiceStatus }> = ({ status }) => {
  const statusColors: Record<ScheduledServiceStatus, string> = {
    [ScheduledServiceStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100',
    [ScheduledServiceStatus.InProgress]: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100',
    [ScheduledServiceStatus.Completed]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-100',
    [ScheduledServiceStatus.Cancelled]: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100',
    [ScheduledServiceStatus.ConvertedToWorkOrder]: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

const InfoItem: React.FC<{ label: string, value?: string | null | string[] }> = ({ label, value }) => (
  <div className="mb-3">
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    <p className="text-md break-words">{Array.isArray(value) ? value.join(', ') : (value || 'No especificado')}</p>
  </div>
);


const ClientDetailPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate(); 

  const [client, setClient] = useState<Client | null>(null);
  const [clientWorkOrders, setClientWorkOrders] = useState<WorkOrder[]>([]);
  const [registeredEquipment, setRegisteredEquipment] = useState<ClientEquipment[]>([]);
  const [scheduledServices, setScheduledServices] = useState<ScheduledService[]>([]);

  const [isLoading, setIsLoading] = useState(true); // Consolidated loading state
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editApiError, setEditApiError] = useState<string | null>(null);

  const [isEquipmentFormModalOpen, setIsEquipmentFormModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<ClientEquipment | null>(null);
  const [isSubmittingEquipment, setIsSubmittingEquipment] = useState(false);
  const [equipmentApiError, setEquipmentApiError] = useState<string | null>(null);

  const [isServiceFormModalOpen, setIsServiceFormModalOpen] = useState(false);
  const [editingScheduledService, setEditingScheduledService] = useState<ScheduledService | null>(null);
  const [targetEquipmentForService, setTargetEquipmentForService] = useState<ClientEquipment | null>(null);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [serviceApiError, setServiceApiError] = useState<string | null>(null);


  const fetchData = useCallback(async () => {
    if (!clientId) { setError("ID de cliente no válido."); setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try {
      const [clientData, workOrdersData, equipmentData, servicesData] = await Promise.all([
        getClientById(clientId),
        getWorkOrdersByClientId(clientId),
        getClientEquipmentByClientId(clientId),
        getScheduledServicesByClientId(clientId)
      ]);

      if (clientData) setClient(clientData); else { throw new Error("Cliente no encontrado."); }
      setClientWorkOrders(workOrdersData);
      setRegisteredEquipment(equipmentData.sort((a,b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()));
      setScheduledServices(servicesData.sort((a,b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()));

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos del cliente.");
      console.error(err);
    }
    finally { setIsLoading(false); }
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenEditModal = () => {
    setEditApiError(null);
    setIsEditModalOpen(true);
  };

  const handleClientUpdate = async (updatedData: Client) => {
    if (!client) return;
    setIsSubmittingEdit(true); setEditApiError(null);
    try {
      const result = await updateClient(client.id, updatedData);
      setClient(result || null);
      setIsEditModalOpen(false);
    } catch (err: any) { console.error("Error updating client:", err); setEditApiError(err.message || "Error al actualizar el cliente."); }
    finally { setIsSubmittingEdit(false); }
  };

  const handleOpenEquipmentFormModal = (equipment?: ClientEquipment) => {
    setEditingEquipment(equipment || null);
    setEquipmentApiError(null);
    setIsEquipmentFormModalOpen(true);
  };
  const handleEquipmentSubmit = async (data: Omit<ClientEquipment, 'id' | 'registeredAt' | 'clientId'> | ClientEquipment) => {
    if (!clientId) return;
    setIsSubmittingEquipment(true); setEquipmentApiError(null);
    try {
      if (editingEquipment && 'id' in data) {
        await updateClientEquipment(data.id, data);
      } else {
        await createClientEquipment({ ...data, clientId });
      }
      await fetchData(); // Refetch all data to update counts and lists
      setIsEquipmentFormModalOpen(false);
    } catch (err: any) { console.error("Error submitting equipment:", err); setEquipmentApiError(err.message || "Error al guardar equipo."); }
    finally { setIsSubmittingEquipment(false); }
  };
  const handleEquipmentDelete = async (equipmentId: string) => {
    if (window.confirm('¿Está seguro de eliminar este equipo y todos sus servicios programados asociados?')) {
      setIsSubmittingEquipment(true); // Use this for visual feedback
      try {
        await deleteClientEquipment(equipmentId);
        await fetchData(); // Refetch all data
      } catch (error) { console.error("Error deleting equipment:", error); alert("Error al eliminar equipo.");}
      finally { setIsSubmittingEquipment(false); }
    }
  };

  const handleOpenServiceFormModal = (equipment: ClientEquipment, service?: ScheduledService) => {
    setTargetEquipmentForService(equipment);
    setEditingScheduledService(service || null);
    setServiceApiError(null);
    setIsServiceFormModalOpen(true);
  };

  const handleConvertToWorkOrder = (service: ScheduledService) => {
    const equipment = registeredEquipment.find(eq => eq.id === service.clientEquipmentId);
    if (!client || !equipment) {
        alert("Faltan datos del cliente o del equipo para convertir a OT.");
        return;
    }
    navigate('/work-orders/new', { 
        state: {
            scheduledServiceId: service.id,
            clientId: client.id,
            clientName: client.name,
            clientEquipmentId: equipment.id,
            clientDetails: client,
            equipmentDetails: equipment,
            scheduledServiceDetails: service,
        }
    });
  };

  const handleServiceSubmit = async (data: Omit<ScheduledService, 'id'|'createdAt'|'updatedAt'|'clientId'|'clientEquipmentId' | 'clientEquipmentSerial' | 'clientEquipmentDescription'> | ScheduledService) => {
    if (!clientId || !targetEquipmentForService) return;
    setIsSubmittingService(true); setServiceApiError(null);
    try {
      if (editingScheduledService && 'id' in data) {
        await updateScheduledService(data.id, data);
      } else {
        const createData = data as Omit<ScheduledService, 'id'|'createdAt'|'updatedAt'|'clientId'|'clientEquipmentId' | 'clientEquipmentSerial' | 'clientEquipmentDescription'>;
        await createScheduledService({ ...createData, clientId, clientEquipmentId: targetEquipmentForService.id });
      }
      await fetchData(); // Refetch all data
      setIsServiceFormModalOpen(false);
    } catch (err: any) { console.error("Error submitting service:", err); setServiceApiError(err.message || "Error al guardar servicio."); }
    finally { setIsSubmittingService(false); }
  };
   const handleScheduledServiceDelete = async (serviceId: string) => {
    if (window.confirm('¿Está seguro de eliminar este servicio programado?')) {
      setIsSubmittingService(true); // Use this for visual feedback
      try {
        await deleteScheduledService(serviceId);
        await fetchData(); // Refetch all data
      } catch (error) { console.error("Error deleting scheduled service:", error); alert("Error al eliminar servicio programado.");}
      finally { setIsSubmittingService(false); }
    }
  };

  const financialSummary = useMemo(() => {
    const unpaidOrders = clientWorkOrders.filter(wo => {
      const totalBudget = wo.budgetItems?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
      const amountDue = totalBudget - (wo.totalPaidAmount || 0);
      return amountDue > 0 && (wo.area === WorkOrderArea.ListoParaRetirar || (wo.area === WorkOrderArea.HistorialCompletados && wo.status === WorkOrderStatus.Entregado) );
    }).map(wo => {
        const totalBudget = wo.budgetItems?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
        return { id: wo.id, otCustomId: wo.customId || wo.id, date: new Date(wo.createdAt).toLocaleDateString(), amountDue: totalBudget - (wo.totalPaidAmount || 0) }
    });
    const totalDebt = unpaidOrders.reduce((sum, order) => sum + order.amountDue, 0);
    return { unpaidOrders, totalDebt };
  }, [clientWorkOrders]);

  const handleSimulatedPaymentReminder = async (otId: string) => {
    if(!client) return;
    const wo = clientWorkOrders.find(w => w.id === otId);
    if(wo) {
        const totalBudget = wo.budgetItems?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
        const amountDue = totalBudget - (wo.totalPaidAmount || 0);
        await sendPaymentReminder(client.id, otId, 'Email');
        alert(`Recordatorio de pago simulado enviado para OT ${wo.customId} por ${formatCurrencyCOP(amountDue)}.`);
    }
  };

  const handleViewEquipmentOrders = (equipmentSerial: string) => {
    navigate('/work-orders', { state: { globalSearchTerm: equipmentSerial } }); 
  };

  if (isLoading) return <LoadingSpinner text="Cargando datos del cliente..." className="mt-20" />;
  if (error) return <div className="text-center text-red-500 dark:text-red-400 mt-20">{error} <Button onClick={() => navigate('/clients')} className="mt-2">Volver</Button></div>;
  if (!client) return <div className="text-center text-slate-500 dark:text-slate-400 mt-20">Cliente no encontrado. <Button onClick={() => navigate('/clients')} className="mt-2">Volver</Button></div>;

  const registeredEquipmentColumns: TableColumn<ClientEquipment>[] = [
    { header: 'Tipo', accessor: 'type' },
    { header: 'Marca', accessor: 'brand' },
    { header: 'Modelo', accessor: 'model' },
    { header: 'Serial', accessor: 'serial', className: 'font-medium' },
    { header: 'Registrado', accessor: item => new Date(item.registeredAt).toLocaleDateString() },
    { header: 'Acciones', accessor: (item) => (
        <div className="flex space-x-1">
            <Button size="sm" variant="ghost" onClick={() => handleViewEquipmentOrders(item.serial)} title="Ver Órdenes de este Equipo"><WrenchScrewdriverIcon className="h-4 w-4 text-blue-600 dark:text-blue-400"/></Button>
            <Button size="sm" variant="ghost" onClick={() => handleOpenServiceFormModal(item)} title="Programar Servicio"><CalendarDaysIcon className="h-4 w-4 text-sky-600 dark:text-sky-400"/></Button>
            <Button size="sm" variant="ghost" onClick={() => handleOpenEquipmentFormModal(item)} title="Editar Equipo"><PencilIcon className="h-4 w-4"/></Button>
            <Button size="sm" variant="ghost" onClick={() => handleEquipmentDelete(item.id)} title="Eliminar Equipo"><TrashIcon className="h-4 w-4 text-red-500"/></Button>
        </div>
    )},
  ];

  const scheduledServicesColumns: TableColumn<ScheduledService>[] = [
    { header: 'Equipo', accessor: item => item.clientEquipmentDescription || item.clientEquipmentSerial || 'N/A' },
    { header: 'Tipo Servicio', accessor: 'serviceType' },
    { header: 'Fecha Programada', accessor: item => new Date(item.scheduledDate).toLocaleDateString() },
    { header: 'Descripción', accessor: 'description', className: 'truncate max-w-xs' },
    { header: 'Estado', accessor: item => <ScheduledServiceStatusBadge status={item.status} />},
    { header: 'Acciones', accessor: (item) => (
        <div className="flex space-x-1">
            {item.status === ScheduledServiceStatus.Pending && (
                 <Button size="sm" variant="ghost" onClick={() => handleConvertToWorkOrder(item)} title="Convertir en OT" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">
                    <ArrowTopRightOnSquareIcon className="h-4 w-4"/>
                </Button>
            )}
            {item.status === ScheduledServiceStatus.ConvertedToWorkOrder && item.workOrderId && (
                 <Button size="sm" variant="ghost" onClick={() => navigate(`/work-orders/edit/${item.workOrderId}`)} title="Ver OT" className="text-purple-600 dark:text-purple-400 hover:text-purple-700">
                    <TicketIcon className="h-4 w-4"/>
                </Button>
            )}
            {(item.status === ScheduledServiceStatus.Pending || item.status === ScheduledServiceStatus.InProgress) && (
              <>
                <Button size="sm" variant="ghost" onClick={() => { const eq = registeredEquipment.find(e=>e.id===item.clientEquipmentId); if(eq) handleOpenServiceFormModal(eq, item);}} title="Editar Servicio"><PencilIcon className="h-4 w-4"/></Button>
                <Button size="sm" variant="ghost" onClick={() => handleScheduledServiceDelete(item.id)} title="Eliminar Servicio"><TrashIcon className="h-4 w-4 text-red-500"/></Button>
              </>
            )}
        </div>
    )},
  ];

  const unpaidOrdersColumns: TableColumn<typeof financialSummary.unpaidOrders[0]>[] = [
    { header: 'ID OT', accessor: (item) => item.otCustomId, className: 'font-medium' },
    { header: 'Fecha OT', accessor: (item) => item.date },
    { header: 'Monto Adeudado', accessor: (item) => formatCurrencyCOP(item.amountDue), className: 'text-red-600 dark:text-red-400 font-semibold' },
    { header: 'Acciones', accessor: (item) => (
        <Button size="sm" variant="warning" onClick={() => handleSimulatedPaymentReminder(item.id)}>Enviar Recordatorio</Button>
    )},
  ];

  const TABS_CONFIG = [
    {
      key: 'general',
      label: 'Información General',
      icon: UserCircleIcon,
      content: (
        <Card title="Datos del Cliente" actions={
          <Button onClick={handleOpenEditModal} variant="ghost" leftIcon={<PencilIcon className="h-4 w-4"/>}>
            Editar Cliente
          </Button>
        }>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            <div>
              <InfoItem label="Nombre Completo" value={client.name} />
              <InfoItem label="ID Fiscal (Cc. o NIT)" value={client.fiscalId} />
              <InfoItem label="Categoría" value={client.clientCategory} />
              <InfoItem label="Email" value={client.email} />
            </div>
            <div>
              <InfoItem label="Teléfono" value={client.phone} />
              <InfoItem label="Dirección" value={client.address} />
              <InfoItem label="Preferencias de Comunicación" value={client.communicationPreferences} />
              <InfoItem label="Registrado el" value={new Date(client.registeredAt).toLocaleDateString()} />
            </div>
          </div>
        </Card>
      )
    },
    {
      key: 'equipment',
      label: 'Equipos Registrados',
      icon: BriefcaseIcon,
      count: registeredEquipment.length,
      content: (
        <Card title="Equipos Registrados" actions={
          <Button onClick={() => handleOpenEquipmentFormModal()} variant="primary" size="sm" leftIcon={<PlusIcon className="h-4 w-4"/>}>
            Registrar Nuevo Equipo
          </Button>
        }>
          {isSubmittingEquipment && !isEquipmentFormModalOpen ? <LoadingSpinner text="Actualizando equipos..." /> :
           registeredEquipment.length > 0 ?
           <Table columns={registeredEquipmentColumns} data={registeredEquipment} /> :
           <p className="text-slate-500 dark:text-slate-400 py-4 text-center">No hay equipos registrados para este cliente.</p>
          }
        </Card>
      )
    },
    {
      key: 'services',
      label: 'Servicios Programados',
      icon: ListBulletIcon,
      count: scheduledServices.length,
      content: (
         <Card title="Servicios Programados (Diagnósticos/Mantenimientos)">
          {isSubmittingService && !isServiceFormModalOpen ? <LoadingSpinner text="Actualizando servicios..." /> :
           scheduledServices.length > 0 ?
           <Table columns={scheduledServicesColumns} data={scheduledServices} /> :
           <p className="text-slate-500 dark:text-slate-400 py-4 text-center">No hay servicios programados para este cliente.</p>
          }
        </Card>
      )
    },
    {
      key: 'financial',
      label: 'Estado Financiero',
      icon: CurrencyDollarIcon,
      content: (
        <Card title="Resumen Financiero">
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
              Total Deuda Pendiente: <span className="text-red-600 dark:text-red-400">{formatCurrencyCOP(financialSummary.totalDebt)}</span>
          </p>
          {financialSummary.unpaidOrders.length > 0 ? (
              <Table columns={unpaidOrdersColumns} data={financialSummary.unpaidOrders} emptyStateMessage="No hay saldos pendientes."/>
          ) : (
              <p className="text-slate-500 dark:text-slate-400 py-4 text-center">El cliente no tiene saldos pendientes.</p>
          )}
        </Card>
      )
    }
  ];


  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div className="flex items-center space-x-3">
            <UserCircleIcon className="h-10 w-10 text-primary dark:text-primary-light"/>
            <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100">
                    {client.name}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">ID Fiscal: {client.fiscalId} - Categoría: {client.clientCategory}</p>
            </div>
        </div>
        <Button onClick={() => navigate('/clients')} variant="secondary" className="w-full sm:w-auto">
          Volver a la Lista
        </Button>
      </div>

      <Tabs tabs={TABS_CONFIG.map(tab => ({ ...tab, label: tab.icon ? <div className="flex items-center"><tab.icon className="h-5 w-5 mr-2"/>{tab.label}</div> : tab.label }))} />


      {isEditModalOpen && client && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Editar Cliente: ${client.name}`} size="lg">
            <ClientForm
                initialData={client}
                onSubmit={(data) => handleClientUpdate(data as Client)}
                onCancel={() => setIsEditModalOpen(false)}
                isSubmitting={isSubmittingEdit}
                apiError={editApiError}
            />
        </Modal>
      )}

      {isEquipmentFormModalOpen && client && (
        <Modal isOpen={isEquipmentFormModalOpen} onClose={() => setIsEquipmentFormModalOpen(false)} title={editingEquipment ? `Editar Equipo de ${client.name}` : `Registrar Nuevo Equipo para ${client.name}`} size="lg">
            <ClientEquipmentForm
                clientId={client.id}
                initialData={editingEquipment}
                onSubmit={handleEquipmentSubmit}
                onCancel={() => setIsEquipmentFormModalOpen(false)}
                isSubmitting={isSubmittingEquipment}
                apiError={equipmentApiError}
            />
        </Modal>
      )}

      {isServiceFormModalOpen && client && targetEquipmentForService && (
         <Modal isOpen={isServiceFormModalOpen} onClose={() => setIsServiceFormModalOpen(false)} title={editingScheduledService ? `Editar Servicio Programado` : `Programar Servicio para ${targetEquipmentForService.serial}`} size="lg">
            <ScheduledServiceForm
                clientEquipment={targetEquipmentForService}
                initialData={editingScheduledService}
                onSubmit={handleServiceSubmit}
                onCancel={() => setIsServiceFormModalOpen(false)}
                isSubmitting={isSubmittingService}
                apiError={serviceApiError}
            />
        </Modal>
      )}
    </div>
  );
};

export default ClientDetailPage;
