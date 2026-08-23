import React from 'react';
import { Sparkles, Zap, ShieldCheck } from 'lucide-react';

export function HeroBanner({ onOpenAgent }) {
  return (
    <section style={{
      position: 'relative',
      padding: '40px 32px',
      borderRadius: '24px',
      background: 'linear-gradient(135deg, rgba(7, 25, 47, 0.9) 0%, rgba(10, 58, 120, 0.6) 100%)',
      border: '1px solid rgba(56, 189, 248, 0.2)',
      boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
      marginBottom: '36px',
      overflow: 'hidden'
    }}>
      <div style={{ maxWidth: '720px', position: 'relative', zIndex: 2 }}>
        <div className="glow-badge" style={{ marginBottom: '14px' }}>
          <Sparkles size={13} />
          <span>Razorpay Smart Commerce Assistant</span>
        </div>
        
        <h1 style={{
          fontSize: '36px',
          fontWeight: '800',
          lineHeight: 1.2,
          letterSpacing: '-0.8px',
          color: '#ffffff',
          marginBottom: '14px'
        }}>
          Conversational Shopping & Instant Secure Checkout
        </h1>
        
        <p style={{
          fontSize: '15px',
          color: '#94a3b8',
          lineHeight: 1.6,
          marginBottom: '24px'
        }}>
          Experience frictionless buyer AI. Order premium mechanical keyboards, ANC headphones, and GaN fast chargers with conversational natural language and instant Razorpay Test Mode captures.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => onOpenAgent("buy 1 Keychron K2 keyboard using visa card")}
            className="primary-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', fontSize: '14px' }}
          >
            <Zap size={16} />
            <span>Try AI Agent: "Buy Keychron K2"</span>
          </button>

          <button 
            onClick={() => onOpenAgent("is there any GAN charger available")}
            className="secondary-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '14px' }}
          >
            <span>Ask Availability: "GaN Charger"</span>
          </button>
        </div>
      </div>

      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '320px',
        height: '320px',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(2, 132, 199, 0.05) 70%, transparent 100%)',
        borderRadius: '50%',
        filter: 'blur(30px)',
        zIndex: 1,
        pointerEvents: 'none'
      }} />
    </section>
  );
}
