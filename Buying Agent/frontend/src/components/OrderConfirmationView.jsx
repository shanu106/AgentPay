import React from 'react';

function OrderConfirmationView({ order, verification, onReset }) {
  if (!order) return null;

  return (
    <div className="order-confirmation-card">
      <div className="confirmation-badge">
        <span style={{ fontSize: '2rem' }}>🎉</span>
        <div>
          <h3>Purchase Completed Successfully!</h3>
          <p style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem', fontWeight: '700', margin: 0 }}>
            Payment Verified with Razorpay & Merchant Order Confirmed
          </p>
        </div>
      </div>

      <div className="confirmation-details-grid">
        <div className="confirmation-item">
          <span className="label">Course Purchased</span>
          <strong className="value" style={{ color: '#fff' }}>
            {order.product?.title || order.productTitle || 'Complete DSA Mastery'}
          </strong>
        </div>

        <div className="confirmation-item">
          <span className="label">Amount Paid</span>
          <strong className="value" style={{ color: 'var(--accent-cyan)', fontSize: '1.2rem' }}>
            ₹{order.amount?.toLocaleString()} {order.currency || 'INR'}
          </strong>
        </div>

        <div className="confirmation-item">
          <span className="label">Merchant Order ID</span>
          <span className="value mono">{order.orderId}</span>
        </div>

        <div className="confirmation-item">
          <span className="label">Razorpay Payment ID</span>
          <span className="value mono">
            {verification?.verification?.paymentId || order.verifiedPayment?.paymentId || order.razorpayOrderId || 'pay_test_verified'}
          </span>
        </div>

        <div className="confirmation-item">
          <span className="label">Learner Email</span>
          <span className="value">{order.customerEmail || 'student@example.com'}</span>
        </div>

        <div className="confirmation-item">
          <span className="label">Access Status</span>
          <span className="value" style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>
            ✓ Instant Digital Access Granted
          </span>
        </div>
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px 16px',
        background: 'rgba(0, 242, 254, 0.05)',
        border: '1px dashed rgba(0, 242, 254, 0.3)',
        borderRadius: '10px',
        fontSize: '0.82rem',
        color: '#cbd5e1'
      }}>
        💡 <strong>Next Step:</strong> You can now view your active enrollment in the merchant course platform at <a href="http://localhost:5173" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>http://localhost:5173</a>.
      </div>

      <button className="btn-checkout" style={{ marginTop: '16px' }} onClick={onReset}>
        Buy Another Course
      </button>
    </div>
  );
}

export default OrderConfirmationView;
