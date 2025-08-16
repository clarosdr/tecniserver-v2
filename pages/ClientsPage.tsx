
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Changed useHistory to useNavigate
import { Client, ClientCategory, WorkOrder, WorkOrderArea, WorkOrderStatus, TableColumn } from '../types';
import { getClients, createClient, getWorkOrders, sendPaymentReminder } from '../services/apiService';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ClientForm from '../components/clients/ClientForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import { formatCurrencyCOP } from '../utils/formatting';
import ClientCategoryBadge from '../components/clients/ClientCategoryBadge';
import { UserPlusIcon, TableCellsIcon, Squares2X2Icon } from '../constants'; // Added TableCellsIcon, Squares2X2Icon

interface ClientWithDebt extends Client {
  otCustomId: string;
  amountDue: number;
  otDate: string;
  originalWorkOrderId: string;
}

type ViewMode = 'table' | 'card';

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiFormError, setApiFormError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const navigate = useNavigate(); // Changed from useHistory

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setApiFormError(null);
    try {
      const [clientsData, workOrdersData] = await Promise.all([
        getClients(),
        getWorkOrders()
      ]);
      setClients(clientsData);
      setWorkOrders(workOrdersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenNewClientModal = () => {
    setApiFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseNewClientModal = () => {
    setIsModalOpen(false);
    setApiFormError(null);
  };

  const handleNewClientSubmit = async (data: Omit<Client, 'id' | 'registeredAt'> | Client) => {
    setIsSubmitting(true);
    setApiFormError(null);
    try {
      const createData = data as Omit<Client, 'id' | 'registeredAt'>;
      await createClient(createData);
      fetchData();
      handleCloseNewClientModal();
    } catch (error: any) {
      console.error("Error creating client:", error);
      setApiFormError(error.message || "Error al procesar el cliente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowClick = (client: Client) => {
    navigate(`/clients/${client.id}`);
  };

  const handleSendReminder = async (clientId: string, workOrderId: string, amount: number) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const methods: ('Email' | 'WhatsApp' | 'SMS')[] = ['Email', 'WhatsApp', 'SMS'];
    const randomMethod = methods[Math.floor(Math.random() * methods.length)];

    const success = await sendPaymentReminder(clientId, workOrderId, randomMethod);
    if (success) {
      alert(`Recordatorio de pago simulado enviado a ${client.name} por ${randomMethod} para la OT (ID interno: ${workOrderId}) por ${formatCurrencyCOP(amount)}.`);
    } else {
      alert(`Error al simular envío de recordatorio para ${client.name}.`);
    }
  };


  const clientsWithDebts = useMemo(() => {
    const debts: ClientWithDebt[] = [];
    clients.forEach(client => {
      workOrders.forEach(wo => {
        if (wo.clientId === client.id && (wo.area === WorkOrderArea.ListoParaRetirar || (wo.area === WorkOrderArea.HistorialCompletados && wo.status === WorkOrderStatus.Entregado))) {
          const totalBudget = wo.budgetItems?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
          const amountDue = totalBudget - (wo.totalPaidAmount || 0);
          if (amountDue > 0) {
            debts.push({
              ...client,
              otCustomId: wo.customId || wo.id,
              amountDue: amountDue,
              otDate: new Date(wo.createdAt).toLocaleDateString(),
              originalWorkOrderId: wo.id
            });
          }
        }
      });
    });
    return debts.sort((a,b) => new Date(b.otDate).getTime() - new Date(a.otDate).getTime());
  }, [clients, workOrders]);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    (client.fiscalId && client.fiscalId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    client.clientCategory.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

  const columns: TableColumn<Client>[] = [
    { header: 'Nombre', accessor: 'name', className: 'font-medium text-primary-dark dark:text-primary-light hover:underline' },
    { header: 'Email', accessor: 'email' },
    { header: 'Teléfono', accessor: 'phone' },
    { header: 'Categoría Cliente', accessor: (item: Client) => <ClientCategoryBadge category={item.clientCategory} /> },
    { header: 'ID Fiscal (Cc. o NIT)', accessor: 'fiscalId' },
    { header: 'Registrado', accessor: (item: Client) => new Date(item.registeredAt).toLocaleDateString() },
  ];

  const debtColumns: TableColumn<ClientWithDebt>[] = [
    { header: 'Cliente', accessor: 'name', className: 'font-medium text-primary-dark dark:text-primary-light hover:underline' },
    { header: 'ID OT', accessor: 'otCustomId' },
    { header: 'Monto Adeudado', accessor: (item) => formatCurrencyCOP(item.amountDue), className: 'text-red-600 dark:text-red-400 font-semibold' },
    { header: 'Fecha OT', accessor: 'otDate' },
    { header: 'Acciones', accessor: (item) => (
        <Button size="sm" variant="warning" onClick={(e) => { e.stopPropagation(); handleSendReminder(item.id, item.originalWorkOrderId, item.amountDue);}}>
          Enviar Recordatorio
        </Button>
      )
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Gestión de Clientes</h1>
        <Button onClick={handleOpenNewClientModal} leftIcon={<UserPlusIcon className="h-5 w-5"/>}>
          Nuevo Cliente
        </Button>
      </div>

      <Card title="Clientes con Saldos Pendientes" className="mb-6">
        {isLoading && clientsWithDebts.length === 0 ? (
            <LoadingSpinner text="Cargando saldos..." />
        ) : clientsWithDebts.length > 0 ? (
            <Table columns={debtColumns} data={clientsWithDebts} onRowClick={(item) => navigate(`/clients/${item.id}`)} />
        ) : (
            <p className="text-slate-500 dark:text-slate-400 p-4 text-center">
                No hay clientes con saldos pendientes.
            </p>
        )}
      </Card>

      <div className="mb-6 p-4 bg-white dark:bg-slate-800 shadow rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <Input
            placeholder="Buscar en todos los clientes (nombre, email, teléfono, ID fiscal, categoría...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="mb-0 flex-grow"
        />
        <div className="flex space-x-2">
            <Button
                variant={viewMode === 'table' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('table')}
                leftIcon={<TableCellsIcon className="h-5 w-5"/>}
                aria-pressed={viewMode === 'table'}
                title="Vista Tabla"
            >
                Tabla
            </Button>
            <Button
                variant={viewMode === 'card' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('card')}
                leftIcon={<Squares2X2Icon className="h-5 w-5"/>}
                aria-pressed={viewMode === 'card'}
                title="Vista Tarjetas"
            >
                Tarjetas
            </Button>
        </div>
      </div>

      {isLoading && clients.length === 0 ? (
        <div className="flex justify-center mt-20">
            <LoadingSpinner text="Cargando clientes..." />
        </div>
      ) : viewMode === 'table' ? (
        <Table columns={columns} data={filteredClients} onRowClick={handleRowClick} emptyStateMessage="No hay clientes registrados que coincidan con la búsqueda."/>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredClients.map(client => (
            <Card 
                key={client.id} 
                title={client.name} 
                onClick={() => handleRowClick(client)} 
                className="hover:shadow-lg cursor-pointer transition-shadow duration-150 flex flex-col justify-between"
                icon={<UserPlusIcon className="h-6 w-6 text-primary-dark dark:text-primary-light"/>}
            >
              <div className="text-sm space-y-1 mb-3">
                <p className="text-slate-600 dark:text-slate-400 truncate" title={client.email}>
                  <span className="font-medium">Email:</span> {client.email}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Tel:</span> {client.phone}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-medium">ID Fiscal:</span> {client.fiscalId}
                </p>
              </div>
              <div className="mt-auto pt-2 border-t border-slate-200 dark:border-slate-700">
                <ClientCategoryBadge category={client.clientCategory} />
              </div>
            </Card>
          ))}
          {filteredClients.length === 0 && <p className="col-span-full text-center p-10 text-slate-500 dark:text-slate-400">No hay clientes registrados que coincidan con la búsqueda.</p>}
        </div>
      )}

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseNewClientModal}
          title={'Nuevo Cliente'}
          size="lg"
        >
          <ClientForm
            onSubmit={handleNewClientSubmit}
            onCancel={handleCloseNewClientModal}
            isSubmitting={isSubmitting}
            apiError={apiFormError}
          />
        </Modal>
      )}
    </div>
  );
};

export default ClientsPage;
