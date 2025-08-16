
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { InventoryItem, TableColumn, UserRole } from '../types'; 
import { getInventoryItems, createInventoryItem, updateInventoryItem, adjustStock, getDynamicInventoryCategories } from '../services/apiService';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import InventoryItemForm from '../components/inventory/InventoryItemForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import { formatCurrencyCOP } from '../utils/formatting'; 
import { AuthContext } from '../contexts/AuthContext';


const InventoryPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const isAdmin = auth?.user?.role === UserRole.Admin;

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [adjustStockModalOpen, setAdjustStockModalOpen] = useState(false);
  const [itemToAdjust, setItemToAdjust] = useState<InventoryItem | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  
  // Dynamic categories state removed, as form will handle its own category fetching

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simultanously fetch inventory items and categories.
      // Note: Dynamic categories for the AutocompleteInput inside InventoryItemForm
      // will be handled by the form itself to keep concerns separated.
      const data = await getInventoryItems();
      setInventory(data);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleOpenModal = (item?: InventoryItem) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: Omit<InventoryItem, 'id'> | InventoryItem) => {
    setIsSubmitting(true);
    try {
      if (editingItem && 'id' in data) {
        await updateInventoryItem(data.id, data);
      } else {
        const createData = data as Omit<InventoryItem, 'id'>;
        await createInventoryItem(createData);
      }
      fetchInventory(); // Refetch inventory and categories
      handleCloseModal();
    } catch (error) {
      console.error("Error submitting inventory item:", error);
      // Potentially set an API error state here to display in the modal
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenAdjustStockModal = (item: InventoryItem) => {
    setItemToAdjust(item);
    setAdjustmentQuantity(0);
    setAdjustStockModalOpen(true);
  };

  const handleAdjustStock = async () => {
    if (!itemToAdjust || adjustmentQuantity === 0 && itemToAdjust.quantity !== 0) return; // Allow setting to 0 explicitly
    if(itemToAdjust.quantity + adjustmentQuantity < 0) {
        alert("El ajuste no puede resultar en stock negativo.");
        return;
    }
    setIsSubmitting(true);
    try {
      await adjustStock(itemToAdjust.id, adjustmentQuantity);
      fetchInventory();
      setAdjustStockModalOpen(false);
      setItemToAdjust(null);
    } catch (error) {
      console.error("Error adjusting stock:", error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const filteredInventory = inventory
    .filter(item =>
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.space?.toLowerCase().includes(searchTerm.toLowerCase()) 
      ) &&
      (showLowStockOnly ? item.quantity <= item.minStockLevel : true)
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const columns: TableColumn<InventoryItem>[] = [ 
    { header: 'Nombre', accessor: 'name', className: 'font-medium text-primary-dark dark:text-primary-light' },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Categoría', accessor: 'category' },
    { header: 'Espacio', accessor: 'space' },
    { header: 'Cantidad', accessor: (item: InventoryItem) => (
        <span className={item.quantity <= item.minStockLevel && item.category !== 'Servicios' ? 'text-red-500 dark:text-red-400 font-semibold' : ''}>
            {item.quantity}
        </span>
    )},
    { header: 'Stock Mínimo', accessor: 'minStockLevel' },
    { header: 'Precio Venta (Público)', accessor: (item: InventoryItem) => formatCurrencyCOP(item.price) },
  ];

  if (isAdmin) {
    columns.push(
      { header: 'Precio Costo (Admin)', accessor: (item: InventoryItem) => item.costPrice ? formatCurrencyCOP(item.costPrice) : 'N/A' },
      { 
        header: 'Ganancia (Admin)', 
        accessor: (item: InventoryItem) => {
          if (typeof item.price === 'number' && typeof item.costPrice === 'number' && item.costPrice > 0) {
            const profit = item.price - item.costPrice;
            return <span className={profit >=0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{formatCurrencyCOP(profit)}</span>;
          }
          return 'N/A';
        }
      },
      { header: 'ID Proveedor (Admin)', accessor: 'supplierId' },
      { header: 'Factura Compra (Admin)', accessor: 'purchaseInvoiceNumber' },
      { header: 'Fecha Compra (Admin)', accessor: (item: InventoryItem) => item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : 'N/A' },
    );
  }

  columns.push({
      header: 'Acciones',
      accessor: (item: InventoryItem) => (
        <div className="space-x-2">
          <Button size="sm" variant="ghost" onClick={() => handleOpenModal(item)} title="Editar">
            <PencilIcon className="h-4 w-4"/>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleOpenAdjustStockModal(item)} title="Ajustar Stock" className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            <AdjustmentsHorizontalIcon className="h-4 w-4"/>
          </Button>
        </div>
      ),
  });
  
  const lowStockItems = inventory.filter(item => item.category !== 'Servicios' && item.quantity <= item.minStockLevel);


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Gestión de Inventario</h1>
        <Button onClick={() => handleOpenModal()} leftIcon={<PlusIcon className="h-5 w-5"/>}>
          Nuevo Artículo
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <Card title="Alertas de Stock Crítico" className="mb-6 border-l-4 border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/30">
          <ul className="list-disc list-inside pl-2 text-red-700 dark:text-red-300">
            {lowStockItems.slice(0,5).map(item => ( 
                <li key={item.id}>{item.name} (SKU: {item.sku}) - Cantidad: {item.quantity} (Mínimo: {item.minStockLevel})</li>
            ))}
            {lowStockItems.length > 5 && <li>... y {lowStockItems.length - 5} más artículos con bajo stock.</li>}
          </ul>
        </Card>
      )}

      <div className="mb-6 p-4 bg-white dark:bg-slate-800 shadow rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <Input 
            placeholder="Buscar por nombre, SKU, categoría, espacio..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="mb-0 flex-grow"
        />
        <label className="inline-flex items-center">
            <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-primary rounded border-slate-300 dark:border-slate-600 focus:ring-primary dark:focus:ring-primary-light"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
            />
            <span className="ml-2 text-slate-700 dark:text-slate-300">Mostrar solo bajo stock (no servicios)</span>
        </label>
      </div>


      {isLoading ? (
        <div className="flex justify-center mt-20">
            <LoadingSpinner text="Cargando inventario..." />
        </div>
      ) : (
        <Table columns={columns} data={filteredInventory} emptyStateMessage="No hay artículos en el inventario que coincidan con la búsqueda."/>
      )}

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingItem ? 'Editar Artículo de Inventario' : 'Nuevo Artículo de Inventario'}
          size="lg"
        >
          <InventoryItemForm
            initialData={editingItem}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
            isSubmitting={isSubmitting}
          />
        </Modal>
      )}
      
      {adjustStockModalOpen && itemToAdjust && (
        <Modal
          isOpen={adjustStockModalOpen}
          onClose={() => setAdjustStockModalOpen(false)}
          title={`Ajustar Stock de: ${itemToAdjust.name}`}
          size="md"
        >
            <div className="space-y-4">
                <p className="text-slate-700 dark:text-slate-300">SKU: {itemToAdjust.sku}</p>
                <p className="text-slate-700 dark:text-slate-300">Cantidad Actual: {itemToAdjust.quantity}</p>
                <Input 
                    type="number"
                    label="Cantidad a Ajustar (+/-)"
                    value={adjustmentQuantity === 0 ? '' : adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value,10) || 0)}
                    placeholder="Ej: 5 para agregar, -2 para quitar"
                />
                <p className="text-sm text-slate-600 dark:text-slate-400">Nueva Cantidad: {itemToAdjust.quantity + (isNaN(adjustmentQuantity) ? 0 : adjustmentQuantity)}</p>
                <div className="flex justify-end space-x-2">
                    <Button variant="secondary" onClick={() => setAdjustStockModalOpen(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleAdjustStock} isLoading={isSubmitting} disabled={isSubmitting}>Confirmar Ajuste</Button>
                </div>
            </div>
        </Modal>
      )}

    </div>
  );
};

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
);
const AdjustmentsHorizontalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);


export default InventoryPage;
