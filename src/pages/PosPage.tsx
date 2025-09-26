
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Cliente, getClient } from '../../services/clients';
import { CartItem, Payment, PosProduct, searchPosProducts, getWorkOrderForPos, createSale, getActiveCashDrawer, openCashDrawer, CajaApertura } from '../../services/pos';
import ClientSearch from '../../components/clients/ClientSearch';
import CartItems from '../../components/pos/CartItems';
import PaymentsBox from '../../components/pos/PaymentsBox';
import { RequireRole } from '../../services/roles';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function PosPage() {
    const [searchParams] = useSearchParams();
    const [caja, setCaja] = useState<CajaApertura | null>(null);
    const [cajaLoading, setCajaLoading] = useState(true);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState<PosProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedSearch = useDebounce(productSearch, 300);

    const checkCaja = useCallback(async () => {
        setCajaLoading(true);
        const activeCaja = await getActiveCashDrawer();
        setCaja(activeCaja);
        setCajaLoading(false);
    }, []);

    useEffect(() => {
        checkCaja();
    }, [checkCaja]);

    useEffect(() => {
        async function fetchOtData() {
            const otIdStr = searchParams.get('ot');
            if (otIdStr) {
                setLoading(true);
                try {
                    const otId = parseInt(otIdStr, 10);
                    const otData = await getWorkOrderForPos(otId);
                    if (otData) {
                        // FIX: Added type assertion for items from RPC call
                        setCart(otData.items as CartItem[]);
                        const clientData = await getClient(otData.client_id);
                        setSelectedClient(clientData);
                    } else {
                        alert('No se encontró la Orden de Trabajo especificada.');
                    }
                } catch (e) {
                    alert('Error al cargar datos de la Orden de Trabajo.');
                } finally {
                    setLoading(false);
                }
            }
        }
        fetchOtData();
    }, [searchParams]);

    useEffect(() => {
        async function fetchProducts() {
            if (debouncedSearch.length < 2) {
                setSearchResults([]);
                return;
            }
            setLoading(true);
            try {
                const results = await searchPosProducts(debouncedSearch);
                setSearchResults(results);
            } catch (error) {
                console.error('Failed to search products', error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, [debouncedSearch]);
    
    const handleSelectClient = async (clientId: string) => {
        const client = await getClient(clientId);
        setSelectedClient(client);
    };

    const addProductToCart = (product: PosProduct) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.product.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { product, quantity: 1, unit_price: product.precio, discount_pct: 0 }];
        });
        setProductSearch('');
        setSearchResults([]);
    };
    
    const updateCartQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        setCart(cart.map(item => item.product.id === productId ? { ...item, quantity: newQuantity } : item));
    };
    
    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    const addPayment = (payment: Payment) => {
        setPayments([...payments, payment]);
    };

    const removePayment = (index: number) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    const handleOpenCaja = async () => {
        const amountStr = prompt('Ingrese el monto inicial de apertura de caja:', '0');
        if (amountStr === null) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount < 0) {
            alert('Monto inválido.');
            return;
        }
        try {
            const newCaja = await openCashDrawer(amount);
            setCaja(newCaja);
        } catch (e: any) {
            alert(`Error: ${e.message}`);
        }
    };

    const cartTotal = cart.reduce((total, item) => {
        return total + (item.unit_price * item.quantity * (1 - item.discount_pct / 100));
    }, 0);
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const handleFinalizeSale = async () => {
        if (!caja) {
            alert('No hay una caja abierta. No se puede completar la venta.');
            return;
        }
        if (!selectedClient) {
            alert('Por favor, seleccione un cliente.');
            return;
        }
        if (cart.length === 0) {
            alert('El carrito está vacío.');
            return;
        }
        if (totalPaid < cartTotal) {
            alert('El monto pagado es menor al total de la venta.');
            return;
        }

        setLoading(true);
        try {
            const otId = searchParams.get('ot');
            const salePayload = {
                cliente_id: selectedClient.id,
                items: cart.map(i => ({ product_id: i.product.id, quantity: i.quantity, unit_price: i.unit_price, discount_pct: i.discount_pct })),
                payments: payments.map(p => ({ method: p.method, amount: p.amount })),
                ot_id: otId ? parseInt(otId, 10) : null,
                caja_apertura_id: caja.id,
            };
            const result = await createSale(salePayload);
            alert(`Venta #${result.venta_id} creada con éxito!`);
            // Reset state
            setCart([]);
            setSelectedClient(null);
            setPayments([]);
            setProductSearch('');
        } catch (e: any) {
            alert(`Error al finalizar la venta: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }

    const pageStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 450px', gap: '2rem', alignItems: 'start' };
    const columnStyle: React.CSSProperties = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', height: 'calc(100vh - 10rem)', display: 'flex', flexDirection: 'column' };

    if (cajaLoading) {
        return <p>Verificando estado de la caja...</p>;
    }

    if (!caja) {
        return (
            <RequireRole roles={['admin', 'recepcionista']}>
                <div style={{textAlign: 'center', padding: '2rem'}}>
                    <h2>No hay una caja abierta</h2>
                    <p>Debes abrir una caja para poder registrar ventas.</p>
                    <button onClick={handleOpenCaja} style={{padding: '0.5rem 1rem', fontSize: '1rem'}}>Abrir Caja</button>
                </div>
            </RequireRole>
        );
    }
    
    return (
        <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Punto de Venta (POS)</h1>
            <div style={pageStyle}>
                {/* --- Left Column: Cart & Payments --- */}
                <div style={columnStyle}>
                    <div style={{ flex: '1 1 auto', overflowY: 'auto' }}>
                        <CartItems items={cart} onUpdateQuantity={updateCartQuantity} onRemoveItem={removeFromCart} />
                    </div>
                    <PaymentsBox total={cartTotal} payments={payments} onAddPayment={addPayment} onRemovePayment={removePayment} />
                </div>

                {/* --- Right Column: Search & Client --- */}
                <div style={{ ...columnStyle, overflowY: 'auto' }}>
                    <div style={{ marginBottom: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '1rem' }}>
                        <h2 style={{marginTop: 0, fontSize: '1.2rem'}}>Cliente</h2>
                        {selectedClient ? (
                            <div>
                                <p><strong>{selectedClient.full_name}</strong> ({selectedClient.fiscal_id})</p>
                                <button onClick={() => setSelectedClient(null)}>Cambiar Cliente</button>
                            </div>
                        ) : (
                            <ClientSearch onSelect={handleSelectClient} />
                        )}
                    </div>
                    
                    <div style={{ marginBottom: '1rem', position: 'relative' }}>
                        <h2 style={{marginTop: 0, fontSize: '1.2rem'}}>Añadir Producto o Servicio</h2>
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem' }}
                        />
                        {searchResults.length > 0 && (
                            <ul style={{ position: 'absolute', background: 'white', width: '100%', border: '1px solid #ddd', zIndex: 10, listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
                                {searchResults.map(p => (
                                    <li key={p.id} onClick={() => addProductToCart(p)} style={{ padding: '0.5rem', cursor: 'pointer' }}>
                                        {p.nombre} - <strong>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(p.precio)}</strong>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    
                    <div style={{ marginTop: 'auto' }}>
                        <button
                            onClick={handleFinalizeSale}
                            disabled={loading || totalPaid < cartTotal || !selectedClient || cart.length === 0}
                            style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', fontWeight: 'bold', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            {loading ? 'Procesando...' : 'Finalizar Venta'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
