import React from 'react';

function AgentActivityPanel({ steps = [], toolCalls = [], loading }) {
  return (
    <div className="activity-panel">
      <div className="activity-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <h4>Live Buyer Agent Activity & Decision Trace</h4>
        </div>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
            <div className="spinner" style={{ width: '14px', height: '14px' }}></div>
            <span>Reasoning & Calling Tools...</span>
          </div>
        )}
      </div>

      <div className="activity-steps-feed">
        {steps.length === 0 && !loading && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Enter a purchase request above (e.g. <em>"Buy me a DSA course up to ₹10,000"</em>) to see the agent reasoning pipeline in real time.
          </div>
        )}

        {steps.map((step, idx) => {
          const isDenied = step.status === 'denied' || step.status === 'failed';
          const isPending = step.status === 'pending_payment';
          const icon = isDenied ? '❌' : isPending ? '💳' : '✓';

          return (
            <div 
              key={idx} 
              className={`activity-step-item ${isDenied ? 'denied' : isPending ? 'pending' : 'completed'}`}
            >
              <span className={`step-badge-icon ${isDenied ? 'denied' : isPending ? 'pending' : 'completed'}`}>
                {icon}
              </span>
              <div className="step-body">
                <div className="step-text">{step.text}</div>
                {step.count !== undefined && (
                  <span className="step-meta">Found {step.count} candidates in merchant catalog</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AgentActivityPanel;
