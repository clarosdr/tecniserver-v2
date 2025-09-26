import React, { useState, useEffect } from 'react';
import {
  myIdentity,
  myEquipos,
  myOTs,
  myPresupuestos,
  myVentas,
  PortalIdentity,
  ClientEquipo,
  ClientOT,
  ClientPresupuesto,
  ClientVenta,
} from '../services/portal';
import ClientSummaryCards from '../components/portal/ClientSummaryCards';
import ClientLists from '../components/portal/ClientLists';

interface PortalData {
  equipos: ClientEquipo[];
  ots: ClientOT[];
  presupuestos: ClientPresupuesto[];
  ventas: ClientVenta[];
}

const activeOtStates = ['abierta', 'en_proceso', 'en_espera', 'esperando_cliente', 'presupuestado', 'aprobado'];
const pendingBudgetStates = ['borrador', 'enviado'];

export default function PortalClientPage() {
  const [identity, setIdentity] = useState<PortalIdentity | null>(null);
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPortal() {
      try {
        setLoading(true);
        const id = await myIdentity();
        setIdentity(id);

        if (id?.cliente_id) {
          const [equipos, ots, presupuestos, ventas] = await Promise.all([
            myEquipos(id.cliente_id),
            myOTs(id.cliente_id),
            myPresupuestos(id.cliente_id),
            myVentas(id.cliente_id),
          ]);
          setData({ equipos, ots, presupuestos, ventas });
        }
      } catch (err) {
        console.error(err);
        setError('Ocurrió un error al cargar la información de tu portal.');
      } finally {
        setLoading(false);
      }
    }

    loadPortal();
  }, []);

  const pageStyle: React.CSSProperties = {
    padding: '2rem',
    backgroundColor: '#f9fafb',
    minHeight: 'calc(100vh - 4rem)', // Adjust based on Topbar height
  };
  
  const centeredMessageStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    fontSize: '1.125rem',
    color: '#4b5563',
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
  };

  if (loading) {
    return <div style={centeredMessageStyle}>Cargando tu portal...</div>;
  }

  if (error) {
    return <div style={{...centeredMessageStyle, color: '#ef4444'}}>{error}</div>;
  }

  if (!identity?.cliente_id) {
    return (
      <div style={centeredMessageStyle}>
        Tu usuario no está asociado a un perfil de cliente. Por favor, contacta a soporte técnico.
      </div>
    );
  }

  if (!data) {
    return <div style={centeredMessageStyle}>No se encontraron datos para mostrar.</div>;
  }

  // Calculate summary data
  const activeOtCount = data.ots.filter(ot => activeOtStates.includes(ot.estado)).length;
  const pendingBudgetsCount = data.presupuestos.filter(p => pendingBudgetStates.includes(p.estado)).length;
  const lastVenta = data.ventas.length > 0 ? data.ventas[0] : null;

  return (
    <div>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '2rem' }}>Mi Portal de Cliente</h1>
      
      <ClientSummaryCards 
        equiposCount={data.equipos.length}
        activeOtCount={activeOtCount}
        pendingBudgetsCount={pendingBudgetsCount}
        lastVenta={lastVenta}
      />
      
      <ClientLists 
        equipos={data.equipos}
        ots={data.ots}
        presupuestos={data.presupuestos}
        ventas={data.ventas}
      />
    </div>
  );
}
