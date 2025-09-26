import React from 'react';
import { ClientEquipo, ClientOT, ClientPresupuesto, ClientVenta } from '../../services/portal';

interface ClientListsProps {
  equipos: ClientEquipo[];
  ots: ClientOT[];
  presupuestos: ClientPresupuesto[];
  ventas: ClientVenta[];
}

const listContainerStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '1.5rem',
  borderRadius: '0.5rem',
  boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
};

const listTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#1f2937',
  marginBottom: '1rem',
};

const ulStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const liStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 0',
  borderBottom: '1px solid #e5e7eb',
};

const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.2em 0.6em',
    fontSize: '0.75em',
    fontWeight: 700,
    borderRadius: '9999px',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    textTransform: 'capitalize'
}

function ListSection<T>({ title, items, renderItem }: { title: string, items: T[], renderItem: (item: T) => React.ReactNode }) {
  return (
    <div style={listContainerStyle}>
      <h3 style={listTitleStyle}>{title}</h3>
      <ul style={ulStyle}>
        {items.length > 0 ? (
          items.map(renderItem)
        ) : (
          <li style={{...liStyle, color: '#6b7280', justifyContent: 'center'}}>No hay registros.</li>
        )}
      </ul>
    </div>
  );
}

export default function ClientLists({ equipos, ots, presupuestos, ventas }: ClientListsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
      
      <ListSection
        title="Mis Equipos"
        items={equipos}
        renderItem={equipo => (
          <li key={equipo.id} style={liStyle}>
            <span>{equipo.display_name}</span>
            <span style={{ color: '#4b5563' }}>S/N: {equipo.serial_normalizado}</span>
          </li>
        )}
      />

      <ListSection
        title="Mis Órdenes de Trabajo"
        items={ots}
        renderItem={ot => (
          <li key={ot.id} style={liStyle}>
            <span>{ot.ot_code} <small style={{color: '#6b7280'}}>({ot.equipo_display})</small></span>
            <span style={badgeStyle}>{ot.estado.replace(/_/g, ' ')}</span>
          </li>
        )}
      />
      
      <ListSection
        title="Mis Presupuestos"
        items={presupuestos}
        renderItem={p => (
          <li key={p.id} style={liStyle}>
            <span>{p.numero} - {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(p.total)}</span>
            <span style={badgeStyle}>{p.estado}</span>
          </li>
        )}
      />

      <ListSection
        title="Mis Facturas"
        items={ventas}
        renderItem={v => (
          <li key={v.id} style={liStyle}>
            <span>{v.numero} - <small style={{color: '#6b7280'}}>{new Date(v.fecha).toLocaleDateString()}</small></span>
            <span style={{fontWeight: 500}}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(v.total)}</span>
          </li>
        )}
      />

    </div>
  );
}
