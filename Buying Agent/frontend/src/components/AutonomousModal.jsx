import React, { useState } from 'react';
import { runAutonomousMission } from '../api/agentApi';

const sampleGoals = [
  'Build a fullstack web developer bundle under ₹1,200 with highest ratings',
  'Find the best AI & Python data science courses and apply maximum discounts',
  'Find high quality developer mechanical keyboard & headphones under ₹9,000',
  'Find essential software engineering books under ₹1,500'
];

function AutonomousModal({ isOpen, onClose, onCartUpdated, onOrderPlaced }) {
  const [goal, setGoal] = useState('');
  const [budget, setBudget] = useState('1500');
  const [category, setCategory] = useState('All');
  const [autoCheckout, setAutoCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('Nawaz Shopper');
  const [customerEmail, setCustomerEmail] = useState('nawaz@example.com');
  const [loading, setLoading] = useState(false);
  const [missionResult, setMissionResult] = useState(null);

  if (!isOpen) return null;

  const handleLaunch = async (e) => {
    e.preventDefault();
    if (!goal.trim()) return;

    try {
      setLoading(true);
      setMissionResult(null);

      const res = await runAutonomousMission({
        goal,
        budget: Number(budget) || undefined,
        category,
        autoCheckout,
        customerName,
        customerEmail
      });

      setMissionResult(res);
      if (res.cart && onCartUpdated) {
        onCartUpdated(res.cart);
      }
    } catch (err) {
      setMissionResult({
        success: false,
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            <div>
              <h3>Autonomous Auto-Pilot Shopping Mission</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', margin: 0 }}>
                Set high-level criteria — Gemini will find, evaluate, discount & buy for you
              </p>
            </div>
          </div>
          <button className="btn-close-drawer" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {!missionResult ? (
            <form onSubmit={handleLaunch} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label>Mission Goal / Shopping Prompt:</label>
                <textarea
                  rows="3"
                  className="form-input"
                  placeholder="e.g. Find the best React and Python courses under ₹1200, apply coupon and add to cart..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                />
              </div>

              {/* Sample Goals */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {sampleGoals.map((sg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setGoal(sg)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    💡 {sg}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Max Budget (₹ INR):</label>
                  <input
                    type="number"
                    className="form-input"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="1500"
                  />
                </div>

                <div className="form-group">
                  <label>Category Focus:</label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    <option value="Courses">Courses Only</option>
                    <option value="Hardware">Hardware & Peripherals</option>
                    <option value="Books">Books & Manuals</option>
                    <option value="Subscriptions">Subscriptions</option>
                  </select>
                </div>
              </div>

              <div style={{
                padding: '14px 18px',
                background: 'rgba(0, 242, 254, 0.05)',
                border: '1px dashed rgba(0, 242, 254, 0.25)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '700' }}>
                    Auto-Checkout & Purchase Execution
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Automatically place the order upon finding matching items
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoCheckout}
                  onChange={(e) => setAutoCheckout(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !goal.trim()}
                className="btn-checkout"
                style={{ marginTop: '8px' }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div className="spinner"></div> Executing Autonomous Mission...
                  </span>
                ) : (
                  '🚀 Launch Auto-Pilot Shopping Agent'
                )}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '1.4rem' }}>✅</span>
                <div>
                  <strong>Mission Completed Successfully!</strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1' }}>{missionResult.missionGoal}</p>
                </div>
              </div>

              {/* Agent Report */}
              <div style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '18px',
                whiteSpace: 'pre-wrap',
                fontSize: '0.88rem',
                lineHeight: '1.6',
                color: '#e2e8f0'
              }}>
                {missionResult.reply}
              </div>

              {/* Executed Tools */}
              {missionResult.toolExecutions && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Autonomous Tool Call Log ({missionResult.toolExecutions.length} steps):
                  </span>
                  {missionResult.toolExecutions.map((t, i) => (
                    <div key={i} className="tool-execution-pill">
                      <span>Step {i + 1}:</span>
                      <strong>{t.tool}()</strong>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn-checkout"
                onClick={() => setMissionResult(null)}
              >
                Start Another Mission
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AutonomousModal;
