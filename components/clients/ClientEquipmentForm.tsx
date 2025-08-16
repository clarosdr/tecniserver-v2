
import React, { useState, useEffect } from 'react';
import { ClientEquipment, AutocompleteSuggestion, PREDEFINED_EQUIPMENT_TYPES } from '../../types';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Button from '../common/Button';
import AutocompleteInput from '../common/AutocompleteInput';
import { 
    getDynamicEquipmentTypes, addDynamicEquipmentType,
    getDynamicBrands, addDynamicBrand,
    getDynamicModelsForBrand, addDynamicModelForBrand
} from '../../services/apiService';

interface ClientEquipmentFormProps {
  clientId: string;
  initialData?: ClientEquipment | null;
  onSubmit: (data: Omit<ClientEquipment, 'id' | 'registeredAt' | 'clientId'> | ClientEquipment) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  apiError?: string | null;
}

const ClientEquipmentForm: React.FC<ClientEquipmentFormProps> = ({ 
    clientId, initialData, onSubmit, onCancel, isSubmitting, apiError 
}) => {
  const [formData, setFormData] = useState<Omit<ClientEquipment, 'id' | 'registeredAt' | 'clientId'>>({
    type: '',
    brand: '',
    model: '',
    serial: '',
    location: '',
    observations: '',
    ...(initialData ? { ...initialData } : {})
  });

  const [equipmentTypeDisplay, setEquipmentTypeDisplay] = useState(initialData?.type || '');
  const [brandDisplay, setBrandDisplay] = useState(initialData?.brand || '');
  const [modelDisplay, setModelDisplay] = useState(initialData?.model || '');

  const [equipmentTypesList, setEquipmentTypesList] = useState<string[]>(PREDEFINED_EQUIPMENT_TYPES);
  const [brandsList, setBrandsList] = useState<string[]>([]);
  const [modelsList, setModelsList] = useState<string[]>([]);

  useEffect(() => {
    const loadDropdownData = async () => {
        const [currentTypes, currentBrands] = await Promise.all([
            getDynamicEquipmentTypes(),
            getDynamicBrands()
        ]);
        setEquipmentTypesList(currentTypes);
        setBrandsList(currentBrands);
        if (initialData?.brand) {
            loadModelsForBrand(initialData.brand);
        }
    };
    loadDropdownData();
  }, [initialData]);


  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type,
        brand: initialData.brand,
        model: initialData.model,
        serial: initialData.serial,
        location: initialData.location || '',
        observations: initialData.observations || '',
      });
      setEquipmentTypeDisplay(initialData.type);
      setBrandDisplay(initialData.brand);
      setModelDisplay(initialData.model);
    } else {
      // Reset for new form
      setFormData({ type: '', brand: '', model: '', serial: '', location: '', observations: ''});
      setEquipmentTypeDisplay('');
      setBrandDisplay('');
      setModelDisplay('');
    }
  }, [initialData]);

  const loadModelsForBrand = async (brandName: string) => {
    if (brandName) {
        const models = await getDynamicModelsForBrand(brandName);
        setModelsList(models);
    } else {
        setModelsList([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Autocomplete Handlers
  const handleEquipmentTypeSelect = (value: string, label?: string) => {
    setFormData(prev => ({ ...prev, type: value }));
    setEquipmentTypeDisplay(label || value);
  };
  const handleEquipmentTypeAddNew = async (typedValue: string) => {
    const addedType = await addDynamicEquipmentType(typedValue.trim());
    if (!equipmentTypesList.some(t => t.toLowerCase() === addedType.toLowerCase())) {
        setEquipmentTypesList(prev => [...prev, addedType].sort());
    }
    setFormData(prev => ({ ...prev, type: addedType }));
    setEquipmentTypeDisplay(addedType);
  };

  const handleBrandSelect = async (value: string, label?: string) => {
    setFormData(prev => ({ ...prev, brand: value, model: '' })); 
    setBrandDisplay(label || value);
    setModelDisplay(''); 
    await loadModelsForBrand(value);
  };
  const handleBrandAddNew = async (typedValue: string) => {
    const addedBrand = await addDynamicBrand(typedValue.trim());
    if (!brandsList.some(b => b.toLowerCase() === addedBrand.toLowerCase())) {
        setBrandsList(prev => [...prev, addedBrand].sort());
    }
    setFormData(prev => ({ ...prev, brand: addedBrand, model: '' }));
    setBrandDisplay(addedBrand);
    setModelDisplay('');
    await loadModelsForBrand(addedBrand);
  };

  const handleModelSelect = (value: string, label?: string) => {
    setFormData(prev => ({ ...prev, model: value }));
    setModelDisplay(label || value);
  };
  const handleModelAddNew = async (typedValue: string) => {
    if (formData.brand) {
        const addedModel = await addDynamicModelForBrand(formData.brand, typedValue.trim());
         if (!modelsList.some(m => m.toLowerCase() === addedModel.toLowerCase())) {
            setModelsList(prev => [...prev, addedModel].sort());
        }
        setFormData(prev => ({ ...prev, model: addedModel }));
        setModelDisplay(addedModel);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.brand || !formData.model || !formData.serial) {
        alert("Por favor, complete los campos obligatorios: Tipo, Marca, Modelo y Serial.");
        return;
    }
    if (initialData) {
        onSubmit({ ...initialData, ...formData });
    } else {
        onSubmit(formData);
    }
  };

  const equipmentTypeSuggestions: AutocompleteSuggestion[] = equipmentTypesList.map(type => ({ value: type, label: type }));
  const brandSuggestions: AutocompleteSuggestion[] = brandsList.map(brand => ({ value: brand, label: brand }));
  const modelSuggestions: AutocompleteSuggestion[] = modelsList.map(model => ({ value: model, label: model }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {apiError && <p className="text-red-500 dark:text-red-400 text-sm mb-4 text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-md">{apiError}</p>}
      
      <AutocompleteInput
        label="Tipo de Equipo*"
        name="type"
        placeholder="Buscar o agregar tipo..."
        value={equipmentTypeDisplay}
        suggestions={equipmentTypeSuggestions}
        onChange={setEquipmentTypeDisplay}
        onSelect={handleEquipmentTypeSelect}
        onAddNew={handleEquipmentTypeAddNew}
        addNewLabel="Agregar nuevo tipo:"
        required
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AutocompleteInput
            label="Marca*"
            name="brand"
            placeholder="Buscar o agregar marca..."
            value={brandDisplay}
            suggestions={brandSuggestions}
            onChange={setBrandDisplay}
            onSelect={handleBrandSelect}
            onAddNew={handleBrandAddNew}
            addNewLabel="Agregar nueva marca:"
            required
        />
        <AutocompleteInput
            label="Modelo*"
            name="model"
            placeholder={formData.brand ? "Buscar o agregar modelo..." : "Seleccione Marca Primero"}
            value={modelDisplay}
            suggestions={modelSuggestions}
            onChange={setModelDisplay}
            onSelect={handleModelSelect}
            onAddNew={handleModelAddNew}
            addNewLabel="Agregar nuevo modelo:"
            disabled={!formData.brand}
            required
        />
      </div>
      <Input name="serial" label="Número de Serie*" value={formData.serial} onChange={handleChange} required />
      <Input name="location" label="Ubicación del Equipo" value={formData.location || ''} onChange={handleChange} placeholder="Ej: Oficina Principal, Domicilio"/>
      <TextArea name="observations" label="Observaciones Generales" value={formData.observations || ''} onChange={handleChange} rows={3} />
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Actualizar Equipo' : 'Registrar Equipo'}
        </Button>
      </div>
    </form>
  );
};

export default ClientEquipmentForm;
