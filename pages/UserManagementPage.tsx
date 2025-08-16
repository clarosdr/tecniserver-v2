


import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { UserRole, User, TableColumn, Permission } from '../types';
import { getInternalUsers, createInternalUser, updateInternalUser, deleteInternalUser, getDefaultPermissionsForRole } from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface UserFormState extends Omit<User, 'id' | 'lastLogin' | 'status' | 'permissions'> {
  id?: string;
  confirmPassword?: string;
  permissions: Permission[];
}

const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [Permission.VIEW_DASHBOARD]: 'Ver Dashboard Principal',
  [Permission.VIEW_APP_GUIDE]: 'Ver Guía de la App',
  [Permission.MANAGE_PERSONAL_BUDGET]: 'Gestionar Presupuesto Personal',
  [Permission.VIEW_WORK_ORDERS_ALL_AREAS]: 'Ver Todas las Órdenes de Trabajo',
  [Permission.CREATE_WORK_ORDERS]: 'Crear Órdenes de Trabajo',
  [Permission.EDIT_WORK_ORDERS_ANY]: 'Editar Cualquier Orden de Trabajo',
  [Permission.EDIT_WORK_ORDERS_ASSIGNED]: 'Editar OTs Asignadas/Propias',
  [Permission.DELETE_WORK_ORDERS]: 'Eliminar Órdenes de Trabajo',
  [Permission.APPROVE_BUDGETS_STAFF]: 'Aprobar Presupuestos (Staff)',
  [Permission.MANAGE_WORK_ORDER_STATUS_AREA]: 'Cambiar Estado/Área de OT',
  [Permission.NOTIFY_CLIENT_READY_PICKUP]: 'Notificar Cliente OT Lista',
  [Permission.NOTIFY_CLIENT_STORAGE]: 'Notificar Cliente Almacenamiento OT',
  [Permission.MARK_OT_DELIVERED]: 'Marcar OT como Entregada',
  [Permission.MOVE_OT_TO_STORAGE]: 'Mover OT a Bodega',
  [Permission.GENERATE_OT_TICKET]: 'Generar Tickets de OT',
  [Permission.VIEW_SCHEDULED_SERVICES_ALL]: 'Ver Todos los Servicios Programados',
  [Permission.CREATE_SCHEDULED_SERVICES]: 'Crear Servicios Programados',
  [Permission.EDIT_SCHEDULED_SERVICES]: 'Editar Servicios Programados',
  [Permission.DELETE_SCHEDULED_SERVICES]: 'Eliminar Servicios Programados',
  [Permission.CONVERT_SCHEDULED_SERVICE_TO_OT]: 'Convertir Servicio Programado a OT',
  [Permission.VIEW_CLIENTS_LIST]: 'Ver Lista de Clientes',
  [Permission.VIEW_CLIENT_DETAILS]: 'Ver Detalles de Cliente',
  [Permission.CREATE_CLIENTS]: 'Crear Clientes',
  [Permission.EDIT_CLIENTS]: 'Editar Clientes',
  [Permission.DELETE_CLIENTS]: 'Eliminar Clientes',
  [Permission.MANAGE_CLIENT_EQUIPMENT]: 'Gestionar Equipos de Cliente',
  [Permission.VIEW_INVENTORY]: 'Ver Inventario',
  [Permission.CREATE_INVENTORY_ITEMS]: 'Crear Ítems de Inventario',
  [Permission.EDIT_INVENTORY_ITEMS]: 'Editar Ítems de Inventario',
  [Permission.DELETE_INVENTORY_ITEMS]: 'Eliminar Ítems de Inventario',
  [Permission.ADJUST_INVENTORY_STOCK]: 'Ajustar Stock de Inventario',
  [Permission.VIEW_ACCOUNTING]: 'Ver Contabilidad',
  [Permission.CREATE_TRANSACTIONS]: 'Crear Transacciones Manuales',
  [Permission.GENERATE_ACCOUNTING_REPORTS]: 'Generar Informes Contables',
  [Permission.MANAGE_USERS_INTERNAL]: 'Gestionar Usuarios Internos (Roles y Permisos)',
  [Permission.VIEW_SETTINGS_AI]: 'Ver Configuración IA',
  [Permission.MANAGE_CLIENT_PORTAL_SETTINGS]: 'Gestionar Configuración Portal Cliente',
  // Client Portal permissions are not typically assigned to internal staff directly here
  [Permission.VIEW_CLIENT_PORTAL_DASHBOARD]: 'Ver Dashboard Portal Cliente (Acceso Conceptual)',
  [Permission.VIEW_CLIENT_PORTAL_PROFILE]: 'Ver Perfil Portal Cliente (Acceso Conceptual)',
  [Permission.MANAGE_CLIENT_PORTAL_EQUIPMENT]: 'Gestionar Equipos Portal Cliente (Acceso Conceptual)',
  [Permission.VIEW_CLIENT_PORTAL_WORK_ORDERS]: 'Ver OTs Portal Cliente (Acceso Conceptual)',
  [Permission.REQUEST_CLIENT_PORTAL_SERVICE]: 'Solicitar Servicio Portal Cliente (Acceso Conceptual)',
  [Permission.VIEW_CLIENT_PORTAL_HISTORY]: 'Ver Historial Portal Cliente (Acceso Conceptual)',
};


const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<UserFormState>({
    username: '',
    email: '',
    role: UserRole.Technician,
    password: '',
    confirmPassword: '',
    permissions: [],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getInternalUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenUserModal = (user?: User) => {
    setFormError(null);
    if (user) {
      setEditingUser(user);
      setUserFormData({
        id: user.id,
        username: user.username,
        email: user.email || '',
        role: user.role,
        password: '',
        confirmPassword: '',
        permissions: user.permissions || [],
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        username: '',
        email: '',
        role: UserRole.Technician,
        password: '',
        confirmPassword: '',
        permissions: getDefaultPermissionsForRole(UserRole.Technician), // Default for new user
      });
    }
    setIsUserModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
    setFormError(null);
  }

  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "role") {
        const newRole = value as UserRole;
        setUserFormData(prev => ({ 
            ...prev, 
            role: newRole,
            // When role changes for a new user or if explicitly desired for editing:
            permissions: editingUser ? prev.permissions : getDefaultPermissionsForRole(newRole)
        }));
    } else {
        setUserFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePermissionChange = (permission: Permission, checked: boolean) => {
    setUserFormData(prev => {
        const newPermissions = checked
            ? [...prev.permissions, permission]
            : prev.permissions.filter(p => p !== permission);
        return { ...prev, permissions: Array.from(new Set(newPermissions)) }; // Ensure unique
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!userFormData.username || !userFormData.role) {
      setFormError("Nombre de usuario y rol son requeridos.");
      setIsSubmitting(false);
      return;
    }

    if (editingUser) {
      if (userFormData.password && userFormData.password !== userFormData.confirmPassword) {
        setFormError("Las nuevas contraseñas no coinciden.");
        setIsSubmitting(false);
        return;
      }
      try {
        await updateInternalUser(editingUser.id, {
            username: userFormData.username,
            email: userFormData.email,
            role: userFormData.role,
            password: userFormData.password || undefined,
            permissions: userFormData.permissions,
        });
        fetchUsers();
        handleCloseModal();
      } catch (error: any) {
        setFormError(error.message || "Error al actualizar usuario.");
      }
    } else {
      if (!userFormData.password || userFormData.password !== userFormData.confirmPassword) {
        setFormError("Contraseña es requerida y debe coincidir.");
        setIsSubmitting(false);
        return;
      }
      try {
        await createInternalUser({
          username: userFormData.username,
          email: userFormData.email,
          role: userFormData.role,
          password: userFormData.password,
          permissions: userFormData.permissions,
        });
        fetchUsers();
        handleCloseModal();
      } catch (error: any) {
        setFormError(error.message || "Error al crear usuario.");
      }
    }
    setIsSubmitting(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer.")) {
        setIsSubmitting(true);
        try {
            await deleteInternalUser(userId);
            fetchUsers();
        } catch (error: any) {
            alert(error.message || "Error al eliminar usuario.");
        } finally {
            setIsSubmitting(false);
        }
    }
  };

  const userColumns: TableColumn<User>[] = [
    { header: 'Username', accessor: 'username', className: 'font-medium' },
    { header: 'Email', accessor: 'email' },
    { header: 'Rol', accessor: 'role' },
    { header: 'Permisos', accessor: (item) => item.permissions?.length || 0, className: 'text-center'},
    { header: 'Último Login', accessor: (item) => item.lastLogin ? new Date(item.lastLogin).toLocaleString() : 'N/A' },
    { header: 'Estado', accessor: 'status' },
    {
      header: 'Acciones',
      accessor: (item: User) => (
        <div className="space-x-2">
          <Button size="sm" variant="ghost" onClick={() => handleOpenUserModal(item)}>Editar</Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteUser(item.id)} disabled={isSubmitting}>Eliminar</Button>
        </div>
      ),
    },
  ];
  
  const rolesData: { id: UserRole; name: string; description: string; }[] = [
    { id: UserRole.Admin, name: 'Administrador', description: 'Acceso completo al sistema.' },
    { id: UserRole.Technician, name: 'Técnico', description: 'Gestiona órdenes de trabajo y utiliza inventario.' },
    { id: UserRole.Receptionist, name: 'Recepcionista', description: 'Atención al cliente, creación de OTs.' },
    { id: UserRole.Accountant, name: 'Contador', description: 'Acceso a módulos financieros.' },
    { id: UserRole.HomeServiceTechnician, name: 'Técnico Domicilios', description: 'Gestiona servicios a domicilio.' },
  ];

  const roleColumns: TableColumn<typeof rolesData[0]>[] = [
    { header: 'Rol', accessor: 'name' },
    { header: 'Descripción', accessor: 'description' },
  ];

  const internalUserRoleOptions = Object.values(UserRole)
    .filter(role => role !== UserRole.Client)
    .map(role => ({ value: role, label: role }));

  const allPermissionKeys = Object.values(Permission).filter(p => !p.startsWith('VIEW_CLIENT_PORTAL') && !p.startsWith('MANAGE_CLIENT_PORTAL') && !p.startsWith('REQUEST_CLIENT_PORTAL'));


  if (isLoading) {
    return <LoadingSpinner text="Cargando usuarios..." className="mt-20"/>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Gestión de Usuarios y Roles</h1>

      <Card title="Usuarios del Sistema" actions={<Button onClick={() => handleOpenUserModal()}>Crear Nuevo Usuario</Button>}>
        <Table columns={userColumns} data={users} emptyStateMessage="No hay usuarios internos registrados."/>
      </Card>

      <Card title="Roles del Sistema">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Los roles definen un conjunto base de permisos. Los permisos individuales pueden ser ajustados por usuario.
        </p>
        <Table columns={roleColumns} data={rolesData} />
      </Card>

      {isUserModalOpen && (
        <Modal isOpen={isUserModalOpen} onClose={handleCloseModal} title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"} size="lg">
          <form onSubmit={handleSaveUser} className="space-y-4">
            {formError && <p className="text-red-500 text-sm p-2 bg-red-100 dark:bg-red-900/30 rounded-md">{formError}</p>}
            <Input label="Nombre de Usuario*" name="username" value={userFormData.username} onChange={handleUserFormChange} required />
            <Input label="Email (Opcional)" name="email" type="email" value={userFormData.email || ''} onChange={handleUserFormChange} />
            <Select label="Rol Base*" name="role" value={userFormData.role} onChange={handleUserFormChange} options={internalUserRoleOptions} required />
            
            <fieldset className="border border-slate-300 dark:border-slate-600 p-3 rounded-md">
                <legend className="text-sm font-medium text-slate-700 dark:text-slate-200 px-1">Permisos Específicos</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 max-h-60 overflow-y-auto mt-2">
                    {allPermissionKeys.map(permKey => (
                        <label key={permKey} className="flex items-center space-x-2 text-sm">
                            <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-primary rounded border-slate-300 dark:border-slate-500 focus:ring-primary"
                                checked={userFormData.permissions.includes(permKey)}
                                onChange={(e) => handlePermissionChange(permKey, e.target.checked)}
                            />
                            <span className="text-slate-700 dark:text-slate-300" title={permKey}>{PERMISSION_DESCRIPTIONS[permKey] || permKey}</span>
                        </label>
                    ))}
                </div>
            </fieldset>

            <Input label={editingUser ? "Nueva Contraseña (dejar en blanco para no cambiar)" : "Contraseña*"} name="password" type="password" value={userFormData.password || ''} onChange={handleUserFormChange} required={!editingUser} />
            <Input label={editingUser ? "Confirmar Nueva Contraseña" : "Confirmar Contraseña*"} name="confirmPassword" type="password" value={userFormData.confirmPassword || ''} onChange={handleUserFormChange} required={!editingUser || !!userFormData.password} />
            
            <div className="flex justify-end space-x-2 pt-3">
              <Button type="button" variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
                {editingUser ? "Actualizar Usuario" : "Crear Usuario"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UserManagementPage;
