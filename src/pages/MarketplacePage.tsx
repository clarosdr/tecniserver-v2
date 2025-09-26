import React, { useState, useEffect, useCallback } from 'react';
import { MkProduct, listProducts } from '../services/mk';
import ProductCard from '../components/marketplace/ProductCard';
import ProductFilters, { FilterValues } from '../components/marketplace/ProductFilters';

const PAGE_SIZE = 12;

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


export default function MarketplacePage() {
    const [products, setProducts] = useState<MkProduct[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FilterValues>({
        search: '',
        min: 0,
        max: 0,
        empresaId: ''
    });

    const debouncedFilters = useDebounce(filters, 500);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const offset = (currentPage - 1) * PAGE_SIZE;
            const { data, count } = await listProducts({ 
                ...debouncedFilters,
                limit: PAGE_SIZE,
                offset
            });
            setProducts(data);
            setTotalCount(count);
            setError(null);
        } catch (err) {
            setError('No se pudieron cargar los productos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedFilters]);
    
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedFilters]);

    const handleFilterChange = (newFilters: FilterValues) => {
        setFilters(newFilters);
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const pageHeaderStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
    };
    
    const resultsCountStyle: React.CSSProperties = {
        color: '#4b5563',
        fontWeight: 500
    };

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginTop: '1.5rem',
    };
    
    const paginationStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '2rem',
        gap: '1rem'
    };
    
    const buttonStyle: React.CSSProperties = {
        padding: '0.5rem 1rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.25rem',
        backgroundColor: 'white',
        cursor: 'pointer',
    };
    
    const disabledButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        cursor: 'not-allowed',
        opacity: 0.5
    };


    return (
        <div>
            <div style={pageHeaderStyle}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>Marketplace</h1>
                {!loading && <span style={resultsCountStyle}>{totalCount} resultados</span>}
            </div>
            
            <ProductFilters initialValues={filters} onChange={handleFilterChange} />
            
            {loading && <p style={{textAlign: 'center', marginTop: '2rem'}}>Cargando productos...</p>}
            {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '2rem' }}>{error}</p>}
            
            {!loading && !error && (
                <>
                    {products.length > 0 ? (
                        <div style={gridStyle}>
                            {products.map(product => (
                                <ProductCard product={product} />
                            ))}
                        </div>
                    ) : (
                        <p style={{textAlign: 'center', marginTop: '2rem', color: '#6b7280'}}>No se encontraron productos que coincidan con su búsqueda.</p>
                    )}

                    {totalPages > 1 && (
                        <div style={paginationStyle}>
                            <button 
                                onClick={() => setCurrentPage(p => p - 1)}
                                disabled={currentPage === 1}
                                style={currentPage === 1 ? disabledButtonStyle : buttonStyle}
                            >
                                Anterior
                            </button>
                            <span>Página {currentPage} de {totalPages}</span>
                            <button 
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage === totalPages}
                                style={currentPage === totalPages ? disabledButtonStyle : buttonStyle}
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
