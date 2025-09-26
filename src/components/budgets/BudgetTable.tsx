import React from 'react';
import { Budget } from '../../services/budgets';
import { RequireRole } from '../../services/roles';
import { printDocument } from '../../services/print';
import { buildBudgetPrintData } from '../../services/print-builders';

interface BudgetTableProps {
  budgets: Budget[];
  onConvert: (budgetId: string) => void;
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '1rem',
};

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563',
  textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb'
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#1f2937'
};

const buttonStyle: React.CSSProperties = {
  padding: '0.3rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', cursor: 'pointer', 
  backgroundColor: '#22c55e', color: 'white', fontWeight: 500
};

const printButtonStyle: React.CSSProperties = {
  padding: '0.3rem 0.8rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', cursor: 'pointer', 
  backgroundColor: '#3b82f6', color: 'white', fontWeight: 500, marginRight: '0.5rem'
};

const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
    color: '#6b7280'
};

const statusColors: Record<string, {bg: string, text: string}> = {
    borrador: { bg: '#e5e7eb', text: '#374151' },
    enviado: { bg: '#dbeafe', text: '#1e40af' },
    aprobado: { bg: '#dcfce7', text: '#166534' },
    convertido: { bg: '#e0e7ff', text: '#3730a3' },
    rechazado: { bg: '#fee2e2', text: '#991b1b' },
    vencido: { bg: '#fef3c7', text: '#92400e' },
};

export default function BudgetTable({ budgets, onConvert }: BudgetTableProps) {
  return (
    <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Número</th>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>Total</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Vence</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {budgets.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                No se encontraron presupuestos.
              </td>
            </tr>
          ) : (
            budgets.map((b) => (
              <tr key={b.id}>
                <td style={{...tdStyle, fontWeight: 500}}>{b.numero}</td>
                <td style={tdStyle}>{b.cliente_nombre}</td>
                <td style={tdStyle}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(b.total)}</td>
                <td style={tdStyle}>
                    <span style={{
                        padding: '0.2em 0.6em', borderRadius: '9999px', fontSize: '0.75rem',
                        backgroundColor: statusColors[b.estado]?.bg || '#e5e7eb', 
                        color: statusColors[b.estado]?.text || '#374151',
                        textTransform: 'capitalize'
                    }}>
                        {b.estado}
                    </span>
                </td>
                <td style={tdStyle}>{new Date(b.vence_at).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <RequireRole roles={['admin', 'recepcionista']}>
                    {b.estado === 'aprobado' && (
                      <button
                        onClick={() => {
                          // Convert Budget to PresupuestoRecord format for printing
                          const presupuestoData = {
                            id: parseInt(b.id) || 0,
                            numero_presupuesto: b.numero,
                            cliente_id: b.cliente_id,
                            descripcion: `Presupuesto ${b.numero}`,
                            estado: b.estado,
                            fecha_creacion: b.created_at,
                            fecha_vencimiento: b.vence_at,
                            total: b.total,
                            cliente: {
                              full_name: b.cliente_nombre,
                              fiscal_id: '',
                              email: '',
                              phone: ''
                            },
                            items: []
                          };
                          const data = buildBudgetPrintData(presupuestoData);
                          printDocument('presupuesto', data);
                        }}
                        style={printButtonStyle}
                        title="Imprimir presupuesto"
                      >
                        Imprimir
                      </button>
                    )}
                    <button
                      onClick={() => onConvert(b.id)}
                      disabled={b.estado !== 'aprobado'}
                      style={b.estado !== 'aprobado' ? disabledButtonStyle : buttonStyle}
                      title={b.estado !== 'aprobado' ? 'Solo los presupuestos aprobados se pueden convertir' : 'Convertir este presupuesto a una venta'}
                    >
                      Convertir a Venta
                    </button>
                  </RequireRole>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
