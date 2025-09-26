
import React, { useState, useEffect, useCallback } from 'react';
import { Cliente, listClients } from '../../services/clients';

interface ClientSearchProps {
  onSelect: (clientId: string) => void;
}

// Simple debounce hook
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const PAGE_SIZE = 10;

export default function ClientSearch({ onSelect }: ClientSearchProps) {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const offset = (currentPage - 1) * PAGE_SIZE;
      const { data, count } = await listClients({ search: debouncedSearch, limit: PAGE_SIZE, offset });
      setClients(data);
      setTotalCount(count);
    } catch (err) {
      setError('No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  
  // Reset page when searching
  useEffect(() => {
    if (debouncedSearch !== search) {
      setCurrentPage(1);
    }
  }, [debouncedSearch, search]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' };
  const thStyle: React.CSSProperties = { padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ddd', backgroundColor: '#f9fafb' };
  const tdStyle: React.CSSProperties = { padding: '0.5rem', borderBottom: '1px solid #ddd' };
  
  return (
    <div>
      <input
        type="text"
        placeholder="Buscar cliente por nombre o documento..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
        aria-label="Buscar Cliente"
      />
      {loading && <p>Buscando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div style={{overflowX: 'auto'}}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Documento</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr 
                key={client.id} 
                onClick={() => onSelect(client.id)} 
                style={{ cursor: 'pointer' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = ''}
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && onSelect(client.id)}
              >
                <td style={tdStyle}>{client.full_name}</td>
                <td style={tdStyle}>{client.fiscal_id}</td>
                <td style={tdStyle}>{client.email}</td>
                <td style={tdStyle}>{client.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Anterior</button>
        <span>Página {currentPage} de {totalPages || 1}</span>
        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>Siguiente</button>
      </div>
    </div>
  );
}
