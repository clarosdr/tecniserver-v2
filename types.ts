


export enum WorkOrderArea {
  Solicitudes = 'Solicitudes de Servicio', // For pending ScheduledServices
  Entrada = 'Entrada a Taller',
  ListoParaRetirar = 'Listo para Retirar',
  HistorialCompletados = 'Historial y Bodega',
}

export enum WorkOrderStatus {
  // Status for ScheduledServices when displayed in Solicitudes Area
  SolicitudPendiente = 'Solicitud Pendiente', 

  // Statuses for Area: Entrada
  PendienteDiagnostico = 'Pendiente', // Was 'Pendiente de Diagnóstico'
  EnProgreso = 'En progreso', // Was 'En Progreso'
  EnEsperaDeRepuestos = 'En espera de repuesto', // Was 'En espera de Repuestos'
  EsperandoAprobacion = 'Esperando Aprobación',

  // Statuses for Area: ListoParaRetirar
  Reparado = 'Reparado',
  SinSolucion = 'Sin solución', // Was 'Sin Solución'

  // Statuses for Area: HistorialCompletados (Replaces "Area: Entregado" from prompt)
  Entregado = 'Entregado',
  EnBodega = 'Bodega', // Was 'En Bodega'

  // General Status
  Cancelado = 'Cancelado',
}

export const statusesByArea: Record<WorkOrderArea, WorkOrderStatus[]> = {
    [WorkOrderArea.Solicitudes]: [WorkOrderStatus.SolicitudPendiente, WorkOrderStatus.Cancelado], // Not directly set for WOs here
    [WorkOrderArea.Entrada]: [
        WorkOrderStatus.PendienteDiagnostico, 
        WorkOrderStatus.EnProgreso, 
        WorkOrderStatus.EnEsperaDeRepuestos, 
        WorkOrderStatus.EsperandoAprobacion,
        WorkOrderStatus.Cancelado
    ],
    [WorkOrderArea.ListoParaRetirar]: [
        WorkOrderStatus.Reparado, 
        WorkOrderStatus.SinSolucion
    ],
    [WorkOrderArea.HistorialCompletados]: [
        WorkOrderStatus.Entregado, 
        WorkOrderStatus.EnBodega
    ],
};


export interface BudgetItem {
  id: string; 
  inventoryItemId?: string; 
  itemName: string; 
  quantity: number;
  unitPrice: number;
  isService: boolean; 
  invoiceNotes?: string; // New field for notes on invoice
  discountPercentage?: number; // New field for individual item discount (0-100)
}

export type ServiceNature = 'Reparación' | 'Mantención' | 'Garantía';

export interface WorkOrder {
  id: string;
  customId?: string; 
  clientId: string;
  clientName?: string; 
  clientPhone?: string; // Added for direct display
  equipmentType: string; 
  equipmentBrand: string;
  equipmentModel: string;
  equipmentSerial: string; 
  equipmentPassword?: string; // New field for equipment password
  reportedFault: string;
  serviceNature?: ServiceNature; // New field for Reparación, Mantención, Garantía
  externalNotes?: string; 
  accessories?: string; 
  photos: string[]; 
  status: WorkOrderStatus; 
  area: WorkOrderArea; 
  priority: 'Urgente' | 'Normal' | 'Baja';
  assignedTechnicianId?: string;
  notes?: string; // Internal technical notes, will be used for "Estado del equipo"
  createdAt: string;
  updatedAt: string;
  budgetItems?: BudgetItem[]; 
  budgetApproved?: boolean;
  budgetNotes?: string; // For client rejection reasons or internal notes on budget
  
  overallDiscountPercentage?: number; // New: Overall discount on subtotal (0-100)
  ivaPercentage?: number; // New: IVA percentage (e.g., 19 for 19%)

  scheduledMaintenanceDate?: string; 
  scheduledMaintenanceType?: string; 
  deliveryDate?: string; 

  paymentStatus?: 'Pagado' | 'Parcial' | 'Pendiente';
  totalPaidAmount?: number;
  warrantyExpiryDate?: string; 
  licenseExpiryDate?: string; 
  location?: string; 

  scheduledServiceId?: string; 

  serviceLocationType?: 'Taller' | 'Domicilio'; 
  appointmentDateTime?: string; 
}

export enum ClientCategory {
    Seleccional = 'Seleccional', // Assuming from "Reseleccional"
    Preferencial = 'Preferencial',
    Individual = 'Individual',
    Empresa = 'Empresa',
    EmpresaPlus = 'Empresa Plus' // New
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  fiscalId: string; 
  communicationPreferences?: ('SMS' | 'Email' | 'WhatsApp' | 'Push')[];
  clientCategory: ClientCategory; 
  registeredAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  sku: string;
  category: string; 
  space?: string; 
  quantity: number;
  minStockLevel: number;
  price: number; 
  costPrice?: number; 
  supplierId: string; // Made mandatory
  purchaseInvoiceNumber: string; // New: Factura de compra al proveedor
  purchaseDate: string; // New: Fecha de compra al proveedor (ISO string date)
}

export interface Transaction {
  id: string;
  type: 'Ingreso' | 'Egreso';
  amount: number;
  description: string;
  date: string;
  workOrderId?: string; 
  branchId?: string; 
  inventoryItemId?: string; // Added for linking to inventory items
}

export interface Technician {
  id: string;
  name: string;
  specialization?: string;
}

export enum UserRole {
  Admin = 'Admin',
  Technician = 'Technician',
  Receptionist = 'Receptionist',
  Accountant = 'Accountant',
  HomeServiceTechnician = 'HomeServiceTechnician',
  Client = 'Client', 
}

export enum Permission {
  // General
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  VIEW_APP_GUIDE = 'VIEW_APP_GUIDE',
  MANAGE_PERSONAL_BUDGET = 'MANAGE_PERSONAL_BUDGET',

  // Work Orders
  VIEW_WORK_ORDERS_ALL_AREAS = 'VIEW_WORK_ORDERS_ALL_AREAS', // See all WOs in any area
  CREATE_WORK_ORDERS = 'CREATE_WORK_ORDERS', // Direct creation
  EDIT_WORK_ORDERS_ANY = 'EDIT_WORK_ORDERS_ANY', // Edit any WO
  EDIT_WORK_ORDERS_ASSIGNED = 'EDIT_WORK_ORDERS_ASSIGNED', // Edit only assigned/unassigned
  DELETE_WORK_ORDERS = 'DELETE_WORK_ORDERS',
  APPROVE_BUDGETS_STAFF = 'APPROVE_BUDGETS_STAFF', // Staff manual budget approval
  MANAGE_WORK_ORDER_STATUS_AREA = 'MANAGE_WORK_ORDER_STATUS_AREA', // Change status/area
  NOTIFY_CLIENT_READY_PICKUP = 'NOTIFY_CLIENT_READY_PICKUP',
  NOTIFY_CLIENT_STORAGE = 'NOTIFY_CLIENT_STORAGE',
  MARK_OT_DELIVERED = 'MARK_OT_DELIVERED',
  MOVE_OT_TO_STORAGE = 'MOVE_OT_TO_STORAGE',
  GENERATE_OT_TICKET = 'GENERATE_OT_TICKET',

  // Scheduled Services
  VIEW_SCHEDULED_SERVICES_ALL = 'VIEW_SCHEDULED_SERVICES_ALL',
  CREATE_SCHEDULED_SERVICES = 'CREATE_SCHEDULED_SERVICES', // From client detail page by staff
  EDIT_SCHEDULED_SERVICES = 'EDIT_SCHEDULED_SERVICES',
  DELETE_SCHEDULED_SERVICES = 'DELETE_SCHEDULED_SERVICES',
  CONVERT_SCHEDULED_SERVICE_TO_OT = 'CONVERT_SCHEDULED_SERVICE_TO_OT',

  // Clients
  VIEW_CLIENTS_LIST = 'VIEW_CLIENTS_LIST',
  VIEW_CLIENT_DETAILS = 'VIEW_CLIENT_DETAILS',
  CREATE_CLIENTS = 'CREATE_CLIENTS',
  EDIT_CLIENTS = 'EDIT_CLIENTS',
  DELETE_CLIENTS = 'DELETE_CLIENTS', // (Consider implications)
  MANAGE_CLIENT_EQUIPMENT = 'MANAGE_CLIENT_EQUIPMENT', // CRUD equipment for a client

  // Inventory
  VIEW_INVENTORY = 'VIEW_INVENTORY',
  CREATE_INVENTORY_ITEMS = 'CREATE_INVENTORY_ITEMS',
  EDIT_INVENTORY_ITEMS = 'EDIT_INVENTORY_ITEMS',
  DELETE_INVENTORY_ITEMS = 'DELETE_INVENTORY_ITEMS',
  ADJUST_INVENTORY_STOCK = 'ADJUST_INVENTORY_STOCK',

  // Accounting
  VIEW_ACCOUNTING = 'VIEW_ACCOUNTING',
  CREATE_TRANSACTIONS = 'CREATE_TRANSACTIONS', // Manual transactions
  // EDIT_TRANSACTIONS = 'EDIT_TRANSACTIONS', // (Consider implications)
  // DELETE_TRANSACTIONS = 'DELETE_TRANSACTIONS', // (Consider implications)
  GENERATE_ACCOUNTING_REPORTS = 'GENERATE_ACCOUNTING_REPORTS',

  // User Management (Admin only)
  MANAGE_USERS_INTERNAL = 'MANAGE_USERS_INTERNAL', // CRUD internal users, assign roles, permissions

  // Settings (Admin only)
  VIEW_SETTINGS_AI = 'VIEW_SETTINGS_AI',
  MANAGE_CLIENT_PORTAL_SETTINGS = 'MANAGE_CLIENT_PORTAL_SETTINGS', // The page itself

  // Client Portal Specific Permissions (for client users)
  VIEW_CLIENT_PORTAL_DASHBOARD = 'VIEW_CLIENT_PORTAL_DASHBOARD',
  VIEW_CLIENT_PORTAL_PROFILE = 'VIEW_CLIENT_PORTAL_PROFILE',
  MANAGE_CLIENT_PORTAL_EQUIPMENT = 'MANAGE_CLIENT_PORTAL_EQUIPMENT', // Client can request service for their equipment
  VIEW_CLIENT_PORTAL_WORK_ORDERS = 'VIEW_CLIENT_PORTAL_WORK_ORDERS', // Client views their WOs and budget details
  REQUEST_CLIENT_PORTAL_SERVICE = 'REQUEST_CLIENT_PORTAL_SERVICE', // Client can make new service requests
  VIEW_CLIENT_PORTAL_HISTORY = 'VIEW_CLIENT_PORTAL_HISTORY',
}


export interface User {
  id: string;
  username: string; 
  role: UserRole;
  password?: string; 
  email?: string;   
  name?: string;     
  fiscalId?: string; 
  lastLogin?: string; 
  status?: 'Activo' | 'Inactivo'; 
  permissions: Permission[]; // Added permissions
}

export interface UserCredentials {
  identifier: string; 
  secret: string;     
}


export interface NavigationItem {
  path: string;
  name: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  requiredPermission?: Permission; // Changed from allowedRoles
  allowedRoles?: UserRole[]; // Kept for client portal distinction logic or very specific cases
  isClientPortal?: boolean; 
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  retrievedContext?: {
    uri?: string;
    title?: string;
  };
}

export const PREDEFINED_EQUIPMENT_TYPES = [
    "Impresora", "Laptop", "PC de Escritorio", "Tablet", "Smartphone", 
    "Monitor", "Router/Modem", "Consola de Videojuegos", "Servidor", "Proyector", "Otro"
];

export const PREDEFINED_BRANDS = ["HP", "Dell", "Lenovo", "Samsung", "Apple", "Acer", "Asus", "Epson", "Canon", "Sony", "LG", "Otro"];
export const PREDEFINED_MODELS: Record<string, string[]> = {
    "HP": ["Pavilion", "Spectre", "Envy", "LaserJet", "ProDesk"],
    "Dell": ["XPS", "Inspiron", "Alienware", "Optiplex", "Latitude"],
    "Lenovo": ["ThinkPad", "IdeaPad", "Yoga", "Legion", "ThinkCentre"],
    "Samsung": ["Galaxy S", "Galaxy Note", "Galaxy Tab", "QLED TV", "Odyssey"],
    "Apple": ["MacBook Pro", "MacBook Air", "iPhone", "iPad", "iMac"],
};

export interface AutocompleteSuggestion {
  value: string;
  label: string;
}

export interface ClientEquipment {
  id: string;
  clientId: string;
  type: string;
  brand: string;
  model: string;
  serial: string;
  location?: string;
  observations?: string;
  registeredAt: string;
}

export enum ScheduledServiceStatus {
  Pending = 'Pendiente', 
  InProgress = 'En Progreso', 
  Completed = 'Completado', 
  Cancelled = 'Cancelado',
  ConvertedToWorkOrder = 'Convertida en OT' 
}

export interface ScheduledService {
  id: string;
  clientId: string;
  clientEquipmentId: string; 
  clientEquipmentSerial?: string; 
  clientEquipmentDescription?: string; 
  serviceType: 'Diagnóstico' | 'Mantenimiento';
  scheduledDate: string; 
  description: string;
  status: ScheduledServiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  workOrderId?: string; 
  requiresHomeVisit?: boolean; // New field
}

// Interface for Table Columns
export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode); 
  render?: (item: T) => React.ReactNode; 
  className?: string; 
}

// Personal Budget Module Types
export enum PersonalExpenseCategory {
  Alimentacion = 'Alimentación',
  Transporte = 'Transporte',
  Vivienda = 'Vivienda',
  Salud = 'Salud',
  Educacion = 'Educación',
  Entretenimiento = 'Entretenimiento',
  RopaCalzado = 'Ropa y Calzado',
  AhorroInversion = 'Ahorro/Inversión',
  Deudas = 'Pago de Deudas',
  RegalosDonaciones = 'Regalos/Donaciones',
  CuidadoPersonal = 'Cuidado Personal',
  Mascotas = 'Mascotas',
  Viajes = 'Viajes',
  Impuestos = 'Impuestos',
  SuscripcionesServicios = 'Suscripciones y Servicios',
  Otro = 'Otro', // Changed from Otros to Otro to match user expectation for singular
}

export enum PersonalExpensePaymentStatus {
  Pagado = 'Pagado',
  Pendiente = 'Pendiente',
  Vencido = 'Vencido',
}

export enum RecurrencePeriod {
  Diario = 'Diario',
  Semanal = 'Semanal',
  Quincenal = 'Quincenal',
  Mensual = 'Mensual',
  Bimestral = 'Bimestral',
  Trimestral = 'Trimestral',
  Semestral = 'Semestral',
  Anual = 'Anual',
}

export interface PersonalExpense {
  id: string;
  userId: string;
  category: PersonalExpenseCategory | string; // Allow custom if 'Otro' is chosen and user types
  description: string;
  amount: number;
  expenseDate: string; // ISO date string
  dueDate?: string; // Optional ISO date string
  isRecurring: boolean;
  recurrencePeriod?: RecurrencePeriod;
  paymentStatus?: PersonalExpensePaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
// Default IVA percentage (e.g., 19%)
export const DEFAULT_IVA_PERCENTAGE = 19;
