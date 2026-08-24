import React, { useState, useEffect } from 'react';
import { fetchUserOrders } from '../api/agentApi';

const TransactionDashboard = ({ isOpen = true, onClose, userEmail, isEmbedded = false }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'paid' | 'pending' | 'denied'

  useEffect(() => {
    if (isOpen || isEmbedded) {
      loadTransactions();
    }
  }, [isOpen, isEmbedded, userEmail]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetchUserOrders(userEmail);
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.warn('Failed to load transactions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !isEmbedded) return null;

  const filteredOrders = orders.filter(o => {
    if (filter === 'paid') return o.payment_status === 'paid';
    if (filter === 'pending') return o.payment_status === 'pending';
    if (filter === 'failed') return o.status === 'failed' || o.payment_status === 'failed';
    return true;
  });

  const content = (
    <div className={isEmbedded ? "terminal-card" : "modal-content"} onClick={e => e.stopPropagation()} style={isEmbedded ? { width: '100%', maxWidth: '960px', margin: '0 auto' } : { maxWidth: '780px', padding: '24px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              📊
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff' }}>
                Transactions & Policy Decision Trace
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Auditable ledger of autonomous and confirmed transactions
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { id: 'all', label: `All Transactions (${orders.length})` },
            { id: 'paid', label: `Captured / Paid (${orders.filter(o => o.payment_status === 'paid').length})` },
            { id: 'pending', label: `Pending (${orders.filter(o => o.payment_status === 'pending').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: filter === tab.id ? 'var(--accent-blue, #2563eb)' : 'rgba(255, 255, 255, 0.05)',
                color: filter === tab.id ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              No transactions found matching this filter.
            </div>
          ) : (
            filteredOrders.map(order => {
              const isPaid = order.payment_status === 'paid';
              return (
                <div
                  key={order.order_id || order.id}
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: `1px solid ${isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '10px',
                    padding: '14px 16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>
                          {order.product_title || 'Autonomous Order'}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '700',
                          background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isPaid ? '#34d399' : '#fbbf24'
                        }}>
                          {isPaid ? 'PAID & CAPTURED ✓' : 'PAYMENT PENDING'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Order ID: <code style={{ color: '#93c5fd' }}>{order.order_id}</code> • {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#34d399' }}>
                        ₹{parseFloat(order.amount || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Razorpay: <code style={{ color: '#93c5fd' }}>{order.razorpay_payment_id || order.razorpay_order_id || 'N/A'}</code>
                      </div>
                    </div>
                  </div>

                  {/* Items list */}
                  {Array.isArray(order.items) && order.items.length > 0 && (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '6px' }}>
                      {order.items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>• {it.quantity || 1}x {it.title || it.productTitle}</span>
                          <span>₹{(it.lineTotal || (it.unitPrice * (it.quantity || 1)) || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', marginTop: '16px' }}>
          {onClose && (
            <button
              type="button"
              className="modal-btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>
  );

  if (isEmbedded) return content;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      {content}
    </div>
  );
};

export default TransactionDashboard;
