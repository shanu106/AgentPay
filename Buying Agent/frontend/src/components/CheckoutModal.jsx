import React, { useState } from 'react';
import { X } from 'lucide-react';
import { checkoutCart } from '../api/agentApi';

function CheckoutModal({ isOpen, onClose, cart, onOrderSuccess }) {
  const [customerName, setCustomerName] = useState('Nawaz Shopper');
  const [customerEmail, setCustomerEmail] = useState('nawaz@example.com');
  const [paymentMethod, setPaymentMethod] = useState('Instant UPI / Card');
  const [loading, setLoading] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!customerName || !customerEmail) return;

    try {
      setLoading(true);
      setError(null);
      const order = await checkoutCart({
        customerName,
        customerEmail,
        paymentMethod
      });
      setConfirmedOrder(order);
      if (onOrderSuccess) {
        onOrderSuccess(order);
      }
    } catch (err) {
      setError(err.message || 'Checkout failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>💳 {confirmedOrder ? 'Order Confirmation' : 'Complete Your Purchase'}</h3>
          {onClose && (
            <button className="modal-close-btn" onClick={onClose} aria-label="Close" title="Close">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="modal-body">
          {!confirmedOrder ? (
            <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Amount to Pay</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                    ₹{cart?.finalTotal || 0}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <div>{cart?.totalItems || 0} item(s) in bag</div>
                  {cart?.discountAmount > 0 && (
                    <div style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>
                      Saved ₹{cart.discountAmount}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  className="form-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address for Delivery / Access:</label>
                <input
                  type="email"
                  className="form-input"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Method:</label>
                <select
                  className="form-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Instant UPI / Card">Instant UPI / QR / Card (Fast)</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="AI One-Click AutoPay">NovaBuy AI One-Click AutoPay</option>
                </select>
              </div>

              {error && (
                <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-checkout"
              >
                {loading ? 'Authorizing & Placing Order...' : `Pay & Complete Purchase (₹${cart?.finalTotal})`}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '3.5rem' }}>🎉</span>
              <div>
                <h3 style={{ color: '#fff', fontSize: '1.4rem' }}>Thank You, {confirmedOrder.customerName}!</h3>
                <p style={{ color: 'var(--accent-emerald)', fontSize: '0.9rem', fontWeight: '700', marginTop: '4px' }}>
                  Payment Verified & Order Confirmed
                </p>
              </div>

              <div style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '18px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.88rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Order ID:</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>#{confirmedOrder.orderId}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                  <span>{new Date(confirmedOrder.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                  <span>{confirmedOrder.customerEmail}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Amount:</span>
                  <strong style={{ color: '#fff', fontSize: '1.1rem' }}>₹{confirmedOrder.finalTotal}</strong>
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
                  📦 {confirmedOrder.deliveryEstimate}
                </div>
              </div>

              <button
                className="btn-checkout"
                onClick={onClose}
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckoutModal;
