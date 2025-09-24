import React, { useState, useEffect } from 'react';
import { WorkOrder, getWorkOrders } from '../services/ot';
import WorkOrderTable from '../components/ot/WorkOrderTable';
import WorkOrderDetail from '../components/ot/WorkOrderDetail';

export default function WorkOrdersPage() {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadWorkOrders() {
            try {
                setLoading(true);
                const data = await getWorkOrders();
                setWorkOrders(data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch work orders.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadWorkOrders();
    }, []);

    const handleSelectOrder = (id: number) => {
        setSelectedOrderId(id);
    };

    const handleCloseDetail = () => {
        setSelectedOrderId(null);
    }
    
    return (
        <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>Órdenes de Trabajo</h1>
            
            {loading && <p>Cargando...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            {!loading && !error && (
                <div style={{ marginTop: '1.5rem' }}>
                    <WorkOrderTable workOrders={workOrders} onSelectOrder={handleSelectOrder} />
                </div>
            )}

            {selectedOrderId && (
                 <WorkOrderDetail orderId={selectedOrderId} onClose={handleCloseDetail} />
            )}
        </div>
    );
}
