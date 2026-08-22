import React from 'react';

function ProductCard({ product, onAddToCart, onCompare, onAskAgent }) {
  return (
    <div className="product-card">
      <div className="product-image-wrap">
        <img src={product.image} alt={product.title} className="product-img" loading="lazy" />
        {product.badge && <span className="product-badge-tag">{product.badge}</span>}
        <span className="product-category-tag">{product.category}</span>
      </div>

      <div className="product-content">
        <div>
          <h3 className="product-title">{product.title}</h3>
          <p className="product-subtitle">{product.subtitle}</p>

          <div className="product-meta-row">
            <div className="product-rating">
              <span>⭐</span>
              <span>{product.rating}</span>
              <span className="product-reviews-cnt">({product.reviewsCount})</span>
            </div>

            <div className="product-price-section">
              <span className="product-price">₹{product.price}</span>
              {product.originalPrice && (
                <span className="product-orig-price">₹{product.originalPrice}</span>
              )}
            </div>
          </div>
        </div>

        <div className="product-card-actions">
          <button 
            className="btn-card-add"
            onClick={() => onAddToCart(product.id)}
          >
            + Add to Cart
          </button>
          <button 
            className="btn-card-compare"
            onClick={() => onCompare(product.id)}
            title="Compare with another item"
          >
            ⚖️ Compare
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
