import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fetchProducts } from '../api/agentApi';

function ComparisonModal({ isOpen, onClose, initialProductIds = [], onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedIdA, setSelectedIdA] = useState('');
  const [selectedIdB, setSelectedIdB] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAll();
    }
  }, [isOpen, initialProductIds]);

  const loadAll = async () => {
    try {
      const list = await fetchProducts();
      setAllProducts(list);

      const idA = initialProductIds[0] || list[0]?.id;
      const idB = initialProductIds[1] || (list[1]?.id !== idA ? list[1]?.id : list[2]?.id);

      setSelectedIdA(idA);
      setSelectedIdB(idB);
    } catch (err) {
      console.error('Failed to load products for comparison:', err);
    }
  };

  if (!isOpen) return null;

  const itemA = allProducts.find(p => p.id === selectedIdA);
  const itemB = allProducts.find(p => p.id === selectedIdB);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚖️ Side-by-Side Product Comparison</h3>
          {onClose && (
            <button className="modal-close-btn" onClick={onClose} aria-label="Close" title="Close">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="modal-body">
          {/* Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Item 1:
              </label>
              <select
                value={selectedIdA}
                onChange={(e) => setSelectedIdA(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  borderRadius: '10px'
                }}
              >
                {allProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.title} (₹{p.price})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Item 2:
              </label>
              <select
                value={selectedIdB}
                onChange={(e) => setSelectedIdB(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  borderRadius: '10px'
                }}
              >
                {allProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.title} (₹{p.price})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
            {[itemA, itemB].map((item, idx) => item ? (
              <div 
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <img 
                  src={item.image} 
                  alt={item.title} 
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px' }} 
                />
                
                <div>
                  <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: '700' }}>{item.title}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>{item.subtitle}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>₹{item.price}</span>
                    {item.originalPrice && (
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', marginLeft: '8px', fontSize: '0.85rem' }}>
                        ₹{item.originalPrice}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: '700', color: '#fbbf24' }}>
                    ⭐ {item.rating} ({item.reviewsCount})
                  </div>
                </div>

                {/* Key Features */}
                <div>
                  <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Key Highlights:</h5>
                  <ul style={{ paddingLeft: '18px', fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {item.features?.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                {/* Specs */}
                {item.specs && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                    {Object.entries(item.specs).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{k}:</span>
                        <span style={{ color: '#fff', fontWeight: '600' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="btn-card-add"
                  style={{ marginTop: 'auto' }}
                  onClick={() => {
                    onAddToCart(item.id);
                    onClose();
                  }}
                >
                  + Add to Cart (₹{item.price})
                </button>
              </div>
            ) : null)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparisonModal;
