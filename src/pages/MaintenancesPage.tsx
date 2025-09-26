import React, { useState, useEffect } from 'react';
import { RequireRole } from '../services/roles';
import { ReminderForm } from '../components/reminders/ReminderForm';
import { listMyReminders, completeReminder, cancelReminder, Reminder } from '../services/reminders';

export default function MaintenancesPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadReminders();
  }, [filter]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const estado = filter === 'all' ? undefined : filter;
      const data = await listMyReminders({ estado });
      setReminders(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar recordatorios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReminder = async (id: number) => {
    try {
      await completeReminder(id);
      await loadReminders();
    } catch (err) {
      alert('Error al completar recordatorio');
      console.error(err);
    }
  };

  const handleCancelReminder = async (id: number) => {
    try {
      await cancelReminder(id);
      await loadReminders();
    } catch (err) {
      alert('Error al cancelar recordatorio');
      console.error(err);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'pending': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return estado;
    }
  };

  return (
    <RequireRole roles={['admin', 'recepcionista', 'tecnico']}>
      <div style={{ padding: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
            Recordatorios de Mantenimiento
          </h1>
          <button
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
            onClick={() => setShowReminderForm(true)}
          >
            Programar Recordatorio
          </button>
        </div>

        {/* Filtros */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { key: 'all', label: 'Todos' },
              { key: 'pending', label: 'Pendientes' },
              { key: 'completed', label: 'Completados' },
              { key: 'cancelled', label: 'Cancelados' }
            ].map(({ key, label }) => (
              <button
                key={key}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  backgroundColor: filter === key ? '#3b82f6' : 'white',
                  color: filter === key ? 'white' : '#374151',
                  cursor: 'pointer'
                }}
                onClick={() => setFilter(key as any)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading && <p>Cargando recordatorios...</p>}
        {error && <p style={{ color: '#ef4444' }}>{error}</p>}

        {/* Lista de recordatorios */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                      {reminder.entidad}
                    </h3>
                    <span
                      style={{
                        backgroundColor: getStatusColor(reminder.estado),
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      {getStatusText(reminder.estado)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div>
                      <strong>Tipo:</strong> {reminder.tipo}
                    </div>
                    <div>
                      <strong>Fecha/Hora:</strong> {new Date(reminder.fecha_hora).toLocaleString()}
                    </div>
                    <div>
                      <strong>Canal:</strong> {reminder.canal}
                    </div>
                  </div>
                  
                  {reminder.nota && (
                    <div style={{ 
                      backgroundColor: '#f9fafb', 
                      padding: '0.75rem', 
                      borderRadius: '0.25rem',
                      marginBottom: '1rem'
                    }}>
                      <strong>Nota:</strong> {reminder.nota}
                    </div>
                  )}
                </div>
                
                {reminder.estado === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                      onClick={() => handleCompleteReminder(reminder.id)}
                    >
                      Completar
                    </button>
                    <button
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                      onClick={() => handleCancelReminder(reminder.id)}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {reminders.length === 0 && !loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: '#6b7280' 
          }}>
            No hay recordatorios {filter !== 'all' ? `${getStatusText(filter).toLowerCase()}s` : ''}.
          </div>
        )}

        {/* Modal del formulario */}
        {showReminderForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '0.5rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                Programar Nuevo Recordatorio
              </h3>
              <ReminderForm
                defaultValues={{
                  tipo: 'mantenimiento',
                  entidad: '',
                  canal: 'email'
                }}
                onSaved={() => {
                  setShowReminderForm(false);
                  loadReminders();
                  alert('Recordatorio programado exitosamente');
                }}
              />
              <button
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
                onClick={() => setShowReminderForm(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}