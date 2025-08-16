
import React, { useState, useEffect } from 'react';
import { PersonalExpense, PersonalExpenseCategory, PersonalExpensePaymentStatus, RecurrencePeriod } from '../../types';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Select from '../common/Select';
import Button from '../common/Button';

interface PersonalExpenseFormProps {
  initialData?: PersonalExpense | null;
  onSubmit: (data: Omit<PersonalExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId'> | PersonalExpense) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const PersonalExpenseForm: React.FC<PersonalExpenseFormProps> = ({
  initialData, onSubmit, onCancel, isSubmitting
}) => {
  const [formData, setFormData] = useState<Omit<PersonalExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>({
    category: PersonalExpenseCategory.Otro,
    description: '',
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    dueDate: undefined,
    isRecurring: false,
    recurrencePeriod: undefined,
    paymentStatus: undefined,
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      // Exclude fields that should not be directly editable in the form from initialData
      const { id, userId, createdAt, updatedAt, ...editableData } = initialData;
      setFormData({
        ...editableData,
        expenseDate: initialData.expenseDate ? new Date(initialData.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : undefined,
      });
    } else {
      // Reset to default for new expense
      setFormData({
        category: PersonalExpenseCategory.Otro, description: '', amount: 0,
        expenseDate: new Date().toISOString().split('T')[0], dueDate: undefined,
        isRecurring: false, recurrencePeriod: undefined, paymentStatus: undefined, notes: '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ 
        ...prev, 
        [name]: checked,
        // Reset recurrencePeriod if isRecurring is unchecked
        ...(!checked && name === 'isRecurring' && { recurrencePeriod: undefined })
      }));
    } else if (name === 'amount') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === 'dueDate') {
      setFormData(prev => ({ ...prev, [name]: value || undefined, paymentStatus: value ? (prev.paymentStatus || PersonalExpensePaymentStatus.Pendiente) : undefined }));
    } 
     else if (name === 'paymentStatus' && !value) { // If payment status is cleared
      setFormData(prev => ({ ...prev, paymentStatus: undefined }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
        alert("El monto debe ser mayor a cero.");
        return;
    }
    if (formData.isRecurring && !formData.recurrencePeriod) {
        alert("Por favor, seleccione un periodo de recurrencia.");
        return;
    }
     if (formData.dueDate && !formData.paymentStatus) {
        alert("Si establece una fecha de vencimiento, por favor seleccione un estado de pago.");
        return;
    }

    const dataToSubmit = initialData
      ? { ...initialData, ...formData } // If editing, include all original fields from initialData then override with formData
      : formData;

    onSubmit(dataToSubmit);
  };

  const categoryOptions = Object.values(PersonalExpenseCategory).map(cat => ({ value: cat, label: cat }));
  const recurrencePeriodOptions = Object.values(RecurrencePeriod).map(rp => ({ value: rp, label: rp }));
  const paymentStatusOptions = formData.dueDate 
    ? Object.values(PersonalExpensePaymentStatus).map(ps => ({ value: ps, label: ps }))
    : [];


  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Categoría*" name="category" value={formData.category} onChange={handleChange} options={categoryOptions} required />
        <Input label="Monto (COP)*" name="amount" type="number" value={formData.amount === 0 ? '' : formData.amount} onChange={handleChange} required min="0.01" step="0.01" placeholder="Ej: 50000"/>
      </div>
      <TextArea label="Descripción*" name="description" value={formData.description} onChange={handleChange} rows={2} required />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Fecha del Gasto*" name="expenseDate" type="date" value={formData.expenseDate} onChange={handleChange} required />
        <Input label="Fecha de Vencimiento (Opcional)" name="dueDate" type="date" value={formData.dueDate || ''} onChange={handleChange} />
      </div>

      {formData.dueDate && (
        <Select label="Estado del Pago" name="paymentStatus" value={formData.paymentStatus || ''} onChange={handleChange} options={[{value: '', label: 'Seleccionar...'}, ...paymentStatusOptions]} placeholder="Seleccionar estado..." />
      )}

      <div className="flex items-center space-x-4">
        <label htmlFor="isRecurring" className="flex items-center">
          <input type="checkbox" id="isRecurring" name="isRecurring" checked={formData.isRecurring} onChange={handleChange} className="h-4 w-4 text-primary rounded border-slate-300 dark:border-slate-600 focus:ring-primary"/>
          <span className="ml-2 text-slate-700 dark:text-slate-200">Es Gasto Recurrente</span>
        </label>
        {formData.isRecurring && (
            <Select label="Periodo Recurrencia" name="recurrencePeriod" value={formData.recurrencePeriod || ''} onChange={handleChange} options={[{value: '', label: 'Seleccionar...'}, ...recurrencePeriodOptions]} containerClassName="flex-grow mb-0" required={formData.isRecurring} />
        )}
      </div>
      
      <TextArea label="Notas Adicionales (Opcional)" name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} />

      <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-700 mt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Actualizar Gasto' : 'Guardar Gasto'}
        </Button>
      </div>
    </form>
  );
};

export default PersonalExpenseForm;
