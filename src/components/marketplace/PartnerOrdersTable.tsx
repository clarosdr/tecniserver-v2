import React, { useState, useEffect, useCallback } from 'react';
import { MkOrder, myOrders, updateOrderStatus, OrderStatus } from '../../services/mk';
import { RequireRole } from '../../services/roles';

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563',
  textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb'
};
const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#1f2937'
};
const buttonStyle: React.CSSProperties = {
  padding: '0.3rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', cursor: 'pointer', backgroundColor: 'white'
};

const statusColors: Record<OrderStatus, {bg: string, text: string}> = {
    pendiente: { bg: '#fef3c7', text: '#92400e' },
    en_proceso: { bg: '#dbeafe', text: '#1e40af' },
    enviada: { bg: '#e0e7ff', text: '#3730a3' },
    entregada: { bg: '#dcfce7', text: '#166534' },
    cancelada: { bg: '#fee2e2', text: '#991b1b' },
};

export default function PartnerOrdersTable() {
  const [orders, setOrders] = useState<MkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await myOrders();
      setOrders(data);
    } catch (e: any) {
      setError('Error al cargar los pedidos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    try {
        await updateOrderStatus(id, newStatus);
        fetchMyOrders(); // Refresh list
    } catch (e) {
        alert('No se pudo actualizar el estado del pedido.');
    }
  }

  if (loading) return <p>Cargando pedidos...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>Número</th>
          <th style={thStyle}>Cliente</th>
          <th style={thStyle}>Fecha</th>
          <th style={thStyle}>Total</th>
          <th style={thStyle}>Estado</th>
          <th style={thStyle}>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr key={order.id}>
            <td style={{...tdStyle, fontWeight: 500}}>{order.numero}</td>
            <td style={tdStyle}>{order.cliente_nombre}</td>
            <td style={tdStyle}>{new Date(order.created_at).toLocaleDateString()}</td>
            <td style={tdStyle}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(order.total)}</td>
            <td style={tdStyle}>
                <span style={{
                    padding: '0.2em 0.6em', borderRadius: '9999px', fontSize: '0.75rem',
                    backgroundColor: statusColors[order.estado].bg, color: statusColors[order.estado].text,
                    textTransform: 'capitalize'
                }}>
                    {order.estado.replace('_', ' ')}
                </span>
            </td>
            <td style={tdStyle}>
                <RequireRole roles={['admin_empresa', 'empresa']}>
                    {order.estado === 'en_proceso' && (
                        <button onClick={() => handleStatusChange(order.id, 'enviada')} style={buttonStyle}>Marcar Enviada</button>
                    )}
                    {order.estado === 'enviada' && (
                        <button onClick={() => handleStatusChange(order.id, 'entregada')} style={buttonStyle}>Marcar Entregada</button>
                    )}
                </RequireRole>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
