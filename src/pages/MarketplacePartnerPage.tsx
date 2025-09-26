import React, { useState, useEffect } from 'react';
import PartnerProductsTable from '../components/marketplace/PartnerProductsTable';
import PartnerOrdersTable from '../components/marketplace/PartnerOrdersTable';
import { supabase } from '../services/supabase';
import { myCompanyId } from '../services/mk';

type ActiveTab = 'products' | 'orders';

const tabStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
    color: '#6b7280',
    borderBottom: '2px solid transparent',
};

const activeTabStyle: React.CSSProperties = {
    ...tabStyle,
    color: '#3b82f6',
    borderBottomColor: '#3b82f6',
};

export default function MarketplacePartnerPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('products');
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCompany() {
            try {
                const companyId = await myCompanyId();
                if (companyId) {
                    const { data, error } = await supabase.from('empresas').select('nombre').eq('id', companyId).single();
                    if (error) throw error;
                    setCompanyName(data.nombre);
                } else {
                    setCompanyName('No asociado a una empresa');
                }
            } catch (err) {
                console.error(err);
                setCompanyName('Error al cargar empresa');
            } finally {
                setLoading(false);
            }
        }
        loadCompany();
    }, []);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>Portal de Socio</h1>
                {!loading && <h2 style={{ fontSize: '1.25rem', color: '#4b5563' }}>{companyName}</h2>}
            </div>

            <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                <button 
                    onClick={() => setActiveTab('products')}
                    style={activeTab === 'products' ? activeTabStyle : tabStyle}
                >
                    Mis Publicaciones
                </button>
                <button 
                    onClick={() => setActiveTab('orders')}
                    style={activeTab === 'orders' ? activeTabStyle : tabStyle}
                >
                    Mis Pedidos
                </button>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'}}>
                {activeTab === 'products' ? <PartnerProductsTable /> : <PartnerOrdersTable />}
            </div>
        </div>
    );
}
