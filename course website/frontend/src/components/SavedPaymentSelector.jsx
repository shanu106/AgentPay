import React, { useState, useEffect } from 'react';

const AGENT_API = 'http://localhost:8001/api';

const DEFAULT_METHODS = [
  { id: 'pm_visa_1007', type: 'card', brand: 'Visa (Domestic)', last4: '1007', label: 'Visa Domestic Debit (•••• 1007)', autoDebitLimit: 15000, category: 'cards', icon: '💳' },
  { id: 'pm_icici_4022', type: 'card', brand: 'Amazon Pay ICICI Card', last4: '4022', label: 'Amazon Pay ICICI (•••• 4022)', autoDebitLimit: 25000, category: 'cards', icon: '💳' },
  { id: 'pm_bob_nb', type: 'netbanking', brand: 'Bank of Baroda', bankName: 'Bank of Baroda', label: 'Bank of Baroda (BOB) NetBanking', autoDebitLimit: 50000, category: 'netbanking', icon: '🏦' },
  { id: 'pm_sbi_nb', type: 'netbanking', brand: 'State Bank of India', bankName: 'State Bank of India', label: 'SBI NetBanking', autoDebitLimit: 50000, category: 'netbanking', icon: '🏦' },
  { id: 'pm_hdfc_nb', type: 'netbanking', brand: 'HDFC Bank', bankName: 'HDFC Bank', label: 'HDFC Bank NetBanking', autoDebitLimit: 50000, category: 'netbanking', icon: '🏦' },
  { id: 'pm_upi_gpay', type: 'upi', brand: 'Google Pay UPI', vpa: 'nawaz@okhdfcbank', label: 'Google Pay UPI (nawaz@okhdfcbank)', autoDebitLimit: 25000, category: 'upi', icon: '⚡' },
  { id: 'pm_upi_phonepe', type: 'upi', brand: 'PhonePe UPI', vpa: 'nawaz@ybl', label: 'PhonePe UPI (nawaz@ybl)', autoDebitLimit: 25000, category: 'upi', icon: '⚡' }
];

export function SavedPaymentSelector({ selectedMethod, onSelectMethod, userEmail = 'nawaz@gmail.com' }) {
  const [methods, setMethods] = useState(DEFAULT_METHODS);
  const [activeCategory, setActiveCategory] = useState('cards');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    fetchAgentPaymentMethods();
  }, [userEmail]);

  const fetchAgentPaymentMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${AGENT_API}/user/payment-methods?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.success && data.paymentMethods && data.paymentMethods.length > 0) {
        const formatted = data.paymentMethods.map(m => ({
          ...m,
          category: m.type === 'netbanking' ? 'netbanking' : (m.type === 'upi' ? 'upi' : 'cards'),
          icon: m.type === 'netbanking' ? '🏦' : (m.type === 'upi' ? '⚡' : '💳')
        }));
        setMethods(formatted);
        if (!selectedMethod && data.defaultMethod) {
          onSelectMethod(data.defaultMethod);
        }
      }
    } catch (err) {
      console.warn('Agent payment methods fetch fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (method) => {
    onSelectMethod(method);
    try {
      // Sync default choice to agent memory
      await fetch(`${AGENT_API}/user/payment-methods/default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, methodId: method.id })
      });
      setStatusMsg(`Synced ${method.label || method.brand} to Agent Memory`);
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err) {
      // Ignore network failures gracefully
    }
  };

  const filtered = methods.filter(m => m.category === activeCategory);

  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>🛡️</span>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
            Razorpay Agent Memory Wallet
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '600' }}>
          Cross-Merchant Synced ✓
        </span>
      </div>

      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.4 }}>
        Select your preferred payment instrument. Once configured, your choice is remembered across all integrated stores.
      </p>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {[
          { id: 'cards', label: '💳 Cards' },
          { id: 'netbanking', label: '🏦 NetBanking' },
          { id: 'upi', label: '⚡ Instant UPI' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveCategory(tab.id)}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeCategory === tab.id ? '#0284c7' : '#e2e8f0',
              color: activeCategory === tab.id ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payment Options List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
        {filtered.map(m => {
          const isSelected = selectedMethod?.id === m.id;
          return (
            <div
              key={m.id}
              onClick={() => handleSelect(m)}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: isSelected ? '#f0f9ff' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    {m.label || m.brand}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {m.type === 'netbanking' ? `Bank Code: ${m.bank || 'Direct'}` : m.type === 'upi' ? `VPA: ${m.vpa || 'Direct UPI'}` : `Card Ending: ${m.last4 || '1007'}`} • Limit: ₹{(m.autoDebitLimit || 25000).toLocaleString()}
                  </div>
                </div>
              </div>
              <input
                type="radio"
                name="selectedPaymentInstrument"
                checked={isSelected}
                onChange={() => handleSelect(m)}
                style={{ accentColor: '#0284c7', width: '16px', height: '16px' }}
              />
            </div>
          );
        })}
      </div>

      {statusMsg && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#16a34a', fontWeight: '600', textAlign: 'center' }}>
          ✓ {statusMsg}
        </div>
      )}
    </div>
  );
}
