import React, { useState } from 'react';
import { verifyPayment } from '../api/agentApi';

function RazorpayModal({ isOpen, onClose, paymentData, onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [upiId, setUpiId] = useState('buyer.agent@okhdfcbank');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !paymentData) return null;

  // Try Launching Official Razorpay SDK
  const handleLaunchOfficialRazorpay = () => {
    if (window.Razorpay && paymentData.razorpayOrderId && paymentData.key) {
      try {
        const options = {
          key: paymentData.key,
          amount: paymentData.amount * 100,
          currency: paymentData.currency || 'INR',
          name: 'LearnHub Merchant Academy',
          description: `Purchase: ${paymentData.productTitle}`,
          order_id: paymentData.razorpayOrderId,
          prefill: {
            name: paymentData.customerName || 'Student Buyer',
            email: paymentData.customerEmail || 'student@example.com',
            contact: '9999999999'
          },
          theme: {
            color: '#6366f1'
          },
          handler: async function (response) {
            handleCompleteVerification({
              razorpay_order_id: response.razorpay_order_id || paymentData.razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        console.warn('Official Razorpay SDK launch fallback:', err);
      }
    }
  };

  const handleCompleteVerification = async (customPayload) => {
    try {
      setProcessing(true);
      setError(null);

      const payload = customPayload || {
        orderId: paymentData.orderId,
        razorpay_order_id: paymentData.razorpayOrderId,
        razorpay_payment_id: `pay_test_${Math.random().toString(36).slice(2, 10)}`,
        razorpay_signature: `sig_verified_${Date.now()}`
      };

      const result = await verifyPayment({
        orderId: paymentData.orderId,
        ...payload
      });

      if (onPaymentSuccess) {
        onPaymentSuccess(result);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Payment verification failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ background: '#13192b', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#0c2340',
              padding: '6px 10px',
              borderRadius: '8px',
              color: '#00BAF2',
              fontWeight: '900',
              fontSize: '0.85rem'
            }}>
              RAZORPAY
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Test Mode Payment Gateway</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Order #{paymentData.orderId} • {paymentData.productTitle}
              </p>
            </div>
          </div>
          <button className="btn-close-drawer" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: '22px' }}>
          {/* Price Header */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Amount to Pay
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#00f2fe' }}>
                ₹{paymentData.amount?.toLocaleString()} {paymentData.currency}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <div>{paymentData.customerName}</div>
              <div style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>● Razorpay Test Mode</div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '10px' }}>
            <button
              className={`nav-tab-btn ${paymentMethod === 'card' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setPaymentMethod('card')}
            >
              💳 Card
            </button>
            <button
              className={`nav-tab-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setPaymentMethod('upi')}
            >
              📱 UPI / QR
            </button>
            <button
              className={`nav-tab-btn ${paymentMethod === 'netbanking' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setPaymentMethod('netbanking')}
            >
              🏛️ Netbanking
            </button>
          </div>

          {/* Method Form */}
          {paymentMethod === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label>Test Card Number:</label>
                <input
                  type="text"
                  className="form-input"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Valid Thru:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>CVV (Test):</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div className="form-group">
              <label>Virtual Payment Address (VPA / UPI ID):</label>
              <input
                type="text"
                className="form-input"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          )}

          {paymentMethod === 'netbanking' && (
            <div className="form-group">
              <label>Select Bank (Test):</label>
              <select className="form-input">
                <option>HDFC Bank (Test)</option>
                <option>ICICI Bank (Test)</option>
                <option>State Bank of India (Test)</option>
                <option>Axis Bank (Test)</option>
              </select>
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', fontWeight: '600' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            <button
              className="btn-checkout"
              onClick={() => handleCompleteVerification()}
              disabled={processing}
              style={{ background: 'linear-gradient(135deg, #00BAF2 0%, #6366f1 100%)', color: '#fff' }}
            >
              {processing ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div className="spinner"></div> Verifying with Razorpay & Merchant...
                </span>
              ) : (
                `Authorize & Pay ₹${paymentData.amount?.toLocaleString()} (Test Mode)`
              )}
            </button>

            {window.Razorpay && (
              <button
                type="button"
                onClick={handleLaunchOfficialRazorpay}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  padding: '8px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Or Open Official Razorpay Checkout Modal
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RazorpayModal;
