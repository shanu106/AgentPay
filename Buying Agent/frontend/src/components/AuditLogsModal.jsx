import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fetchAuditLogs } from '../api/agentApi';

function AuditLogsModal({ isOpen = true, onClose, isEmbedded = false }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const content = (
    <div className={isEmbedded ? "terminal-card" : "modal-box"} style={isEmbedded ? { width: '100%', maxWidth: '960px', margin: '0 auto' } : { maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📜</span>
            <div>
              <h3>Security & Agent Tool Call Audit Logs</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Spec Section 16 — Backend Control & Authorization Trace
              </p>
            </div>
          </div>
          {onClose && (
            <button className="modal-close-btn" onClick={onClose} aria-label="Close" title="Close">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner"></div>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No audit logs recorded yet. Submit a purchase request to generate logs.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {logs.map((log) => {
                const isAuth = log.type === 'AUTHORIZATION_CHECK';
                const isDenied = log.type === 'ORDER_CREATION_DENIED';
                const isSuccess = log.type === 'PAYMENT_VERIFIED_SUCCESS' || log.type === 'ORDER_CREATION_SUCCESS';

                return (
                  <div
                    key={log.id}
                    style={{
                      background: isDenied ? 'rgba(244, 63, 94, 0.08)' : isSuccess ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-input)',
                      border: `1px solid ${isDenied ? 'rgba(244, 63, 94, 0.3)' : isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                      borderRadius: '10px',
                      padding: '12px 16px',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{
                        fontWeight: '700',
                        color: isDenied ? 'var(--accent-rose)' : isSuccess ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {log.type}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <pre style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      overflowX: 'auto',
                      color: '#cbd5e1',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      margin: 0
                    }}>
                      {JSON.stringify(log.details, null, 2)}
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
