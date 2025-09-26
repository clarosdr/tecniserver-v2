
import React, { useState, useEffect } from 'react';
import { Cliente, createClient, updateClient } from '../../services/clients';

interface ClientFormProps {
  initialData?: Cliente | null;
  onSaved: (clientId: string) => void;
  onCancel: () => void;
}

export default function ClientForm({ initialData, onSaved, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    fiscal_id: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name,
        fiscal_id: initialData.fiscal_id,
        email: initialData.email || '',
        phone: initialData.phone || '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.fiscal_id) {
      alert('Nombre y documento son requeridos.');
      return;
    }
    setLoading(true);
    try {
      let savedClient;
      const dataToSend = {
          ...formData,
          email: formData.email || null,
          phone: formData.phone || null,
      };

      if (initialData?.id) {
        savedClient = await updateClient(initialData.id, dataToSend);
      } else {
        savedClient = await createClient(dataToSend);
      }
      onSaved(savedClient.id);
    } catch (error) {
      console.error(error);
      alert('Error al guardar el cliente.');
    } finally {
      setLoading(false);
    }
  };
  
  const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' };
  const inputStyle: React.CSSProperties = { padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' };
  const buttonContainer: React.CSSProperties = { display: 'flex', gap: '1rem', justifyContent: 'flex-end' };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3>{initialData ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
      <input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Nombre completo" required style={inputStyle} aria-label="Nombre Completo" />
      <input name="fiscal_id" value={formData.fiscal_id} onChange={handleChange} placeholder="Documento (CC/NIT)" required style={inputStyle} aria-label="Documento" />
      <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" style={inputStyle} aria-label="Email" />
      <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Teléfono" style={inputStyle} aria-label="Teléfono" />
      <div style={buttonContainer}>
        <button type="button" onClick={onCancel} disabled={loading}>Cancelar</button>
        <button type="submit" disabled={loading} style={{fontWeight: 'bold'}}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
