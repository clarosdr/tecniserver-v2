
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { InventoryItem, AutocompleteSuggestion, UserRole } from '../../types';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Button from '../common/Button';
import AutocompleteInput from '../common/AutocompleteInput';
import { AuthContext } from '../../contexts/AuthContext';
import { 
    getDynamicInventoryCategories, addDynamicInventoryCategory,
    getDynamicInventorySpaces, addDynamicInventorySpace,
    getDynamicInventorySuppliers, addDynamicInventorySupplier
} from '../../services/apiService';
import { formatCurrencyCOP } from '../../utils/formatting';

interface InventoryItemFormProps {
  initialData?: InventoryItem | null;
  onSubmit: (data: Omit<InventoryItem, 'id'> | InventoryItem) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const InventoryItemForm: React.FC<InventoryItemFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const auth = useContext(AuthContext);
  const isAdmin = auth?.user?.role === UserRole.Admin;

  const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>({
    name: '',
    description: '',
    sku: '',
    category: '',
    space: '',
    quantity: 0,
    minStockLevel: 0,
    price: 0, // Precio de Venta
    costPrice: 0, // Precio de Costo
    supplierId: '', // Now mandatory, ensure it has a default empty string
    purchaseInvoiceNumber: '', // New
    purchaseDate: '', // New (ISO date string)
    ...(initialData ? { ...initialData } : {})
  });
  
  const [categoryDisplay, setCategoryDisplay] = useState(initialData?.category || '');
  const [inventoryCategoriesSuggestions, setInventoryCategoriesSuggestions] = useState<AutocompleteSuggestion[]>([]);

  const [spaceDisplay, setSpaceDisplay] = useState(initialData?.space || '');
  const [inventorySpacesSuggestions, setInventorySpacesSuggestions] = useState<AutocompleteSuggestion[]>([]);
  
  const [supplierDisplay, setSupplierDisplay] = useState(initialData?.supplierId || '');
  const [inventorySuppliersSuggestions, setInventorySuppliersSuggestions] = useState<AutocompleteSuggestion[]>([]);


  useEffect(() => {
    const fetchDropdownData = async () => {
        const [cats, spaces, suppliers] = await Promise.all([
            getDynamicInventoryCategories(),
            getDynamicInventorySpaces(),
            getDynamicInventorySuppliers()
        ]);
        setInventoryCategoriesSuggestions(cats.map(c => ({ label: c, value: c })));
        setInventorySpacesSuggestions(spaces.map(s => ({ label: s, value: s})));
        setInventorySuppliersSuggestions(suppliers.map(s => ({ label: s, value: s})));
    };
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        sku: initialData.sku,
        category: initialData.category || '',
        space: initialData.space || '',
        quantity: initialData.quantity,
        minStockLevel: initialData.minStockLevel,
        price: initialData.price,
        costPrice: initialData.costPrice || 0,
        supplierId: initialData.supplierId, // Will be present
        purchaseInvoiceNumber: initialData.purchaseInvoiceNumber, // Will be present
        purchaseDate: initialData.purchaseDate.split('T')[0], // Format for date input
      });
      setCategoryDisplay(initialData.category || '');
      setSpaceDisplay(initialData.space || '');
      setSupplierDisplay(initialData.supplierId);
    } else {
      // Default state for new item
      setFormData({
        name: '', description: '', sku: '', category: '', space: '', 
        quantity: 0, minStockLevel: 0, price: 0, costPrice: 0, 
        supplierId: '', purchaseInvoiceNumber: '', purchaseDate: '',
      });
      setCategoryDisplay('');
      setSpaceDisplay('');
      setSupplierDisplay('');
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'costPrice' || name === 'quantity' || name === 'minStockLevel' 
               ? parseFloat(value) || 0 
               : value,
    }));
  };

  const handleCategorySelect = (value: string, label?: string) => {
    setFormData(prev => ({ ...prev, category: value }));
    setCategoryDisplay(label || value);
  };
  const handleCategoryAddNew = async (typedValue: string) => {
    const addedCategory = await addDynamicInventoryCategory(typedValue.trim());
    if (typedValue.trim() && !inventoryCategoriesSuggestions.some(cat => cat.value.toLowerCase() === addedCategory.toLowerCase())) {
        setInventoryCategoriesSuggestions(prev => [...prev, { label: addedCategory, value: addedCategory }].sort((a,b) => a.label.localeCompare(b.label)));
    }
    setFormData(prev => ({ ...prev, category: addedCategory }));
    setCategoryDisplay(addedCategory);
  };

  const handleSpaceSelect = (value: string, label?:string) => {
    setFormData(prev => ({ ...prev, space: value }));
    setSpaceDisplay(label || value);
  };
  const handleSpaceAddNew = async (typedValue: string) => {
    const addedSpace = await addDynamicInventorySpace(typedValue.trim());
     if (typedValue.trim() && !inventorySpacesSuggestions.some(s => s.value.toLowerCase() === addedSpace.toLowerCase())) {
        setInventorySpacesSuggestions(prev => [...prev, {label: addedSpace, value: addedSpace }].sort((a,b) => a.label.localeCompare(b.label)));
    }
    setFormData(prev => ({ ...prev, space: addedSpace }));
    setSpaceDisplay(addedSpace);
  };

  const handleSupplierSelect = (value: string, label?:string) => {
    setFormData(prev => ({ ...prev, supplierId: value }));
    setSupplierDisplay(label || value);
  };
  const handleSupplierAddNew = async (typedValue: string) => {
    const addedSupplier = await addDynamicInventorySupplier(typedValue.trim());
    if (typedValue.trim() && !inventorySuppliersSuggestions.some(s => s.value.toLowerCase() === addedSupplier.toLowerCase())) {
        setInventorySuppliersSuggestions(prev => [...prev, {label: addedSupplier, value: addedSupplier }].sort((a,b) => a.label.localeCompare(b.label)));
    }
    setFormData(prev => ({ ...prev, supplierId: addedSupplier }));
    setSupplierDisplay(addedSupplier);
  };


  const estimatedProfit = useMemo(() => {
    if (isAdmin && typeof formData.price === 'number' && typeof formData.costPrice === 'number' && formData.costPrice > 0) {
      return formData.price - formData.costPrice;
    }
    return null;
  }, [formData.price, formData.costPrice, isAdmin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.name || !formData.sku) {
        alert("Los campos Nombre, SKU y Categoría son obligatorios.");
        return;
    }
    if (isAdmin && (!formData.supplierId || !formData.purchaseInvoiceNumber || !formData.purchaseDate)) {
        alert("Para Administradores: ID Proveedor, Factura de Compra y Fecha de Compra son obligatorios.");
        return;
    }
    
    const dataToSubmit = {
        ...formData,
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : '', // Ensure ISO format if date is set
    };

    if (initialData) {
        onSubmit({ ...initialData, ...dataToSubmit });
    } else {
        onSubmit(dataToSubmit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input name="name" label="Nombre del Artículo*" value={formData.name} onChange={handleChange} required />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input name="sku" label="SKU / Código de Barras*" value={formData.sku} onChange={handleChange} required />
        <AutocompleteInput
            label="Espacio/Ubicación"
            name="space"
            placeholder="Buscar o agregar espacio..."
            value={spaceDisplay}
            suggestions={inventorySpacesSuggestions}
            onChange={setSpaceDisplay}
            onSelect={handleSpaceSelect}
            onAddNew={handleSpaceAddNew}
            addNewLabel="Agregar nuevo espacio:"
        />
      </div>
      
      <AutocompleteInput
        label="Categoría*"
        name="category"
        placeholder="Seleccionar o agregar categoría..."
        value={categoryDisplay}
        suggestions={inventoryCategoriesSuggestions}
        onChange={setCategoryDisplay} 
        onSelect={handleCategorySelect} 
        onAddNew={handleCategoryAddNew}
        addNewLabel="Agregar nueva categoría:"
        required
      />

      <TextArea name="description" label="Descripción" value={formData.description} onChange={handleChange} rows={2} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input name="quantity" type="number" label="Cantidad Actual*" value={formData.quantity} onChange={handleChange} required min="0" step="1"/>
        <Input name="minStockLevel" type="number" label="Nivel Mínimo de Stock*" value={formData.minStockLevel} onChange={handleChange} required min="0" step="1"/>
        <Input 
          name="price" 
          type="number" 
          label="Precio Venta (Público, COP)*" 
          value={formData.price === 0 ? '' : formData.price} 
          onChange={handleChange} 
          step="1" 
          required 
          min="0"
          placeholder="Ej: 150000"
        />
      </div>

      {isAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <Input 
              name="costPrice" 
              type="number" 
              label="Precio de Costo (Admin, COP)" 
              value={formData.costPrice === 0 ? '' : formData.costPrice} 
              onChange={handleChange} 
              step="1"
              min="0"
              placeholder="Ej: 100000"
            />
            {estimatedProfit !== null && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ganancia Estimada (Admin)</label>
                <p className={`text-md p-2 rounded ${estimatedProfit >=0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                    {formatCurrencyCOP(estimatedProfit)}
                </p>
              </div>
            )}
          </div>
          <AutocompleteInput
            label="ID Proveedor (Admin)*"
            name="supplierId"
            placeholder="Buscar o agregar proveedor..."
            value={supplierDisplay}
            suggestions={inventorySuppliersSuggestions}
            onChange={setSupplierDisplay}
            onSelect={handleSupplierSelect}
            onAddNew={handleSupplierAddNew}
            addNewLabel="Agregar nuevo proveedor:"
            required={isAdmin} 
          />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
                name="purchaseInvoiceNumber" 
                label="Número Factura Compra (Admin)*" 
                value={formData.purchaseInvoiceNumber} 
                onChange={handleChange} 
                required={isAdmin} 
            />
            <Input 
                name="purchaseDate" 
                type="date" 
                label="Fecha de Compra (Admin)*" 
                value={formData.purchaseDate} 
                onChange={handleChange} 
                required={isAdmin} 
            />
          </div>
        </>
      )}
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Actualizar Artículo' : 'Crear Artículo'}
        </Button>
      </div>
    </form>
  );
};

export default InventoryItemForm;
