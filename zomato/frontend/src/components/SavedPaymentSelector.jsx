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
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    fetchAgentPaymentMethods();
  }, [userEmail]);

  const fetchAgentPaymentMethods = async () => {
    try {
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
      console.warn('Fallback to standard payment options:', err);
    }
  };

  const handleSelect = async (method) => {
    onSelectMethod(method);
    try {
      await fetch(`${AGENT_API}/user/payment-methods/default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, methodId: method.id })
      });
      setStatusMsg(`Synced ${method.label || method.brand} to Agent Memory`);
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err) {}
  };

  const filtered = methods.filter(m => m.category === activeCategory);

  return (
    <div style={{
      background: '#f8f8f8',
      border: '1px solid #eeeeee',
      borderRadius: '12px',
      padding: '14px',
      marginTop: '14px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '15px' }}>🛡️</span>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#1c1c1c' }}>
            Agent Memory Payment Vault
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#e23744', fontWeight: '700' }}>
          Synced with Zomato ✓
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
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
              padding: '6px 8px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeCategory === tab.id ? '#e23744' : '#ffffff',
              color: activeCategory === tab.id ? '#ffffff' : '#696969',
              boxShadow: activeCategory === tab.id ? '0 2px 6px rgba(226, 55, 68, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
        {filtered.map(m => {
          const isSelected = selectedMethod?.id === m.id;
          return (
            <div
              key={m.id}
              onClick={() => handleSelect(m)}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: isSelected ? '1.5px solid #e23744' : '1px solid #e8e8e8',
                background: isSelected ? '#fef2f2' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1c1c1c' }}>
                    {m.label || m.brand}
                  </div>
                  <div style={{ fontSize: '10px', color: '#828282' }}>
                    Limit: ₹{(m.autoDebitLimit || 25000).toLocaleString()}
                  </div>
                </div>
              </div>
              <input
                type="radio"
                name="zomatoPaymentRadio"
                checked={isSelected}
                onChange={() => handleSelect(m)}
                style={{ accentColor: '#e23744' }}
              />
            </div>
          );
        })}
      </div>

      {statusMsg && (
        <div style={{ marginTop: '6px', fontSize: '11px', color: '#24963f', fontWeight: '700', textAlign: 'center' }}>
          ✓ {statusMsg}
        </div>
      )}
    </div>
  );
}
