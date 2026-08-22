import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { fetchProducts, fetchDeals } from '../api/agentApi';

const categories = ['All', 'Courses', 'Hardware', 'Books', 'Subscriptions'];

function ProductCatalog({ onAddToCart, onCompare, onAskAgent }) {
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recommended');

  useEffect(() => {
    loadProducts();
    loadDeals();
  }, [selectedCategory, sortBy]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts({
        category: selectedCategory,
        search: searchTerm,
        sort: sortBy
      });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDeals = async () => {
    try {
      const data = await fetchDeals();
      setDeals(data.deals || []);
      setCoupons(data.coupons || []);
    } catch (err) {
      console.error('Failed to load deals:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts();
  };

  return (
    <div className="catalog-pane">
      <div className="catalog-header">
        <div className="catalog-title">
          <h2>Store Catalog & Live Deals</h2>
          <p>Browse AI-curated developer gear, top courses, hardware & tech books</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {coupons.slice(0, 3).map(c => (
            <div 
              key={c.code}
              style={{
                background: 'rgba(0, 242, 254, 0.08)',
                border: '1px dashed rgba(0, 242, 254, 0.35)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                color: '#00f2fe',
                fontWeight: '700'
              }}
            >
              🏷️ {c.code} ({c.discountPercent}% OFF)
            </div>
          ))}
        </div>
      </div>

      <div className="catalog-filters">
        <div className="category-pills">
          {categories.map(cat => (
            <button
              key={cat}
              className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="catalog-search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search items, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="catalog-search-input"
          />
        </form>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-subtle)',
            color: '#fff',
            padding: '7px 12px',
            borderRadius: '10px',
            outline: 'none',
            fontSize: '0.85rem'
          }}
        >
          <option value="recommended">Featured / Recommended</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Top Rated ⭐</option>
          <option value="discount">Biggest Discount %</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '36px', height: '36px' }}></div>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '2.5rem' }}>🔍</span>
          <h3 style={{ color: '#fff', marginTop: '12px' }}>No matching products found</h3>
          <p>Try clearing filters or searching for "python", "react", "keyboard", "headphones".</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onCompare={onCompare}
              onAskAgent={onAskAgent}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductCatalog;
