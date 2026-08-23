import React from 'react';
import { Star, Zap, ShoppingBag } from 'lucide-react';

export function ProductCard({ product, onAddToCart, onAgentBuy }) {
  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.65)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '20px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 16px 30px rgba(0, 0, 0, 0.4)';
      e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    }}
    >
      {/* Product Image */}
      <div style={{ position: 'relative', height: '200px', width: '100%', overflow: 'hidden' }}>
        <img 
          src={product.image} 
          alt={product.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(10, 15, 29, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: '600',
          color: '#38bdf8'
        }}>
          {product.category}
        </div>
      </div>

      {/* Product Content */}
      <div style={{ padding: '20px', flex: '1', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Star size={14} color="#f59e0b" fill="#f59e0b" />
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>{product.rating}</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>({product.ratingCount || 1200})</span>
        </div>

        <h3 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#ffffff',
          lineHeight: 1.35,
          marginBottom: '6px'
        }}>
          {product.title}
        </h3>

        <p style={{
          fontSize: '12px',
          color: '#94a3b8',
          lineHeight: 1.5,
          marginBottom: '16px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {product.subtitle || product.description}
        </p>

        {/* Pricing */}
        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8' }}>
              {product.priceDisplay || `₹${product.price}`}
            </span>
            {product.originalPrice && (
              <span style={{ fontSize: '13px', color: '#64748b', textDecoration: 'line-through' }}>
                {product.originalPrice}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAgentBuy(`buy 1 ${product.title}`);
              }}
              style={{
                flex: '1',
                padding: '9px 12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <Zap size={14} />
              <span>Buy with Agent</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Add to Cart"
            >
              <ShoppingBag size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
