import React, { useState } from 'react';
import { updateSavedPaymentMethod } from '../api/agentApi';

const testCardPresets = [
  { brand: 'Visa (Domestic)', last4: '1007', cardNumber: '4100 2800 0000 1007', label: 'Visa Domestic Debit (4100...1007)' },
  { brand: 'RuPay (Domestic)', last4: '1005', cardNumber: '6527 6589 0000 1005', label: 'RuPay Domestic Card (6527...1005)' },
  { brand: 'Mastercard (Domestic)', last4: '1001', cardNumber: '5180 2872 0009 1001', label: 'Mastercard Domestic (5180...1001)' },
  { brand: 'UPI AutoPay', last4: 'UPI', cardNumber: 'success@razorpay', label: 'Razorpay UPI (success@razorpay)' }
];

function SavedPaymentModal({ isOpen, onClose, savedPayment, onPaymentUpdated }) {
  const [enabled, setEnabled] = useState(savedPayment?.enabled !== false);
  const [brand, setBrand] = useState(savedPayment?.brand || 'Visa (Domestic)');
  const [last4, setLast4] = useState(savedPayment?.last4 || '1007');
  const [expiry, setExpiry] = useState(savedPayment?.expiry || '12/28');
  const [holder, setHolder] = useState(savedPayment?.holder || 'Student Buyer');
  const [autoDebitLimit, setAutoDebitLimit] = useState(savedPayment?.autoDebitLimit || 15000);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!isOpen) return null;

  const handlePresetSelect = (preset) => {
    setBrand(preset.brand);
    setLast4(preset.last4);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await updateSavedPaymentMethod({
        enabled,
        brand,
        last4,
        expiry,
        holder,
        autoDebitLimit: Number(autoDebitLimit)
      });
      setMsg({ success: true, text: 'Pre-saved payment authorization updated successfully!' });
      if (onPaymentUpdated) onPaymentUpdated(res.paymentMethod);
      setTimeout(() => {
        onClose();
        setMsg(null);
      }, 1000);
    } catch (err) {
      setMsg({ success: false, text: err.message || 'Failed to update payment details.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>💳</span>
            <div>
              <h3>Pre-Saved Payment Details & Authorization</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Enables instant zero-click autonomous purchasing within your price limit
              </p>
            </div>
          </div>
          <button className="btn-close-drawer" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Card Preview Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '16px',
            padding: '20px',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '0.05em', color: '#00f2fe' }}>
                {brand.toUpperCase()}
              </span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.15)', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                Razorpay Domestic Test Card
              </span>
            </div>

            <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em' }}>
              •••• •••• •••• {last4}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.9 }}>
              <div>
                <span style={{ fontSize: '0.65rem', display: 'block', opacity: 0.7 }}>CARD HOLDER</span>
                <strong>{holder}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.65rem', display: 'block', opacity: 0.7 }}>EXPIRES</span>
                <strong>{expiry}</strong>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Auto-Debit Toggle */}
            <div style={{
              padding: '14px 18px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '700' }}>
                  ⚡ Autonomous Instant Buy (Pre-Authorized)
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Auto-authorize payments up to ₹{Number(autoDebitLimit).toLocaleString()} without manual card entry
                </div>
              </div>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
              />
            </div>

            {/* Quick Test Presets */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Select Domestic Test Payment Method:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {testCardPresets.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePresetSelect(p)}
                    style={{
                      padding: '8px 10px',
                      background: brand === p.brand ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      border: brand === p.brand ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: brand === p.brand ? '#00f2fe' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Card Brand / Type:</label>
                <input
                  type="text"
                  className="form-input"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Last 4 Digits:</label>
                <input
                  type="text"
                  maxLength="4"
                  className="form-input"
                  value={last4}
                  onChange={(e) => setLast4(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Cardholder Name:</label>
                <input
                  type="text"
                  className="form-input"
                  value={holder}
                  onChange={(e) => setHolder(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Auto-Debit Maximum Limit (₹):</label>
                <input
                  type="number"
                  className="form-input"
                  value={autoDebitLimit}
                  onChange={(e) => setAutoDebitLimit(e.target.value)}
                />
              </div>
            </div>

            {msg && (
              <div style={{
                color: msg.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                {msg.text}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-checkout">
              {loading ? 'Saving...' : 'Save Payment Authorization'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SavedPaymentModal;
