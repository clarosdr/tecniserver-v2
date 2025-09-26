import React, { useState, useEffect, useCallback } from 'react';
import { Budget, BudgetStatus, listBudgets, convertToSale } from '../services/budgets';
import BudgetTable from '../components/budgets/BudgetTable';

const budgetStatuses: BudgetStatus[] = ['borrador', 'enviado', 'aprobado', 'rechazado', 'vencido', 'convertido'];

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<BudgetStatus | ''>('');
    const [notification, setNotification] = useState<string>('');

    const fetchBudgets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listBudgets({ estado: filter || undefined });
            setBudgets(data);
        } catch (err: any) {
            setError('No se pudieron cargar los presupuestos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchBudgets();
    }, [fetchBudgets]);

    const handleConvert = async (budgetId: string) => {
        if (!confirm('¿Estás seguro de que quieres convertir este presupuesto en una venta? Esta acción no se puede deshacer.')) {
            return;
        }
        try {
            // Nota: Por ahora, no se pasa un cajaAperturaId. La función RPC debería manejarlo.
            const newSaleId = await convertToSale(budgetId);
            setNotification(`¡Éxito! Presupuesto convertido a la venta con ID: ${newSaleId}`);
            fetchBudgets(); // Recargar la lista para ver el estado actualizado
            setTimeout(() => setNotification(''), 5000);
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
    };

    const filterContainerStyle: React.CSSProperties = {
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
    };
    
    const selectStyle: React.CSSProperties = {
        padding: '0.5rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.25rem',
        backgroundColor: 'white'
    };
    
    const notificationStyle: React.CSSProperties = {
        padding: '1rem',
        backgroundColor: '#dcfce7',
        color: '#166534',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        textAlign: 'center'
    };

    return (
        <div>
            <div style={headerStyle}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>Presupuestos</h1>
                <div style={filterContainerStyle}>
                    <label htmlFor="status-filter">Filtrar por estado:</label>
                    <select 
                        id="status-filter"
                        style={selectStyle}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as BudgetStatus | '')}
                    >
                        <option value="">Todos</option>
                        {budgetStatuses.map(status => (
                            <option key={status} value={status} style={{textTransform: 'capitalize'}}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            
            {notification && <div style={notificationStyle}>{notification}</div>}

            {loading && <p>Cargando presupuestos...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            {!loading && !error && (
                <BudgetTable budgets={budgets} onConvert={handleConvert} />
            )}
        </div>
    );
}
