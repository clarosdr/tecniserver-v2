import React, { useState, useEffect, useCallback } from 'react';
import { MkProduct, myProducts, createProduct, updateProduct } from '../../services/mk';

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563',
  textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb'
};
const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#1f2937'
};
const inputStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', width: '100px'
};
const buttonStyle: React.CSSProperties = {
  padding: '0.3rem 0.8rem', border: '1px solid transparent', borderRadius: '0.25rem', cursor: 'pointer', marginRight: '0.5rem'
};


export default function PartnerProductsTable() {
  const [products, setProducts] = useState<MkProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ precio: number; stock_publicado: number }>({ precio: 0, stock_publicado: 0 });

  const fetchMyProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await myProducts();
      setProducts(data);
    } catch (e: any) {
      setError('Error al cargar los productos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyProducts();
  }, [fetchMyProducts]);
  
  const handleEdit = (product: MkProduct) => {
    setEditingId(product.id);
    setEditData({ precio: product.precio, stock_publicado: product.stock_publicado || 0 });
  };
  
  const handleCancel = () => {
    setEditingId(null);
  };
  
  const handleSave = async (id: string) => {
    try {
      await updateProduct(id, editData);
      setEditingId(null);
      fetchMyProducts();
    } catch (e) {
      alert('No se pudo guardar el producto.');
    }
  };
  
  const handleToggleActive = async (product: MkProduct) => {
    if (!confirm(`¿Estás seguro de que quieres ${product.activo ? 'desactivar' : 'activar'} este producto?`)) return;
    try {
      await updateProduct(product.id, { activo: !product.activo });
      fetchMyProducts();
    } catch (e) {
      alert('No se pudo cambiar el estado del producto.');
    }
  };
  
  if (loading) return <p>Cargando publicaciones...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>SKU</th>
            <th style={thStyle}>Nombre</th>
            <th style={thStyle}>Precio</th>
            <th style={thStyle}>Stock</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td style={tdStyle}>{p.sku}</td>
              <td style={tdStyle}>{p.nombre}</td>
              <td style={tdStyle}>
                {editingId === p.id ? (
                  <input type="number" style={inputStyle} value={editData.precio} onChange={e => setEditData({...editData, precio: Number(e.target.value)})} />
                ) : (
                  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(p.precio)
                )}
              </td>
              <td style={tdStyle}>
                {editingId === p.id ? (
                  <input type="number" style={inputStyle} value={editData.stock_publicado} onChange={e => setEditData({...editData, stock_publicado: Number(e.target.value)})} />
                ) : (
                  p.stock_publicado ?? 'N/A'
                )}
              </td>
              <td style={tdStyle}>
                <span style={{
                    padding: '0.2em 0.6em', borderRadius: '9999px', fontSize: '0.75rem',
                    backgroundColor: p.activo ? '#dcfce7' : '#fee2e2', color: p.activo ? '#166534' : '#991b1b'
                }}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td style={tdStyle}>
                {editingId === p.id ? (
                  <>
                    <button onClick={() => handleSave(p.id)} style={{...buttonStyle, backgroundColor: '#22c55e', color: 'white'}}>Guardar</button>
                    <button onClick={handleCancel} style={{...buttonStyle, backgroundColor: '#6b7280', color: 'white'}}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(p)} style={{...buttonStyle, backgroundColor: '#3b82f6', color: 'white'}}>Editar</button>
                    <button onClick={() => handleToggleActive(p)} style={{...buttonStyle, backgroundColor: p.activo ? '#f59e0b' : '#10b981', color: 'white'}}>
                      {p.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
