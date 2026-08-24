import React, { useState, useEffect } from 'react';
import { fetchMerchants, updateMerchantSettings } from '../api/agentApi';

const MerchantDashboard = ({ isOpen = true, onClose, isEmbedded = false }) => {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen || isEmbedded) {
      loadMerchants();
    }
  }, [isOpen, isEmbedded]);

  const loadMerchants = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchMerchants();
      if (res.success && res.merchants) {
        setMerchants(res.merchants);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load merchants.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCommerce = async (merchantId, currentStatus) => {
    setLoading(true);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      const res = await updateMerchantSettings({
        merchantId,
        agentCommerceEnabled: !currentStatus
      });
      setStatusMsg(res.message || 'Merchant settings updated.');
      await loadMerchants();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update merchant settings.');
      setLoading(false);
    }
  };

  const handleUpdateLimit = async (merchantId, newLimit) => {
    const limit = parseFloat(newLimit);
    if (isNaN(limit) || limit <= 0) return;
    setLoading(true);
    try {
      await updateMerchantSettings({
        merchantId,
        maxAutonomousOrderAmount: limit
      });
      setStatusMsg('Merchant autonomous checkout limit updated.');
      await loadMerchants();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update limit.');
      setLoading(false);
    }
  };

  if (!isOpen && !isEmbedded) return null;

  const content = (
    <div className={isEmbedded ? "terminal-card" : "modal-content"} onClick={e => e.stopPropagation()} style={isEmbedded ? { width: '100%', maxWidth: '840px', margin: '0 auto' } : { maxWidth: '650px', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🏪
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff' }}>
                Merchant AI-Commerce Dashboard
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Store-side autonomous ordering controls & limits
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {statusMsg && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '12px', marginBottom: '14px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            ✓ {statusMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '12px', marginBottom: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            ✕ {errorMsg}
          </div>
        )}

        {/* Merchants List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {merchants.map(m => {
            const isEnabled = m.agent_commerce_enabled !== false;
            return (
              <div
                key={m.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: `1px solid ${isEnabled ? 'rgba(99, 102, 241, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                      {m.name}
                    </h3>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '700',
                      background: isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isEnabled ? '#34d399' : '#f87171'
                    }}>
                      {isEnabled ? 'AI COMMERCE ACTIVE' : 'AI COMMERCE DISABLED'}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    API: <code style={{ color: '#93c5fd' }}>{m.api_base_url || 'http://localhost:8000/api'}</code>
                  </p>

                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span>Max Autonomous Order:</span>
                    <input
                      type="number"
                      defaultValue={m.max_autonomous_order_amount || 10000}
                      onBlur={e => handleUpdateLimit(m.id, e.target.value)}
                      style={{
                        width: '80px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}
                    />
                    <span>₹</span>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => handleToggleCommerce(m.id, isEnabled)}
                    disabled={loading}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isEnabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: isEnabled ? '#f87171' : '#34d399',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}
                  >
                    {isEnabled ? '🚫 Disable Agent Purchases' : '✓ Enable Agent Purchases'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
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

export default MerchantDashboard;
