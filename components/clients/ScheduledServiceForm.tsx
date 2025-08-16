
import React, { useState, useEffect } from 'react';
import { ScheduledService, ScheduledServiceStatus, ClientEquipment } from '../../types';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Select from '../common/Select';
import Button from '../common/Button';

interface ScheduledServiceFormProps {
  clientEquipment: ClientEquipment;
  initialData?: ScheduledService | null;
  onSubmit: (data: Omit<ScheduledService, 'id'|'createdAt'|'updatedAt'|'clientId'|'clientEquipmentId' | 'clientEquipmentSerial' | 'clientEquipmentDescription'> | ScheduledService) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  apiError?: string | null;
}

const ScheduledServiceForm: React.FC<ScheduledServiceFormProps> = ({
  clientEquipment, initialData, onSubmit, onCancel, isSubmitting, apiError
}) => {
  const [formData, setFormData] = useState<Omit<ScheduledService, 'id'|'createdAt'|'updatedAt'|'clientId'|'clientEquipmentId' | 'clientEquipmentSerial' | 'clientEquipmentDescription'>>({
    serviceType: 'Mantenimiento',
    scheduledDate: new Date().toISOString().split('T')[0], // Default to today
    description: '',
    status: ScheduledServiceStatus.Pending,
    notes: '',
    requiresHomeVisit: false, // New field
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        serviceType: initialData.serviceType,
        scheduledDate: initialData.scheduledDate.split('T')[0], // Ensure only date part
        description: initialData.description,
        status: initialData.status,
        notes: initialData.notes || '',
        requiresHomeVisit: initialData.requiresHomeVisit || false, // Initialize new field
      });
    } else {
        // Default for new form
        setFormData({
            serviceType: 'Mantenimiento',
            scheduledDate: new Date().toISOString().split('T')[0],
            description: '',
            status: ScheduledServiceStatus.Pending,
            notes: '',
            requiresHomeVisit: false,
        });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
     if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.scheduledDate || !formData.description) {
        alert("Por favor, complete la fecha programada y la descripción.");
        return;
    }
    
    const dataToSubmit = initialData 
      ? { ...initialData, ...formData } 
      : formData; 

    onSubmit(dataToSubmit);
  };

  const serviceTypeOptions = [
    { value: 'Diagnóstico', label: 'Diagnóstico' },
    { value: 'Mantenimiento', label: 'Mantenimiento' },
  ];

  const statusOptions = Object.values(ScheduledServiceStatus).map(status => ({
    value: status,
    label: status,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {apiError && <p className="text-red-500 dark:text-red-400 text-sm mb-4 text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-md">{apiError}</p>}
      
      <p className="text-slate-700 dark:text-slate-200">
        Programando servicio para equipo: <span className="font-semibold">{clientEquipment.type} {clientEquipment.brand} {clientEquipment.model} (S/N: {clientEquipment.serial})</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
            name="serviceType"
            label="Tipo de Servicio*"
            value={formData.serviceType}
            onChange={handleChange}
            options={serviceTypeOptions}
            required
        />
        <Input
            name="scheduledDate"
            type="date"
            label="Fecha Programada*"
            value={formData.scheduledDate}
            onChange={handleChange}
            required
        />
      </div>
      
      <TextArea
        name="description"
        label="Descripción del Diagnóstico/Mantenimiento*"
        value={formData.description}
        onChange={handleChange}
        rows={3}
        required
      />
      
      <Select
        name="status"
        label="Estado Inicial*"
        value={formData.status}
        onChange={handleChange}
        options={statusOptions}
        required
      />

      <div className="flex items-center">
        <input
          type="checkbox"
          id="requiresHomeVisit"
          name="requiresHomeVisit"
          checked={formData.requiresHomeVisit}
          onChange={handleChange}
          className="h-4 w-4 text-primary rounded border-slate-300 dark:border-slate-600 focus:ring-primary"
        />
        <label htmlFor="requiresHomeVisit" className="ml-2 text-sm text-slate-700 dark:text-slate-200">
          ¿Requiere Visita a Domicilio?
        </label>
      </div>

      <TextArea
        name="notes"
        label="Notas Adicionales (Opcional)"
        value={formData.notes || ''}
        onChange={handleChange}
        rows={2}
      />
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Actualizar Servicio' : 'Programar Servicio'}
        </Button>
      </div>
    </form>
  );
};

export default ScheduledServiceForm;