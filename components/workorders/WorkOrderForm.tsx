
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WorkOrder, WorkOrderStatus, Client, InventoryItem, Technician, BudgetItem, ClientCategory, AutocompleteSuggestion, ScheduledService, ClientEquipment, WorkOrderArea, statusesByArea, ServiceNature, DEFAULT_IVA_PERCENTAGE } from '../../types.ts';
import Input from '../common/Input.tsx';
import TextArea from '../common/TextArea.tsx';
import Select from '../common/Select.tsx'; 
import Button from '../common/Button.tsx';
import Modal from '../common/Modal.tsx';
import ClientForm from '../clients/ClientForm.tsx'; 
import AutocompleteInput from '../common/AutocompleteInput.tsx'; 
import Tabs from '../common/Tabs.tsx';
import WorkOrderStatusBadge from './WorkOrderStatusBadge.tsx';
import { 
    getClients, getInventoryItems, getTechnicians, createClient, 
    getWorkOrdersBySerial, getDynamicBrands, addDynamicBrand, 
    getDynamicModelsForBrand, addDynamicModelForBrand,
    getNextWorkOrderCustomId, getWorkOrdersByBrandAndModel,
    getDynamicEquipmentTypes, addDynamicEquipmentType,
    getClientEquipmentByClientId, getClientById
} from '../../services/apiService.ts';
import { 
    DEFAULT_PHOTO_PLACEHOLDER, 
    PlusIcon, 
    TicketIcon, 
    CalendarDaysIcon as CalendarIcon, 
    PrinterIcon, 
    UserIcon, // Standard user icon
    PhoneIcon, 
    ArrowPathIcon as RefreshIcon, 
    TrashIcon as RemoveBudgetItemIcon, 
    CogIcon, // For "Equipo" tab
    EllipsisVerticalIcon, 
    CreditCardIcon, // For "Info Pago" tab
    CameraIcon, // For "Fotos" tab
    DocumentTextIcon, // Used for NotesIcon alias
    InformationCircleIcon, // For "Más Info" tab
    UserGroupIcon as TasksIcon, // For "Tareas" tab
    MapPinIcon as CitasIcon // For "Citas" tab, aliased from MapPinOutlineIcon
} from '../../constants.tsx';
import { formatCurrencyCOP } from '../../utils/formatting.ts';
import LoadingSpinner from '../common/LoadingSpinner.tsx';

const generateBudgetItemId = () => `bi-${Math.random().toString(36).substr(2, 9)}`;

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
};

interface WorkOrderFormProps {
  initialData?: WorkOrder | null;
  prefillData?: { 
    scheduledServiceId: string;
    client: Client;
    equipment: ClientEquipment;
    scheduledServiceDetails: ScheduledService;
  } | null;
  onSubmit: (data: WorkOrder) => void;
  onCancel: () => void; 
  isSubmitting?: boolean;
  apiError?: string | null;
  isEditing?: boolean;
}

const WorkOrderForm: React.FC<WorkOrderFormProps> = ({ initialData, prefillData, onSubmit, onCancel, isSubmitting, apiError, isEditing }) => {
  const [formData, setFormData] = useState<WorkOrder>({
    id: '', customId: '', clientId: '', clientName: '', clientPhone: '',
    equipmentType: '', equipmentBrand: '', equipmentModel: '', equipmentSerial: '', equipmentPassword: '',
    reportedFault: '', serviceNature: 'Reparación', externalNotes: '', accessories: '', photos: [],
    area: WorkOrderArea.Entrada, status: WorkOrderStatus.PendienteDiagnostico, priority: 'Normal',
    assignedTechnicianId: '', notes: '', createdAt: '', updatedAt: '',
    budgetItems: [], budgetApproved: false, overallDiscountPercentage: 0, ivaPercentage: DEFAULT_IVA_PERCENTAGE,
    scheduledMaintenanceDate: '', scheduledMaintenanceType: '', deliveryDate: '',
    paymentStatus: 'Pendiente', totalPaidAmount: 0, warrantyExpiryDate: '', licenseExpiryDate: '',
    location: '', scheduledServiceId: undefined, serviceLocationType: 'Taller', appointmentDateTime: undefined,
  });
  
  // States for Autocomplete displays and dynamic lists
  const [clientDisplay, setClientDisplay] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientApiError, setClientApiError] = useState<string | null>(null);
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);

  const [showAddItemForm, setShowAddItemForm] = useState<'part' | 'service' | null>(null);
  const [newBudgetItemName, setNewBudgetItemName] = useState('');
  const [newBudgetItemQuantity, setNewBudgetItemQuantity] = useState<number>(1);
  const [newBudgetItemPrice, setNewBudgetItemPrice] = useState<number>(0);
  const [newBudgetItemDiscount, setNewBudgetItemDiscount] = useState<number>(0);
  const [selectedInventoryPartId, setSelectedInventoryPartId] = useState('');
  const [newBudgetItemInvoiceNotes, setNewBudgetItemInvoiceNotes] = useState('');

  const [activeTab, setActiveTab] = useState('equipo');


  useEffect(() => {
    const loadInitialFormData = async () => {
      const clientsData = await getClients();
      setClients(clientsData);
      const inventoryData = await getInventoryItems();
      setInventoryItems(inventoryData.filter(item => !item.category?.toLowerCase().includes('servicio')));
      const techniciansData = await getTechnicians();
      setTechnicians(techniciansData);

      let baseFormData: Partial<WorkOrder> = {
        customId: initialData?.customId || prefillData ? initialData?.customId : await getNextWorkOrderCustomId(),
        area: WorkOrderArea.Entrada, 
        status: WorkOrderStatus.PendienteDiagnostico, 
        priority: 'Normal',
        paymentStatus: 'Pendiente',
        totalPaidAmount: 0,
        budgetItems: [],
        budgetApproved: false,
        serviceLocationType: 'Taller',
        serviceNature: 'Reparación',
        overallDiscountPercentage: 0,
        ivaPercentage: DEFAULT_IVA_PERCENTAGE,
        photos: [],
      };

      if (initialData) {
        baseFormData = { ...baseFormData, ...initialData, clientPhone: initialData.clientPhone || clientsData.find(c=>c.id === initialData.clientId)?.phone };
        setClientDisplay(initialData.clientName || clientsData.find(c => c.id === initialData.clientId)?.name || '');
      } else if (prefillData) {
          baseFormData = {
              ...baseFormData, 
              clientId: prefillData.client.id,
              clientName: prefillData.client.name,
              clientPhone: prefillData.client.phone,
              equipmentType: prefillData.equipment.type,
              equipmentBrand: prefillData.equipment.brand,
              equipmentModel: prefillData.equipment.model,
              equipmentSerial: prefillData.equipment.serial,
              location: prefillData.equipment.location || prefillData.client.address || '',
              reportedFault: `${prefillData.scheduledServiceDetails.serviceType}: ${prefillData.scheduledServiceDetails.description}`,
              notes: prefillData.equipment.observations || '', // Use internal notes for 'Estado del equipo'
              scheduledServiceId: prefillData.scheduledServiceId,
              serviceLocationType: prefillData.scheduledServiceDetails.requiresHomeVisit ? 'Domicilio' : 'Taller',
              appointmentDateTime: prefillData.scheduledServiceDetails.requiresHomeVisit ? prefillData.scheduledServiceDetails.scheduledDate + 'T09:00' : undefined
          };
          setClientDisplay(prefillData.client.name);
      }
      setFormData(prev => ({ ...prev, ...baseFormData }));
    };
    loadInitialFormData();
  }, [initialData, prefillData]);

  const subtotalBudget = useMemo(() => {
    return formData.budgetItems?.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unitPrice;
        const itemDiscountAmount = itemTotal * ((item.discountPercentage || 0) / 100);
        return sum + (itemTotal - itemDiscountAmount);
    }, 0) || 0;
  }, [formData.budgetItems]);

  const overallDiscountAmount = useMemo(() => {
    return subtotalBudget * ((formData.overallDiscountPercentage || 0) / 100);
  }, [subtotalBudget, formData.overallDiscountPercentage]);

  const ivaAmount = useMemo(() => {
    const taxableAmount = subtotalBudget - overallDiscountAmount;
    return taxableAmount * ((formData.ivaPercentage || 0) / 100);
  }, [subtotalBudget, overallDiscountAmount, formData.ivaPercentage]);

  const grandTotal = useMemo(() => {
    return subtotalBudget - overallDiscountAmount + ivaAmount;
  }, [subtotalBudget, overallDiscountAmount, ivaAmount]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number | boolean | undefined = value;
    if (['overallDiscountPercentage', 'ivaPercentage', 'totalPaidAmount'].includes(name)) {
        parsedValue = parseFloat(value) || 0;
    } else if (e.target.type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        parsedValue = checked;
    }
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };
  
  const handleServiceNatureChange = (nature: ServiceNature) => {
    setFormData(prev => ({ ...prev, serviceNature: nature }));
  };

  const handleClientSelect = async (value: string, label?: string) => {
    const selectedClient = clients.find(c => c.id === value) || await getClientById(value);
    setFormData(prev => ({ 
        ...prev, 
        clientId: value,
        clientName: selectedClient?.name,
        clientPhone: selectedClient?.phone,
    }));
    setClientDisplay(label || selectedClient?.name || value);
  };

  const handleClientAddNew = () => setIsClientModalOpen(true); 

  const handleClientSubmit = async (clientData: Omit<Client, 'id' | 'registeredAt'>) => {
    setIsSubmittingClient(true); setClientApiError(null);
    try {
      const newClient = await createClient(clientData);
      setClients(prevClients => [...prevClients, newClient]);
      setFormData(prevFormData => ({ 
        ...prevFormData, 
        clientId: newClient.id,
        clientName: newClient.name,
        clientPhone: newClient.phone,
       }));
      setClientDisplay(newClient.name); 
      setIsClientModalOpen(false);
    } catch (error) { setClientApiError(error instanceof Error ? error.message : "Error al crear cliente."); } 
    finally { setIsSubmittingClient(false); }
  };

  const handleAddBudgetItem = () => {
    let newItem: BudgetItem | null = null;
    if (showAddItemForm === 'part' && selectedInventoryPartId && newBudgetItemQuantity > 0 && newBudgetItemPrice >= 0) {
        const part = inventoryItems.find(item => item.id === selectedInventoryPartId);
        if (!part) return;
        newItem = {
            id: generateBudgetItemId(), inventoryItemId: part.id, itemName: part.name,
            quantity: newBudgetItemQuantity, unitPrice: newBudgetItemPrice, 
            discountPercentage: newBudgetItemDiscount, isService: false, 
            invoiceNotes: newBudgetItemInvoiceNotes.trim() || undefined,
        };
    } else if (showAddItemForm === 'service' && newBudgetItemName.trim() && newBudgetItemQuantity > 0 && newBudgetItemPrice >= 0) {
        newItem = {
            id: generateBudgetItemId(), itemName: newBudgetItemName,
            quantity: newBudgetItemQuantity, unitPrice: newBudgetItemPrice, 
            discountPercentage: newBudgetItemDiscount, isService: true,
            invoiceNotes: newBudgetItemInvoiceNotes.trim() || undefined,
        };
    }
    if (newItem) {
      setFormData(prev => ({ ...prev, budgetItems: [...(prev.budgetItems || []), newItem] }));
    }
    setShowAddItemForm(null); setNewBudgetItemName(''); setNewBudgetItemQuantity(1); setNewBudgetItemPrice(0); setNewBudgetItemDiscount(0); setSelectedInventoryPartId(''); setNewBudgetItemInvoiceNotes('');
  };

  const handleRemoveBudgetItem = (itemId: string) => {
    setFormData(prev => ({ ...prev, budgetItems: prev.budgetItems?.filter(item => item.id !== itemId) }));
  };
  
  const handleBudgetItemChange = (itemId: string, field: keyof BudgetItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      budgetItems: prev.budgetItems?.map(item => 
        item.id === itemId ? { ...item, [field]: typeof value === 'string' && (field === 'quantity' || field === 'unitPrice' || field === 'discountPercentage') ? parseFloat(value) || 0 : value } : item
      )
    }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData });
  };
  
  const clientSuggestions: AutocompleteSuggestion[] = clients.map(c => ({ value: c.id, label: `${c.name} (ID: ${c.fiscalId})` }));
  const inventoryPartOptions = inventoryItems.map(item => ({ value: item.id, label: `${item.name} (${formatCurrencyCOP(item.price)}) - Stock: ${item.quantity}` }));

  const tabConfigs = [
    { key: 'equipo', label: 'Equipo', icon: CogIcon },
    { key: 'fotos', label: 'Fotos', icon: CameraIcon },
    { key: 'notas_internas', label: 'Notas Internas', icon: DocumentTextIcon }, // For "Estado del equipo" and general internal notes
    { key: 'informe', label: 'Informe Técnico', icon: DocumentTextIcon },
    { key: 'tareas', label: 'Tareas', icon: TasksIcon },
    { key: 'citas', label: 'Citas', icon: CitasIcon },
    { key: 'pago', label: 'Info Pago', icon: CreditCardIcon },
    { key: 'info', label: 'Más Info', icon: InformationCircleIcon },
  ];


  return (
    <div className="bg-white dark:bg-slate-800 shadow-xl dark:shadow-slate-900/30 rounded-lg">
      {/* Page Top Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          {isEditing ? `Orden #${formData.customId || formData.id}` : 'Nueva Orden de Trabajo'}
        </h2>
        <div className="flex items-center space-x-2">
          <WorkOrderStatusBadge status={formData.status} />
          <Button variant="success" size="sm" onClick={() => alert('Ingresar pago (Placeholder)')} leftIcon={<CreditCardIcon className="h-4 w-4"/>}>Ingresar Pago</Button>
          <Button variant="ghost" size="sm" onClick={() => alert('Más opciones (Placeholder)')}><EllipsisVerticalIcon className="h-5 w-5"/></Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-0">
        {apiError && <p className="m-4 text-red-500 dark:text-red-400 text-sm p-2 bg-red-50 dark:bg-red-900/30 rounded-md">{apiError}</p>}
        
        <div className="flex flex-col lg:flex-row">
          {/* Left Column */}
          <div className="w-full lg:w-3/5 p-4 sm:p-6 border-r-0 lg:border-r border-slate-200 dark:border-slate-700 space-y-6">
            {/* Client Info Section */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
              <div className="flex items-center">
                <UserIcon className="h-8 w-8 text-primary dark:text-primary-light mr-3"/>
                <div>
                  <AutocompleteInput
                    label="Cliente"
                    name="client"
                    placeholder="Buscar o agregar cliente..."
                    value={clientDisplay}
                    suggestions={clientSuggestions}
                    onChange={setClientDisplay} 
                    onSelect={handleClientSelect}
                    onAddNew={handleClientAddNew}
                    addNewLabel="Crear nuevo cliente:"
                    required
                    containerClassName="mb-0"
                    disabled={!!prefillData || (isEditing && formData.status === WorkOrderStatus.Entregado)} 
                  />
                </div>
              </div>
              <div className="text-right">
                {formData.clientPhone && <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center"><PhoneIcon className="h-4 w-4 mr-1"/> {formData.clientPhone}</p>}
                <Button variant="ghost" size="sm" onClick={() => alert('Expandir info cliente (Placeholder)')} className="mt-1"><RefreshIcon className="h-4 w-4"/></Button>
              </div>
            </div>

            {/* Falla o Requerimiento Section */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Falla o Requerimiento*</label>
              <TextArea name="reportedFault" value={formData.reportedFault} onChange={handleChange} rows={3} required 
                disabled={(!!prefillData && !!prefillData.scheduledServiceDetails.description) || (isEditing && formData.status === WorkOrderStatus.Entregado)}
                placeholder="Describa detalladamente la falla..."
              />
              <div className="mt-2 flex items-center space-x-3">
                {(['Reparación', 'Mantención', 'Garantía'] as ServiceNature[]).map(nature => (
                  <label key={nature} className="flex items-center text-sm">
                    <input type="radio" name="serviceNature" value={nature} checked={formData.serviceNature === nature} onChange={() => handleServiceNatureChange(nature)} className="form-radio h-4 w-4 text-primary focus:ring-primary-light" disabled={(isEditing && formData.status === WorkOrderStatus.Entregado)}/>
                    <span className="ml-1.5 text-slate-700 dark:text-slate-300">{nature}</span>
                  </label>
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={() => alert('Añadir otro requerimiento (Placeholder)')}><PlusIcon className="h-4 w-4"/></Button>
              </div>
            </div>

            {/* Servicio o Producto (Budget) Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Servicio(s) o Producto(s) del Presupuesto</label>
              {formData.budgetItems && formData.budgetItems.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                      <tr>
                        <th className="p-2 text-left">Descripción</th>
                        <th className="p-2 text-center w-16">Cant.</th>
                        <th className="p-2 text-right w-28">P.Unit.</th>
                        <th className="p-2 text-center w-20">Desc.%</th>
                        <th className="p-2 text-right w-28">Total</th>
                        <th className="p-2 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                      {formData.budgetItems.map(item => (
                        <tr key={item.id}>
                          <td className="p-2"><Input name={`itemName-${item.id}`} value={item.itemName} onChange={(e) => handleBudgetItemChange(item.id, 'itemName', e.target.value)} containerClassName="mb-0" className="text-xs p-1" disabled={(isEditing && formData.status === WorkOrderStatus.Entregado)}/></td>
                          <td className="p-1"><Input type="number" name={`quantity-${item.id}`} value={item.quantity} onChange={(e) => handleBudgetItemChange(item.id, 'quantity', e.target.value)} min="1" containerClassName="mb-0" className="text-xs p-1 w-full text-center" disabled={(isEditing && formData.status === WorkOrderStatus.Entregado)}/></td>
                          <td className="p-1"><Input type="number" name={`unitPrice-${item.id}`} value={item.unitPrice} onChange={(e) => handleBudgetItemChange(item.id, 'unitPrice', e.target.value)} min="0" step="1" containerClassName="mb-0" className="text-xs p-1 w-full text-right" disabled={(isEditing && formData.status === WorkOrderStatus.Entregado)}/></td>
                          <td className="p-1"><Input type="number" name={`discountPercentage-${item.id}`} value={item.discountPercentage || 0} onChange={(e) => handleBudgetItemChange(item.id, 'discountPercentage', e.target.value)} min="0" max="100" containerClassName="mb-0" className="text-xs p-1 w-full text-center" disabled={(isEditing && formData.status === WorkOrderStatus.Entregado)}/></td>
                          <td className="p-2 text-right">{formatCurrencyCOP((item.quantity * item.unitPrice) * (1 - (item.discountPercentage || 0) / 100))}</td>
                          <td className="p-1 text-center"><Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveBudgetItem(item.id)} title="Quitar item" className="text-red-500" disabled={(isEditing && formData.status === WorkOrderStatus.Entregado)}><RemoveBudgetItemIcon className="h-4 w-4"/></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-xs text-slate-500 dark:text-slate-400">No hay ítems en el presupuesto.</p>}
              
              {! (isEditing && formData.status === WorkOrderStatus.Entregado) && (
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddItemForm('part'); setSelectedInventoryPartId(''); setNewBudgetItemQuantity(1); setNewBudgetItemPrice(0); setNewBudgetItemDiscount(0); setNewBudgetItemInvoiceNotes(''); }} leftIcon={<PlusIcon className="h-4 w-4"/>} className="text-primary dark:text-primary-light border-primary dark:border-primary-light hover:bg-primary-light/10 dark:hover:bg-primary-dark/20">
                  Agregar Producto o Servicio
                </Button>
              )}

              {/* Modal-like form for adding budget items */}
              {showAddItemForm && (
                  <div className="mt-3 p-3 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700/50 space-y-2">
                    <h4 className="text-xs font-semibold">{showAddItemForm === 'part' ? 'Añadir Repuesto' : 'Añadir Servicio Manual'}</h4>
                    {showAddItemForm === 'part' ? (
                        <Select label="Seleccionar Repuesto" options={inventoryPartOptions} value={selectedInventoryPartId} onChange={e => {setSelectedInventoryPartId(e.target.value); const part = inventoryItems.find(i => i.id === e.target.value); if(part) setNewBudgetItemPrice(part.price);}} placeholder="Elegir repuesto..." containerClassName="mb-0 text-xs" />
                    ) : (
                        <Input label="Nombre del Servicio*" name="newBudgetItemName" value={newBudgetItemName} onChange={e => setNewBudgetItemName(e.target.value)} required containerClassName="mb-0 text-xs" />
                    )}
                    <div className="grid grid-cols-3 gap-2">
                        <Input type="number" label="Cantidad" value={newBudgetItemQuantity} onChange={e => setNewBudgetItemQuantity(parseInt(e.target.value))} min="1" containerClassName="mb-0 text-xs"/>
                        <Input type="number" label="Precio Unit. (COP)" value={newBudgetItemPrice} onChange={e => setNewBudgetItemPrice(parseFloat(e.target.value))} min="0" step="1" containerClassName="mb-0 text-xs"/>
                        <Input type="number" label="Desc. %" value={newBudgetItemDiscount} onChange={e => setNewBudgetItemDiscount(parseFloat(e.target.value))} min="0" max="100" containerClassName="mb-0 text-xs"/>
                    </div>
                    <Input label="Notas en Factura (Opcional)" value={newBudgetItemInvoiceNotes} onChange={e => setNewBudgetItemInvoiceNotes(e.target.value)} placeholder="Ej: S/N SSD, Garantía" containerClassName="mb-0 text-xs"/>
                    <div className="flex gap-2 pt-1">
                        <Button type="button" size="sm" onClick={handleAddBudgetItem} disabled={ (showAddItemForm === 'part' && !selectedInventoryPartId) || (showAddItemForm === 'service' && !newBudgetItemName.trim()) || newBudgetItemQuantity <= 0 || newBudgetItemPrice < 0}>Confirmar</Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setShowAddItemForm(null)}>Cancelar</Button>
                    </div>
                  </div>
              )}
            </div>

            {/* Totals Section */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                    <label htmlFor="overallDiscountPercentage" className="text-slate-600 dark:text-slate-400">Descuento General (%):</label>
                    <Input type="number" name="overallDiscountPercentage" id="overallDiscountPercentage" value={formData.overallDiscountPercentage || 0} onChange={handleChange} min="0" max="100" className="w-20 text-right p-1" containerClassName="mb-0" disabled={(isEditing && formData.status === WorkOrderStatus.Entregado)}/>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                    <span className="font-medium px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">{formatCurrencyCOP(subtotalBudget)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Descuento Aplicado:</span>
                    <span className="font-medium px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-red-600 dark:text-red-400">-{formatCurrencyCOP(overallDiscountAmount)}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <label htmlFor="ivaPercentage" className="text-slate-600 dark:text-slate-400">IVA (%):</label>
                    <Input type="number" name="ivaPercentage" id="ivaPercentage" value={formData.ivaPercentage || 0} onChange={handleChange} min="0" max="100" className="w-20 text-right p-1" containerClassName="mb-0" disabled={(isEditing && formData.status === WorkOrderStatus.Entregado)}/>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Monto IVA:</span>
                    <span className="font-medium px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">{formatCurrencyCOP(ivaAmount)}</span>
                </div>
                 <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">TOTAL A PAGAR:</span>
                    <span className="font-bold px-4 py-1.5 bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 rounded-full">{formatCurrencyCOP(grandTotal)}</span>
                </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-2/5 p-4 sm:p-6 space-y-4">
            <Tabs tabs={tabConfigs.map(t => ({...t, label: <><t.icon className="h-4 w-4 mr-1.5"/>{t.label}</>}))} onTabChange={setActiveTab} defaultActiveTabKey="equipo"/>
            
            {activeTab === 'equipo' && (
              <div className="space-y-3">
                <Input label="Tipo Equipo" value={formData.equipmentType} readOnly disabled className="bg-slate-100 dark:bg-slate-700"/>
                <Input label="Marca" value={formData.equipmentBrand} readOnly disabled className="bg-slate-100 dark:bg-slate-700"/>
                <Input label="Modelo" value={formData.equipmentModel} readOnly disabled className="bg-slate-100 dark:bg-slate-700"/>
                <Input label="Serial" value={formData.equipmentSerial} readOnly disabled className="bg-slate-100 dark:bg-slate-700"/>
                <Input label="Contraseña Equipo (Opcional)" name="equipmentPassword" value={formData.equipmentPassword || ''} onChange={handleChange} placeholder="Contraseña de acceso al equipo" disabled={(isEditing && formData.status === WorkOrderStatus.Entregado)}/>
                <TextArea label="Estado Físico del Equipo / Notas Internas Adicionales" name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} placeholder="Describa el estado físico, rayones, golpes, software instalado, etc." disabled={(isEditing && formData.status === WorkOrderStatus.Entregado)}/>
                <div className="flex space-x-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => alert('Imprimir Etiqueta (Placeholder)')}>Imprimir Etiqueta</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => alert('Imprimir Orden Completa (Placeholder)')}>Imprimir Orden</Button>
                </div>
              </div>
            )}
            {/* Placeholder for other tabs */}
            {activeTab !== 'equipo' && <p className="text-sm text-slate-500 dark:text-slate-400 py-4">Contenido para la pestaña '{tabConfigs.find(t=>t.key === activeTab)?.label}' (próximamente).</p>}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting || (isEditing && formData.status === WorkOrderStatus.Entregado)}>
            {isEditing ? 'Actualizar Orden' : 'Crear Orden'}
          </Button>
        </div>
      </form>

      <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} title="Crear Nuevo Cliente" size="lg">
          <ClientForm 
            onSubmit={handleClientSubmit}
            onCancel={() => setIsClientModalOpen(false)}
            isSubmitting={isSubmittingClient}
            apiError={clientApiError}
          />
      </Modal>
    </div>
  );
};

export default WorkOrderForm;
