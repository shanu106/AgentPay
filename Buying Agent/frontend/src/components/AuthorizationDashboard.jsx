import React, { useState, useEffect } from 'react';
import { fetchAuthorization, updateAuthorization, revokeAuthorization } from '../api/agentApi';

const AuthorizationDashboard = ({ isOpen = true, onClose, userEmail, onPolicyUpdated, isEmbedded = false }) => {
  const [loading, setLoading] = useState(false);
  const [authData, setAuthData] = useState(null);
  const [spendingStats, setSpendingStats] = useState(null);
  const [maxTxAmount, setMaxTxAmount] = useState(5000);
  const [dailyLimit, setDailyLimit] = useState(10000);
  const [confirmationThreshold, setConfirmationThreshold] = useState(3000);
  const [categories, setCategories] = useState(['courses', 'food', 'electronics']);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen || isEmbedded) {
      loadAuthorization();
    }
  }, [isOpen, isEmbedded, userEmail]);

  const loadAuthorization = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchAuthorization(userEmail);
      if (res.success && res.authorization) {
        setAuthData(res.authorization);
        setSpendingStats(res.spendingStats);
        setMaxTxAmount(parseFloat(res.authorization.max_transaction_amount) || 5000);
        setDailyLimit(parseFloat(res.authorization.daily_spending_limit) || 10000);
        setConfirmationThreshold(parseFloat(res.authorization.require_confirmation_above) || 3000);
        setCategories(res.authorization.allowed_categories || ['courses', 'food', 'electronics']);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load authorization.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await updateAuthorization({
        maxTransactionAmount: maxTxAmount,
        dailySpendingLimit: dailyLimit,
        requireConfirmationAbove: confirmationThreshold,
        allowedCategories: categories,
        expiresInDays
      }, userEmail);

      setStatusMessage(res.message || 'Authorization policy updated successfully.');
      setAuthData(res.authorization);
      setSpendingStats(res.spendingStats);
      if (onPolicyUpdated) onPolicyUpdated(res.authorization);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update authorization.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!authData?.id) return;
    if (!window.confirm('Are you sure you want to revoke AI shopping authorization? Autonomous orders will be denied until re-enabled.')) return;

    setLoading(true);
    try {
      const res = await revokeAuthorization(authData.id);
      setStatusMessage('Authorization revoked. AI agent cannot make autonomous purchases.');
      setAuthData(res.authorization);
      if (onPolicyUpdated) onPolicyUpdated(res.authorization);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to revoke authorization.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (cat) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter(c => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  if (!isOpen && !isEmbedded) return null;

  const spentToday = parseFloat(spendingStats?.spentToday || authData?.spent_today || 0);
  const currentDailyLimit = parseFloat(spendingStats?.dailyLimit || authData?.daily_spending_limit || 10000);
  const spentPct = Math.min(100, Math.round((spentToday / (currentDailyLimit || 1)) * 100));
  const isActive = authData?.status === 'active';

  const content = (
    <div className={isEmbedded ? "terminal-card" : "modal-content"} onClick={e => e.stopPropagation()} style={isEmbedded ? { width: '100%', maxWidth: '840px', margin: '0 auto' } : { maxWidth: '620px', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🛡️
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff' }}>
                AI Shopping Authorization & Policies
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Deterministic policy engine & atomic spending limits in PostgreSQL
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Status Pill */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: isActive ? '#10b981' : '#ef4444', display: 'inline-block' }}></span>
            <strong style={{ color: isActive ? '#34d399' : '#f87171', fontSize: '13px' }}>
              {isActive ? 'AGENT AUTHORIZATION ACTIVE' : 'AUTHORIZATION REVOKED / INACTIVE'}
            </strong>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            User: <strong style={{ color: '#93c5fd' }}>{userEmail || 'nawaz@gmail.com'}</strong>
          </span>
        </div>

        {/* Daily Spending Progress Bar */}
        <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            <span>Daily Spending Ledger</span>
            <span style={{ fontWeight: '700', color: '#fff' }}>
              ₹{spentToday.toLocaleString()} / ₹{currentDailyLimit.toLocaleString()} ({spentPct}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${spentPct}%`, height: '100%', background: spentPct > 80 ? '#ef4444' : '#10b981', transition: 'width 0.3s ease' }}></div>
          </div>
        </div>

        {statusMessage && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '12px', marginBottom: '14px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            ✓ {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '12px', marginBottom: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            ✕ {errorMessage}
          </div>
        )}

        {/* Form Controls */}
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Max Per-Transaction Limit (₹)
              </label>
              <input
                type="number"
                min="100"
                max="100000"
                step="100"
                value={maxTxAmount}
                onChange={e => setMaxTxAmount(Number(e.target.value))}
                className="config-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Orders above this will be DENIED</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Daily Spending Limit (₹)
              </label>
              <input
                type="number"
                min="500"
                max="200000"
                step="500"
                value={dailyLimit}
                onChange={e => setDailyLimit(Number(e.target.value))}
                className="config-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Resets daily at 00:00 UTC</span>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Require Explicit User Confirmation Above (₹)
            </label>
            <input
              type="number"
              min="0"
              max="100000"
              step="100"
              value={confirmationThreshold}
              onChange={e => setConfirmationThreshold(Number(e.target.value))}
              className="config-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Autonomous 0-click purchases are allowed below this threshold. Amounts above require manual confirmation button click.
            </span>
          </div>

          {/* Allowed Categories */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Allowed Autonomous Purchase Categories
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'courses', label: '📚 Courses & Tech' },
                { id: 'food', label: '🍴 Food & Biryani' },
                { id: 'electronics', label: '💻 Electronics & Gear' }
              ].map(cat => {
                const isChecked = categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                      background: isChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: isChecked ? '#34d399' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: isChecked ? '700' : '500'
                    }}
                  >
                    {isChecked ? '✓ ' : '+ '} {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={handleRevoke}
              disabled={loading || !isActive}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                cursor: isActive ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              🚫 Revoke Authorization
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="modal-btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                {loading ? 'Saving...' : '💾 Save Policy'}
              </button>
            </div>
          </div>
        </form>
      </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      {content}
    </div>
  );
};

export default AuthorizationDashboard;
