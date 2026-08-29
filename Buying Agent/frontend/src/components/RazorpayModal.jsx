import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { verifyPayment, loadRazorpayScript } from '../api/agentApi';

const testPaymentMethods = [
  {
    type: 'Visa Domestic Debit (Recommended)',
    number: '4100280000001007',
    displayNumber: '4100 2800 0000 1007',
    expiry: '12/28',
    cvv: '123',
    icon: '💳'
  },
  {
    type: 'RuPay Domestic Card',
    number: '6527658900001005',
    displayNumber: '6527 6589 0000 1005',
    expiry: '12/28',
    cvv: '123',
    icon: '🇮🇳'
  },
  {
    type: 'Mastercard Domestic',
    number: '5180287200091001',
    displayNumber: '5180 2872 0009 1001',
    expiry: '12/28',
    cvv: '123',
    icon: '💳'
  },
  {
    type: 'Razorpay Test UPI ID',
    number: 'success@razorpay',
    displayNumber: 'success@razorpay',
    expiry: 'N/A',
    cvv: 'N/A',
    icon: '📱'
  }
];

function RazorpayModal({ isOpen, onClose, paymentData, onPaymentSuccess }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Auto-launch official Razorpay SDK if available
  useEffect(() => {
    if (isOpen && paymentData?.razorpayOrderId && paymentData?.key) {
      launchOfficialRazorpay();
    }
  }, [isOpen, paymentData]);

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const launchOfficialRazorpay = async () => {
    try {
      setProcessing(true);
      setError(null);

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Razorpay SDK script not available. Please check internet connection.');
      }

      const options = {
        key: paymentData.key,
        amount: (paymentData.amount || 499) * 100,
        currency: paymentData.currency || 'INR',
        name: 'LearnHub Academy',
        description: `Enrollment for ${paymentData.productTitle}`,
        image: 'https://img.icons8.com/fluency/96/book.png',
        order_id: paymentData.razorpayOrderId,
        prefill: {
          name: paymentData.customerName || 'Student Buyer',
          email: paymentData.customerEmail || 'student@example.com',
          contact: '9876512345'
        },
        theme: {
          color: '#6366f1'
        },
        handler: async function (response) {
          try {
            setProcessing(true);
            const result = await verifyPayment({
              orderId: paymentData.orderId,
              razorpay_order_id: response.razorpay_order_id || paymentData.razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (onPaymentSuccess) {
              onPaymentSuccess(result);
            }
            onClose();
          } catch (err) {
            setError(err.message || 'Payment signature verification failed.');
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            console.log('Razorpay modal closed.');
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        console.error('Razorpay payment failed:', response.error);
        const desc = response.error?.description || response.error?.reason || 'Transaction declined';
        if (desc.toLowerCase().includes('international')) {
          setError(`Payment Error: ${desc}. Please use the Domestic Visa (4100 2800 0000 1007), RuPay, or UPI (success@razorpay) below.`);
        } else {
          setError(`Payment failed: ${desc}`);
        }
        setProcessing(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Failed to launch Razorpay checkout:', err);
      setError(err.message || 'Failed to open Razorpay payment gateway.');
      setProcessing(false);
    }
  };

  if (!isOpen || !paymentData) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
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
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Razorpay Test Mode Checkout</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Order #{paymentData.orderId} • {paymentData.productTitle}
              </p>
            </div>
          </div>
          {onClose && (
            <button className="modal-close-btn" onClick={onClose} aria-label="Close" title="Close">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="modal-body" style={{ padding: '22px' }}>
          {/* Amount Callout */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(0, 242, 254, 0.06))',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                PRE-AUTHORIZED AMOUNT
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                ₹{paymentData.amount?.toLocaleString()} {paymentData.currency || 'INR'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '600', display: 'block' }}>
                {paymentData.customerName || 'Student Buyer'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: '600' }}>
                ● Razorpay Order #{paymentData.razorpayOrderId}
              </span>
            </div>
          </div>

          {/* Pre-Authorized Card Banner */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>🛡️</span>
              <div>
                <strong style={{ color: '#fff', fontSize: '0.85rem', display: 'block' }}>
                  Pre-Authorized Auto-Debit Active
                </strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Within prompt budget & pre-saved limit (₹15,000)
                </span>
              </div>
            </div>
            <span style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: 'var(--accent-emerald)',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: '700'
            }}>
              Authorized ✓
            </span>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            className="btn-checkout"
            onClick={launchOfficialRazorpay}
            disabled={processing}
            style={{
              padding: '15px',
              fontSize: '0.98rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #00BAF2 0%, #0082c8 100%)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(0, 186, 242, 0.3)',
              marginBottom: '16px',
              cursor: 'pointer'
            }}
          >
            <span>🚀</span>
            <span>{processing ? 'Processing Razorpay Payment...' : `Open Razorpay Checkout (${paymentData.razorpayOrderId})`}</span>
          </button>

          {/* Domestic Test Payment Methods Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#fff' }}>
                💡 Recommended Indian Domestic Test Credentials
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                Click to copy
              </span>
            </div>

            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: '1.4' }}>
              To prevent <em>"International Card Not Allowed"</em>, use Razorpay's official Indian Domestic test cards, Netbanking, or UPI:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {testPaymentMethods.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => copyToClipboard(m.number, idx)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{m.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#e2e8f0' }}>{m.type}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {m.displayNumber} {m.expiry !== 'N/A' && `• Exp: ${m.expiry} • CVV: ${m.cvv}`}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    color: copiedIndex === idx ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                    fontWeight: '600'
                  }}>
                    {copiedIndex === idx ? '✓ Copied!' : 'Copy'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              color: 'var(--accent-rose)',
              fontSize: '0.82rem',
              marginTop: '12px'
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RazorpayModal;
