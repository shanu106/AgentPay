import React from 'react';
import { Zap, ShieldCheck, CreditCard, Lock } from 'lucide-react';

export function TrustBadges() {
  const badges = [
    {
      icon: <Zap size={22} color="#38bdf8" />,
      title: '0-Click Autonomous Shopping',
      desc: 'Let AI negotiate, order, and pay with pre-authorized spending caps.'
    },
    {
      icon: <ShieldCheck size={22} color="#10b981" />,
      title: 'Razorpay Verified Mocksharp',
      desc: 'Instant direct API settlements across NetBanking, Cards, and UPI.'
    },
    {
      icon: <CreditCard size={22} color="#a855f7" />,
      title: 'Multi-Payment Routing',
      desc: 'Seamlessly toggle between HDFC, BOB, SBI, Visa, and Instant UPI.'
    },
    {
      icon: <Lock size={22} color="#f59e0b" />,
      title: '256-Bit SSL Encrypted',
      desc: 'Enterprise security standards for end-to-end buyer authorization.'
    }
  ];

  return (
    <section style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
      marginTop: '60px',
      marginBottom: '40px'
    }}>
      {badges.map((b, idx) => (
        <div key={idx} style={{
          padding: '24px',
          borderRadius: '18px',
          background: 'rgba(15, 23, 42, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div>{b.icon}</div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>{b.title}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>{b.desc}</div>
        </div>
      ))}
    </section>
  );
}

export function Footer() {
  return (
    <footer style={{
      marginTop: 'auto',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(10, 15, 29, 0.95)',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          © 2026 NovaStore E-Commerce • Powered by Razorpay Agentic Commerce SDK
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#94a3b8' }}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>API Docs</span>
        </div>
      </div>
    </footer>
  );
}
