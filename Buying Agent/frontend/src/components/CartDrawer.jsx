import React, { useState } from 'react';
import { applyCouponCode, updateCartQuantity, removeFromCart } from '../api/agentApi';

function CartDrawer({ isOpen, onClose, cart, onCartUpdated, onProceedToCheckout }) {
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleApplyCoupon = async (codeToApply) => {
    const code = codeToApply || couponCode;
    if (!code) return;
    try {
      setLoading(true);
      const res = await applyCouponCode(code);
      setCouponMsg({ success: res.success, message: res.message });
      if (res.cart && onCartUpdated) {
        onCartUpdated(res.cart);
      }
      setCouponCode('');
    } catch (err) {
      setCouponMsg({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = async (productId, currentQty, delta) => {
    try {
      const updatedCart = await updateCartQuantity(productId, currentQty + delta);
      if (onCartUpdated) onCartUpdated(updatedCart);
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const handleRemove = async (productId) => {
    try {
      const updatedCart = await removeFromCart(productId);
      if (onCartUpdated) onCartUpdated(updatedCart);
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h3>🛒 Your Shopping Bag ({cart?.totalItems || 0})</h3>
          <button className="btn-close-drawer" onClick={onClose}>✕</button>
        </div>

        {(!cart?.items || cart.items.length === 0) ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', marginBottom: '14px' }}>🛍️</span>
            <h4 style={{ color: '#fff', marginBottom: '6px' }}>Your cart is empty</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Ask the AI agent to find top deals or browse the store catalog to add items!
            </p>
          </div>
        ) : (
          <>
            <div className="cart-items-list">
              {cart.items.map(item => (
                <div key={item.productId} className="cart-item-row">
                  <img src={item.product?.image} alt={item.product?.title} className="cart-item-img" />
                  <div className="cart-item-info">
                    <h4>{item.product?.title}</h4>
                    <div className="cart-item-price">₹{item.product?.price} each</div>
                    
                    <div className="cart-qty-controls">
                      <button 
                        className="qty-btn"
                        onClick={() => handleQtyChange(item.productId, item.quantity, -1)}
                      >
                        -
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => handleQtyChange(item.productId, item.quantity, 1)}
                      >
                        +
                      </button>
                      <button 
                        className="btn-remove-item"
                        onClick={() => handleRemove(item.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div>
                <div className="coupon-input-box">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="coupon-input"
                  />
                  <button 
                    className="btn-apply-coupon"
                    onClick={() => handleApplyCoupon()}
                    disabled={loading}
                  >
                    Apply
                  </button>
                </div>

                {couponMsg && (
                  <div style={{
                    fontSize: '0.78rem',
                    color: couponMsg.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                    marginTop: '6px',
                    fontWeight: '600'
                  }}>
                    {couponMsg.message}
                  </div>
                )}

                {/* Quick Coupon Chips */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {['NOVABUY (25%)', 'SAVE10 (10%)', 'STUDENT50 (50%)'].map(tag => {
                    const code = tag.split(' ')[0];
                    return (
                      <button
                        key={code}
                        onClick={() => handleApplyCoupon(code)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          color: 'var(--text-secondary)',
                          fontSize: '0.72rem',
                          padding: '3px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="cart-math-row">
                  <span>Subtotal</span>
                  <span>₹{cart.subtotal}</span>
                </div>

                {cart.discountAmount > 0 && (
                  <div className="cart-math-row discount">
                    <span>Discount ({cart.coupon?.code || 'Promo'})</span>
                    <span>-₹{cart.discountAmount}</span>
                  </div>
                )}

                <div className="cart-math-row total">
                  <span>Final Total</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>₹{cart.finalTotal}</span>
                </div>
              </div>

              <button 
                className="btn-checkout"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
              >
                Proceed to Checkout (₹{cart.finalTotal}) →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;
