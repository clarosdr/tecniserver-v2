
import React, { useState, useEffect } from 'react';
import { Client, ClientCategory } from '../../types';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import TextArea from '../common/TextArea'; 

interface ClientFormProps {
  initialData?: Client | null;
  onSubmit: (data: Omit<Client, 'id' | 'registeredAt'> | Client) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  apiError?: string | null; // To display API errors like duplicate fiscal ID
}

const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting, apiError }) => {
  const [formData, setFormData] = useState<Omit<Client, 'id' | 'registeredAt'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    fiscalId: '', 
    communicationPreferences: [],
    clientCategory: ClientCategory.Individual, 
    ...(initialData ? { ...initialData } : {}) 
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone,
        address: initialData.address || '',
        fiscalId: initialData.fiscalId, 
        communicationPreferences: initialData.communicationPreferences || [],
        clientCategory: initialData.clientCategory || ClientCategory.Individual,
      });
    } else {
      setFormData({
        name: '', email: '', phone: '', address: '', fiscalId: '',
        communicationPreferences: [], clientCategory: ClientCategory.Individual,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCommsPreferenceChange = (preference: 'SMS' | 'Email' | 'WhatsApp' | 'Push') => {
    setFormData(prev => {
      const currentPrefs = prev.communicationPreferences || [];
      if (currentPrefs.includes(preference)) {
        return { ...prev, communicationPreferences: currentPrefs.filter(p => p !== preference) };
      } else {
        return { ...prev, communicationPreferences: [...currentPrefs, preference] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fiscalId) {
        alert("El ID Fiscal (Cc. o NIT) es obligatorio."); // Basic client-side check
        return;
    }
    if (initialData) {
        onSubmit({ ...initialData, ...formData }); 
    } else {
        onSubmit(formData); 
    }
  };

  const clientCategoryOptions = Object.values(ClientCategory).map(category => ({
    value: category,
    label: category,
  }));


  const commsOptions: ('SMS' | 'Email' | 'WhatsApp' | 'Push')[] = ['SMS', 'Email', 'WhatsApp', 'Push'];


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {apiError && <p className="text-red-500 dark:text-red-400 text-sm mb-4 text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-md">{apiError}</p>}
      <Input name="name" label="Nombre Completo*" value={formData.name} onChange={handleChange} required />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input name="email" type="email" label="Correo Electrónico*" value={formData.email} onChange={handleChange} required />
        <Input name="phone" label="Teléfono*" value={formData.phone} onChange={handleChange} required />
      </div>
      <TextArea name="address" label="Dirección" value={formData.address || ''} onChange={handleChange} rows={2} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input name="fiscalId" label="ID Fiscal (Cc. o NIT)*" value={formData.fiscalId} onChange={handleChange} required />
        <Select name="clientCategory" label="Categoría de Cliente*" value={formData.clientCategory} onChange={handleChange} options={clientCategoryOptions} required/>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Preferencias de Comunicación</label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {commsOptions.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-primary rounded border-slate-300 dark:border-slate-600 focus:ring-primary dark:focus:ring-primary-light"
                checked={formData.communicationPreferences?.includes(opt)}
                onChange={() => handleCommsPreferenceChange(opt)}
              />
              <span className="ml-2 text-slate-700 dark:text-slate-200">{opt}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Actualizar Cliente' : 'Crear Cliente'}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;