import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Shield, Search, Filter } from 'lucide-react';
import { fetchAuditLogs } from '../api/agentApi';

function AuditLogsModal({ isOpen = true, onClose, isEmbedded = false }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'orders' | 'policy' | 'tools' | 'auth'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen || isEmbedded) {
      loadLogs();
    }
  }, [isOpen, isEmbedded]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchAuditLogs();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !isEmbedded) return null;

  const filteredLogs = logs.filter(log => {
    const type = (log.type || log.action_type || log.actionType || '').toUpperCase();
    const email = (log.userEmail || log.user_email || '').toLowerCase();
    const orderId = (log.orderId || log.order_id || '').toLowerCase();
    const detailsStr = JSON.stringify(log.details || {}).toLowerCase();
    const search = searchQuery.toLowerCase().trim();

    if (search && !type.toLowerCase().includes(search) && !email.includes(search) && !orderId.includes(search) && !detailsStr.includes(search)) {
      return false;
    }

    if (filterTab === 'orders') {
      return type.includes('ORDER') || type.includes('PAYMENT') || type.includes('RECEIPT');
    }
    if (filterTab === 'policy') {
      return type.includes('POLICY') || type.includes('AUTHORIZATION') || type.includes('SPEND');
    }
    if (filterTab === 'tools') {
      return type.includes('TOOL') || type.includes('INTENT');
    }
    if (filterTab === 'auth') {
      return type.includes('USER_') || type.includes('LOGIN') || type.includes('SIGNUP') || type.includes('OTP');
    }
    return true;
  });

  const getLogColorTheme = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('DENIED') || t.includes('FAIL') || t.includes('ERROR') || t.includes('REVOKE')) {
      return {
        bg: 'rgba(244, 63, 94, 0.08)',
        border: 'rgba(244, 63, 94, 0.3)',
        text: '#fb7185',
        badgeBg: 'rgba(244, 63, 94, 0.18)'
      };
    }
    if (t.includes('CAPTURED') || t.includes('SUCCESS') || t.includes('COMPLETED') || t.includes('ALLOW') || t.includes('DISPATCHED')) {
      return {
        bg: 'rgba(16, 185, 129, 0.08)',
        border: 'rgba(16, 185, 129, 0.3)',
        text: '#34d399',
        badgeBg: 'rgba(16, 185, 129, 0.18)'
      };
    }
    if (t.includes('POLICY') || t.includes('AUTHORIZATION') || t.includes('CONFIRMATION')) {
      return {
        bg: 'rgba(168, 85, 247, 0.08)',
        border: 'rgba(168, 85, 247, 0.3)',
        text: '#c084fc',
        badgeBg: 'rgba(168, 85, 247, 0.18)'
      };
    }
    if (t.includes('INTENT') || t.includes('TOOL')) {
      return {
        bg: 'rgba(14, 165, 233, 0.08)',
        border: 'rgba(14, 165, 233, 0.3)',
        text: '#38bdf8',
        badgeBg: 'rgba(14, 165, 233, 0.18)'
      };
    }
    return {
      bg: 'rgba(255, 255, 255, 0.03)',
      border: 'rgba(255, 255, 255, 0.08)',
      text: '#94a3b8',
      badgeBg: 'rgba(255, 255, 255, 0.08)'
    };
  };

  const content = (
    <div className={isEmbedded ? "terminal-card" : "modal-box"} style={isEmbedded ? { width: '100%', maxWidth: '960px', margin: '0 auto' } : { maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
      <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            📜
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>PostgreSQL Audit Trail & Security Ledger</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Immutable audit log of all autonomous tool calls, policy checks, and payments
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          {onClose && (
            <button className="modal-close-btn" onClick={onClose} aria-label="Close" title="Close">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Events (${logs.length})` },
            { id: 'orders', label: 'Orders & Payments' },
            { id: 'policy', label: 'Policy & Spending' },
            { id: 'tools', label: 'Tools & AI Intent' },
            { id: 'auth', label: 'Auth & Accounts' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                background: filterTab === tab.id ? 'var(--accent-blue, #2563eb)' : 'rgba(255, 255, 255, 0.05)',
                color: filterTab === tab.id ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search audit trail by event type, order ID, email, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '7px 10px 7px 32px',
              color: '#fff',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
        {loading && logs.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            No audit logs found matching this filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredLogs.map((log) => {
              const eventType = log.type || log.action_type || log.actionType || 'AUDIT_EVENT';
              const theme = getLogColorTheme(eventType);
              const orderId = log.orderId || log.order_id;
              const userEmail = log.userEmail || log.user_email;
              const logDate = log.timestamp ? new Date(log.timestamp) : new Date();

              return (
                <div
                  key={log.id}
                  style={{
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontWeight: '700',
                        color: theme.text,
                        background: theme.badgeBg,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem'
                      }}>
                        {eventType}
                      </span>
                      {orderId && (
                        <span style={{ fontSize: '0.75rem', color: '#93c5fd', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          Order: {orderId}
                        </span>
                      )}
                      {userEmail && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {userEmail}
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {logDate.toLocaleString()}
                    </span>
                  </div>

                  <pre style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    overflowX: 'auto',
                    color: '#cbd5e1',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    margin: 0
                  }}>
                    {JSON.stringify(log.details || {}, null, 2)}
                  </pre>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (isEmbedded) return content;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {content}
    </div>
  );
}

export default AuditLogsModal;
