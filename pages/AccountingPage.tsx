
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, TableColumn } from '../types';
import { getTransactions, createTransaction } from '../services/apiService';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrencyCOP } from '../utils/formatting';
import { PlusIcon, DocumentTextIcon } from '../constants'; // Added DocumentTextIcon

interface NewTransactionData {
  type: 'Ingreso' | 'Egreso';
  amount: number;
  description: string;
  workOrderId?: string;
  inventoryItemId?: string;
}

type FilterPeriod = 'all' | 'today' | 'week' | 'month' | 'custom';

const AccountingPage: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTransaction, setNewTransaction] = useState<NewTransactionData>({
    type: 'Ingreso',
    amount: 0,
    description: '',
  });

  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTransactions();
      setAllTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewTransaction({ type: 'Ingreso', amount: 0, description: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTransaction.amount <= 0) {
      alert("El monto debe ser mayor a cero.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createTransaction({
        type: newTransaction.type,
        amount: newTransaction.amount,
        description: newTransaction.description,
        date: new Date().toISOString(),
        workOrderId: newTransaction.workOrderId,
      });
      fetchTransactions();
      handleCloseModal();
    } catch (error) {
      console.error("Error creating transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (filterPeriod) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))); // Monday
        startDate = new Date(firstDayOfWeek.setHours(0, 0, 0, 0));
        const lastDayOfWeek = new Date(startDate);
        lastDayOfWeek.setDate(startDate.getDate() + 6);
        endDate = new Date(lastDayOfWeek.setHours(23, 59, 59, 999));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0,0,0,0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23,59,59,999);
        break;
      case 'custom':
        if (customStartDate) startDate = new Date(customStartDate);
        if (customEndDate) {
            endDate = new Date(customEndDate);
            endDate.setHours(23,59,59,999); // Ensure end of day for custom end date
        }
        break;
      case 'all':
      default:
        return allTransactions;
    }

    return allTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const isAfterStart = startDate ? transactionDate >= startDate : true;
      const isBeforeEnd = endDate ? transactionDate <= endDate : true;
      return isAfterStart && isBeforeEnd;
    });
  }, [allTransactions, filterPeriod, customStartDate, customEndDate]);

  const totalIngresos = filteredTransactions.filter(t => t.type === 'Ingreso').reduce((sum, t) => sum + t.amount, 0);
  const totalEgresos = filteredTransactions.filter(t => t.type === 'Egreso').reduce((sum, t) => sum + t.amount, 0);
  const balancePeriodo = totalIngresos - totalEgresos;
  const balanceCajaAcumuladaGlobal = allTransactions.filter(t => t.type === 'Ingreso').reduce((sum, t) => sum + t.amount, 0) - allTransactions.filter(t => t.type === 'Egreso').reduce((sum, t) => sum + t.amount, 0);


  const columns: TableColumn<Transaction>[] = [
    { header: 'Fecha', accessor: (item: Transaction) => new Date(item.date).toLocaleString() },
    {
      header: 'Tipo', accessor: (item: Transaction) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.type === 'Ingreso'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-100'
            : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
          }`}>
          {item.type}
        </span>
      )
    },
    { header: 'Monto', accessor: (item: Transaction) => formatCurrencyCOP(item.amount), className: 'text-right' },
    { header: 'Descripción', accessor: 'description', className: 'whitespace-pre-wrap break-words max-w-sm' },
    { header: 'Ref. OT', accessor: (item: Transaction) => item.workOrderId ? (window as any).mockWorkOrders?.find((wo: any) => wo.id === item.workOrderId)?.customId || item.workOrderId.substring(0,6)+'...' : 'N/A' },
    { header: 'Ref. Inv.', accessor: (item: Transaction) => item.inventoryItemId ? (window as any).mockInventory?.find((inv: any) => inv.id === item.inventoryItemId)?.sku || item.inventoryItemId.substring(0,6)+'...' : 'N/A' },
  ];

  const filterButtonClass = (period: FilterPeriod) => 
    `px-3 py-1.5 text-sm rounded-md transition-colors ${
      filterPeriod === period 
        ? 'bg-primary text-white dark:bg-primary-dark' 
        : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
    }`;
  
  const getPeriodLabel = () => {
    switch (filterPeriod) {
      case 'today': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      case 'custom': return customStartDate && customEndDate ? `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}` : 'Rango Personalizado';
      case 'all': default: return 'Todo el Historial';
    }
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Contabilidad y Caja</h1>
        <div className="flex gap-2 flex-wrap">
            <Button onClick={handleOpenModal} leftIcon={<PlusIcon className="h-5 w-5" />}>
                Nueva Transacción Manual
            </Button>
            <Button onClick={() => setIsReportModalOpen(true)} leftIcon={<DocumentTextIcon className="h-5 w-5"/>} variant="secondary">
                Generar Informe
            </Button>
        </div>
      </div>

      <Card title="Filtros de Fecha" className="mb-6">
        <div className="flex flex-wrap items-end gap-3">
            {(['all', 'today', 'week', 'month'] as FilterPeriod[]).map(period => (
                <button key={period} onClick={() => { setFilterPeriod(period); setCustomStartDate(''); setCustomEndDate('');}} className={filterButtonClass(period)}>
                    {period === 'all' ? 'Todo' : period === 'today' ? 'Hoy' : period === 'week' ? 'Semana' : 'Mes'}
                </button>
            ))}
            <button onClick={() => setFilterPeriod('custom')} className={filterButtonClass('custom')}>
                Personalizado
            </button>
            {filterPeriod === 'custom' && (
                <div className="flex gap-2 items-end mt-2 sm:mt-0">
                    <Input type="date" label="Desde" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} containerClassName="mb-0 min-w-[150px]" />
                    <Input type="date" label="Hasta" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} containerClassName="mb-0 min-w-[150px]" />
                </div>
            )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card title="Ingresos del Periodo">
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrencyCOP(totalIngresos)}</p>
        </Card>
        <Card title="Egresos del Periodo">
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrencyCOP(totalEgresos)}</p>
        </Card>
        <Card title={filterPeriod === 'all' ? "Balance Caja Global" : "Balance del Periodo"} className={balancePeriodo >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'}>
          <p className={`text-3xl font-bold ${balancePeriodo >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
            {formatCurrencyCOP(filterPeriod === 'all' ? balanceCajaAcumuladaGlobal : balancePeriodo)}
          </p>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Historial de Movimientos ({getPeriodLabel()})</h2>
      {isLoading && filteredTransactions.length === 0 ? (
        <div className="flex justify-center mt-10">
          <LoadingSpinner text="Cargando transacciones..." />
        </div>
      ) : (
        <Table columns={columns} data={filteredTransactions} emptyStateMessage="No hay transacciones registradas para el periodo seleccionado." />
      )}

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Registrar Nueva Transacción Manual"
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Tipo de Transacción"
              name="type"
              value={newTransaction.type}
              onChange={handleChange}
              options={[{ value: 'Ingreso', label: 'Ingreso' }, { value: 'Egreso', label: 'Egreso' }]}
            />
            <Input
              label="Monto (COP)"
              name="amount"
              type="number"
              value={newTransaction.amount === 0 ? '' : newTransaction.amount}
              onChange={handleChange}
              step="1"
              min="1"
              required
              placeholder="Ej: 50000"
            />
            <Input
              label="Descripción"
              name="description"
              value={newTransaction.description}
              onChange={handleChange}
              required
            />
            <Input
              label="ID Orden de Trabajo (Opcional)"
              name="workOrderId"
              value={newTransaction.workOrderId || ''}
              onChange={handleChange}
              placeholder="Ej: wo1, ot-1005"
            />
            <div className="flex justify-end space-x-3 pt-2">
              <Button type="button" variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
                Guardar Transacción
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {isReportModalOpen && (
        <Modal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            title={`Informe de Transacciones - Periodo: ${getPeriodLabel()}`}
            size="lg"
            footer={ <Button variant="secondary" onClick={() => setIsReportModalOpen(false)}>Cerrar</Button> }
        >
            <div className="space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-700/30 rounded">
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Total Ingresos:</p>
                        <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">{formatCurrencyCOP(totalIngresos)}</p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-700/30 rounded">
                        <p className="text-xs font-medium text-red-700 dark:text-red-300">Total Egresos:</p>
                        <p className="text-lg font-semibold text-red-800 dark:text-red-200">{formatCurrencyCOP(totalEgresos)}</p>
                    </div>
                     <div className={`p-3 rounded ${balancePeriodo >= 0 ? 'bg-sky-50 dark:bg-sky-700/30' : 'bg-orange-50 dark:bg-orange-700/30'}`}>
                        <p className={`text-xs font-medium ${balancePeriodo >= 0 ? 'text-sky-700 dark:text-sky-300' : 'text-orange-700 dark:text-orange-300'}`}>Balance Neto:</p>
                        <p className={`text-lg font-semibold ${balancePeriodo >= 0 ? 'text-sky-800 dark:text-sky-200' : 'text-orange-800 dark:text-orange-200'}`}>{formatCurrencyCOP(balancePeriodo)}</p>
                    </div>
                </div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">Detalle de Transacciones ({filteredTransactions.length}):</h4>
                {filteredTransactions.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto border dark:border-slate-600 rounded">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                                <tr>
                                    <th className="px-2 py-1.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Fecha</th>
                                    <th className="px-2 py-1.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Tipo</th>
                                    <th className="px-2 py-1.5 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Monto</th>
                                    <th className="px-2 py-1.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Descripción</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredTransactions.map(t => (
                                    <tr key={t.id}>
                                        <td className="px-2 py-1 whitespace-nowrap text-slate-600 dark:text-slate-300">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className={`px-2 py-1 font-medium ${t.type === 'Ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{t.type}</td>
                                        <td className="px-2 py-1 text-right text-slate-600 dark:text-slate-300">{formatCurrencyCOP(t.amount)}</td>
                                        <td className="px-2 py-1 text-slate-600 dark:text-slate-300 whitespace-normal break-words max-w-xs">{t.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-slate-500 dark:text-slate-400 text-center py-3">No hay transacciones para este periodo.</p>}
            </div>
        </Modal>
      )}

    </div>
  );
};

// Expose mocks to window for temporary access (remove in real app)
if (typeof window !== 'undefined') {
    (window as any).mockWorkOrders = (window as any).mockWorkOrders || [];
    (window as any).mockInventory = (window as any).mockInventory || [];
}

export default AccountingPage;
