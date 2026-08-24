import React, { useState } from 'react';
import { signupUser, loginUser } from '../api/agentApi';

const AuthModal = ({ isOpen, onClose, currentUser, onAuthSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLoginView) {
        const res = await loginUser({ email, password });
        setSuccessMsg(res.message || 'Logged in successfully!');
        if (onAuthSuccess) onAuthSuccess(res.user, res.token);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        const res = await signupUser({ name, email, password, phone });
        setSuccessMsg(res.message || 'Account created successfully!');
        if (onAuthSuccess) onAuthSuccess(res.user, res.token);
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content auth-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              👤
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                {isLoginView ? 'User Login' : 'Create New Account'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                PostgreSQL Connected Storage
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* View Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: '8px',
          padding: '4px',
          margin: '16px 0 12px 0'
        }}>
          <button
            type="button"
            onClick={() => { setIsLoginView(true); setError(null); setSuccessMsg(null); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              background: isLoginView ? 'var(--accent-blue, #2563eb)' : 'transparent',
              color: isLoginView ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            🔑 Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsLoginView(false); setError(null); setSuccessMsg(null); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              background: !isLoginView ? 'var(--accent-blue, #2563eb)' : 'transparent',
              color: !isLoginView ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            ✨ Sign Up
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '13px',
            color: '#f87171',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '13px',
            color: '#34d399',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLoginView && (
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Nawaz Khan"
                value={name}
                onChange={e => setName(e.target.value)}
                required={!isLoginView}
                className="config-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. nawaz@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="config-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password (default: password123)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="config-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {!isLoginView && (
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="config-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff',
              fontWeight: '700',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              marginTop: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Processing...' : (isLoginView ? '🔑 Log In to Account' : '✨ Create PostgreSQL Account')}
          </button>
        </form>

        <div style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <div>
            Active: <strong style={{ color: '#93c5fd' }}>{currentUser?.email || 'nawaz@gmail.com'}</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('buying_agent_token');
              if (onAuthSuccess) onAuthSuccess(null, null);
              setSuccessMsg('Signed out of session.');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12px'
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
