
import React from 'react';
import Card from '../../components/common/Card.tsx';
import { 
    QuestionMarkCircleIcon, 
    HomeIcon, 
    WrenchScrewdriverIcon, 
    UsersIcon, 
    ArchiveBoxIcon, 
    BanknotesIcon, 
    ComputerDesktopIcon,
    WalletIcon,
    CogIcon,
    UsersGearIcon,
    BriefcaseIcon,
    ListBulletIcon
} from '../../constants.tsx';
import { APP_NAME } from '../../constants.tsx';

const GuideItem: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0 mr-4 mt-1 text-primary dark:text-primary-light">{icon}</div>
        <div>
            <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200">{title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
                {children}
            </p>
        </div>
    </div>
);

const AppGuidePage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center">
          <QuestionMarkCircleIcon className="h-10 w-10 mr-3 text-primary dark:text-primary-light" />
          Guía de la Aplicación
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
          Bienvenido a la guía de {APP_NAME}. Aquí encontrarás información sobre cómo utilizar las principales funciones.
        </p>
      </header>
      
      <Card title="Para el Personal del Taller" icon={<UsersGearIcon className="h-6 w-6" />}>
        <div className="space-y-6">
            <GuideItem title="Dashboard" icon={<HomeIcon className="h-6 w-6" />}>
              El Dashboard te ofrece una vista rápida del estado actual del taller: órdenes de trabajo activas, diagnósticos pendientes, ítems con bajo stock y más.
            </GuideItem>
            <GuideItem title="Órdenes y Solicitudes" icon={<WrenchScrewdriverIcon className="h-6 w-6" />}>
              Aquí gestionas todo el ciclo de vida de una reparación. Desde las solicitudes de servicio de los clientes (pestaña 'Solicitudes') hasta la entrega del equipo. Las órdenes se mueven por diferentes áreas: Entrada, Listo para Retirar, Entregado y Bodega.
            </GuideItem>
             <GuideItem title="Clientes" icon={<UsersIcon className="h-6 w-6" />}>
              Administra la información de tus clientes, consulta su historial de servicios, gestiona sus equipos registrados y revisa saldos pendientes.
            </GuideItem>
             <GuideItem title="Inventario" icon={<ArchiveBoxIcon className="h-6 w-6" />}>
              Controla tu stock de repuestos e insumos. Registra nuevos artículos, ajusta cantidades y mantente al tanto de los ítems con bajo stock.
            </GuideItem>
            <GuideItem title="Contabilidad y Caja" icon={<BanknotesIcon className="h-6 w-6" />}>
              Registra ingresos y egresos manuales, y visualiza un historial de todas las transacciones financieras, incluyendo las generadas automáticamente por compras de inventario o pagos de OTs.
            </GuideItem>
            <GuideItem title="Gestión de Usuarios y Configuración IA" icon={<CogIcon className="h-6 w-6" />}>
              En 'Gestión de Usuarios', puedes crear, editar y eliminar usuarios internos, asignando roles y permisos específicos. En 'Configuración IA', puedes acceder a herramientas asistidas por IA y configurar el portal de clientes.
            </GuideItem>
        </div>
      </Card>
      
      <Card title="Para Clientes (Portal de Clientes)" id="client-portal-section" icon={<ComputerDesktopIcon className="h-6 w-6" />}>
        <div className="space-y-6">
          <GuideItem title="Acceso al Portal" icon={<UsersIcon className="h-6 w-6" />}>
            Para iniciar sesión en el portal de clientes, utiliza tu correo electrónico registrado y tu número de identificación fiscal (C.C. o NIT) como contraseña en el campo de "Contraseña o ID Fiscal".
          </GuideItem>
           <GuideItem title="Dashboard del Portal" icon={<HomeIcon className="h-6 w-6" />}>
            Tu página de inicio en el portal te muestra un resumen rápido: notificaciones importantes (como presupuestos listos), tus servicios actualmente en el taller y accesos directos a todas las funciones.
          </GuideItem>
           <GuideItem title="Mis Equipos y Solicitar Servicio" icon={<BriefcaseIcon className="h-6 w-6" />}>
            En 'Mis Equipos', puedes ver una lista de todos los equipos que has registrado con nosotros. Desde allí o desde 'Solicitar Servicio', puedes iniciar una nueva solicitud de reparación o mantenimiento para un equipo existente o uno nuevo.
          </GuideItem>
           <GuideItem title="Mis Servicios y Presupuestos" icon={<WrenchScrewdriverIcon className="h-6 w-6" />}>
            Consulta el estado actual de todas tus órdenes de trabajo. Si un presupuesto está listo, podrás verlo detalladamente. Para aprobarlo o discutirlo, por favor contacta directamente al taller por los medios indicados.
          </GuideItem>
           <GuideItem title="Historial" icon={<ListBulletIcon className="h-6 w-6" />}>
            Revisa un historial completo de todos los servicios que hemos realizado para ti, con detalles de la solución aplicada y los costos.
          </GuideItem>
        </div>
      </Card>

      <Card title="Funciones Comunes para Todos" icon={<WalletIcon className="h-6 w-6" />}>
        <div className="space-y-6">
          <GuideItem title="Presupuesto Personal" icon={<WalletIcon className="h-6 w-6" />}>
            Esta herramienta opcional te permite llevar un control de tus gastos personales, categorizarlos, establecer fechas de vencimiento y marcar pagos como recurrentes. Es una función independiente para ayudarte en tu organización financiera personal.
          </GuideItem>
        </div>
      </Card>

    </div>
  );
};

export default AppGuidePage;
