import React, { useState } from 'react';
import { updateApiKey } from '../api/agentApi';

function ApiKeyModal({ isOpen, onClose, config, onKeyUpdated }) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    try {
      setLoading(true);
      const res = await updateApiKey(apiKey.trim());
      setMsg({ success: true, text: 'Google Gemini API Key saved and activated!' });
      if (onKeyUpdated) onKeyUpdated(apiKey.trim());
      setTimeout(() => {
        onClose();
        setMsg(null);
        setApiKey('');
      }, 1200);
    } catch (err) {
      setMsg({ success: false, text: err.message || 'Failed to update API key.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🔑</span>
            <div>
              <h3>Google Gemini API Key Settings</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Powers real-time tool calling and generative shopping intelligence
              </p>
            </div>
          </div>
          <button className="btn-close-drawer" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div style={{
            padding: '12px 16px',
            background: config?.hasKey ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${config?.hasKey ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: '10px',
            fontSize: '0.85rem',
            color: config?.hasKey ? 'var(--accent-emerald)' : 'var(--accent-amber)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{config?.hasKey ? '🟢' : '🟡'}</span>
            <span>
              {config?.hasKey 
                ? `Active Gemini Key Configured: ${config.keyMasked}` 
                : 'No key in backend .env (Running in Local Reasoning Simulation Mode)'}
            </span>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label>Enter Google Gemini API Key:</label>
              <input
                type="password"
                className="form-input"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)' }}
                required
              />
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

            <button
              type="submit"
              disabled={loading || !apiKey.trim()}
              className="btn-checkout"
            >
              {loading ? 'Saving Key...' : 'Save & Activate Gemini Model'}
            </button>
          </form>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
            💡 <strong>How to get a key:</strong>
            <ol style={{ paddingLeft: '18px', marginTop: '6px' }}>
              <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>Google AI Studio (aistudio.google.com)</a></li>
              <li>Click <strong>Create API Key</strong></li>
              <li>Paste the key above or save in <code>Buying Agent/backend/.env</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApiKeyModal;
