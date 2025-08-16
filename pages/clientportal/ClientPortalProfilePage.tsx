
import React, { useContext } from 'react';
import Card from '../../components/common/Card';
import { AuthContext } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { UserCircleIcon } from '../../constants.tsx'; // Assuming this is a generic user icon

const InfoDisplay: React.FC<{ label: string; value?: string | string[] | null }> = ({ label, value }) => (
  <div className="mb-3">
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    <p className="text-md text-slate-700 dark:text-slate-200 break-words">
      {Array.isArray(value) ? value.join(', ') : value || 'No especificado'}
    </p>
  </div>
);

const ClientPortalProfilePage: React.FC = () => {
  const auth = useContext(AuthContext);
  const clientUser = auth?.user;

  if (!clientUser || clientUser.role !== 'Client') {
    return (
      <Card title="Error de Acceso">
        <p className="text-red-500 dark:text-red-400">No está autenticado como cliente o no se pudo cargar la información.</p>
        <Link to="/client-portal" className="text-primary hover:underline mt-2 block">Volver al inicio del portal</Link>
      </Card>
    );
  }

  // Using optional chaining for client-specific fields as User type is generic
  const name = clientUser.name || clientUser.username;
  const email = clientUser.email || 'No especificado';
  const fiscalId = clientUser.fiscalId || 'No especificado';
  // Add other client-specific fields from your Client type if they are in currentUser
  // For example: const phone = (clientUser as Client).phone || 'No especificado';
  // This requires casting or ensuring User type in AuthContext includes all needed Client fields.
  // For this example, we'll assume name, email, fiscalId are on the User object for clients.

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <UserCircleIcon className="h-8 w-8 mr-3 text-primary dark:text-primary-light" />
          Mi Información Personal
        </h1>
        <p className="text-slate-600 dark:text-slate-400">Aquí puedes ver tus datos registrados en nuestro sistema.</p>
      </header>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <InfoDisplay label="Nombre Completo" value={name} />
            <InfoDisplay label="Correo Electrónico" value={email} />
            <InfoDisplay label="ID Fiscal (C.C. o NIT)" value={fiscalId} />
            {/* Example for other fields if available on clientUser */}
            {/* <InfoDisplay label="Teléfono" value={(clientUser as any).phone} /> */}
            {/* <InfoDisplay label="Dirección" value={(clientUser as any).address} /> */}
            {/* <InfoDisplay label="Categoría de Cliente" value={(clientUser as any).clientCategory} /> */}
            {/* <InfoDisplay label="Preferencias de Comunicación" value={(clientUser as any).communicationPreferences} /> */}
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Si necesitas actualizar alguno de estos datos, por favor comunícate directamente con el taller.
        </p>
      </Card>
    </div>
  );
};

export default ClientPortalProfilePage;
