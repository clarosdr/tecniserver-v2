
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Changed useHistory to useNavigate
import { WorkOrder, WorkOrderStatus, WorkOrderArea, ScheduledService, ScheduledServiceStatus, TableColumn, BudgetItem } from '../types';
import {
    getWorkOrders, deleteWorkOrder, updateWorkOrder,
    getPendingScheduledServices, updateScheduledService,
    sendReadyForPickupReminder, sendStorageReminder, getClientById // Added getClientById
} from '../services/apiService';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import WorkOrderStatusBadge from '../components/workorders/WorkOrderStatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Input from '../components/common/Input';
import WorkOrderTicketModal from '../components/workorders/WorkOrderTicketModal';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { formatCurrencyCOP } from '../utils/formatting';
import { CalendarDaysIcon, PencilIcon, TrashIcon, TicketIcon, ArrowTopRightOnSquareIcon, PlusIcon, EnvelopeIcon, EyeIcon, UsersIcon as UsersIconFromConstants, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, TruckIcon } from '../constants';
import Tabs from '../components/common/Tabs';


type AreaTabKey = WorkOrderArea | 'all' | 'Entregado' | 'Bodega';

interface DisplayScheduledService extends ScheduledService {
    clientName?: string;
}

interface ActionConfirmModalConfig {
  title: string;
  message: React.ReactNode;
  confirmButtonText?: string;
  confirmButtonVariant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  onConfirm: () => Promise<void>;
  itemContext?: string;
}


const WorkOrdersPage: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [pendingServices, setPendingServices] = useState<DisplayScheduledService[]>([]);
  const [pendingApprovalOTs, setPendingApprovalOTs] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAreaTab, setActiveAreaTab] = useState<AreaTabKey>(WorkOrderArea.Solicitudes);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketWorkOrder, setTicketWorkOrder] = useState<WorkOrder | null>(null);

  const [isManualApprovalModalOpen, setIsManualApprovalModalOpen] = useState(false);
  const [selectedWoForManualApproval, setSelectedWoForManualApproval] = useState<WorkOrder | null>(null);
  const [isSubmittingManualApproval, setIsSubmittingManualApproval] = useState(false);

  const [isActionConfirmModalOpen, setIsActionConfirmModalOpen] = useState(false);
  const [actionConfirmModalConfig, setActionConfirmModalConfig] = useState<ActionConfirmModalConfig | null>(null);
  const [isSubmittingActionConfirm, setIsSubmittingActionConfirm] = useState(false);


  const navigate = useNavigate(); 
  const location = useLocation();
  const routeState = location.state as { globalSearchTerm?: string } | undefined;


  useEffect(() => {
    if (routeState?.globalSearchTerm) {
      setSearchTerm(routeState.globalSearchTerm);
      setActiveAreaTab('all');
    }
  }, [routeState]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [woData, psData] = await Promise.all([
        getWorkOrders(),
        getPendingScheduledServices()
      ]);
      setWorkOrders(woData);
      setPendingServices(psData as DisplayScheduledService[]);
      const approvalOTs = woData.filter(
        wo => wo.status === WorkOrderStatus.EsperandoAprobacion && !wo.budgetApproved
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setPendingApprovalOTs(approvalOTs);

    } catch (error) {
      console.error("Error fetching work orders and scheduled services:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenNewWorkOrder = () => {
    navigate('/work-orders/new');
  };

  const handleEditWorkOrder = (wo: WorkOrder) => {
    navigate(`/work-orders/edit/${wo.id}`);
  };

  const executeConfirmedAction = async () => {
    if (!actionConfirmModalConfig) return;
    setIsSubmittingActionConfirm(true);
    try {
      await actionConfirmModalConfig.onConfirm();
      await fetchData(); // Refetch all data after action
    } catch (error) {
      console.error(`Error executing action for item ${actionConfirmModalConfig.itemContext}:`, error);
      alert(`Error al procesar la acción para ${actionConfirmModalConfig.itemContext}.`);
    } finally {
      setIsSubmittingActionConfirm(false);
      setIsActionConfirmModalOpen(false);
      setActionConfirmModalConfig(null);
    }
  };


  const triggerDeleteWorkOrder = (wo: WorkOrder) => {
    setActionConfirmModalConfig({
      title: 'Eliminar Orden de Trabajo',
      message: (
        <p>
          ¿Está seguro de que desea eliminar la orden de trabajo{' '}
          <strong className="font-semibold">{wo.customId || wo.id}</strong> para el cliente{' '}
          <strong className="font-semibold">{wo.clientName || 'Desconocido'}</strong>? Esta acción no se puede deshacer.
        </p>
      ),
      confirmButtonText: 'Sí, Eliminar',
      confirmButtonVariant: 'danger',
      onConfirm: async () => {
        await deleteWorkOrder(wo.id);
      },
      itemContext: wo.customId || wo.id
    });
    setIsActionConfirmModalOpen(true);
  };


  const handleOpenTicketModal = (wo: WorkOrder) => {
    setTicketWorkOrder(wo);
    setIsTicketModalOpen(true);
  };

  const handleConvertScheduledServiceToOT = async (service: DisplayScheduledService) => {
    const client = await getClientById(service.clientId);
    if (!client) {
        alert("No se pudo cargar la información completa del cliente para la OT.");
        return;
    }

    navigate('/work-orders/new', { 
        state: {
            scheduledServiceId: service.id,
            clientId: service.clientId,
            clientDetails: client,
            clientEquipmentId: service.clientEquipmentId,
            scheduledServiceDetails: service,
        }
    });
  };

  const triggerCancelScheduledService = (service: DisplayScheduledService) => {
    setActionConfirmModalConfig({
      title: 'Cancelar Solicitud de Servicio',
      message: (
        <p>
          ¿Está seguro de cancelar la solicitud de servicio para el equipo{' '}
          <strong className="font-semibold">{service.clientEquipmentDescription || 'N/A'}</strong> del cliente{' '}
          <strong className="font-semibold">{service.clientName || 'Desconocido'}</strong> programada para el{' '}
          <strong className="font-semibold">{new Date(service.scheduledDate).toLocaleDateString()}</strong>?
        </p>
      ),
      confirmButtonText: 'Sí, Cancelar Solicitud',
      confirmButtonVariant: 'danger',
      onConfirm: async () => {
        await updateScheduledService(service.id, { status: ScheduledServiceStatus.Cancelled });
      },
      itemContext: service.id
    });
    setIsActionConfirmModalOpen(true);
  };

  const triggerNotifyClientReady = (wo: WorkOrder) => {
    setActionConfirmModalConfig({
        title: 'Notificar Cliente Listo',
        message: (
            <p>
              ¿Notificar a <strong className="font-semibold">{wo.clientName || 'Cliente'}</strong> que su equipo
              (<strong className="font-semibold">{wo.equipmentBrand} {wo.equipmentModel}</strong>, OT:{' '}
              <strong className="font-semibold">{wo.customId}</strong>) está LISTO PARA RETIRAR?
            </p>
        ),
        confirmButtonText: 'Sí, Notificar',
        confirmButtonVariant: 'primary',
        onConfirm: async () => {
            await sendReadyForPickupReminder(wo.id, wo.clientName || 'Cliente', `${wo.equipmentBrand} ${wo.equipmentModel}`);
            alert(`Recordatorio de "Listo para Retirar" enviado para OT ${wo.customId}.`);
        },
        itemContext: wo.customId || wo.id
    });
    setIsActionConfirmModalOpen(true);
  };

  const triggerMarkAsDelivered = (wo: WorkOrder) => {
    setActionConfirmModalConfig({
        title: 'Confirmar Entrega al Cliente',
        message: (
             <p>
              ¿Está seguro de marcar la OT <strong className="font-semibold">{wo.customId}</strong> como ENTREGADA al cliente?
              Esta acción registra la entrega y es un paso final para el ciclo activo de la OT.
            </p>
        ),
        confirmButtonText: 'Sí, Marcar como Entregada',
        confirmButtonVariant: 'success',
        onConfirm: async () => {
            await updateWorkOrder(wo.id, { status: WorkOrderStatus.Entregado, area: WorkOrderArea.HistorialCompletados, deliveryDate: new Date().toISOString() });
        },
        itemContext: wo.customId || wo.id
    });
    setIsActionConfirmModalOpen(true);
  };

  const triggerMoveToStorage = (wo: WorkOrder) => {
    setActionConfirmModalConfig({
        title: 'Mover a Bodega Taller',
        message: (
            <p>
              ¿Mover la OT <strong className="font-semibold">{wo.customId}</strong> a bodega?
              Esto indica almacenamiento a largo plazo en el taller.
            </p>
        ),
        confirmButtonText: 'Sí, Mover a Bodega',
        confirmButtonVariant: 'secondary',
        onConfirm: async () => {
            await updateWorkOrder(wo.id, { status: WorkOrderStatus.EnBodega, area: WorkOrderArea.HistorialCompletados });
        },
        itemContext: wo.customId || wo.id
    });
    setIsActionConfirmModalOpen(true);
  };

  const triggerNotifyClientStorage = (wo: WorkOrder) => {
     setActionConfirmModalConfig({
        title: 'Notificar Almacenamiento Prolongado',
        message: (
            <p>
              ¿Enviar recordatorio a <strong className="font-semibold">{wo.clientName || 'Cliente'}</strong> por almacenamiento
              prolongado del equipo (<strong className="font-semibold">{wo.equipmentBrand} {wo.equipmentModel}</strong>, OT:{' '}
              <strong className="font-semibold">{wo.customId}</strong>)?
            </p>
        ),
        confirmButtonText: 'Sí, Enviar Recordatorio',
        confirmButtonVariant: 'warning',
        onConfirm: async () => {
            await sendStorageReminder(wo.id, wo.clientName || 'Cliente', `${wo.equipmentBrand} ${wo.equipmentModel}`);
            alert(`Recordatorio de "Almacenamiento Prolongado" enviado para OT ${wo.customId}.`);
        },
        itemContext: wo.customId || wo.id
    });
    setIsActionConfirmModalOpen(true);
  };

  const handleOpenManualApprovalModal = (wo: WorkOrder) => {
    setSelectedWoForManualApproval(wo);
    setIsManualApprovalModalOpen(true);
  };

  const handleConfirmManualBudgetApproval = async () => {
    if (!selectedWoForManualApproval) return;
    setIsSubmittingManualApproval(true);
    try {
        await updateWorkOrder(selectedWoForManualApproval.id, {
            budgetApproved: true,
            status: WorkOrderStatus.EnProgreso,
            area: WorkOrderArea.Entrada,
            budgetNotes: (selectedWoForManualApproval.budgetNotes || '') + `\nAprobado manualmente por personal del taller el ${new Date().toLocaleString()}.`
        });
        fetchData();
        setIsManualApprovalModalOpen(false);
        setSelectedWoForManualApproval(null);
    } catch (error) {
        console.error("Error manually approving budget:", error);
        alert("Error al aprobar presupuesto manualmente.");
    } finally {
        setIsSubmittingManualApproval(false);
    }
  };


  const statusSummaryCounts = useMemo(() => {
    const summary: Record<string, number> = {};
    summary[WorkOrderArea.Solicitudes] = pendingServices.filter(s => s.status === ScheduledServiceStatus.Pending).length;

    Object.values(WorkOrderArea).forEach(area => {
      if (area !== WorkOrderArea.Solicitudes && area !== WorkOrderArea.HistorialCompletados) {
        summary[area] = workOrders.filter(wo => wo.area === area).length;
      }
    });
    summary['Entregado'] = workOrders.filter(wo => wo.area === WorkOrderArea.HistorialCompletados && wo.status === WorkOrderStatus.Entregado).length;
    summary['Bodega'] = workOrders.filter(wo => wo.area === WorkOrderArea.HistorialCompletados && wo.status === WorkOrderStatus.EnBodega).length;
    summary['all'] = workOrders.length;
    return summary;
  }, [workOrders, pendingServices]);


  const filteredData = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const searchPredicate = (wo: WorkOrder) =>
        wo.customId?.toLowerCase().includes(lowerSearchTerm) ||
        wo.clientName?.toLowerCase().includes(lowerSearchTerm) ||
        wo.equipmentType?.toLowerCase().includes(lowerSearchTerm) ||
        wo.equipmentBrand?.toLowerCase().includes(lowerSearchTerm) ||
        wo.equipmentModel?.toLowerCase().includes(lowerSearchTerm) ||
        wo.equipmentSerial?.toLowerCase().includes(lowerSearchTerm) ||
        (activeAreaTab === 'all' && (
            wo.area?.toLowerCase().includes(lowerSearchTerm) ||
            wo.status?.toLowerCase().includes(lowerSearchTerm) ||
            wo.priority?.toLowerCase().includes(lowerSearchTerm) ||
            wo.serviceLocationType?.toLowerCase().includes(lowerSearchTerm)
        ));

    if (activeAreaTab === WorkOrderArea.Solicitudes) {
      return pendingServices.filter(s =>
        s.status === ScheduledServiceStatus.Pending &&
        (s.clientName?.toLowerCase().includes(lowerSearchTerm) ||
        s.clientEquipmentDescription?.toLowerCase().includes(lowerSearchTerm) ||
        s.description.toLowerCase().includes(lowerSearchTerm) ||
        (s.requiresHomeVisit ? 'domicilio'.includes(lowerSearchTerm) : 'taller'.includes(lowerSearchTerm)))
      );
    } else if (activeAreaTab === 'all') {
        return workOrders.filter(searchPredicate)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (activeAreaTab === 'Entregado') {
        return workOrders.filter(wo =>
            wo.area === WorkOrderArea.HistorialCompletados &&
            wo.status === WorkOrderStatus.Entregado &&
            searchPredicate(wo)
        ).sort((a, b) => new Date(b.deliveryDate || b.updatedAt).getTime() - new Date(a.deliveryDate || a.updatedAt).getTime());
    } else if (activeAreaTab === 'Bodega') {
        return workOrders.filter(wo =>
            wo.area === WorkOrderArea.HistorialCompletados &&
            wo.status === WorkOrderStatus.EnBodega &&
            searchPredicate(wo)
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    // Default for other specific areas (Entrada, ListoParaRetirar)
    return workOrders.filter(wo =>
      wo.area === activeAreaTab && searchPredicate(wo)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [workOrders, pendingServices, searchTerm, activeAreaTab]);


  const commonWOColumns: TableColumn<WorkOrder>[] = [
    {
      header: 'ID OT',
      accessor: (item: WorkOrder) => (
        <div className="flex items-center">
          {item.scheduledServiceId && <CalendarDaysIcon className="h-4 w-4 text-purple-500 mr-1.5" title="Creada desde Servicio Programado"/>}
          {item.status === WorkOrderStatus.EsperandoAprobacion && !item.budgetApproved &&
            <ClockIcon className="h-4 w-4 text-fuchsia-500 mr-1.5 animate-pulse" title="Esperando Aprobación del Cliente"/>}
          {item.budgetApproved &&
            <CheckCircleIcon className="h-4 w-4 text-emerald-500 mr-1.5" title="Presupuesto Aprobado"/>}
           {item.serviceLocationType === 'Domicilio' && <TruckIcon className="h-4 w-4 text-blue-500 mr-1.5" title="Servicio a Domicilio"/>}
          <span className="font-medium text-primary-dark dark:text-primary-light">{item.customId || item.id}</span>
        </div>
      ),
    },
    { header: 'Cliente', accessor: 'clientName' },
    { header: 'Equipo', accessor: (item: WorkOrder) => `${item.equipmentType} ${item.equipmentBrand} ${item.equipmentModel}` },
    { header: 'Serial', accessor: 'equipmentSerial' },
    { header: 'Estado', accessor: (item: WorkOrder) => <WorkOrderStatusBadge status={item.status} /> },
  ];

  const baseHistoricalColumns: TableColumn<WorkOrder>[] = [
    ...commonWOColumns.filter(c => c.header !== 'Prioridad' && c.header !== 'Área'),
  ];

  const columnsByArea: Record<AreaTabKey, TableColumn<any>[]> = {
    'all': [
        ...commonWOColumns,
        { header: 'Área', accessor: 'area', className: 'text-xs' },
        { header: 'Prioridad', accessor: 'priority', className: 'text-xs' },
        { header: 'Creado', accessor: (item: WorkOrder) => new Date(item.createdAt).toLocaleDateString(), className: 'text-xs' },
        {
          header: 'Acciones',
          accessor: (item: WorkOrder) => (
            <div className="flex space-x-1">
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditWorkOrder(item); }} title="Editar/Ver OT"><PencilIcon className="h-4 w-4"/></Button>
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleOpenTicketModal(item); }} title="Ver Ticket"><TicketIcon className="h-4 w-4 text-sky-600 dark:text-sky-400"/></Button>
              {item.status !== WorkOrderStatus.Entregado && (
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); triggerDeleteWorkOrder(item); }} title="Eliminar OT"><TrashIcon className="h-4 w-4 text-red-500"/></Button>
              )}
            </div>
          ),
          className: 'text-xs'
        },
    ],
    [WorkOrderArea.Solicitudes]: [ // Columns for Scheduled Services
        { header: 'Cliente', accessor: 'clientName', className: 'font-medium' },
        { header: 'Equipo', accessor: 'clientEquipmentDescription', className: 'text-xs'},
        { header: 'Servicio', accessor: 'serviceType' },
        { header: 'Fecha Prog.', accessor: (item: DisplayScheduledService) => new Date(item.scheduledDate).toLocaleDateString() },
        { header: 'Notas Cliente', accessor: 'description', className: 'text-xs whitespace-normal max-w-xs'},
        { header: 'Visita Domicilio', accessor: (item: DisplayScheduledService) => item.requiresHomeVisit ? <TruckIcon className="h-5 w-5 text-blue-500" title="Sí"/> : <UsersIconFromConstants className="h-5 w-5 text-slate-400" title="No (Taller)"/> },
        {
            header: 'Acciones',
            accessor: (item: DisplayScheduledService) => (
                <div className="flex space-x-1">
                     <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/clients/${item.clientId}`); }} title="Ver Cliente"><EyeIcon className="h-4 w-4"/></Button>
                     <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); handleConvertScheduledServiceToOT(item); }} title="Convertir en OT"><ArrowTopRightOnSquareIcon className="h-4 w-4"/></Button>
                     <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); triggerCancelScheduledService(item); }} title="Cancelar Solicitud"><TrashIcon className="h-4 w-4"/></Button>
                </div>
            ),
        },
    ],
    [WorkOrderArea.Entrada]: [
        ...commonWOColumns.filter(c => c.header !== 'Área'), // Área is fixed here
        { header: 'Creado', accessor: (item: WorkOrder) => new Date(item.createdAt).toLocaleDateString(), className: 'text-xs' },
        {
            header: 'Acciones',
            accessor: (item: WorkOrder) => (
                <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditWorkOrder(item); }} title="Editar/Ver OT"><PencilIcon className="h-4 w-4"/></Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleOpenTicketModal(item); }} title="Ver Ticket"><TicketIcon className="h-4 w-4 text-sky-600 dark:text-sky-400"/></Button>
                     {item.status === WorkOrderStatus.EsperandoAprobacion && !item.budgetApproved && (
                        <Button size="sm" variant="warning" onClick={(e) => { e.stopPropagation(); handleOpenManualApprovalModal(item); }} title="Aprobar Presupuesto Manualmente"><CheckCircleIcon className="h-4 w-4"/></Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); triggerDeleteWorkOrder(item); }} title="Eliminar OT"><TrashIcon className="h-4 w-4 text-red-500"/></Button>
                </div>
            ),
            className: 'text-xs'
        },
    ],
    [WorkOrderArea.ListoParaRetirar]: [
        ...commonWOColumns.filter(c => c.header !== 'Área'),
        { header: 'Últ. Actualización', accessor: (item: WorkOrder) => new Date(item.updatedAt).toLocaleDateString(), className: 'text-xs' },
        {
            header: 'Acciones',
            accessor: (item: WorkOrder) => (
                <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditWorkOrder(item); }} title="Editar/Ver OT"><PencilIcon className="h-4 w-4"/></Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleOpenTicketModal(item); }} title="Ver Ticket"><TicketIcon className="h-4 w-4 text-sky-600 dark:text-sky-400"/></Button>
                    <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); triggerNotifyClientReady(item); }} title="Notificar Cliente Listo"><EnvelopeIcon className="h-4 w-4"/></Button>
                    <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); triggerMarkAsDelivered(item); }} title="Marcar como Entregada"><CheckCircleIcon className="h-4 w-4"/></Button>
                    <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); triggerMoveToStorage(item); }} title="Mover a Bodega">📦</Button>
                </div>
            ),
             className: 'text-xs min-w-[180px]',
        },
    ],
    'Entregado': [
        ...baseHistoricalColumns,
        { header: 'Fecha Entrega', accessor: (item: WorkOrder) => item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : 'N/A', className: 'text-xs' },
        { header: 'Total Pagado', accessor: (item: WorkOrder) => formatCurrencyCOP(item.totalPaidAmount || 0), className: 'text-xs text-right'},
        {
            header: 'Acciones',
            accessor: (item: WorkOrder) => (
                 <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditWorkOrder(item); }} title="Ver Detalles OT (Solo Vista)"><EyeIcon className="h-4 w-4"/></Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleOpenTicketModal(item); }} title="Ver Ticket"><TicketIcon className="h-4 w-4 text-sky-600 dark:text-sky-400"/></Button>
                     <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); triggerMoveToStorage(item); }} title="Mover a Bodega (Post-Entrega)">📦</Button>
                </div>
            ),
            className: 'text-xs'
        },
    ],
    'Bodega': [
        ...baseHistoricalColumns,
        { header: 'Fecha Actualización', accessor: (item: WorkOrder) => new Date(item.updatedAt).toLocaleDateString(), className: 'text-xs' },
        { header: 'Total Pagado', accessor: (item: WorkOrder) => formatCurrencyCOP(item.totalPaidAmount || 0), className: 'text-xs text-right'},
        {
            header: 'Acciones',
            accessor: (item: WorkOrder) => (
                <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditWorkOrder(item); }} title="Ver Detalles OT (Solo Vista)"><EyeIcon className="h-4 w-4"/></Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleOpenTicketModal(item); }} title="Ver Ticket"><TicketIcon className="h-4 w-4 text-sky-600 dark:text-sky-400"/></Button>
                    <Button size="sm" variant="warning" onClick={(e) => { e.stopPropagation(); triggerNotifyClientStorage(item); }} title="Notificar Almacenamiento Prolongado"><ExclamationTriangleIcon className="h-4 w-4"/></Button>
                </div>
            ),
            className: 'text-xs'
        },
    ],
    [WorkOrderArea.HistorialCompletados]: baseHistoricalColumns,
  };

  const currentColumns = columnsByArea[activeAreaTab] || columnsByArea['all'];

  const tabsConfig = [
    { key: WorkOrderArea.Solicitudes, label: WorkOrderArea.Solicitudes, count: statusSummaryCounts[WorkOrderArea.Solicitudes], content: <></> },
    { key: WorkOrderArea.Entrada, label: WorkOrderArea.Entrada, count: statusSummaryCounts[WorkOrderArea.Entrada], content: <></> },
    { key: WorkOrderArea.ListoParaRetirar, label: WorkOrderArea.ListoParaRetirar, count: statusSummaryCounts[WorkOrderArea.ListoParaRetirar], content: <></> },
    { key: 'Entregado', label: 'Entregado', count: statusSummaryCounts['Entregado'], content: <></> },
    { key: 'Bodega', label: 'En Bodega', count: statusSummaryCounts['Bodega'], content: <></> },
    { key: 'all', label: 'Todas las Órdenes', count: statusSummaryCounts['all'], content: <></> },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100">
          Órdenes de Trabajo y Solicitudes
        </h1>
        <Button onClick={handleOpenNewWorkOrder} leftIcon={<PlusIcon className="h-5 w-5"/>} className="w-full sm:w-auto">
          Nueva Orden Directa
        </Button>
      </div>

      {pendingApprovalOTs.length > 0 && (
        <Card
            title={<><ClockIcon className="h-5 w-5 mr-2 inline-block text-fuchsia-500"/> Órdenes Pendientes de Aprobación Cliente ({pendingApprovalOTs.length})</>}
            className="mb-6 border-l-4 border-fuchsia-500 dark:border-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-900/30"
        >
            <div className="max-h-48 overflow-y-auto">
                <ul className="divide-y divide-fuchsia-200 dark:divide-fuchsia-700">
                    {pendingApprovalOTs.map(wo => (
                        <li key={wo.id} className="py-2 px-1 text-sm">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-medium text-fuchsia-700 dark:text-fuchsia-300">{wo.customId}</span> - {wo.clientName} ({wo.equipmentBrand} {wo.equipmentModel})
                                    <span className="block text-xs text-fuchsia-500 dark:text-fuchsia-400">Presupuesto: {formatCurrencyCOP(wo.budgetItems?.reduce((s,i)=>s+(i.quantity*i.unitPrice),0) || 0)} - Creada: {new Date(wo.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="space-x-1">
                                    <Button size="sm" variant="ghost" onClick={() => navigate(`/work-orders/edit/${wo.id}`)} title="Ver Detalles"><EyeIcon className="h-4 w-4"/></Button>
                                    <Button size="sm" variant="primary" onClick={() => handleOpenManualApprovalModal(wo)} title="Aprobar Manualmente"><CheckCircleIcon className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
      )}

      <div className="mb-4 p-4 bg-white dark:bg-slate-800 shadow rounded-lg">
        <Input
            placeholder="Buscar en la pestaña activa (ID, cliente, equipo, serial, etc.)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="mb-0"
        />
      </div>

      <Tabs tabs={tabsConfig} onTabChange={(key) => setActiveAreaTab(key as AreaTabKey)} defaultActiveTabKey={activeAreaTab}/>

      {isLoading ? (
        <div className="flex justify-center mt-10">
            <LoadingSpinner text="Cargando datos..." />
        </div>
      ) : (
        <Table
            columns={currentColumns}
            data={filteredData}
            onRowClick={(item) => {
                if (activeAreaTab === WorkOrderArea.Solicitudes) {
                    navigate(`/clients/${(item as DisplayScheduledService).clientId}`);
                } else {
                    handleEditWorkOrder(item as WorkOrder);
                }
            }}
            emptyStateMessage="No hay datos disponibles para esta área y filtro."
        />
      )}

      {isTicketModalOpen && ticketWorkOrder && (
        <WorkOrderTicketModal
            isOpen={isTicketModalOpen}
            onClose={() => setIsTicketModalOpen(false)}
            workOrder={ticketWorkOrder}
        />
      )}

      {isManualApprovalModalOpen && selectedWoForManualApproval && (
          <Modal
            isOpen={isManualApprovalModalOpen}
            onClose={() => setIsManualApprovalModalOpen(false)}
            title={`Confirmar Aprobación Presupuesto: OT ${selectedWoForManualApproval.customId}`}
            size="md"
            footer={
                <div className="flex justify-end space-x-2">
                    <Button variant="secondary" onClick={() => setIsManualApprovalModalOpen(false)} disabled={isSubmittingManualApproval}>Cancelar</Button>
                    <Button variant="success" onClick={handleConfirmManualBudgetApproval} isLoading={isSubmittingManualApproval} disabled={isSubmittingManualApproval}>Sí, Aprobar y Continuar</Button>
                </div>
            }
          >
              <p className="text-slate-700 dark:text-slate-300 mb-2">
                  Cliente: <strong className="font-medium">{selectedWoForManualApproval.clientName}</strong><br/>
                  Equipo: <strong className="font-medium">{selectedWoForManualApproval.equipmentBrand} {selectedWoForManualApproval.equipmentModel}</strong> (Serial: {selectedWoForManualApproval.equipmentSerial})<br/>
                  Total Presupuesto: <strong className="font-medium">{formatCurrencyCOP(selectedWoForManualApproval.budgetItems?.reduce((s,i) => s + (i.quantity * i.unitPrice), 0) || 0)}</strong>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                  Al confirmar, el presupuesto se marcará como <strong className="text-emerald-600 dark:text-emerald-400">APROBADO</strong> y la OT pasará a estado <strong className="text-blue-600 dark:text-blue-400">"En Progreso"</strong>.
                  ¿Está seguro de continuar?
              </p>
          </Modal>
      )}

        {isActionConfirmModalOpen && actionConfirmModalConfig && (
            <Modal
                isOpen={isActionConfirmModalOpen}
                onClose={() => setIsActionConfirmModalOpen(false)}
                title={actionConfirmModalConfig.title}
                size="md"
                footer={
                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setIsActionConfirmModalOpen(false)} disabled={isSubmittingActionConfirm}>Cancelar</Button>
                        <Button
                            variant={actionConfirmModalConfig.confirmButtonVariant || 'primary'}
                            onClick={executeConfirmedAction}
                            isLoading={isSubmittingActionConfirm}
                            disabled={isSubmittingActionConfirm}
                        >
                            {actionConfirmModalConfig.confirmButtonText || 'Confirmar'}
                        </Button>
                    </div>
                }
            >
                <div className="text-slate-700 dark:text-slate-300">{actionConfirmModalConfig.message}</div>
            </Modal>
        )}

    </div>
  );
};

export default WorkOrdersPage;
