
import React, { useContext } from 'react';
import Card from '../../components/common/Card.tsx';
import Button from '../../components/common/Button.tsx';
import { Link, useNavigate } from 'react-router-dom'; // Changed useHistory to useNavigate
import { APP_NAME } from '../../constants.tsx';
import { AuthContext } from '../../contexts/AuthContext.tsx';
import { UserCircleIcon, BriefcaseIcon, WrenchScrewdriverIcon, PlusIcon as PlusIconFromConstants, ListBulletIcon, QuestionMarkCircleIcon as GuideIcon } from '../../constants.tsx';


const ClientPortalDashboardPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate(); // Changed from useHistory
  const clientName = auth?.user?.name || auth?.user?.username || 'Cliente';

  // Dummy data for demonstration
  const activeServices = [
    { id: 'S001', equipment: 'Laptop HP Pavilion', status: 'En Diagnóstico', date: '2024-07-25', workOrderId: 'OT-1025' },
    { id: 'S002', equipment: 'PC Gamer Alienware', status: 'Esperando Repuesto', date: '2024-07-22', workOrderId: 'OT-1022' },
  ];
  const notifications = [
    { id: 'N001', message: 'Presupuesto para Laptop HP Pavilion (OT-1025) está listo para aprobación.', type: 'budget' as 'budget' | 'info', linkTo: '/client-portal/work-orders', workOrderId: 'OT-1025' },
    { id: 'N002', message: 'Mantenimiento programado para su Impresora Epson L3150 el 2024-08-15.', type: 'info' as 'budget' | 'info' },
  ];

  const quickActions = [
    { label: 'Mi Información', path: '/client-portal/profile', icon: UserCircleIcon },
    { label: 'Mis Equipos', path: '/client-portal/equipment', icon: BriefcaseIcon },
    { label: 'Mis Servicios / OTs', path: '/client-portal/work-orders', icon: WrenchScrewdriverIcon },
    { label: 'Solicitar Nuevo Servicio', path: '/client-portal/request-service', icon: PlusIconFromConstants },
    { label: 'Historial de Servicios', path: '/client-portal/history', icon: ListBulletIcon },
    { label: 'Guía del Portal', path: '/app-guide', icon: GuideIcon }, // Using common app guide
  ];

  return (
    <div className="p-4 sm:p-6">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
          Bienvenido al Portal de Clientes, {clientName}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">Gestiona tus equipos y servicios de forma fácil y rápida.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions Card */}
        <Card title="Acciones Rápidas" className="shadow-lg lg:col-span-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map(action => (
              <Button
                key={action.path}
                as={Link}
                to={action.path}
                variant="secondary"
                className="w-full text-left justify-start"
                leftIcon={action.icon && <action.icon className="h-5 w-5 mr-2"/>}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Notifications Card */}
        <Card title="Notificaciones Importantes" className="shadow-lg lg:col-span-2">
          {notifications.length > 0 ? (
            <ul className="space-y-3 max-h-60 overflow-y-auto">
              {notifications.map(notif => (
                <li key={notif.id} className={`p-3 rounded-md ${notif.type === 'budget' ? 'bg-amber-50 dark:bg-amber-800/30 border-l-4 border-amber-500' : 'bg-sky-50 dark:bg-sky-800/30'}`}>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{notif.message}</p>
                  {notif.linkTo && (
                    <Link
                        to={notif.linkTo}
                        state={notif.workOrderId ? { highlightWorkOrderId: notif.workOrderId } : undefined }
                        className="text-xs text-primary hover:underline dark:text-primary-light"
                    >
                        Ver detalles &rarr;
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">No tienes notificaciones nuevas.</p>
          )}
        </Card>
      </div>

      {/* Active Services Card */}
      <div className="mt-8">
        <Card title="Servicios Activos en Taller" className="shadow-lg">
          {activeServices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Equipo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Estado</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Fecha Ingreso</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ID OT</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {activeServices.map(service => (
                    <tr key={service.id}
                        onClick={() => navigate('/client-portal/work-orders', { state: { highlightWorkOrderId: service.workOrderId } })}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-200">{service.equipment}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-200">{service.status}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{service.date}</td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-primary hover:underline dark:text-primary-light">{service.workOrderId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-5">No tienes servicios activos en este momento.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ClientPortalDashboardPage;
