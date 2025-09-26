import React, { useState } from 'react';
import { createReminder, CreateReminderParams } from '../../services/reminders';

interface ReminderFormProps {
    defaultValues?: {
        tipo?: 'ot' | 'mantenimiento' | 'cliente' | 'general';
        entidad?: string;
        entidad_id?: number;
        fecha_hora?: string;
        canal?: 'email' | 'sms' | 'push' | 'interno';
        nota?: string;
    };
    onSaved?: (reminder: any) => void;
    onCancel?: () => void;
}

export const ReminderForm: React.FC<ReminderFormProps> = ({
    defaultValues,
    onSaved,
    onCancel
}) => {
    const [formData, setFormData] = useState<CreateReminderParams>({
        tipo: defaultValues?.tipo || 'general',
        entidad: defaultValues?.entidad || '',
        entidad_id: defaultValues?.entidad_id,
        fecha_hora: defaultValues?.fecha_hora || '',
        canal: defaultValues?.canal || 'interno',
        nota: defaultValues?.nota || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validaciones básicas
            if (!formData.entidad.trim()) {
                throw new Error('La entidad es requerida');
            }
            if (!formData.fecha_hora) {
                throw new Error('La fecha y hora son requeridas');
            }

            // Verificar que la fecha no sea en el pasado
            const reminderDate = new Date(formData.fecha_hora);
            const now = new Date();
            if (reminderDate <= now) {
                throw new Error('La fecha del recordatorio debe ser futura');
            }

            const reminder = await createReminder(formData);
            
            if (onSaved) {
                onSaved(reminder);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof CreateReminderParams, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Generar fecha mínima (ahora + 1 minuto)
    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        return now.toISOString().slice(0, 16);
    };

    return (
        <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            maxWidth: '500px',
            margin: '0 auto'
        }}>
            <h3 style={{ marginBottom: '1rem', color: '#333' }}>
                Programar Recordatorio
            </h3>

            {error && (
                <div style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    marginBottom: '1rem',
                    fontSize: '0.875rem'
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Tipo de Recordatorio
                    </label>
                    <select
                        value={formData.tipo}
                        onChange={(e) => handleChange('tipo', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                        }}
                        required
                    >
                        <option value="general">General</option>
                        <option value="ot">Orden de Trabajo</option>
                        <option value="mantenimiento">Mantenimiento</option>
                        <option value="cliente">Cliente</option>
                    </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Entidad/Descripción
                    </label>
                    <input
                        type="text"
                        value={formData.entidad}
                        onChange={(e) => handleChange('entidad', e.target.value)}
                        placeholder="Ej: OT #123, Cliente Juan Pérez, etc."
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                        }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Fecha y Hora
                    </label>
                    <input
                        type="datetime-local"
                        value={formData.fecha_hora}
                        onChange={(e) => handleChange('fecha_hora', e.target.value)}
                        min={getMinDateTime()}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                        }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Canal de Notificación
                    </label>
                    <select
                        value={formData.canal}
                        onChange={(e) => handleChange('canal', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                        }}
                        required
                    >
                        <option value="interno">Notificación Interna</option>
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="push">Push Notification</option>
                    </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Nota (Opcional)
                    </label>
                    <textarea
                        value={formData.nota}
                        onChange={(e) => handleChange('nota', e.target.value)}
                        placeholder="Información adicional sobre el recordatorio..."
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            style={{
                                padding: '0.5rem 1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                color: '#374151',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                            color: 'white',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}
                    >
                        {loading ? 'Guardando...' : 'Programar Recordatorio'}
                    </button>
                </div>
            </form>
        </div>
    );
};