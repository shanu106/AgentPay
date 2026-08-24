import React, { useState, useEffect } from 'react';
import { fetchUserOrders } from '../api/agentApi';

const OrderHistoryModal = ({ isOpen, onClose, userEmail, userName }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (isOpen && userEmail) {
      loadOrders();
    }
  }, [isOpen, userEmail]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchUserOrders(userEmail);
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.warn('Failed to load order history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalSpent = orders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
  const filteredOrders = orders.filter(o => 
    !filter || 
    (o.productTitle && o.productTitle.toLowerCase().includes(filter.toLowerCase())) ||
    (o.orderId && o.orderId.toLowerCase().includes(filter.toLowerCase())) ||
    (o.razorpayPaymentId && o.razorpayPaymentId.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', width: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              📦
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Order History & Invoices</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                PostgreSQL Stored Orders for <strong>{userName || 'User'}</strong> ({userEmail})
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Stats Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          margin: '16px 0 12px 0'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '10px 14px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Orders
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#60a5fa', marginTop: '2px' }}>
              {orders.length}
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '10px 14px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Autonomous Spend
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#34d399', marginTop: '2px' }}>
              ₹{totalSpent.toLocaleString()}
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '10px 14px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Database Status
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#a78bfa', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              PostgreSQL Connected
            </div>
          </div>
        </div>

        {/* Search / Filter */}
        <div style={{ marginBottom: '14px', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search by order ID, course/dish name, or payment ID..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="config-input"
            style={{ flex: 1 }}
          />
          <button
            onClick={loadOrders}
            className="btn-refresh"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Orders List Container */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
              Loading orders from PostgreSQL...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '10px',
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
              <p style={{ margin: 0, fontWeight: '600', color: '#e2e8f0' }}>No orders found</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                Ask the Buying Agent to buy any course or food items to see them here!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredOrders.map((order, idx) => (
                <div
                  key={order.orderId || idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', fontSize: '15px', color: '#f8fafc' }}>
                          {order.productTitle || 'Ordered Items'}
                        </span>
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          ✓ {order.paymentStatus === 'paid' ? 'PAID' : (order.status || 'CONFIRMED').toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        Order ID: <code style={{ color: '#93c5fd' }}>{order.orderId}</code> • {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Recent'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#34d399' }}>
                        ₹{parseFloat(order.amount || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {order.quantity || 1} Item(s)
                      </div>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    fontSize: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    {order.razorpayPaymentId && (
                      <div style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        color: '#93c5fd'
                      }}>
                        💳 Razorpay ID: <code>{order.razorpayPaymentId}</code>
                      </div>
                    )}

                    {order.paymentMethod?.label && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        color: '#cbd5e1'
                      }}>
                        ⚡ Paid via: {order.paymentMethod.label || order.paymentMethod.brand}
                      </div>
                    )}

                    {order.deliveryAddress?.street && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        color: '#cbd5e1'
                      }}>
                        📍 {order.deliveryAddress.label || 'Home'} ({order.deliveryAddress.city})
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryModal;
