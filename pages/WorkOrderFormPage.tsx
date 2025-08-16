
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Changed useHistory to useNavigate
import { WorkOrder, Client, ClientEquipment, ScheduledService } from '../types';
import { getWorkOrderById, createWorkOrder, updateWorkOrder, getClientById, getClientEquipmentByClientId } from '../services/apiService'; // Added getClientById, getClientEquipmentByClientId
import WorkOrderForm from '../components/workorders/WorkOrderForm.tsx';
import LoadingSpinner from '../components/common/LoadingSpinner.tsx';
import Button from '../components/common/Button.tsx';

interface WorkOrderFormPageState {
  scheduledServiceId?: string;
  clientId?: string;
  // clientName is available from clientDetails
  clientEquipmentId?: string;
  clientDetails?: Client; // Full client object
  equipmentDetails?: ClientEquipment; // Full equipment object
  scheduledServiceDetails?: ScheduledService; // Full service object
}

const WorkOrderFormPage: React.FC = () => {
  const { workOrderId } = useParams<{ workOrderId?: string }>();
  const navigate = useNavigate(); 
  const location = useLocation(); 
  const routeState = location.state as WorkOrderFormPageState | undefined; 

  const [formInitialData, setFormInitialData] = useState<WorkOrder | null>(null);
  const [formPrefillData, setFormPrefillData] = useState<Parameters<typeof WorkOrderForm>[0]['prefillData'] | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isEditing = Boolean(workOrderId);

  useEffect(() => {
    const initializeForm = async () => {
      setIsLoading(true);
      setApiError(null);
      setFormInitialData(null); 
      setFormPrefillData(null);

      try {
        if (isEditing && workOrderId) {
          const data = await getWorkOrderById(workOrderId);
          if (data) {
            // Ensure client phone is populated for existing WOs if not already there
            if (!data.clientPhone && data.clientId) {
                const clientInfo = await getClientById(data.clientId);
                data.clientPhone = clientInfo.phone;
            }
            setFormInitialData(data);
          } else {
            setApiError("No se encontró la orden de trabajo.");
          }
        } else if (routeState?.scheduledServiceId && routeState.clientId && routeState.clientEquipmentId && routeState.scheduledServiceDetails) {
          let client = routeState.clientDetails;
          let equipment = routeState.equipmentDetails;

          if (!client && routeState.clientId) {
            client = await getClientById(routeState.clientId);
          }
          
          if (!equipment && routeState.clientEquipmentId && routeState.clientId) {
             const clientEquipmentList = await getClientEquipmentByClientId(routeState.clientId);
             equipment = clientEquipmentList.find(e => e.id === routeState.clientEquipmentId);
          }

          if (client && equipment && routeState.scheduledServiceDetails) {
            setFormPrefillData({
              scheduledServiceId: routeState.scheduledServiceId,
              client: client, // Pass full client object
              equipment: equipment, // Pass full equipment object
              scheduledServiceDetails: routeState.scheduledServiceDetails,
            });
          } else {
            setApiError("No se pudieron cargar los datos para pre-llenar la OT desde el servicio programado.");
          }
        }
      } catch (err) {
        console.error("Error initializing work order form page:", err);
        setApiError("Error al cargar datos para el formulario.");
      } finally {
        setIsLoading(false);
      }
    };
    initializeForm();
  }, [workOrderId, isEditing, routeState]);

  const handleSubmit = async (data: WorkOrder) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      if (isEditing && formInitialData) {
        // Merge ensuring ID from formInitialData is preserved, and other fields come from `data`
        const updatedData = { ...formInitialData, ...data, id: formInitialData.id };
        await updateWorkOrder(formInitialData.id, updatedData);
      } else {
        // For new orders, WorkOrderForm provides a mostly complete structure.
        // We just need to ensure no ID or audit fields are passed to createWorkOrder
        const { id, createdAt, updatedAt, deliveryDate, clientName, clientPhone, ...createData } = data;
        
        if (!createData.clientId || !createData.equipmentType || !createData.equipmentBrand || !createData.equipmentModel || !createData.equipmentSerial || !createData.reportedFault) {
             throw new Error("Faltan campos obligatorios para crear la orden.");
        }
        await createWorkOrder(createData as Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt' | 'clientName' | 'clientPhone' | 'deliveryDate'>);
      }
      navigate('/work-orders', { replace: true }); 
    } catch (error: any) {
      console.error("Error submitting work order:", error);
      setApiError(error.message || "Error al procesar la orden.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/work-orders'); 
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full mt-20">
        <LoadingSpinner text={isEditing ? "Cargando orden de trabajo..." : "Preparando formulario..."} />
      </div>
    );
  }

  if (apiError && ((isEditing && !formInitialData) || (!isEditing && routeState && !formPrefillData))) {
    return (
        <div className="text-center mt-10">
            <p className="text-red-500 dark:text-red-400">{apiError}</p>
            <Button onClick={() => navigate('/work-orders')} className="mt-4">Volver a Órdenes</Button>
        </div>
    );
  }

  // Render form if:
  // 1. Not editing and no prefill (blank new form implicitly handled by WorkOrderForm defaults)
  // 2. Not editing and prefill data is ready
  // 3. Editing and initial data is loaded
  const canRenderForm = (!isEditing && !routeState) || 
                        (!isEditing && routeState && formPrefillData) || 
                        (isEditing && formInitialData);

  if (canRenderForm) {
    return (
      <div className="max-w-6xl mx-auto p-0 sm:p-2 md:p-4"> {/* Increased max-width for new layout */}
        {/* Header actions moved inside WorkOrderForm */}
        <WorkOrderForm
          initialData={formInitialData}
          prefillData={formPrefillData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          apiError={apiError}
          isEditing={isEditing}
        />
      </div>
    );
  }

  // Fallback if conditions aren't met, though ideally initializeForm handles errors leading to apiError display.
  return null; 
};

// Interface for WorkOrderFormProps matching its definition - kept for reference, but WorkOrderForm handles its own props now.
// interface WorkOrderFormProps {
//   initialData?: WorkOrder | null;
//   prefillData?: {
//     scheduledServiceId: string;
//     client: Client;
//     equipment: ClientEquipment;
//     scheduledServiceDetails: ScheduledService;
//   } | null;
//   onSubmit: (data: WorkOrder) => void;
//   onCancel: () => void;
//   isSubmitting?: boolean;
//   apiError?: string | null;
//   isEditing?: boolean; 
// }

export default WorkOrderFormPage;
