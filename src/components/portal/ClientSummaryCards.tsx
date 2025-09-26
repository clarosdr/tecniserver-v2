import React from 'react';
import { ClientVenta } from '../../services/portal';

interface ClientSummaryCardsProps {
  equiposCount: number;
  activeOtCount: number;
  pendingBudgetsCount: number;
  lastVenta: ClientVenta | null;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '1.5rem',
  borderRadius: '0.5rem',
  boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#6b7280',
  marginBottom: '0.5rem'
};

const cardValueStyle: React.CSSProperties = {
  fontSize: '2.25rem',
  fontWeight: 'bold',
  color: '#111827'
};

const cardFooterStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#4b5563',
    marginTop: '1rem'
}

export default function ClientSummaryCards({
  equiposCount,
  activeOtCount,
  pendingBudgetsCount,
  lastVenta
}: ClientSummaryCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
      
      <div style={cardStyle}>
        <div>
          <h3 style={cardTitleStyle}>Equipos Registrados</h3>
          <p style={cardValueStyle}>{equiposCount}</p>
        </div>
      </div>

      <div style={cardStyle}>
        <div>
          <h3 style={cardTitleStyle}>Órdenes Activas</h3>
          <p style={cardValueStyle}>{activeOtCount}</p>
        </div>
      </div>

      <div style={cardStyle}>
        <div>
          <h3 style={cardTitleStyle}>Presupuestos Pendientes</h3>
          <p style={cardValueStyle}>{pendingBudgetsCount}</p>
        </div>
      </div>

      <div style={cardStyle}>
        <div>
          <h3 style={cardTitleStyle}>Última Factura</h3>
          {lastVenta ? (
            <>
              <p style={{...cardValueStyle, fontSize: '1.875rem'}}>
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(lastVenta.total)}
              </p>
              <p style={cardFooterStyle}>
                {new Date(lastVenta.fecha).toLocaleDateString()} ({lastVenta.numero})
              </p>
            </>
          ) : (
            <p style={{...cardValueStyle, fontSize: '1.5rem', color: '#4b5563'}}>N/A</p>
          )}
        </div>
      </div>
    </div>
  );
}
