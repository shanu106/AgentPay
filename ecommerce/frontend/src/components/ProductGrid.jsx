import React from 'react';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products, loading, onAddToCart, onAgentBuy }) {
  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{
            height: '380px',
            borderRadius: '20px',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            animation: 'pulse 1.5s infinite ease-in-out'
          }} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        background: 'rgba(15, 23, 42, 0.4)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', marginBottom: '6px' }}>
          No gear found
        </h3>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Try clearing your search or picking another category.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '24px'
    }}>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onAgentBuy={onAgentBuy}
        />
      ))}
    </div>
  );
}
