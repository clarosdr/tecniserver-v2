
import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { PersonalExpense, PersonalExpenseCategory, PersonalExpensePaymentStatus, RecurrencePeriod, TableColumn } from '../types';
import { getPersonalExpenses, createPersonalExpense, updatePersonalExpense, deletePersonalExpense } from '../services/apiService';
import { AuthContext } from '../contexts/AuthContext';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Input from '../components/common/Input'; // Added import
import Select from '../components/common/Select'; // Added import
import { formatCurrencyCOP } from '../utils/formatting';
import { PlusIcon, WalletIcon, ExclamationTriangleIcon, CalendarDaysIcon, BellAlertIcon, CurrencyDollarIcon, CalendarPlusIcon } from '../constants'; // Added CurrencyDollarIcon & CalendarPlusIcon
import PersonalExpenseForm from '../components/personalbudget/PersonalExpenseForm';

type FilterPeriod = 'all' | 'currentMonth' | 'lastMonth' | 'custom';

const PersonalBudgetPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const [allExpenses, setAllExpenses] = useState<PersonalExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<PersonalExpense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('currentMonth');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [upcomingDueExpenses, setUpcomingDueExpenses] = useState<PersonalExpense[]>([]);
  const [overdueExpenses, setOverdueExpenses] = useState<PersonalExpense[]>([]);


  const fetchExpenses = useCallback(async () => {
    if (!auth?.user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getPersonalExpenses(auth.user.id);
      setAllExpenses(data);

      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);
      today.setHours(0,0,0,0); // Compare dates only

      const upcoming = data.filter(exp =>
        exp.dueDate && exp.paymentStatus === PersonalExpensePaymentStatus.Pendiente &&
        new Date(exp.dueDate) >= today && new Date(exp.dueDate) <= sevenDaysFromNow
      );
      setUpcomingDueExpenses(upcoming.sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()));

      const overdue = data.filter(exp =>
        exp.dueDate && exp.paymentStatus === PersonalExpensePaymentStatus.Pendiente &&
        new Date(exp.dueDate) < today
      );
      setOverdueExpenses(overdue.sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()));

    } catch (error) {
      console.error("Error fetching personal expenses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [auth?.user?.id]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleOpenModal = (expense?: PersonalExpense) => {
    setEditingExpense(expense || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = async (data: Omit<PersonalExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId'> | PersonalExpense) => {
    if (!auth?.user?.id) return;
    setIsSubmitting(true);
    try {
      if (editingExpense && 'id' in data) {
        await updatePersonalExpense(data.id, data, auth.user.id);
      } else {
        await createPersonalExpense(data as Omit<PersonalExpense, 'id'|'createdAt'|'updatedAt'|'userId'>, auth.user.id);
      }
      fetchExpenses();
      handleCloseModal();
    } catch (error) {
      console.error("Error submitting personal expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!auth?.user?.id || !window.confirm("¿Está seguro de eliminar este gasto?")) return;
    setIsSubmitting(true); // Reuse for delete indication
    try {
        await deletePersonalExpense(id, auth.user.id);
        fetchExpenses();
    } catch (error) {
        console.error("Error deleting expense:", error);
        alert("Error al eliminar el gasto.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (expense: PersonalExpense) => {
    if (!auth?.user?.id || !expense.dueDate) return;
    setIsSubmitting(true);
    try {
        await updatePersonalExpense(expense.id, { paymentStatus: PersonalExpensePaymentStatus.Pagado, expenseDate: expense.expenseDate || new Date().toISOString() }, auth.user.id);
        fetchExpenses();
    } catch (error) {
        console.error("Error marking as paid:", error);
        alert("Error al marcar como pagado.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const generateCalendarUrlForExpense = (expense: PersonalExpense) => {
    if (!expense.dueDate) return '#';
    const title = encodeURIComponent(`Vencimiento Gasto: ${expense.description}`);
    const startDate = new Date(expense.dueDate).toISOString().split('T')[0].replace(/-/g, '');
    // For all-day event, endDate is startDate + 1 day
    const tempEndDate = new Date(expense.dueDate);
    tempEndDate.setDate(tempEndDate.getDate() + 1);
    const endDate = tempEndDate.toISOString().split('T')[0].replace(/-/g, '');
    
    const details = encodeURIComponent(`Categoría: ${expense.category}\nMonto: ${formatCurrencyCOP(expense.amount)}\nNotas: ${expense.notes || ''}`);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}`;
  };


  const filteredExpenses = useMemo(() => {
    let expenses = allExpenses;
    const now = new Date();

    // Period Filter
    switch (filterPeriod) {
      case 'currentMonth':
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        expenses = expenses.filter(e => new Date(e.expenseDate) >= currentMonthStart && new Date(e.expenseDate) <= currentMonthEnd);
        break;
      case 'lastMonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        expenses = expenses.filter(e => new Date(e.expenseDate) >= lastMonthStart && new Date(e.expenseDate) <= lastMonthEnd);
        break;
      case 'custom':
        if (customStartDate) expenses = expenses.filter(e => new Date(e.expenseDate) >= new Date(customStartDate));
        if (customEndDate) {
            const endOfDay = new Date(customEndDate);
            endOfDay.setHours(23,59,59,999);
            expenses = expenses.filter(e => new Date(e.expenseDate) <= endOfDay);
        }
        break;
      // 'all' case falls through
    }

    // Category Filter
    if (categoryFilter !== 'all') {
      expenses = expenses.filter(e => e.category === categoryFilter);
    }
    // Status Filter
    if (statusFilter !== 'all') {
      expenses = expenses.filter(e => e.paymentStatus === statusFilter);
    }
    return expenses;
  }, [allExpenses, filterPeriod, customStartDate, customEndDate, categoryFilter, statusFilter]);

  const summary = useMemo(() => {
    const currentMonthExpenses = allExpenses.filter(e => {
        const expenseMonth = new Date(e.expenseDate).getMonth();
        const expenseYear = new Date(e.expenseDate).getFullYear();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return expenseMonth === currentMonth && expenseYear === currentYear;
    });
    const totalSpentMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const pendingThisMonth = allExpenses.filter(e => 
        e.dueDate && e.paymentStatus === PersonalExpensePaymentStatus.Pendiente &&
        new Date(e.dueDate).getMonth() === new Date().getMonth() &&
        new Date(e.dueDate).getFullYear() === new Date().getFullYear()
    ).reduce((sum, e) => sum + e.amount, 0);

    const upcoming7DaysValue = upcomingDueExpenses.reduce((sum, e) => sum + e.amount, 0);

    return { totalSpentMonth, pendingThisMonth, upcoming7DaysValue };
  }, [allExpenses, upcomingDueExpenses]);


  const columns: TableColumn<PersonalExpense>[] = [
    { header: 'Categoría', accessor: 'category', className: 'font-medium' },
    { header: 'Descripción', accessor: 'description', className: 'whitespace-normal break-words max-w-xs' },
    { header: 'Monto', accessor: (item) => formatCurrencyCOP(item.amount), className: 'text-right' },
    { header: 'Fecha Gasto', accessor: (item) => new Date(item.expenseDate).toLocaleDateString() },
    { header: 'Vencimiento', accessor: (item) => item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A' },
    { header: 'Estado Pago', accessor: (item) => {
        if (!item.paymentStatus) return 'N/A';
        let color = 'bg-slate-100 text-slate-800 dark:bg-slate-600 dark:text-slate-200';
        if (item.paymentStatus === PersonalExpensePaymentStatus.Pagado) color = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-100';
        else if (item.paymentStatus === PersonalExpensePaymentStatus.Pendiente) color = 'bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-100';
        else if (item.paymentStatus === PersonalExpensePaymentStatus.Vencido) color = 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100';
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{item.paymentStatus}</span>;
    }},
    { header: 'Acciones', accessor: (item) => (
      <div className="flex items-center space-x-1">
        <Button size="sm" variant="ghost" onClick={() => handleOpenModal(item)} title="Editar">✏️</Button>
        <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} title="Eliminar" className="text-red-500">🗑️</Button>
        {item.dueDate && (item.paymentStatus === PersonalExpensePaymentStatus.Pendiente || item.paymentStatus === PersonalExpensePaymentStatus.Vencido) && (
            <Button size="sm" variant="success" onClick={() => handleMarkAsPaid(item)} title="Marcar como Pagado">Pagado</Button>
        )}
        {item.dueDate && (
             <Button 
                as="a"
                href={generateCalendarUrlForExpense(item)}
                target="_blank"
                rel="noopener noreferrer"
                size="sm" 
                variant="ghost" 
                title="Añadir a Google Calendar"
                className="text-sky-600 dark:text-sky-400"
             >
                <CalendarPlusIcon className="h-4 w-4" />
            </Button>
        )}
      </div>
    )},
  ];

  const categoryOptions = [{value: 'all', label: 'Todas las Categorías'}, ...Object.values(PersonalExpenseCategory).map(cat => ({value: cat, label: cat}))];
  const statusOptions = [{value: 'all', label: 'Todos los Estados'}, ...Object.values(PersonalExpensePaymentStatus).map(stat => ({value: stat, label: stat}))];

  if (isLoading && allExpenses.length === 0) return <LoadingSpinner text="Cargando presupuesto personal..." className="mt-20" />;
  if (!auth?.user?.id) return <Card title="Acceso Denegado"><p>Debe iniciar sesión para acceder a esta función.</p></Card>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 flex items-center">
          <WalletIcon className="h-8 w-8 mr-3 text-primary dark:text-primary-light" /> Presupuesto Personal
        </h1>
        <Button onClick={() => handleOpenModal()} leftIcon={<PlusIcon className="h-5 w-5" />}>
          Agregar Gasto
        </Button>
      </div>

      {(upcomingDueExpenses.length > 0 || overdueExpenses.length > 0) && (
        <Card 
            title="Alertas de Pagos" 
            icon={<BellAlertIcon className="h-6 w-6 text-amber-500"/>} 
            className="mb-6 border-l-4 border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/30"
        >
            {overdueExpenses.length > 0 && (
                <div className="mb-3">
                    <h4 className="font-semibold text-red-600 dark:text-red-400">Pagos Vencidos ({overdueExpenses.length}):</h4>
                    <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                        {overdueExpenses.slice(0,3).map(exp => (
                            <li key={exp.id}>{exp.description} ({formatCurrencyCOP(exp.amount)}) - Venció el {new Date(exp.dueDate!).toLocaleDateString()}</li>
                        ))}
                        {overdueExpenses.length > 3 && <li>... y {overdueExpenses.length - 3} más.</li>}
                    </ul>
                </div>
            )}
             {upcomingDueExpenses.length > 0 && (
                <div>
                    <h4 className="font-semibold text-amber-600 dark:text-amber-400">Próximos Vencimientos ({upcomingDueExpenses.length}):</h4>
                    <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-300">
                         {upcomingDueExpenses.slice(0,3).map(exp => (
                            <li key={exp.id}>{exp.description} ({formatCurrencyCOP(exp.amount)}) - Vence el {new Date(exp.dueDate!).toLocaleDateString()}</li>
                        ))}
                        {upcomingDueExpenses.length > 3 && <li>... y {upcomingDueExpenses.length - 3} más.</li>}
                    </ul>
                </div>
            )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card title="Total Gastado (Mes Actual)" icon={<CurrencyDollarIcon className="h-7 w-7" />}>
          <p className="text-3xl font-bold text-primary dark:text-primary-light">{formatCurrencyCOP(summary.totalSpentMonth)}</p>
        </Card>
        <Card title="Gastos Pendientes (Este Mes)" icon={<ExclamationTriangleIcon className="h-7 w-7" />}>
          <p className="text-3xl font-bold text-amber-500 dark:text-amber-400">{formatCurrencyCOP(summary.pendingThisMonth)}</p>
        </Card>
        <Card title="Vencimientos (Próximos 7 días)" icon={<CalendarDaysIcon className="h-7 w-7" />}>
          <p className="text-3xl font-bold text-sky-500 dark:text-sky-400">{formatCurrencyCOP(summary.upcoming7DaysValue)}</p>
        </Card>
      </div>

      <Card title="Filtros de Gastos" className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Select label="Periodo" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value as FilterPeriod)}
            options={[
              { value: 'currentMonth', label: 'Mes Actual' }, { value: 'lastMonth', label: 'Mes Anterior' },
              { value: 'all', label: 'Todo' }, { value: 'custom', label: 'Personalizado' }
            ]}
            containerClassName="mb-0"
          />
          {filterPeriod === 'custom' && (
            <>
              <Input type="date" label="Desde" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} containerClassName="mb-0"/>
              <Input type="date" label="Hasta" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} containerClassName="mb-0"/>
            </>
          )}
          <Select label="Categoría" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} options={categoryOptions} containerClassName="mb-0"/>
          <Select label="Estado Pago" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={statusOptions} containerClassName="mb-0"/>
        </div>
      </Card>
      
      <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Historial de Gastos Personales</h2>
      <Table columns={columns} data={filteredExpenses} emptyStateMessage="No hay gastos personales registrados que coincidan con los filtros." />

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingExpense ? "Editar Gasto Personal" : "Agregar Nuevo Gasto Personal"} size="lg">
          <PersonalExpenseForm
            initialData={editingExpense}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
            isSubmitting={isSubmitting}
          />
        </Modal>
      )}
    </div>
  );
};

export default PersonalBudgetPage;