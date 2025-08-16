
import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types'; // Assuming UserRole is in types
import { UsersIcon, CogIcon, QuestionMarkCircleIcon, BriefcaseIcon, EyeIcon, ChartBarIcon } from '../../constants'; // Import appropriate icons


const ClientPortalManagementPage: React.FC = () => {
    const navigate = useNavigate();

    // Mock data - in a real app, this would come from an API
    const stats = {
        activePortalUsers: 125, // Example: mockClients.length could be used if available here
        serviceRequestsLast30Days: 15,
        budgetsManagedViaPortalLast30Days: 8,
    };

    const recentActivity = [
        { id: 'act1', user: 'Alice Wonderland', action: 'Aprobó presupuesto para OT-1025', time: 'Hace 15 mins', type: 'budget_approved' },
        { id: 'act2', user: 'Bob The Builder Inc.', action: 'Solicitó nuevo servicio para Laptop Dell XPS', time: 'Hace 1 hora', type: 'new_request' },
        { id: 'act3', user: 'Carlos EmpresaPlus', action: 'Visualizó estado de OT-1028', time: 'Hace 3 horas', type: 'view_status' },
        { id: 'act4', user: 'Diana Preferencial', action: 'Rechazó presupuesto para OT-1020 (Razón: Muy alto)', time: 'Hace 5 horas', type: 'budget_rejected' },
    ];

    const handleNavigateToUserManagement = () => {
        // Ideally, pass a filter state to UserManagementPage
        navigate('/user-management', { state: { filterRole: UserRole.Client } });
    };

    const handleNavigateToSettings = () => {
        // Ideally, navigate and scroll to a specific section
        navigate('/settings'); // Later, could be navigate('/settings#client-portal-config');
    };
     const handleNavigateToAppGuide = () => {
        navigate('/app-guide');
        // TODO: Implement scroll to #client-portal-section after navigation if possible with HashRouter
        // For now, direct navigation. User can manually find the section.
        // setTimeout(() => {
        // const element = document.getElementById('client-portal-section');
        // if (element) element.scrollIntoView({ behavior: 'smooth' });
        // }, 100);
    };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">
        Administración del Portal de Clientes
      </h1>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Clientes en Portal" icon={<UsersIcon className="h-7 w-7 text-blue-500"/>}>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.activePortalUsers}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total de clientes con acceso.</p>
        </Card>
        <Card title="Solicitudes (Portal)" icon={<BriefcaseIcon className="h-7 w-7 text-emerald-500"/>}>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.serviceRequestsLast30Days}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Últimos 30 días.</p>
        </Card>
        <Card title="Presupuestos Gestionados (Portal)" icon={<ChartBarIcon className="h-7 w-7 text-indigo-500"/>}>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.budgetsManagedViaPortalLast30Days}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Aprobados/Rechazados últ. 30 días.</p>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <Card title="Acciones Rápidas de Gestión">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={handleNavigateToUserManagement} leftIcon={<UsersIcon className="h-5 w-5"/>} variant="secondary" className="justify-start">
                Gestionar Usuarios Clientes
            </Button>
            <Button onClick={handleNavigateToSettings} leftIcon={<CogIcon className="h-5 w-5"/>} variant="secondary" className="justify-start">
                Configurar Portal
            </Button>
            <Button onClick={handleNavigateToAppGuide} leftIcon={<QuestionMarkCircleIcon className="h-5 w-5"/>} variant="secondary" className="justify-start">
                Ver Guía del Portal
            </Button>
             <Card className="!p-3 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700">
                <h4 className="text-sm font-semibold text-sky-700 dark:text-sky-300 mb-1 flex items-center">
                    <EyeIcon className="h-4 w-4 mr-1.5"/>Ver Portal como Cliente
                </h4>
                <p className="text-xs text-sky-600 dark:text-sky-400">
                    Cierre sesión y use credenciales de un cliente (Ej: <code className="bg-sky-100 dark:bg-sky-800 px-1 rounded">alice@example.com</code> / <code className="bg-sky-100 dark:bg-sky-800 px-1 rounded">AW123456XYZ</code>).
                </p>
            </Card>
        </div>
      </Card>

      {/* Recent Activity Log (Simulated) */}
      <Card title="Actividad Reciente en el Portal (Simulada)">
        {recentActivity.length > 0 ? (
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {recentActivity.map(activity => (
              <li key={activity.id} className="p-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{activity.user}: </span>
                    <span className="text-slate-600 dark:text-slate-300">{activity.action}</span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">{activity.time}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-4">No hay actividad reciente para mostrar.</p>
        )}
      </Card>
    </div>
  );
};

export default ClientPortalManagementPage;
