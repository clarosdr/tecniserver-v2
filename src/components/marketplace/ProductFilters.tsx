import React, { useState, useEffect } from 'react';
import { MkCompany, listCompanies } from '../../services/mk';

export interface FilterValues {
  search: string;
  min: number;
  max: number;
  empresaId: string;
}

interface ProductFiltersProps {
  initialValues: FilterValues;
  onChange: (values: FilterValues) => void;
}

export default function ProductFilters({ initialValues, onChange }: ProductFiltersProps) {
  const [filters, setFilters] = useState(initialValues);
  const [companies, setCompanies] = useState<MkCompany[]>([]);

  useEffect(() => {
    listCompanies().then(setCompanies).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onChange(newFilters);
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Allow empty value, convert to number otherwise
    const numericValue = value === '' ? 0 : parseInt(value, 10);
    const newFilters = { ...filters, [name]: isNaN(numericValue) ? 0 : numericValue };
    setFilters(newFilters);
    onChange(newFilters);
  };
  

  const containerStyle: React.CSSProperties = {
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    alignItems: 'end'
  };
  
  const inputGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };
  
  const labelStyle: React.CSSProperties = {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: '#374151',
      marginBottom: '0.25rem'
  };

  const inputStyle: React.CSSProperties = {
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.25rem',
    fontSize: '1rem',
    width: '100%',
    boxSizing: 'border-box'
  };


  return (
    <div style={containerStyle}>
      <div style={inputGroupStyle}>
        <label htmlFor="search" style={labelStyle}>Buscar por nombre o SKU</label>
        <input
          id="search"
          type="text"
          name="search"
          value={filters.search}
          onChange={handleChange}
          style={inputStyle}
          placeholder='Ej: Teclado Mecánico'
        />
      </div>
      <div style={inputGroupStyle}>
        <label htmlFor="empresaId" style={labelStyle}>Filtrar por empresa</label>
        <select
          id="empresaId"
          name="empresaId"
          value={filters.empresaId}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">Todas las empresas</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>{company.nombre}</option>
          ))}
        </select>
      </div>
      <div style={{display: 'flex', gap: '0.5rem'}}>
        <div style={inputGroupStyle}>
            <label htmlFor="min" style={labelStyle}>Precio Mín.</label>
            <input
            id="min"
            type="number"
            name="min"
            value={filters.min || ''}
            onChange={handlePriceChange}
            style={inputStyle}
            placeholder='0'
            min={0}
            />
        </div>
        <div style={inputGroupStyle}>
            <label htmlFor="max" style={labelStyle}>Precio Máx.</label>
            <input
            id="max"
            type="number"
            name="max"
            value={filters.max || ''}
            onChange={handlePriceChange}
            style={inputStyle}
            placeholder='∞'
            min={0}
            />
        </div>
      </div>
    </div>
  );
}
