
import React, { useState, useEffect, useContext, useCallback } from 'react';
import Card from '../../components/common/Card.tsx';
import Button from '../../components/common/Button.tsx';
import Table from '../../components/common/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner.tsx';
import { ClientEquipment, TableColumn } from '../../types';
import { getClientEquipmentByClientId } from '../../services/apiService.ts';
import { AuthContext } from '../../contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import { DeviceTabletIcon, PlusIcon } from '../../constants';

const ClientPortalEquipmentPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [equipmentList, setEquipmentList] = useState<ClientEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClientEquipment = useCallback(async () => {
    if (auth?.user?.id && auth.user.role === 'Client') {
      setIsLoading(true);
      try {
        const data = await getClientEquipmentByClientId(auth.user.id);
        setEquipmentList(data);
      } catch (error) {
        console.error("Error fetching client equipment:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false); // Not a client or no user ID
    }
  }, [auth?.user?.id, auth?.user?.role]);

  useEffect(() => {
    fetchClientEquipment();
  }, [fetchClientEquipment]);

  const handleRequestServiceForEquipment = (equipment: ClientEquipment) => {
    navigate('/client-portal/request-service', { state: { prefillEquipmentId: equipment.id, equipmentDetails: `${equipment.type} ${equipment.brand} ${equipment.model} (S/N: ${equipment.serial})` } });
  };

  const columns: TableColumn<ClientEquipment>[] = [
    { header: 'Tipo', accessor: 'type' },
    { header: 'Marca', accessor: 'brand' },
    { header: 'Modelo', accessor: 'model' },
    { header: 'Serial', accessor: 'serial', className: 'font-medium' },
    { header: 'Ubicación', accessor: 'location' },
    { header: 'Observaciones', accessor: 'observations', className: 'text-xs max-w-xs truncate' },
    {
      header: 'Acciones',
      accessor: (item) => (
        <Button size="sm" variant="primary" onClick={() => handleRequestServiceForEquipment(item)}>
          Solicitar Servicio
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner text="Cargando tus equipos..." className="mt-10" />;
  }

  if (!auth?.user || auth.user.role !== 'Client') {
    return (
      <Card title="Acceso Denegado">
        <p className="text-red-500">Debes iniciar sesión como cliente para ver esta página.</p>
      </Card>
    );
  }

  return (
    <div>
      <header className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <DeviceTabletIcon className="h-8 w-8 mr-3 text-primary dark:text-primary-light" />
            Mis Equipos Registrados
            </h1>
            <p className="text-slate-600 dark:text-slate-400">Visualiza tus equipos y solicita servicio para ellos.</p>
        </div>
        <Button
            onClick={() => navigate('/client-portal/request-service')}
            leftIcon={<PlusIcon className="h-5 w-5"/>}
            className="w-full sm:w-auto"
        >
          Solicitar Servicio para Equipo Nuevo
        </Button>
      </header>

      {equipmentList.length > 0 ? (
        <Card>
          <Table columns={columns} data={equipmentList} />
        </Card>
      ) : (
        <Card>
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            No tienes equipos registrados actualmente. Puedes solicitar servicio para un equipo nuevo.
          </p>
        </Card>
      )}
       <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Nota: Para registrar un nuevo equipo o modificar la información de uno existente, por favor comunícate directamente con el taller.
        </p>
    </div>
  );
};

export default ClientPortalEquipmentPage;
