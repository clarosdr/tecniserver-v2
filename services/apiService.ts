

import { WorkOrder, Client, InventoryItem, Transaction, Technician, WorkOrderStatus, BudgetItem, ClientCategory, PREDEFINED_BRANDS, PREDEFINED_MODELS, ClientEquipment, ScheduledService, ScheduledServiceStatus, PREDEFINED_EQUIPMENT_TYPES, WorkOrderArea, statusesByArea, PersonalExpense, PersonalExpenseCategory, PersonalExpensePaymentStatus, RecurrencePeriod, User, UserRole, Permission } from '../types.ts';
import { formatCurrencyCOP } from '../utils/formatting.ts'; 

// Simulate API delay
const delay = <T,>(data: T, ms = Math.random() * 700 + 300): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), ms));

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Default Permissions ---
const allPermissions = Object.values(Permission);
const defaultAdminPermissions: Permission[] = allPermissions;

const defaultTechnicianPermissions: Permission[] = [
  Permission.VIEW_DASHBOARD, Permission.VIEW_WORK_ORDERS_ALL_AREAS, Permission.EDIT_WORK_ORDERS_ASSIGNED,
  Permission.VIEW_CLIENTS_LIST, Permission.VIEW_INVENTORY, Permission.ADJUST_INVENTORY_STOCK,
  Permission.MANAGE_PERSONAL_BUDGET, Permission.VIEW_APP_GUIDE, Permission.APPROVE_BUDGETS_STAFF,
  Permission.GENERATE_OT_TICKET,
];
const defaultReceptionistPermissions: Permission[] = [
  Permission.VIEW_DASHBOARD, Permission.CREATE_WORK_ORDERS, Permission.VIEW_WORK_ORDERS_ALL_AREAS,
  Permission.VIEW_CLIENTS_LIST, Permission.CREATE_CLIENTS, Permission.EDIT_CLIENTS, // Receptionist can manage clients
  Permission.VIEW_INVENTORY, Permission.VIEW_SCHEDULED_SERVICES_ALL,
  Permission.CREATE_SCHEDULED_SERVICES, Permission.EDIT_SCHEDULED_SERVICES, Permission.CONVERT_SCHEDULED_SERVICE_TO_OT,
  Permission.MANAGE_PERSONAL_BUDGET, Permission.VIEW_APP_GUIDE, Permission.GENERATE_OT_TICKET,
];
const defaultAccountantPermissions: Permission[] = [
  Permission.VIEW_DASHBOARD, Permission.VIEW_ACCOUNTING, Permission.CREATE_TRANSACTIONS,
  Permission.GENERATE_ACCOUNTING_REPORTS, Permission.MANAGE_PERSONAL_BUDGET, Permission.VIEW_APP_GUIDE,
];
const defaultHomeServiceTechnicianPermissions: Permission[] = [
  ...defaultTechnicianPermissions,
  Permission.VIEW_SCHEDULED_SERVICES_ALL, // Can see services they might take
];

// --- Mock Internal Users ---
let mockInternalUsers: User[] = [
  { id: 'admin001', username: 'admin', password: 'adminpassword', role: UserRole.Admin, name: 'Administrador Principal', email: 'admin@tecniserver.pro', lastLogin: new Date(Date.now() - Math.random() * 100000000).toISOString(), status: 'Activo', permissions: defaultAdminPermissions },
  { id: 'tech001', username: 'carlos.perez', password: 'techpassword', role: UserRole.Technician, name: 'Carlos Pérez (Técnico)', email: 'c.perez@tecniserver.pro', lastLogin: new Date(Date.now() - Math.random() * 100000000).toISOString(), status: 'Activo', permissions: defaultTechnicianPermissions },
  { id: 'recep001', username: 'ana.gomez', password: 'receppassword', role: UserRole.Receptionist, name: 'Ana Gómez (Recepción)', email: 'a.gomez@tecniserver.pro', lastLogin: new Date(Date.now() - Math.random() * 100000000).toISOString(), status: 'Activo', permissions: defaultReceptionistPermissions },
  { id: 'acc001', username: 'juan.diaz', password: 'accpassword', role: UserRole.Accountant, name: 'Juan Diaz (Contador)', email: 'j.diaz@tecniserver.pro', lastLogin: new Date(Date.now() - Math.random() * 100000000).toISOString(), status: 'Inactivo', permissions: defaultAccountantPermissions },
  { id: 'hstech001', username: 'laura.v', password: 'hspassword', role: UserRole.HomeServiceTechnician, name: 'Laura Vargas (Domicilios)', email: 'l.vargas@tecniserver.pro', lastLogin: new Date(Date.now() - Math.random() * 100000000).toISOString(), status: 'Activo', permissions: defaultHomeServiceTechnicianPermissions },
];

// Mock Data for other entities
let mockWorkOrders: WorkOrder[] = [
  { 
    id: 'wo1', customId: 'OT-1001', clientId: 'c1', clientName: 'Alice Wonderland', 
    equipmentType: 'Laptop', equipmentBrand: 'HP', equipmentModel: 'Pavilion 15', equipmentSerial: 'SN123HP', 
    reportedFault: 'No enciende', externalNotes: 'El cliente menciona que se derramó café cerca.', accessories: 'Cargador original, sin mouse.', photos: [], 
    area: WorkOrderArea.Entrada, status: WorkOrderStatus.PendienteDiagnostico, priority: 'Urgente', 
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date().toISOString(), 
    budgetItems: [{ id: 'bi1', itemName: 'Diagnóstico Inicial', quantity: 1, unitPrice: 50000, isService: true, invoiceNotes: 'Diagnóstico completo.' }], 
    budgetApproved: false,
    scheduledMaintenanceDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], scheduledMaintenanceType: 'Limpieza interna y revisión general',
    paymentStatus: 'Pendiente', totalPaidAmount: 0, 
    warrantyExpiryDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0], 
    location: 'Oficina Principal Cliente'
  },
  { 
    id: 'wo2', customId: 'OT-1002', clientId: 'c2', clientName: 'Bob The Builder Inc.', 
    equipmentType: 'PC de Escritorio', equipmentBrand: 'Dell', equipmentModel: 'Optiplex 7070', equipmentSerial: 'SN456DELL', 
    reportedFault: 'Pantalla azul', externalNotes: 'Sucede al abrir programas pesados.', accessories: 'Teclado y mouse.', photos: [], 
    area: WorkOrderArea.Entrada, status: WorkOrderStatus.EnProgreso, priority: 'Normal', assignedTechnicianId: 'tech001', 
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date().toISOString(), 
    budgetItems: [{id: 'bi2', inventoryItemId: 'item1', itemName: 'SSD 512GB Kingston', quantity: 1, unitPrice: 250000, isService: false, invoiceNotes: 'SSD Kingston A400, S/N: XYZ123, Garantía 1 año'}],
    budgetApproved: true,
    paymentStatus: 'Pendiente', totalPaidAmount: 0,
    licenseExpiryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    location: 'Sede Central'
  },
  { 
    id: 'wo3', customId: 'OT-1003', clientId: 'c1', clientName: 'Alice Wonderland', 
    equipmentType: 'Smartphone', equipmentBrand: 'Samsung', equipmentModel: 'Galaxy S21', equipmentSerial: 'SN789SAM', 
    reportedFault: 'Batería no dura', externalNotes: 'Ya se cambió la batería hace un año.', accessories: 'Solo equipo, sin cargador.', photos: [], 
    area: WorkOrderArea.HistorialCompletados, status: WorkOrderStatus.Entregado, priority: 'Normal', 
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(), 
    budgetItems: [{id: 'bi3', itemName: 'Reemplazo de batería', quantity: 1, unitPrice: 80000, isService: true}], 
    budgetApproved: true,
    deliveryDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    paymentStatus: 'Pagado', totalPaidAmount: 80000,
    location: 'Domicilio Particular'
  },
  { 
    id: 'wo4', customId: 'OT-1004', clientId: 'c2', clientName: 'Bob The Builder Inc.', 
    equipmentType: 'Tablet', equipmentBrand: 'Lenovo', equipmentModel: 'Tab M10', equipmentSerial: 'SN012LEN', 
    reportedFault: 'No carga', externalNotes: 'El puerto de carga parece flojo.', accessories: 'Cable USB-C.', photos: [], 
    area: WorkOrderArea.Entrada, status: WorkOrderStatus.EsperandoAprobacion, priority: 'Urgente', 
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    paymentStatus: 'Pendiente', totalPaidAmount: 0,
    budgetItems: [{id: 'bi4', itemName: 'Puerto de carga Tablet', quantity: 1, unitPrice: 120000, isService: true}],
    budgetApproved: false, budgetNotes: 'Cliente contactado, pendiente de respuesta.',
    scheduledMaintenanceDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0], scheduledMaintenanceType: 'Revisión general tablet',
    location: 'Sucursal Norte'
  },
  { 
    id: 'wo5', customId: 'OT-1005', clientId: 'c3', clientName: 'Carlos EmpresaPlus', 
    equipmentType: 'Impresora', equipmentBrand: 'Epson', equipmentModel: 'L3150', equipmentSerial: 'SNEP567L3150', 
    reportedFault: 'Atascos de papel frecuentes.', externalNotes: 'Cliente indica que usa papel reciclado.', accessories: 'Cable de poder.', photos: [], 
    area: WorkOrderArea.ListoParaRetirar, status: WorkOrderStatus.Reparado, priority: 'Normal', 
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), updatedAt: new Date().toISOString(),
    budgetItems: [{id: 'bi5', itemName: 'Mantenimiento Impresora', quantity: 1, unitPrice: 90000, isService: true}],
    budgetApproved: true,
    paymentStatus: 'Pendiente', totalPaidAmount: 0,
    warrantyExpiryDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], 
    location: 'Punto de Venta Principal'
  },
  { 
    id: 'wo6', customId: 'OT-1006', clientId: 'c1', clientName: 'Alice Wonderland', 
    equipmentType: 'Laptop', equipmentBrand: 'HP', equipmentModel: 'Pavilion 15', equipmentSerial: 'SN123HP', 
    reportedFault: 'Teclado no funciona algunas teclas', externalNotes: 'Sucedió después de una limpieza.', accessories: 'Cargador', photos: [], 
    area: WorkOrderArea.ListoParaRetirar, status: WorkOrderStatus.Reparado, priority: 'Normal', 
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date().toISOString(), 
    budgetItems: [{id: 'bi6', itemName: 'Limpieza interna teclado', quantity: 1, unitPrice: 60000, isService: true}],
    budgetApproved: true,
    paymentStatus: 'Pagado', totalPaidAmount: 60000,
    location: 'Oficina Principal Cliente',
    scheduledServiceId: 'ss1' 
  },
];

let mockClients: Client[] = [
  { id: 'c1', name: 'Alice Wonderland', email: 'alice@example.com', phone: '555-1234', fiscalId: 'AW123456XYZ', clientCategory: ClientCategory.Individual, registeredAt: new Date().toISOString() },
  { id: 'c2', name: 'Bob The Builder Inc.', email: 'bob@example.com', phone: '555-5678', fiscalId: 'BTB987654ABC', clientCategory: ClientCategory.Empresa, registeredAt: new Date().toISOString() },
  { id: 'c3', name: 'Carlos EmpresaPlus', email: 'carlos.plus@example.com', phone: '555-1111', fiscalId: 'CPREMIUM001', clientCategory: ClientCategory.EmpresaPlus, registeredAt: new Date().toISOString() },
  { id: 'c4', name: 'Diana Preferencial', email: 'diana.pref@example.com', phone: '555-2222', fiscalId: 'DPREF002', clientCategory: ClientCategory.Preferencial, registeredAt: new Date().toISOString() },
  { id: 'c5', name: 'Eduardo Seleccional', email: 'edu.sel@example.com', phone: '555-3333', fiscalId: 'ESEL003', clientCategory: ClientCategory.Seleccional, registeredAt: new Date().toISOString() },
];

const defaultPurchaseDate = new Date(Date.now() - 30 * 86400000).toISOString(); 

let mockInventory: InventoryItem[] = [
  { id: 'item1', name: 'SSD 512GB Kingston', sku: 'SSD-KNG-512', category: 'Almacenamiento', space: 'Estante A-1', quantity: 10, minStockLevel: 5, price: 250000, costPrice: 180000, supplierId: 'prov1', purchaseInvoiceNumber: 'FC-SSD-001', purchaseDate: defaultPurchaseDate },
  { id: 'item2', name: 'RAM DDR4 8GB Corsair', sku: 'RAM-COR-DDR4-8', category: 'Memorias RAM', space: 'Cajón B-3', quantity: 5, minStockLevel: 3, price: 180000, costPrice: 130000, supplierId: 'prov2', purchaseInvoiceNumber: 'FC-RAM-002', purchaseDate: defaultPurchaseDate },
  { id: 'item3', name: 'Fuente Poder 500W EVGA', sku: 'PSU-EVG-500', category: 'Fuentes de Poder', space: 'Estante C-5', quantity: 2, minStockLevel: 2, price: 300000, costPrice: 220000, supplierId: 'prov_generic', purchaseInvoiceNumber: 'FC-PSU-003', purchaseDate: defaultPurchaseDate },
  { id: 'item4', name: 'Servicio Limpieza General PC', sku: 'SERV-CLEAN-PC', category: 'Servicios', space:'N/A', quantity: 999, minStockLevel: 0, price: 70000, costPrice: 10000, supplierId: 'serv_internal', purchaseInvoiceNumber: 'N/A', purchaseDate: new Date().toISOString() },
  { id: 'item5', name: 'Pasta Térmica Arctic MX-4', sku: 'PASTE-ARC-MX4', category: 'Insumos', space: 'Caja Pequeños-1', quantity: 20, minStockLevel: 10, price: 35000, costPrice: 15000, supplierId: 'prov1', purchaseInvoiceNumber: 'FC-PASTE-004', purchaseDate: defaultPurchaseDate },
];

let dynamicInventoryCategories = Array.from(new Set(mockInventory.map(item => item.category)));
let dynamicInventorySpaces = Array.from(new Set(mockInventory.map(item => item.space).filter(s => s && s !== 'N/A') as string[]));
let dynamicInventorySuppliers = Array.from(new Set(mockInventory.map(item => item.supplierId).filter(Boolean) as string[]));
if (!dynamicInventorySuppliers.includes('prov_generic')) dynamicInventorySuppliers.push('prov_generic');
if (!dynamicInventorySuppliers.includes('serv_internal')) dynamicInventorySuppliers.push('serv_internal');


let mockTransactions: Transaction[] = [
  { id: 'tr1', type: 'Ingreso', amount: 50000, description: 'Diagnóstico OT-1001', date: new Date(Date.now() - 1 * 86400000).toISOString(), workOrderId: 'wo1' },
  { id: 'tr2', type: 'Egreso', amount: 35000, description: 'Compra de insumos limpieza', date: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'tr3', type: 'Ingreso', amount: 80000, description: 'Pago completo OT-1003', date: new Date(Date.now() - 3 * 86400000).toISOString(), workOrderId: 'wo3' },
  { id: 'tr4', type: 'Ingreso', amount: 60000, description: 'Pago completo OT-1006', date: new Date(Date.now() - 2 * 86400000).toISOString(), workOrderId: 'wo6' },
];

let mockTechnicians: Technician[] = [
    { id: 'tech001', name: 'Carlos Pérez', specialization: 'Hardware' }, // Matched with User ID
    { id: 'tech002', name: 'Laura Gómez', specialization: 'Software y Redes' }, // Example if technicians are separate from users
];

let mockClientEquipment: ClientEquipment[] = [
    {id: 'ceq1', clientId: 'c1', type: 'Laptop', brand: 'HP', model: 'Pavilion 15', serial: 'SN123HP', location: 'Oficina Principal', observations: 'Equipo principal de Alice', registeredAt: new Date().toISOString()},
    {id: 'ceq2', clientId: 'c1', type: 'Smartphone', brand: 'Samsung', model: 'Galaxy S21', serial: 'SN789SAM', location: 'Personal', registeredAt: new Date().toISOString()},
    {id: 'ceq3', clientId: 'c2', type: 'PC de Escritorio', brand: 'Dell', model: 'Optiplex 7070', serial: 'SN456DELL', location: 'Recepción', observations: 'Equipo de recepción', registeredAt: new Date().toISOString()},
];

let mockScheduledServices: ScheduledService[] = [
    {id: 'ss1', clientId: 'c1', clientEquipmentId: 'ceq1', clientEquipmentSerial: 'SN123HP', clientEquipmentDescription: 'Laptop HP Pavilion 15', serviceType: 'Mantenimiento', scheduledDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], description: 'Limpieza interna preventiva y actualización de drivers.', status: ScheduledServiceStatus.ConvertedToWorkOrder, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), workOrderId: 'wo6' },
    {id: 'ss2', clientId: 'c2', clientEquipmentId: 'ceq3', clientEquipmentSerial: 'SN456DELL', clientEquipmentDescription: 'PC Dell Optiplex 7070', serviceType: 'Diagnóstico', scheduledDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], description: 'Revisar lentitud reportada por usuario de recepción.', status: ScheduledServiceStatus.Pending, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), workOrderId: undefined },
    {id: 'ss3', clientId: 'c1', clientEquipmentId: 'ceq2', clientEquipmentSerial: 'SN789SAM', clientEquipmentDescription: 'Samsung Galaxy S21', serviceType: 'Diagnóstico', scheduledDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], description: 'Pantalla parpadea a veces.', status: ScheduledServiceStatus.Pending, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), workOrderId: undefined },
];

let mockPersonalExpenses: PersonalExpense[] = [
    { id: 'pe1', userId: 'admin001', category: PersonalExpenseCategory.Alimentacion, description: 'Almuerzo reunión equipo', amount: 45000, expenseDate: new Date(Date.now() - 2 * 86400000).toISOString(), isRecurring: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), paymentStatus: PersonalExpensePaymentStatus.Pagado },
    { id: 'pe2', userId: 'admin001', category: PersonalExpenseCategory.Vivienda, description: 'Arriendo Apartamento', amount: 1200000, expenseDate: new Date(new Date().setDate(1)).toISOString(), dueDate: new Date(new Date().setDate(5)).toISOString(), isRecurring: true, recurrencePeriod: RecurrencePeriod.Mensual, paymentStatus: PersonalExpensePaymentStatus.Pendiente, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'pe3', userId: 'c1', category: PersonalExpenseCategory.Transporte, description: 'Gasolina Moto', amount: 30000, expenseDate: new Date(Date.now() - 1 * 86400000).toISOString(), isRecurring: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), paymentStatus: PersonalExpensePaymentStatus.Pagado },
    { id: 'pe4', userId: 'admin001', category: PersonalExpenseCategory.SuscripcionesServicios, description: 'Netflix', amount: 38900, expenseDate: new Date(new Date().setDate(15)).toISOString(), dueDate: new Date(new Date().setDate(15)).toISOString(), isRecurring: true, recurrencePeriod: RecurrencePeriod.Mensual, paymentStatus: PersonalExpensePaymentStatus.Pagado, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'pe5', userId: 'admin001', category: PersonalExpenseCategory.Salud, description: 'EPS Mes', amount: 150000, expenseDate: new Date(new Date().setDate(2)).toISOString(), dueDate: new Date(new Date().setDate(2)).toISOString(), isRecurring: true, recurrencePeriod: RecurrencePeriod.Mensual, paymentStatus: PersonalExpensePaymentStatus.Pendiente, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];


// For dynamic brands and models (simulation)
let dynamicBrands = [...PREDEFINED_BRANDS];
let dynamicModels: Record<string, string[]> = JSON.parse(JSON.stringify(PREDEFINED_MODELS)); // Deep copy
let dynamicEquipmentTypes = [...PREDEFINED_EQUIPMENT_TYPES];

// --- Internal User Authentication and Management ---
export const authenticateInternalUser = async (username: string, password?: string): Promise<User | null> => {
  const user = mockInternalUsers.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (user) {
    // Simulate updating lastLogin
    user.lastLogin = new Date().toISOString();
    user.status = 'Activo'; // Assume login makes user active
    return delay({ ...user }); // Return a copy
  }
  return delay(null);
};

export const getInternalUsers = async (): Promise<User[]> => {
  return delay([...mockInternalUsers]); // Return a copy
};

export const createInternalUser = async (userData: Omit<User, 'id' | 'lastLogin' | 'status'>): Promise<User> => {
  if (mockInternalUsers.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
    return Promise.reject(new Error(`El nombre de usuario '${userData.username}' ya existe.`));
  }
  if (userData.email && mockInternalUsers.some(u => u.email?.toLowerCase() === userData.email!.toLowerCase())) {
    return Promise.reject(new Error(`El email '${userData.email}' ya está en uso.`));
  }
  const newUser: User = {
    id: `usr_${generateId()}`,
    username: userData.username,
    role: userData.role,
    password: userData.password,
    email: userData.email,
    name: userData.name, // Ensure name is also passed if available
    permissions: userData.permissions || [], // Assign provided permissions or default to empty
    lastLogin: new Date().toISOString(),
    status: 'Activo',
  };
  mockInternalUsers.push(newUser);
  return delay({ ...newUser });
};

export const updateInternalUser = async (userId: string, userData: Partial<Omit<User, 'id' | 'lastLogin' | 'status'>>): Promise<User> => {
  const userIndex = mockInternalUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return Promise.reject(new Error(`Usuario con ID '${userId}' no encontrado.`));
  }
  const existingUser = mockInternalUsers[userIndex];

  // Check for username uniqueness if changed
  if (userData.username && userData.username.toLowerCase() !== existingUser.username.toLowerCase()) {
    if (mockInternalUsers.some(u => u.id !== userId && u.username.toLowerCase() === userData.username!.toLowerCase())) {
      return Promise.reject(new Error(`El nombre de usuario '${userData.username}' ya existe.`));
    }
  }
  // Check for email uniqueness if changed and provided
  if (userData.email && userData.email.toLowerCase() !== (existingUser.email || '').toLowerCase()) {
    if (mockInternalUsers.some(u => u.id !== userId && u.email?.toLowerCase() === userData.email!.toLowerCase())) {
      return Promise.reject(new Error(`El email '${userData.email}' ya está en uso.`));
    }
  }

  const updatedUser = { ...existingUser, ...userData };
  // Only update password if a new one is provided
  if (!userData.password) {
    delete updatedUser.password; // Keep old password if new one is not set
  }
  // Update permissions if provided
  if (userData.permissions) {
    updatedUser.permissions = userData.permissions;
  }

  mockInternalUsers[userIndex] = updatedUser;
  return delay({ ...updatedUser });
};

export const deleteInternalUser = async (userId: string): Promise<boolean> => {
  const initialLength = mockInternalUsers.length;
  mockInternalUsers = mockInternalUsers.filter(u => u.id !== userId);
  return delay(mockInternalUsers.length < initialLength);
};

// Helper to get default permissions for a role
export const getDefaultPermissionsForRole = (role: UserRole): Permission[] => {
    switch (role) {
        case UserRole.Admin: return defaultAdminPermissions;
        case UserRole.Technician: return defaultTechnicianPermissions;
        case UserRole.Receptionist: return defaultReceptionistPermissions;
        case UserRole.Accountant: return defaultAccountantPermissions;
        case UserRole.HomeServiceTechnician: return defaultHomeServiceTechnicianPermissions;
        default: return [];
    }
};


// --- Other API functions ---

export const simulateNotification = (
    message: string, 
    type: 'client' | 'admin' | 'technician' = 'client', 
    targetUserId?: string,
    options?: { adminToo?: boolean } // For client/technician notifications that admin should also see
) => {
    const targetType = type.toUpperCase();
    const targetInfo = targetUserId ? ` (Usuario: ${targetUserId})` : '';
    console.log(`SIMULACIÓN DE NOTIFICACIÓN (${targetType})${targetInfo}: ${message}`);

    let shouldNotifyAdmin = false;
    if (type === 'admin') {
        shouldNotifyAdmin = true;
    } else { 
        if (options?.adminToo) {
            shouldNotifyAdmin = true;
        }
    }

    if (shouldNotifyAdmin) {
        window.dispatchEvent(new CustomEvent('newAdminNotification', { detail: { message: `(${targetType}${targetInfo}) ${message}` } }));
    }
};

export const getDynamicEquipmentTypes = async (): Promise<string[]> => delay([...dynamicEquipmentTypes]);
export const addDynamicEquipmentType = async (typeName: string): Promise<string> => {
  if (!dynamicEquipmentTypes.some(t => t.toLowerCase() === typeName.toLowerCase())) {
    dynamicEquipmentTypes.push(typeName);
  }
  return delay(typeName);
};

export const getDynamicBrands = async (): Promise<string[]> => delay([...dynamicBrands]);
export const addDynamicBrand = async (brandName: string): Promise<string> => {
  const upperBrandName = brandName.toUpperCase();
  if (!dynamicBrands.some(b => b.toUpperCase() === upperBrandName)) {
    dynamicBrands.push(brandName);
    if (!dynamicModels[brandName]) {
        dynamicModels[brandName] = [];
    }
  }
  return delay(brandName);
};

export const getDynamicModelsForBrand = async (brandName: string): Promise<string[]> => {
  const brandKey = Object.keys(dynamicModels).find(k => k.toLowerCase() === brandName.toLowerCase());
  return delay(brandKey ? dynamicModels[brandKey] : []);
};

export const addDynamicModelForBrand = async (brandName: string, modelName: string): Promise<string> => {
  const brandKey = Object.keys(dynamicModels).find(k => k.toLowerCase() === brandName.toLowerCase());
  if (!brandKey) { 
    await addDynamicBrand(brandName); 
     if (!dynamicModels[brandName]) { 
        dynamicModels[brandName] = [];
    }
  }
  const targetBrandKey = brandKey || brandName;
  
  if (!dynamicModels[targetBrandKey].some(m => m.toLowerCase() === modelName.toLowerCase())) {
    dynamicModels[targetBrandKey].push(modelName);
  }
  return delay(modelName);
};


let nextWorkOrderNumericId = mockWorkOrders.length > 0 
    ? Math.max(1000, ...mockWorkOrders.map(wo => parseInt(wo.customId?.split('-')[1] || '0'))) + 1 
    : 1001; 

export const getNextWorkOrderCustomId = async (): Promise<string> => {
    return delay(`OT-${String(nextWorkOrderNumericId).padStart(4, '0')}`);
};

// Work Order Operations
export const getWorkOrders = async (): Promise<WorkOrder[]> => {
    return delay(mockWorkOrders.map(wo => ({...wo, clientName: mockClients.find(c=>c.id === wo.clientId)?.name || 'Desconocido'})));
}
export const getWorkOrderById = async (id: string): Promise<WorkOrder> => {
    const wo = mockWorkOrders.find(wo => wo.id === id);
    if (wo) {
        return delay({...wo, clientName: mockClients.find(c => c.id === wo.clientId)?.name || 'Desconocido'});
    }
    return Promise.reject(new Error(`WorkOrder with ID ${id} not found.`));
}

export const getWorkOrdersBySerial = async (serial: string): Promise<WorkOrder[]> => {
    if (!serial) return delay([]);
    return delay(mockWorkOrders.filter(wo => wo.equipmentSerial && wo.equipmentSerial.toLowerCase() === serial.toLowerCase()));
};

export const getWorkOrdersByBrandAndModel = async (brand: string, model: string): Promise<WorkOrder[]> => {
  if (!brand || !model) return delay([]);
  return delay(
    mockWorkOrders.filter(wo => 
      wo.equipmentBrand.toLowerCase() === brand.toLowerCase() && 
      wo.equipmentModel.toLowerCase() === model.toLowerCase()
    )
  );
};

export const getWorkOrdersByClientId = async (clientId: string): Promise<WorkOrder[]> => {
  return delay(
    mockWorkOrders
      .filter(wo => wo.clientId === clientId)
      .map(wo => ({ ...wo, clientName: mockClients.find(c => c.id === wo.clientId)?.name || 'Desconocido' }))
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
};

export const createWorkOrder = async (data: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt' | 'clientName' | 'deliveryDate' | 'area' | 'status'> & { area?: WorkOrderArea, status?: WorkOrderStatus }): Promise<WorkOrder> => {
  if (!data.equipmentSerial) {
    return Promise.reject(new Error(`El serial del equipo es obligatorio.`));
  }

  let customIdToUse = data.customId; 
  if (!customIdToUse || mockWorkOrders.some(wo => wo.customId === customIdToUse)) { 
    customIdToUse = `OT-${String(nextWorkOrderNumericId).padStart(4, '0')}`;
  }
  
  if (parseInt(customIdToUse.split('-')[1]) >= nextWorkOrderNumericId) {
    nextWorkOrderNumericId = parseInt(customIdToUse.split('-')[1]) + 1;
  }

  const newWorkOrder: WorkOrder = { 
    ...data, 
    id: generateId(), 
    customId: customIdToUse,
    area: data.scheduledServiceId ? WorkOrderArea.Entrada : (data.area || WorkOrderArea.Entrada), 
    status: data.scheduledServiceId ? WorkOrderStatus.PendienteDiagnostico : (data.status || WorkOrderStatus.PendienteDiagnostico), 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString(),
    externalNotes: data.externalNotes || '',
    accessories: data.accessories || '',
    photos: data.photos || [],
    budgetItems: data.budgetItems || [],
    budgetApproved: data.budgetApproved || false,
    budgetNotes: data.budgetNotes || '',
    equipmentType: data.equipmentType || 'Desconocido',
    equipmentBrand: data.equipmentBrand || 'Desconocido',
    equipmentModel: data.equipmentModel || 'Desconocido',
    scheduledMaintenanceDate: data.scheduledMaintenanceDate,
    scheduledMaintenanceType: data.scheduledMaintenanceType,
    paymentStatus: data.paymentStatus || 'Pendiente',
    totalPaidAmount: data.totalPaidAmount || 0,
    warrantyExpiryDate: data.warrantyExpiryDate,
    licenseExpiryDate: data.licenseExpiryDate,
    location: data.location,
    scheduledServiceId: data.scheduledServiceId,
  };
  mockWorkOrders.push(newWorkOrder);

  if (newWorkOrder.scheduledServiceId) {
    const serviceIndex = mockScheduledServices.findIndex(s => s.id === newWorkOrder.scheduledServiceId);
    if (serviceIndex !== -1) {
      mockScheduledServices[serviceIndex].status = ScheduledServiceStatus.ConvertedToWorkOrder;
      mockScheduledServices[serviceIndex].workOrderId = newWorkOrder.id;
      mockScheduledServices[serviceIndex].updatedAt = new Date().toISOString();
      const client = mockClients.find(c => c.id === newWorkOrder.clientId);
      const equipment = mockClientEquipment.find(eq => eq.id === mockScheduledServices[serviceIndex].clientEquipmentId);
      if (client && equipment) {
        simulateNotification(`Servicio programado para ${client.name} (${equipment.serial}) convertido a OT ${newWorkOrder.customId} en área ${newWorkOrder.area}.`, 'admin');
      }
    }
  }

  if (newWorkOrder.scheduledMaintenanceDate && newWorkOrder.scheduledMaintenanceType) {
    simulateNotification(`Nueva OT ${newWorkOrder.customId} creada con mantenimiento programado para ${mockClients.find(c=>c.id === newWorkOrder.clientId)?.name}.`, 'admin');
  }
  return delay(newWorkOrder);
};

export const updateWorkOrder = async (id: string, data: Partial<WorkOrder>): Promise<WorkOrder> => {
  const index = mockWorkOrders.findIndex(wo => wo.id === id);
  if (index === -1) return Promise.reject(new Error(`WorkOrder with ID ${id} not found for update.`));

  const oldWO = { ...mockWorkOrders[index] };
  const updatedWO: WorkOrder = {
    ...oldWO,
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  if (data.area && data.status && !statusesByArea[data.area].includes(data.status)) {
    console.warn(`Inconsistent update for OT ${id}: Status ${data.status} is not valid for Area ${data.area}. The form should prevent this.`);
  } else if (data.status && !data.area && !statusesByArea[oldWO.area].includes(data.status)) {
     console.warn(`Inconsistent status update for OT ${id}: Status ${data.status} is not valid for current Area ${oldWO.area} and no new area provided. The form should prevent this.`);
  }

  mockWorkOrders[index] = updatedWO;

  const areaChanged = updatedWO.area !== oldWO.area;
  const statusChanged = updatedWO.status !== oldWO.status;

  if (statusChanged && updatedWO.status === WorkOrderStatus.EsperandoAprobacion && !updatedWO.budgetApproved) {
    simulateNotification(`Cliente: Su OT ${updatedWO.customId} para ${updatedWO.equipmentBrand} ${updatedWO.equipmentModel} está lista. Por favor, contacte al taller para discutir y aprobar su presupuesto.`, 'client', updatedWO.clientId);
    simulateNotification(`OT ${updatedWO.customId} (${updatedWO.clientName}) cambió a 'Esperando Aprobación'. Cliente notificado.`, 'admin');
  } else if (areaChanged && statusChanged) {
    simulateNotification(`OT ${updatedWO.customId} movida al área: ${updatedWO.area} con estado: ${updatedWO.status}.`, 'admin');
  } else if (areaChanged) {
    simulateNotification(`OT ${updatedWO.customId} movida al área: ${updatedWO.area}. (Estado actual: ${updatedWO.status})`, 'admin');
  } else if (statusChanged) {
     simulateNotification(`OT ${updatedWO.customId} actualizada en área ${updatedWO.area}. Nuevo estado: ${updatedWO.status}.`, 'admin');
  }
  
  if ((updatedWO.status === WorkOrderStatus.Reparado || updatedWO.status === WorkOrderStatus.SinSolucion) &&
      ![WorkOrderStatus.Reparado, WorkOrderStatus.SinSolucion, WorkOrderStatus.Entregado, WorkOrderStatus.EnBodega].includes(oldWO.status)) {
    if (updatedWO.budgetItems) {
      for (const budgetItem of updatedWO.budgetItems) {
        if (!budgetItem.isService && budgetItem.inventoryItemId) {
          if (updatedWO.status === WorkOrderStatus.Reparado) { 
            await adjustStock(budgetItem.inventoryItemId, -budgetItem.quantity, true); 
          }
        }
      }
    }
  }

  if (updatedWO.status === WorkOrderStatus.Entregado && oldWO.status !== WorkOrderStatus.Entregado) {
    updatedWO.deliveryDate = new Date().toISOString();
    if (updatedWO.budgetItems) {
        for (const budgetItem of updatedWO.budgetItems) {
            if (!budgetItem.isService && budgetItem.inventoryItemId) {
                const inventoryItem = mockInventory.find(inv => inv.id === budgetItem.inventoryItemId);
                if (inventoryItem && inventoryItem.costPrice) {
                    await createTransaction({
                        type: 'Egreso',
                        amount: inventoryItem.costPrice * budgetItem.quantity,
                        description: `CMV OT ${updatedWO.customId}: ${budgetItem.itemName} (x${budgetItem.quantity})`,
                        date: updatedWO.deliveryDate || new Date().toISOString(),
                        workOrderId: updatedWO.id,
                    });
                }
            }
        }
    }
    if (!areaChanged && !statusChanged) { 
        simulateNotification(`OT ${updatedWO.customId} marcada como Entregada. Registrado CMV.`, 'admin');
    }
  }


  if (data.scheduledMaintenanceDate !== oldWO.scheduledMaintenanceDate || data.scheduledMaintenanceType !== oldWO.scheduledMaintenanceType) {
     if (updatedWO.scheduledMaintenanceDate && updatedWO.scheduledMaintenanceType) {
        simulateNotification(`Mantenimiento para OT ${updatedWO.customId} (${updatedWO.clientName}) actualizado.`, 'admin');
     }
  }
  if (data.paymentStatus && data.paymentStatus !== oldWO.paymentStatus) {
    simulateNotification(`Estado de pago para OT ${updatedWO.customId} (${updatedWO.clientName}) actualizado a: ${data.paymentStatus}.`, 'admin');
  }

  return delay(updatedWO);
};


export const deleteWorkOrder = async (id: string): Promise<boolean> => {
  const initialLength = mockWorkOrders.length;
  mockWorkOrders = mockWorkOrders.filter(wo => wo.id !== id);
  return delay(mockWorkOrders.length < initialLength);
};

// Client Budget Approval Functions
export const approveWorkOrderBudgetClient = async (workOrderId: string): Promise<WorkOrder> => {
  const index = mockWorkOrders.findIndex(wo => wo.id === workOrderId);
  if (index === -1) throw new Error("Orden de trabajo no encontrada.");
  
  mockWorkOrders[index].budgetApproved = true;
  mockWorkOrders[index].budgetNotes = 'Aprobado por cliente.'; // Simplified, actual approval is staff-handled
  if (mockWorkOrders[index].status === WorkOrderStatus.EsperandoAprobacion) {
    // Status change to EnProgreso will be handled by staff in the main WO page after client confirms with them
    // mockWorkOrders[index].status = WorkOrderStatus.EnProgreso; 
  }
  mockWorkOrders[index].updatedAt = new Date().toISOString();
  
  simulateNotification(`Cliente ${mockWorkOrders[index].clientName} indicó INTERÉS en aprobar el presupuesto para OT ${mockWorkOrders[index].customId}. Contactar para confirmar.`, 'admin');
  return delay(mockWorkOrders[index]);
};

export const rejectWorkOrderBudgetClient = async (workOrderId: string, reason: string): Promise<WorkOrder> => {
  const index = mockWorkOrders.findIndex(wo => wo.id === workOrderId);
  if (index === -1) throw new Error("Orden de trabajo no encontrada.");

  mockWorkOrders[index].budgetApproved = false; 
  mockWorkOrders[index].budgetNotes = `Cliente indicó RECHAZO de presupuesto. Razón: ${reason}. Contactar para discutir.`;
  mockWorkOrders[index].updatedAt = new Date().toISOString();
  
  simulateNotification(`Cliente ${mockWorkOrders[index].clientName} indicó RECHAZO del presupuesto para OT ${mockWorkOrders[index].customId}. Razón: ${reason}`, 'admin');
  return delay(mockWorkOrders[index]);
};


// Client Operations
export const getClients = async (): Promise<Client[]> => delay(mockClients);
export const getClientById = async (id: string): Promise<Client> => {
    const client = mockClients.find(c => c.id === id);
    if (client) return delay(client);
    return Promise.reject(new Error(`Client with ID ${id} not found.`));
}
export const authenticateClient = async (email: string, fiscalId: string, allClients?: Client[]): Promise<Client | null> => {
    const clientsToSearch = allClients || mockClients; 
    const client = clientsToSearch.find(c => c.email.toLowerCase() === email.toLowerCase() && c.fiscalId === fiscalId);
    return delay(client || null);
};


export const createClient = async (data: Omit<Client, 'id' | 'registeredAt'>): Promise<Client> => {
  if (!data.fiscalId) {
    return Promise.reject(new Error(`El ID Fiscal (Cc. o NIT) es obligatorio.`));
  }
  if (mockClients.some(client => client.fiscalId.toLowerCase() === data.fiscalId.toLowerCase())) {
    return Promise.reject(new Error(`El ID Fiscal (Cc. o NIT) '${data.fiscalId}' ya está registrado.`));
  }
  if (mockClients.some(client => client.email.toLowerCase() === data.email.toLowerCase())) {
    return Promise.reject(new Error(`El correo electrónico '${data.email}' ya está registrado.`));
  }
  const newClient: Client = { ...data, id: generateId(), registeredAt: new Date().toISOString() };
  mockClients.push(newClient);
  return delay(newClient);
};

export const updateClient = async (id: string, data: Partial<Client>): Promise<Client> => {
  const index = mockClients.findIndex(c => c.id === id);
  if (index === -1) return Promise.reject(new Error(`Client with ID ${id} not found for update.`));

  if (data.fiscalId && data.fiscalId !== mockClients[index].fiscalId) {
    if (!data.fiscalId) {
        return Promise.reject(new Error(`El ID Fiscal (Cc. o NIT) es obligatorio.`));
    }
    if (mockClients.some(client => client.id !== id && client.fiscalId.toLowerCase() === data.fiscalId!.toLowerCase())) {
        return Promise.reject(new Error(`El ID Fiscal (Cc. o NIT) '${data.fiscalId}' ya está registrado para otro cliente.`));
    }
  }
  if (data.email && data.email !== mockClients[index].email && mockClients.some(client => client.id !== id && client.email.toLowerCase() === data.email!.toLowerCase())) {
    return Promise.reject(new Error(`El correo electrónico '${data.email}' ya está registrado para otro cliente.`));
  }

  mockClients[index] = { ...mockClients[index], ...data };
  return delay(mockClients[index]);
};

// Inventory Operations
export const getInventoryItems = async (): Promise<InventoryItem[]> => delay(mockInventory);

export const createInventoryItem = async (data: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
  const newItem: InventoryItem = { ...data, id: generateId() };
  mockInventory.push(newItem);

  if (newItem.costPrice && newItem.costPrice > 0 && newItem.quantity > 0) {
    await createTransaction({
        type: 'Egreso',
        amount: newItem.costPrice * newItem.quantity,
        description: `Compra Inventario: ${newItem.name} (SKU: ${newItem.sku}) - Fact: ${newItem.purchaseInvoiceNumber}`,
        date: newItem.purchaseDate || new Date().toISOString(), 
        inventoryItemId: newItem.id,
    });
  }

  if (!dynamicInventoryCategories.some(cat => cat.toLowerCase() === data.category.toLowerCase())) {
    dynamicInventoryCategories.push(data.category);
    dynamicInventoryCategories.sort((a,b) => a.localeCompare(b));
  }
  if (data.space && data.space !== 'N/A' && !dynamicInventorySpaces.some(s => s.toLowerCase() === data.space!.toLowerCase())) {
    dynamicInventorySpaces.push(data.space);
    dynamicInventorySpaces.sort((a,b) => a.localeCompare(b));
  }
  if (data.supplierId && !dynamicInventorySuppliers.some(s => s.toLowerCase() === data.supplierId!.toLowerCase())) {
    dynamicInventorySuppliers.push(data.supplierId);
    dynamicInventorySuppliers.sort((a,b) => a.localeCompare(b));
  }
  return delay(newItem);
};
export const updateInventoryItem = async (id: string, data: Partial<InventoryItem>): Promise<InventoryItem> => {
  const index = mockInventory.findIndex(i => i.id === id);
  if (index === -1) return Promise.reject(new Error(`InventoryItem with ID ${id} not found for update.`));
  
  const updatedItem = { 
    ...mockInventory[index], 
    ...data,
    supplierId: data.supplierId || mockInventory[index].supplierId, 
    purchaseInvoiceNumber: data.purchaseInvoiceNumber || mockInventory[index].purchaseInvoiceNumber,
    purchaseDate: data.purchaseDate || mockInventory[index].purchaseDate,
  };
  mockInventory[index] = updatedItem;

  if (data.category && !dynamicInventoryCategories.some(cat => cat.toLowerCase() === data.category!.toLowerCase())) {
    dynamicInventoryCategories.push(data.category);
    dynamicInventoryCategories.sort((a,b) => a.localeCompare(b));
  }
  if (data.space && data.space !== 'N/A' && !dynamicInventorySpaces.some(s => s.toLowerCase() === data.space!.toLowerCase())) {
    dynamicInventorySpaces.push(data.space);
    dynamicInventorySpaces.sort((a,b) => a.localeCompare(b));
  }
  if (data.supplierId && !dynamicInventorySuppliers.some(s => s.toLowerCase() === data.supplierId!.toLowerCase())) {
    dynamicInventorySuppliers.push(data.supplierId);
    dynamicInventorySuppliers.sort((a,b) => a.localeCompare(b));
  }
  return delay(mockInventory[index]);
};

export const adjustStock = async (itemId: string, quantityChange: number, isSaleAdjustment: boolean = false): Promise<InventoryItem> => {
  const index = mockInventory.findIndex(i => i.id === itemId);
  if (index === -1) return Promise.reject(new Error(`InventoryItem with ID ${itemId} not found for stock adjustment.`));
  
  const item = mockInventory[index];
  if (item.quantity + quantityChange < 0) {
     return Promise.reject(new Error(`No se puede ajustar el stock de '${item.name}' en ${quantityChange}. Stock actual: ${item.quantity}. Resultaría en stock negativo.`));
  }
  
  item.quantity += quantityChange;
  console.log(`Stock de ${item.name} (ID: ${itemId}) ajustado en ${quantityChange}. Nuevo stock: ${item.quantity}`);

  if (quantityChange < 0 && !isSaleAdjustment && item.costPrice && item.costPrice > 0) {
    await createTransaction({
        type: 'Egreso',
        amount: item.costPrice * Math.abs(quantityChange),
        description: `Ajuste Negativo Stock (Pérdida/Daño): ${item.name} (SKU: ${item.sku})`,
        date: new Date().toISOString(),
        inventoryItemId: item.id,
    });
  }

  return delay(item);
};

export const getDynamicInventoryCategories = async (): Promise<string[]> => {
    return delay([...dynamicInventoryCategories].sort((a,b) => a.localeCompare(b)));
};
export const addDynamicInventoryCategory = async (categoryName: string): Promise<string> => {
  if (categoryName.trim() && !dynamicInventoryCategories.some(cat => cat.toLowerCase() === categoryName.toLowerCase())) {
    dynamicInventoryCategories.push(categoryName);
    dynamicInventoryCategories.sort((a,b) => a.localeCompare(b));
  }
  return delay(categoryName);
};

export const getDynamicInventorySpaces = async (): Promise<string[]> => {
    return delay([...dynamicInventorySpaces].sort((a,b) => a.localeCompare(b)));
};
export const addDynamicInventorySpace = async (spaceName: string): Promise<string> => {
    if (spaceName.trim() && spaceName !== 'N/A' && !dynamicInventorySpaces.some(s => s.toLowerCase() === spaceName.toLowerCase())) {
        dynamicInventorySpaces.push(spaceName);
        dynamicInventorySpaces.sort((a,b) => a.localeCompare(b));
    }
    return delay(spaceName);
};

export const getDynamicInventorySuppliers = async (): Promise<string[]> => {
    return delay([...dynamicInventorySuppliers].sort((a,b) => a.localeCompare(b)));
};
export const addDynamicInventorySupplier = async (supplierId: string): Promise<string> => {
    if (supplierId.trim() && !dynamicInventorySuppliers.some(s => s.toLowerCase() === supplierId.toLowerCase())) {
        dynamicInventorySuppliers.push(supplierId);
        dynamicInventorySuppliers.sort((a,b) => a.localeCompare(b));
    }
    return delay(supplierId);
};


// Transaction Operations
export const getTransactions = async (): Promise<Transaction[]> => delay(mockTransactions);
export const createTransaction = async (data: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const newTransaction: Transaction = { ...data, id: generateId() };
  mockTransactions.push(newTransaction);
  mockTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 


  if (data.workOrderId && data.type === 'Ingreso') {
    const woIndex = mockWorkOrders.findIndex(wo => wo.id === data.workOrderId);
    if (woIndex !== -1) {
        const wo = mockWorkOrders[woIndex];
        wo.totalPaidAmount = (wo.totalPaidAmount || 0) + data.amount;
        const totalBudget = wo.budgetItems?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
        if (wo.totalPaidAmount >= totalBudget) {
            wo.paymentStatus = 'Pagado';
        } else if (wo.totalPaidAmount > 0) {
            wo.paymentStatus = 'Parcial';
        }
    }
  }
  return delay(newTransaction);
};

// Technician Operations
export const getTechnicians = async (): Promise<Technician[]> => delay(mockTechnicians);


// Dashboard Data (Example)
export const getDashboardSummary = async (): Promise<any> => {
  return delay({
    activeWorkOrders: mockWorkOrders.filter(wo => wo.area === WorkOrderArea.Entrada || wo.area === WorkOrderArea.ListoParaRetirar && wo.status !== WorkOrderStatus.Entregado).length,
    pendingDiagnosis: mockWorkOrders.filter(wo => wo.status === WorkOrderStatus.PendienteDiagnostico && wo.area === WorkOrderArea.Entrada).length,
    pendingApproval: mockWorkOrders.filter(wo => wo.status === WorkOrderStatus.EsperandoAprobacion && !wo.budgetApproved).length,
    lowStockItems: mockInventory.filter(item => item.category !== 'Servicios' && item.quantity <= item.minStockLevel).length, 
    totalClients: mockClients.length,
    monthlyRevenue: mockTransactions.filter(t => t.type === 'Ingreso' && new Date(t.date).getMonth() === new Date().getMonth()).reduce((sum, t) => sum + t.amount, 0), 
  });
};


export interface PerformanceChartDataItem {
  name: string; 
  repairs: number;
  revenue: number;
  expenses: number;
}

export const getPerformanceDataForChart = async (
  range: 'daily' | 'weekly' | 'monthly'
): Promise<PerformanceChartDataItem[]> => {
  const allTransactions = mockTransactions; 
  const allWorkOrders = mockWorkOrders;   

  const today = new Date();
  let dataPoints: PerformanceChartDataItem[] = [];

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  if (range === 'daily') { 
    const daysOfWeekShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 6; i >= 0; i--) { 
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      targetDate.setHours(0, 0, 0, 0); 

      const dailyRepairs = allWorkOrders.filter(wo => {
        const woDate = new Date(wo.createdAt);
        return isSameDay(new Date(wo.updatedAt), targetDate) && [WorkOrderStatus.Reparado, WorkOrderStatus.Entregado, WorkOrderStatus.EnBodega].includes(wo.status); 
      }).length;

      const dailyRevenue = allTransactions.filter(t => {
        const tDate = new Date(t.date);
        return isSameDay(tDate, targetDate) && t.type === 'Ingreso';
      }).reduce((sum, t) => sum + t.amount, 0);

      const dailyExpenses = allTransactions.filter(t => {
        const tDate = new Date(t.date);
        return isSameDay(tDate, targetDate) && t.type === 'Egreso';
      }).reduce((sum, t) => sum + t.amount, 0);
      
      dataPoints.push({ name: daysOfWeekShort[targetDate.getDay()], repairs: dailyRepairs, revenue: dailyRevenue, expenses: dailyExpenses });
    }
  } else if (range === 'weekly') { 
    let currentDayOfWeek = today.getDay(); 
    if (currentDayOfWeek === 0) currentDayOfWeek = 7; 
    
    const mondayOfThisWeek = new Date(today);
    mondayOfThisWeek.setDate(today.getDate() - (currentDayOfWeek - 1));
    mondayOfThisWeek.setHours(0,0,0,0);

    const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    for (let i = 0; i < 7; i++) {
        const targetDate = new Date(mondayOfThisWeek);
        targetDate.setDate(mondayOfThisWeek.getDate() + i);

        const dailyRepairs = allWorkOrders.filter(wo => isSameDay(new Date(wo.updatedAt), targetDate) && [WorkOrderStatus.Reparado, WorkOrderStatus.Entregado, WorkOrderStatus.EnBodega].includes(wo.status)).length;
        const dailyRevenue = allTransactions
            .filter(t => isSameDay(new Date(t.date), targetDate) && t.type === 'Ingreso')
            .reduce((sum, t) => sum + t.amount, 0);
        const dailyExpenses = allTransactions
            .filter(t => isSameDay(new Date(t.date), targetDate) && t.type === 'Egreso')
            .reduce((sum, t) => sum + t.amount, 0);

        dataPoints.push({ name: daysOfWeek[i], repairs: dailyRepairs, revenue: dailyRevenue, expenses: dailyExpenses });
    }
  } else if (range === 'monthly') { 
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const targetDate = new Date(year, month, day);
      targetDate.setHours(0,0,0,0);
      
      const dailyRepairs = allWorkOrders.filter(wo => isSameDay(new Date(wo.updatedAt), targetDate) && [WorkOrderStatus.Reparado, WorkOrderStatus.Entregado, WorkOrderStatus.EnBodega].includes(wo.status)).length;
      const dailyRevenue = allTransactions
          .filter(t => isSameDay(new Date(t.date), targetDate) && t.type === 'Ingreso')
          .reduce((sum, t) => sum + t.amount, 0);
      const dailyExpenses = allTransactions
          .filter(t => isSameDay(new Date(t.date), targetDate) && t.type === 'Egreso')
          .reduce((sum, t) => sum + t.amount, 0);

      dataPoints.push({ name: `${day}`, repairs: dailyRepairs, revenue: dailyRevenue, expenses: dailyExpenses });
    }
  }
  return delay(dataPoints); 
};

export const sendReadyForPickupReminder = async (workOrderId: string, clientName: string, equipmentDesc: string): Promise<boolean> => {
  const message = `Recordatorio para ${clientName}: Su equipo (${equipmentDesc}, OT: ${mockWorkOrders.find(wo=>wo.id===workOrderId)?.customId}) está LISTO PARA RETIRAR.`;
  simulateNotification(message, 'client', mockWorkOrders.find(wo=>wo.id===workOrderId)?.clientId);
  return delay(true);
};

export const sendStorageReminder = async (workOrderId: string, clientName: string, equipmentDesc: string): Promise<boolean> => {
  const message = `Recordatorio para ${clientName}: Su equipo (${equipmentDesc}, OT: ${mockWorkOrders.find(wo=>wo.id===workOrderId)?.customId}) ha estado en bodega por un tiempo considerable. Por favor, contáctenos.`;
  simulateNotification(message, 'client', mockWorkOrders.find(wo=>wo.id===workOrderId)?.clientId);
  return delay(true);
};


export const sendPaymentReminder = async (clientId: string, workOrderId: string, method: 'Email' | 'WhatsApp' | 'SMS'): Promise<boolean> => {
  const client = mockClients.find(c => c.id === clientId);
  const workOrder = mockWorkOrders.find(wo => wo.id === workOrderId);

  if (client && workOrder) {
    const totalBudget = workOrder.budgetItems?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
    const amountDue = totalBudget - (workOrder.totalPaidAmount || 0);
    
    if (amountDue > 0) {
      const message = `Recordatorio de Pago para ${client.name} via ${method}: Saldo pendiente de ${formatCurrencyCOP(amountDue)} para la OT ${workOrder.customId}.`;
      simulateNotification(message, 'client', clientId);
      return delay(true);
    }
  }
  return delay(false);
};

export const sendMaintenanceReminder = async (clientId: string, workOrderId: string, maintenanceType: string, dueDate: string): Promise<boolean> => {
  const client = mockClients.find(c => c.id === clientId);
  const workOrder = mockWorkOrders.find(wo => wo.id === workOrderId);

  if (client && workOrder) {
    const message = `Recordatorio de Mantenimiento para ${client.name}: Su equipo (${workOrder.equipmentBrand} ${workOrder.equipmentModel}, Serial: ${workOrder.equipmentSerial}) tiene un mantenimiento programado (${maintenanceType}) para el ${new Date(dueDate).toLocaleDateString()}.`;
    simulateNotification(message, 'client', clientId);
    return delay(true);
  }
  return delay(false);
};

// Client Equipment Operations
export const getClientEquipmentByClientId = async (clientId: string): Promise<ClientEquipment[]> => {
  return delay(mockClientEquipment.filter(eq => eq.clientId === clientId));
};

export const createClientEquipment = async (data: Omit<ClientEquipment, 'id' | 'registeredAt'>): Promise<ClientEquipment> => {
  if (!data.serial) {
    return Promise.reject(new Error("El número de serie es obligatorio para el equipo."));
  }
  const newEquipment: ClientEquipment = {
    ...data,
    id: generateId(),
    registeredAt: new Date().toISOString(),
  };
  mockClientEquipment.push(newEquipment);
  return delay(newEquipment);
};

export const updateClientEquipment = async (id: string, data: Partial<ClientEquipment>): Promise<ClientEquipment> => { 
  const index = mockClientEquipment.findIndex(eq => eq.id === id);
  if (index === -1) return Promise.reject(new Error(`ClientEquipment with ID ${id} not found for update.`));
  mockClientEquipment[index] = { ...mockClientEquipment[index], ...data };
  return delay(mockClientEquipment[index]);
};

export const deleteClientEquipment = async (id: string): Promise<boolean> => {
  const initialLength = mockClientEquipment.length;
  mockClientEquipment = mockClientEquipment.filter(eq => eq.id !== id);
  mockScheduledServices = mockScheduledServices.filter(ss => ss.clientEquipmentId !== id);
  return delay(mockClientEquipment.length < initialLength);
};


// Scheduled Service Operations
export const getScheduledServicesByClientId = async (clientId: string): Promise<ScheduledService[]> => {
  return delay(mockScheduledServices
    .filter(ss => ss.clientId === clientId)
    .map(ss => {
        const equipment = mockClientEquipment.find(eq => eq.id === ss.clientEquipmentId);
        return {
            ...ss,
            clientEquipmentSerial: equipment?.serial,
            clientEquipmentDescription: equipment ? `${equipment.type} ${equipment.brand} ${equipment.model}` : 'Equipo Desconocido',
            workOrderId: ss.workOrderId 
        };
    })
  );
};

export const getPendingScheduledServices = async (): Promise<ScheduledService[]> => {
  return delay(mockScheduledServices
    .filter(ss => ss.status === ScheduledServiceStatus.Pending)
    .map(ss => {
        const client = mockClients.find(c => c.id === ss.clientId);
        const equipment = mockClientEquipment.find(eq => eq.id === ss.clientEquipmentId);
        return {
            ...ss,
            //@ts-ignore
            clientName: client?.name || 'Cliente Desconocido',
            clientEquipmentSerial: equipment?.serial,
            clientEquipmentDescription: equipment ? `${equipment.type} ${equipment.brand} ${equipment.model}` : 'Equipo Desconocido',
        };
    })
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
  );
};


export const createScheduledService = async (data: Omit<ScheduledService, 'id' | 'createdAt' | 'updatedAt' | 'clientEquipmentSerial' | 'clientEquipmentDescription'>): Promise<ScheduledService> => {
  const newService: ScheduledService = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workOrderId: data.workOrderId, 
  };
  mockScheduledServices.push(newService);
  const client = mockClients.find(c => c.id === newService.clientId);
  const equipment = mockClientEquipment.find(eq => eq.id === newService.clientEquipmentId);
  if(client && equipment) {
    simulateNotification(`Nuevo servicio (${newService.serviceType}) programado para ${client.name} - ${equipment.serial} el ${new Date(newService.scheduledDate).toLocaleDateString()}.`, 'admin');
  }
  return delay(newService);
};

export const updateScheduledService = async (id: string, data: Partial<ScheduledService>): Promise<ScheduledService> => { 
  const index = mockScheduledServices.findIndex(ss => ss.id === id);
  if (index === -1) return Promise.reject(new Error(`ScheduledService with ID ${id} not found for update.`));
  
  const oldStatus = mockScheduledServices[index].status;

  const { id: dataIdToExclude, ...restOfData } = data; 
  
  mockScheduledServices[index] = { 
    ...mockScheduledServices[index], 
    ...restOfData, 
    updatedAt: new Date().toISOString() 
  };
  const updatedService = mockScheduledServices[index];
  
  const client = mockClients.find(c => c.id === updatedService.clientId);
  const equipment = mockClientEquipment.find(eq => eq.id === updatedService.clientEquipmentId);

  if(client && equipment) {
    if (oldStatus !== updatedService.status || data.scheduledDate || data.description) { 
         simulateNotification(`Servicio programado para ${client.name} - ${equipment.serial} actualizado. ${data.status ? `Nuevo estado: ${updatedService.status}.` : ''} ${data.scheduledDate ? `Nueva fecha: ${new Date(updatedService.scheduledDate).toLocaleDateString()}.` : ''}`, 'admin');
    }
  }
  return delay(updatedService);
};

export const deleteScheduledService = async (id: string): Promise<boolean> => {
  const initialLength = mockScheduledServices.length;
  const serviceToDelete = mockScheduledServices.find(ss => ss.id === id);
  mockScheduledServices = mockScheduledServices.filter(ss => ss.id !== id);
  
  if (serviceToDelete) {
    const client = mockClients.find(c => c.id === serviceToDelete.clientId);
    const equipment = mockClientEquipment.find(eq => eq.id === serviceToDelete.clientEquipmentId);
    if (client && equipment) {
        simulateNotification(`Servicio programado (${serviceToDelete.serviceType}) para ${client.name} - ${equipment.serial} del ${new Date(serviceToDelete.scheduledDate).toLocaleDateString()} ha sido eliminado.`, 'admin');
    }
  }
  return delay(mockScheduledServices.length < initialLength);
};

// Personal Expense Operations
export const getPersonalExpenses = async (userId: string): Promise<PersonalExpense[]> => {
  return delay(mockPersonalExpenses.filter(pe => pe.userId === userId).sort((a,b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()));
};

export const createPersonalExpense = async (data: Omit<PersonalExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId'>, userId: string): Promise<PersonalExpense> => {
  const newExpense: PersonalExpense = {
    ...data,
    id: generateId(),
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockPersonalExpenses.push(newExpense);
  return delay(newExpense);
};

export const updatePersonalExpense = async (id: string, data: Partial<Omit<PersonalExpense, 'id' | 'userId' | 'createdAt'>>, userId: string): Promise<PersonalExpense> => {
  const index = mockPersonalExpenses.findIndex(pe => pe.id === id && pe.userId === userId);
  if (index === -1) return Promise.reject(new Error(`PersonalExpense with ID ${id} not found for user ${userId} for update.`));
  mockPersonalExpenses[index] = { ...mockPersonalExpenses[index], ...data, updatedAt: new Date().toISOString() };
  return delay(mockPersonalExpenses[index]);
};

export const deletePersonalExpense = async (id: string, userId: string): Promise<boolean> => {
  const initialLength = mockPersonalExpenses.length;
  mockPersonalExpenses = mockPersonalExpenses.filter(pe => !(pe.id === id && pe.userId === userId));
  return delay(mockPersonalExpenses.length < initialLength);
};

// Expose mocks to window for temporary access in AccountingPage (remove in real app)
if (typeof window !== 'undefined') {
    (window as any).mockWorkOrders = mockWorkOrders;
    (window as any).mockInventory = mockInventory;
}