import React from 'react';
import { MkProduct } from '../../services/mk';

interface ProductCardProps {
  product: MkProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const imageContainerStyle: React.CSSProperties = {
    height: '12rem',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    fontSize: '0.875rem',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const contentStyle: React.CSSProperties = {
    padding: '1rem',
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  const companyNameStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: 600,
  };

  const productNameStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#111827',
    margin: '0.25rem 0',
  };

  const priceStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 'auto',
  };
  
  const ivaStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#4b5563',
    marginLeft: '0.5rem'
  }

  const firstImage = product.media?.images?.[0];

  return (
    <div style={cardStyle}>
      <div style={imageContainerStyle}>
        {firstImage ? (
          <img src={firstImage} alt={product.nombre} style={imageStyle} />
        ) : (
          <span>Sin imagen</span>
        )}
      </div>
      <div style={contentStyle}>
        <div>
          <span style={companyNameStyle}>{product.empresa_nombre}</span>
          <h3 style={productNameStyle}>{product.nombre}</h3>
        </div>
        <div>
          <p style={priceStyle}>
            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(product.precio)}
             {product.iva_pct > 0 && <span style={ivaStyle}>IVA {product.iva_pct}% incl.</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
