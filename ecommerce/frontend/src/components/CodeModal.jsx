import React, { useState } from 'react';
import { Code, CheckCircle2 } from 'lucide-react';

export function CodeModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const embedSnippet = `<script 
  src="http://localhost:8001/sdk/razorpay-agent.js"
  data-key="rzp_test_TSqKSZKcvQdzJs"
  data-merchant-id="merchant_novastore"
  data-merchant-name="NovaStore Tech & Gear"
  data-merchant-api="http://localhost:8002/api"
  data-agent-api="http://localhost:8001/api/agent"
  data-auto-debit="true">
</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '20px',
        maxWidth: '560px',
        width: '100%',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
              Razorpay Agent Drop-In SDK
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
          Add this 1-line script tag to any HTML/React page to immediately enable autonomous AI shopping and pre-authorized 0-click checkout on your store:
        </p>

        <pre style={{
          background: '#020617',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#38bdf8',
          fontSize: '12px',
          lineHeight: 1.6,
          overflowX: 'auto',
          fontFamily: 'monospace',
          marginBottom: '20px'
        }}>
          {embedSnippet}
        </pre>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={copyToClipboard}
            className="primary-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '13px' }}
          >
            {copied ? <CheckCircle2 size={16} /> : <Code size={16} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Script Tag'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
