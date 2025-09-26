
import React, { useState, useEffect, useMemo } from 'react';
import { CatalogoMarca, CatalogoModelo, CatalogoTipoEquipo, createEquipo, getCatalogos } from '../../services/clients';

interface EquipoFormProps {
  clienteId: string;
  onSaved: (equipoId: string) => void;
  onCancel: () => void;
}

export default function EquipoForm({ clienteId, onSaved, onCancel }: EquipoFormProps) {
  const [formData, setFormData] = useState({
    tipo_equipo_slug: '',
    marca_slug: '',
    modelo_slug: '',
    serial: '',
    observations: '',
  });
  const [catalogos, setCatalogos] = useState<{ tipos: CatalogoTipoEquipo[], marcas: CatalogoMarca[], modelos: CatalogoModelo[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCatalogos()
      .then(setCatalogos)
      .catch(err => alert('No se pudieron cargar los catálogos.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredModelos = useMemo(() => {
    if (catalogos && formData.marca_slug) {
      return catalogos.modelos.filter(m => m.marca_slug === formData.marca_slug);
    }
    return [];
  }, [formData.marca_slug, catalogos]);
  
  const handleMarcaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, marca_slug: e.target.value, modelo_slug: '' })); // Reset modelo on marca change
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (name === 'serial') {
      value = value.toUpperCase().replace(/\s/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tipo_equipo_slug || !formData.marca_slug || !formData.modelo_slug || !formData.serial) {
      alert('Todos los campos excepto las notas son requeridos.');
      return;
    }
    setLoading(true);
    try {
      const newEquipo = await createEquipo({ ...formData, cliente_id: clienteId });
      onSaved(newEquipo.id);
    } catch (error) {
      console.error(error);
      alert('Error al crear el equipo. ¿El serial ya existe?');
    } finally {
      setLoading(false);
    }
  };

  const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' };
  const inputStyle: React.CSSProperties = { padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' };
  const buttonContainer: React.CSSProperties = { display: 'flex', gap: '1rem', justifyContent: 'flex-end' };

  if (!catalogos) return <p>Cargando catálogos...</p>;
  
  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3>Nuevo Equipo</h3>
      <select name="tipo_equipo_slug" value={formData.tipo_equipo_slug} onChange={handleChange} required style={inputStyle} aria-label="Tipo de Equipo">
        <option value="">-- Seleccione Tipo --</option>
        {catalogos.tipos.map(t => <option key={t.slug} value={t.slug}>{t.nombre}</option>)}
      </select>
      <select name="marca_slug" value={formData.marca_slug} onChange={handleMarcaChange} required style={inputStyle} aria-label="Marca">
        <option value="">-- Seleccione Marca --</option>
        {catalogos.marcas.map(m => <option key={m.slug} value={m.slug}>{m.nombre}</option>)}
      </select>
      <select name="modelo_slug" value={formData.modelo_slug} onChange={handleChange} required disabled={!formData.marca_slug} style={inputStyle} aria-label="Modelo">
        <option value="">-- Seleccione Modelo --</option>
        {filteredModelos.map(m => <option key={m.slug} value={m.slug}>{m.nombre}</option>)}
      </select>
      <input name="serial" value={formData.serial} onChange={handleChange} placeholder="Número de Serie" required style={inputStyle} aria-label="Número de Serie" />
      <textarea name="observations" value={formData.observations} onChange={handleChange} placeholder="Notas (ej. rayones, estado batería)" style={inputStyle} aria-label="Notas" />
      <div style={buttonContainer}>
        <button type="button" onClick={onCancel} disabled={loading}>Cancelar</button>
        <button type="submit" disabled={loading} style={{fontWeight: 'bold'}}>
          {loading ? 'Guardando...' : 'Guardar Equipo'}
        </button>
      </div>
    </form>
  );
}
