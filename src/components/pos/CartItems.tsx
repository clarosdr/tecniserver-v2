
import React from 'react';
import { CartItem } from '../../services/pos';

interface CartItemsProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId:string) => void;
}

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' };
const tdStyle: React.CSSProperties = { padding: '0.5rem', borderBottom: '1px solid #ddd', verticalAlign: 'middle' };
const inputStyle: React.CSSProperties = { width: '50px', padding: '0.25rem', textAlign: 'center' };
const removeButtonStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' };

export default function CartItems({ items, onUpdateQuantity, onRemoveItem }: CartItemsProps) {
  
  const calculateSubtotal = (item: CartItem) => {
    return item.unit_price * item.quantity * (1 - item.discount_pct / 100);
  };

  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Producto</th>
            <th style={thStyle}>Precio Unit.</th>
            <th style={thStyle}>Cant.</th>
            <th style={thStyle}>Subtotal</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#999' }}>
                El carrito está vacío
              </td>
            </tr>
          ) : (
            items.map(item => (
              <tr key={item.product.id}>
                <td style={tdStyle}>{item.product.nombre}</td>
                <td style={tdStyle}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.unit_price)}</td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.product.id, parseInt(e.target.value, 10) || 1)}
                    style={inputStyle}
                    min="1"
                  />
                </td>
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(calculateSubtotal(item))}
                </td>
                <td style={tdStyle}>
                    <button onClick={() => onRemoveItem(item.product.id)} style={removeButtonStyle} title="Eliminar del carrito">&times;</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
