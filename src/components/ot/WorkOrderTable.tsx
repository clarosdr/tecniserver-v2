import React from 'react';
import { WorkOrder } from '../../services/ot';

interface WorkOrderTableProps {
  workOrders: WorkOrder[];
  onSelectOrder: (id: number) => void;
}

export default function WorkOrderTable({ workOrders, onSelectOrder }: WorkOrderTableProps) {
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    borderRadius: '0.5rem',
    overflow: 'hidden'
  };

  const thStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '0.875rem',
    color: '#1f2937'
  };

  const trStyle: React.CSSProperties = {
    cursor: 'pointer'
  };
  
  const trHoverStyle: React.CSSProperties = {
    backgroundColor: '#f3f4f6'
  };

  const [hoveredRow, setHoveredRow] = React.useState<number | null>(null);

  return (
    <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Cliente</th>
              <th style={thStyle}>Equipo</th>
              <th style={thStyle}>Problema Reportado</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Fecha de Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                  No hay órdenes de trabajo para mostrar.
                </td>
              </tr>
            ) : (
              workOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => onSelectOrder(order.id)}
                  onMouseEnter={() => setHoveredRow(order.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    ...trStyle,
                    ...(hoveredRow === order.id ? trHoverStyle : {})
                  }}
                >
                  <td style={{...tdStyle, fontWeight: 500}}>{order.id}</td>
                  <td style={tdStyle}>{order.client_name}</td>
                  <td style={tdStyle}>{`${order.device_type} ${order.device_brand || ''} ${order.device_model || ''}`.trim()}</td>
                  <td style={{...tdStyle, maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={order.issue_description}>{order.issue_description}</td>
                  <td style={tdStyle}>{order.status}</td>
                  <td style={tdStyle}>{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
    </div>
  );
}
