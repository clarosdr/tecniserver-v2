import React, { useState, useEffect } from 'react';
import { WorkOrder, getWorkOrderById } from '../../services/ot';

interface WorkOrderDetailProps {
  orderId: number;
  onClose: () => void;
}

export default function WorkOrderDetail({ orderId, onClose }: WorkOrderDetailProps) {
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrderDetails() {
      if (!orderId) return;
      try {
        setLoading(true);
        const data = await getWorkOrderById(orderId);
        if (data) {
          setOrder(data);
          setError(null);
        } else {
          setError('No se encontró la orden de trabajo.');
        }
      } catch (err) {
        setError('Falló la carga de los detalles de la orden de trabajo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadOrderDetails();
  }, [orderId]);

  // Add keydown listener to close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '0.5rem',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    background: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    lineHeight: 1,
    color: '#9ca3af',
    padding: '0.25rem',
  };

  const detailItemStyle: React.CSSProperties = {
    marginBottom: '1rem',
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: 500,
    display: 'block',
    color: '#6b7280',
    fontSize: '0.875rem',
    marginBottom: '0.25rem'
  };

  const valueStyle: React.CSSProperties = {
    color: '#111827',
    fontSize: '1rem',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '1.125rem', 
    fontWeight: 600, 
    color: '#1f2937',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0.5rem',
    marginTop: '2rem', 
    marginBottom: '1rem'
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeButtonStyle} onClick={onClose} title="Cerrar (Esc)">&times;</button>
        
        {loading && <p>Cargando detalles...</p>}
        {error && <p style={{ color: '#ef4444' }}>{error}</p>}
        
        {order && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem' }}>
              Detalles de la Orden #{order.id}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 2rem' }}>
              <div style={detailItemStyle}>
                  <span style={labelStyle}>Estado</span>
                  <span style={{...valueStyle, fontWeight: 'bold'}}>{order.status}</span>
              </div>
              <div style={detailItemStyle}>
                  <span style={labelStyle}>Fecha de Ingreso</span>
                  <span style={valueStyle}>{new Date(order.created_at).toLocaleString()}</span>
              </div>
            </div>
            
            <h3 style={sectionHeaderStyle}>Información del Cliente</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem 2rem' }}>
              <div style={detailItemStyle}>
                <span style={labelStyle}>Nombre</span>
                <span style={valueStyle}>{order.client_name}</span>
              </div>
              <div style={detailItemStyle}>
                <span style={labelStyle}>Teléfono</span>
                <span style={valueStyle}>{order.client_phone || 'No especificado'}</span>
              </div>
              <div style={detailItemStyle}>
                <span style={labelStyle}>Email</span>
                <span style={valueStyle}>{order.client_email || 'No especificado'}</span>
              </div>
            </div>
            
            <h3 style={sectionHeaderStyle}>Información del Equipo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem 2rem' }}>
              <div style={detailItemStyle}>
                <span style={labelStyle}>Tipo de Equipo</span>
                <span style={valueStyle}>{order.device_type}</span>
              </div>
              <div style={detailItemStyle}>
                <span style={labelStyle}>Marca</span>
                <span style={valueStyle}>{order.device_brand || 'No especificado'}</span>
              </div>
              <div style={detailItemStyle}>
                <span style={labelStyle}>Modelo</span>
                <span style={valueStyle}>{order.device_model || 'No especificado'}</span>
              </div>
              <div style={detailItemStyle}>
                <span style={labelStyle}>Número de Serie</span>
                <span style={valueStyle}>{order.device_serial || 'No especificado'}</span>
              </div>
            </div>

            <h3 style={sectionHeaderStyle}>Problema y Diagnóstico</h3>
            <div style={detailItemStyle}>
              <span style={labelStyle}>Problema Reportado por el Cliente</span>
              <p style={{...valueStyle, whiteSpace: 'pre-wrap', backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '0.25rem' }}>{order.issue_description}</p>
            </div>
            <div style={detailItemStyle}>
              <span style={labelStyle}>Notas del Técnico</span>
              <p style={{...valueStyle, whiteSpace: 'pre-wrap', backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '0.25rem'}}>{order.technician_notes || 'Aún no hay notas del técnico.'}</p>
            </div>
            
          </>
        )}
      </div>
    </div>
  );
}
