
import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card.tsx';
import Button from '../../components/common/Button.tsx';
import Input from '../../components/common/Input.tsx';
import TextArea from '../../components/common/TextArea.tsx';
import Select from '../../components/common/Select.tsx';
import { useLocation, useNavigate } from 'react-router-dom'; 
import { createScheduledService, getClientEquipmentByClientId } from '../../services/apiService.ts';
import { AuthContext } from '../../contexts/AuthContext.tsx';
import { ScheduledServiceStatus, ClientEquipment } from '../../types.ts';

const GENERAL_TECHNICAL_VISIT_VALUE = 'GENERAL_TECHNICAL_VISIT';
const NEW_EQUIPMENT_VALUE = 'new';

interface ClientPortalRequestServicePageState {
    prefillEquipmentId?: string;
    equipmentDetails?: string; // Or a more structured ClientEquipment object
}

const ClientPortalRequestServicePage: React.FC = () => {
  const auth = React.useContext(AuthContext);
  const location = useLocation();
  const routeState = location.state as ClientPortalRequestServicePageState | undefined;
  const navigate = useNavigate(); 

  const [clientEquipmentOptions, setClientEquipmentOptions] = useState<{value: string, label: string}[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [contactPreference, setContactPreference] = useState('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEquipmentDetails, setNewEquipmentDetails] = useState({ type: '', brand: '', model: '', serial: '' });


  useEffect(() => {
    const fetchEquipment = async () => {
        if (auth?.user?.id) {
            try {
                const equipment = await getClientEquipmentByClientId(auth.user.id);
                const baseOptions = [
                    { value: '', label: 'Seleccione una opción...' },
                    ...equipment.map(eq => ({
                        value: eq.id,
                        label: `${eq.type} ${eq.brand} ${eq.model} (S/N: ${eq.serial})`
                    })),
                    { value: GENERAL_TECHNICAL_VISIT_VALUE, label: 'Solicitar visita técnica / revisión general (sin equipo específico)' },
                    { value: NEW_EQUIPMENT_VALUE, label: 'Servicio para un equipo nuevo/no registrado aún' }
                ];
                setClientEquipmentOptions(baseOptions);

                if (routeState?.prefillEquipmentId) {
                    setSelectedEquipmentId(routeState.prefillEquipmentId);
                } else if (routeState?.equipmentDetails && !routeState.prefillEquipmentId) {
                  setSelectedEquipmentId(NEW_EQUIPMENT_VALUE);
                }

            } catch (error) {
                console.error("Error fetching client equipment options:", error);
            }
        }
    };
    fetchEquipment();
  }, [auth?.user?.id, routeState]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.user?.id) {
        alert("Debe estar logueado para solicitar un servicio.");
        return;
    }
    if (!selectedEquipmentId) {
        alert("Por favor, seleccione una opción para el servicio.");
        return;
    }
    if (selectedEquipmentId === NEW_EQUIPMENT_VALUE && (!newEquipmentDetails.type || !newEquipmentDetails.brand || !newEquipmentDetails.serial)) {
        alert("Si es un equipo nuevo, por favor complete Tipo, Marca y Serial.");
        return;
    }
    if (!problemDescription.trim()) {
        alert("Por favor, describa el problema o el servicio requerido.");
        return;
    }

    setIsSubmitting(true);
    try {
      let equipmentIdForService: string;
      let serviceDescription = problemDescription;
      let notes = `Preferencia de contacto: ${contactPreference}.`;

      if (selectedEquipmentId === NEW_EQUIPMENT_VALUE) {
        equipmentIdForService = 'TEMP_NEW_EQUIPMENT'; // Placeholder, backend might create equipment
        const newEquipDesc = `NUEVO EQUIPO: ${newEquipmentDetails.type} ${newEquipmentDetails.brand} ${newEquipmentDetails.model || '(Sin modelo)'} (S/N: ${newEquipmentDetails.serial})`;
        serviceDescription = `${problemDescription} --- Detalles equipo nuevo: ${newEquipDesc}`;
        notes += ` --- Detalles equipo nuevo: ${newEquipDesc}`;
      } else if (selectedEquipmentId === GENERAL_TECHNICAL_VISIT_VALUE) {
        equipmentIdForService = 'GENERAL_TECHNICAL_VISIT'; // Placeholder for general visit
        serviceDescription = `Visita técnica general: ${problemDescription}`;
      } else {
        equipmentIdForService = selectedEquipmentId;
      }

      const serviceData = {
        clientId: auth.user.id,
        clientEquipmentId: equipmentIdForService,
        serviceType: selectedEquipmentId === GENERAL_TECHNICAL_VISIT_VALUE ? 'Diagnóstico' : 'Diagnóstico' as 'Diagnóstico' | 'Mantenimiento', // Or derive from problemDescription
        scheduledDate: new Date().toISOString().split('T')[0],
        description: serviceDescription,
        status: ScheduledServiceStatus.Pending,
        notes: notes,
        requiresHomeVisit: selectedEquipmentId === GENERAL_TECHNICAL_VISIT_VALUE ? true : undefined, // Default to home visit for general requests, undefined otherwise unless specified
      };

      await createScheduledService(serviceData);
      alert('Solicitud de servicio enviada con éxito. Nos pondremos en contacto pronto.');
      navigate('/client-portal/work-orders'); 
    } catch (error) {
        console.error("Error submitting service request:", error);
        alert("Hubo un error al enviar su solicitud. Por favor, intente más tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewEquipmentDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEquipmentDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const showNewEquipmentForm = selectedEquipmentId === NEW_EQUIPMENT_VALUE;

  return (
    <div className="p-4 sm:p-6">
       <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Solicitar Nuevo Servicio</h1>
        <p className="text-slate-600 dark:text-slate-400">Describa el problema con su equipo o la visita técnica que necesita y envíe una solicitud.</p>
      </header>

      <Card title="Detalles de la Solicitud">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Select
            label="Tipo de Solicitud / Equipo*"
            options={clientEquipmentOptions}
            value={selectedEquipmentId}
            onChange={(e) => setSelectedEquipmentId(e.target.value)}
            required
            containerClassName="mb-0"
          />

          {showNewEquipmentForm && (
            <Card title="Detalles del Nuevo Equipo" className="mt-4 !p-4 border-dashed border-slate-300 dark:border-slate-600">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Por favor, complete los detalles de su nuevo equipo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Tipo de Equipo*" name="type" value={newEquipmentDetails.type} onChange={handleNewEquipmentDetailsChange} required />
                <Input label="Marca*" name="brand" value={newEquipmentDetails.brand} onChange={handleNewEquipmentDetailsChange} required />
                <Input label="Modelo" name="model" value={newEquipmentDetails.model} onChange={handleNewEquipmentDetailsChange} />
                <Input label="Serial*" name="serial" value={newEquipmentDetails.serial} onChange={handleNewEquipmentDetailsChange} required />
              </div>
            </Card>
          )}

          <TextArea
            label="Descripción del Problema o Servicio Requerido*"
            name="problemDescription"
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            rows={5}
            placeholder={
                selectedEquipmentId === GENERAL_TECHNICAL_VISIT_VALUE
                ? "Ej: Necesito una revisión general de mi conexión a internet, evaluar un problema en mi oficina..."
                : "Ej: Mi laptop no enciende, la impresora atasca el papel, necesito un mantenimiento preventivo para mi PC..."
            }
            required
          />

          <Select
            label="Preferencia de Contacto*"
            options={[
              { value: 'email', label: 'Correo Electrónico' },
              { value: 'phone', label: 'Teléfono (Llamada)' },
              { value: 'whatsapp', label: 'WhatsApp' },
            ]}
            value={contactPreference}
            onChange={(e) => setContactPreference(e.target.value)}
            required
            containerClassName="mb-0"
          />

          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={() => navigate('/client-portal')}>Cancelar</Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto" isLoading={isSubmitting}>
                {isSubmitting ? 'Enviando Solicitud...' : 'Enviar Solicitud de Servicio'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ClientPortalRequestServicePage;
