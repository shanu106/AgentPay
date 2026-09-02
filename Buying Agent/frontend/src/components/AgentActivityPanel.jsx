import React from 'react';

function AgentActivityPanel({ steps = [], toolCalls = [], loading, agentResult, activeOrder, confirmedOrder, onConfirmCheckout }) {
  const needsConfirmation = agentResult && (agentResult.requiresConfirmation || agentResult.requiresCheckout) && !confirmedOrder && (activeOrder || agentResult.order);
  const amountToPay = activeOrder?.amount || agentResult?.order?.amount || 0;

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

        {/* Prominent Confirmation CTA Banner when Amount Exceeds Auto-Approval */}
        {needsConfirmation && (
          <div style={{
            marginTop: '14px',
            padding: '14px 16px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(99, 102, 241, 0.12))',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <span style={{ fontWeight: '700', fontSize: '0.88rem', color: '#fbbf24' }}>
                  User Confirmation Required
                </span>
              </div>
              <span style={{
                fontSize: '0.92rem',
                fontWeight: '800',
                color: '#fff',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                ₹{amountToPay.toLocaleString()}
              </span>
            </div>
            
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {agentResult.order?.productTitle || 'Your order'} exceeds the automatic approval limit. Click below to review and authorize payment.
            </p>

            <button
              type="button"
              className="btn-primary-blue"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.88rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #00BAF2 0%, #0082c8 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 186, 242, 0.35)'
              }}
              onClick={onConfirmCheckout}
            >
              <span>💳 Confirm & Complete Razorpay Checkout (₹{amountToPay.toLocaleString()})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentActivityPanel;

