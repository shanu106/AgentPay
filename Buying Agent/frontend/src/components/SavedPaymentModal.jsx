import React, { useState } from 'react';
import { updateSavedPaymentMethod } from '../api/agentApi';

const multiPaymentPresets = [
  // Cards
  { id: 'pm_visa_1007', type: 'card', brand: 'Visa (Domestic)', last4: '1007', label: 'Visa Domestic Debit (•••• 1007)', autoDebitLimit: 15000, category: 'cards', icon: '💳' },
  { id: 'pm_icici_4022', type: 'card', brand: 'Amazon Pay ICICI Card', last4: '4022', label: 'Amazon Pay ICICI (•••• 4022)', autoDebitLimit: 25000, category: 'cards', icon: '💳' },
  { id: 'pm_hdfc_3003', type: 'card', brand: 'HDFC Millennia Card', last4: '3003', label: 'HDFC Millennia (•••• 3003)', autoDebitLimit: 20000, category: 'cards', icon: '💳' },
  { id: 'pm_rupay_1005', type: 'card', brand: 'RuPay Domestic Debit', last4: '1005', label: 'RuPay Debit (•••• 1005)', autoDebitLimit: 15000, category: 'cards', icon: '💳' },
  // NetBanking
  { id: 'pm_bob_nb', type: 'netbanking', brand: 'Bank of Baroda', bankName: 'Bank of Baroda', label: 'Bank of Baroda (BOB) NetBanking', autoDebitLimit: 50000, category: 'netbanking', icon: '🏦' },
  { id: 'pm_sbi_nb', type: 'netbanking', brand: 'State Bank of India', bankName: 'State Bank of India', label: 'SBI NetBanking', autoDebitLimit: 50000, category: 'netbanking', icon: '🏦' },
  { id: 'pm_hdfc_nb', type: 'netbanking', brand: 'HDFC Bank', bankName: 'HDFC Bank', label: 'HDFC Bank NetBanking', autoDebitLimit: 50000, category: 'netbanking', icon: '🏦' },
  { id: 'pm_icici_nb', type: 'netbanking', brand: 'ICICI Bank', bankName: 'ICICI Bank', label: 'ICICI Bank NetBanking', autoDebitLimit: 50000, category: 'netbanking', icon: '🏦' },
  { id: 'pm_canara_nb', type: 'netbanking', brand: 'Canara Bank', bankName: 'Canara Bank', label: 'Canara Bank NetBanking', autoDebitLimit: 50000, category: 'netbanking', icon: '🏦' },
  { id: 'pm_axis_nb', type: 'netbanking', brand: 'Axis Bank', bankName: 'Axis Bank', label: 'Axis Bank NetBanking', autoDebitLimit: 50000, category: 'netbanking', icon: '🏦' },
  // UPI
  { id: 'pm_upi_gpay', type: 'upi', brand: 'Google Pay UPI', vpa: 'nawaz@okhdfcbank', label: 'Google Pay UPI (nawaz@okhdfcbank)', autoDebitLimit: 25000, category: 'upi', icon: '⚡' },
  { id: 'pm_upi_phonepe', type: 'upi', brand: 'PhonePe UPI', vpa: 'nawaz@ybl', label: 'PhonePe UPI (nawaz@ybl)', autoDebitLimit: 25000, category: 'upi', icon: '⚡' },
  { id: 'pm_upi_paytm', type: 'upi', brand: 'Paytm UPI', vpa: 'nawaz@paytm', label: 'Paytm UPI (nawaz@paytm)', autoDebitLimit: 25000, category: 'upi', icon: '⚡' }
];

function SavedPaymentModal({ isOpen, onClose, savedPayment, onPaymentUpdated }) {
  const [activeTab, setActiveTab] = useState('cards');
  const [selectedMethodId, setSelectedMethodId] = useState(savedPayment?.id || 'pm_visa_1007');
  const [enabled, setEnabled] = useState(savedPayment?.enabled !== false);
  const [brand, setBrand] = useState(savedPayment?.brand || 'Visa (Domestic)');
  const [last4, setLast4] = useState(savedPayment?.last4 || '1007');
  const [holder, setHolder] = useState(savedPayment?.holder || 'Nawaz Khan');
  const [autoDebitLimit, setAutoDebitLimit] = useState(savedPayment?.autoDebitLimit || 15000);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newMethodType, setNewMethodType] = useState('card');
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodIdentifier, setNewMethodIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!isOpen) return null;

  const handleMethodSelect = (preset) => {
    setSelectedMethodId(preset.id);
    setBrand(preset.brand);
    if (preset.last4) setLast4(preset.last4);
    if (preset.autoDebitLimit) setAutoDebitLimit(preset.autoDebitLimit);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const chosenPreset = multiPaymentPresets.find(p => p.id === selectedMethodId) || { brand, last4, type: 'card' };
      const res = await updateSavedPaymentMethod({
        methodId: selectedMethodId,
        enabled,
        brand: chosenPreset.brand,
        last4: chosenPreset.last4 || '1007',
        type: chosenPreset.type,
        method: chosenPreset.type,
        label: chosenPreset.label,
        holder,
        autoDebitLimit: Number(autoDebitLimit),
        isDefault: true
      });
      setMsg({ success: true, text: `Default payment method set to ${chosenPreset.label} in Agent Memory!` });
      if (onPaymentUpdated) onPaymentUpdated(res.paymentMethod || chosenPreset);
      setTimeout(() => {
        onClose();
        setMsg(null);
      }, 1200);
    } catch (err) {
      setMsg({ success: false, text: err.message || 'Failed to update payment details.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewMethod = async (e) => {
    e.preventDefault();
    if (!newMethodName.trim() || !newMethodIdentifier.trim()) {
      setMsg({ success: false, text: 'Please fill in all details for the new payment option.' });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        type: newMethodType,
        brand: newMethodName,
        holder,
        autoDebitLimit: Number(autoDebitLimit) || 25000,
        isDefault: true
      };

      if (newMethodType === 'card') {
        payload.last4 = newMethodIdentifier.slice(-4) || '9999';
        payload.cardNumber = newMethodIdentifier;
        payload.label = `${newMethodName} (•••• ${payload.last4})`;
      } else if (newMethodType === 'netbanking') {
        payload.bankName = newMethodName;
        payload.bank = newMethodIdentifier.toUpperCase();
        payload.label = `${newMethodName} NetBanking`;
      } else if (newMethodType === 'upi') {
        payload.vpa = newMethodIdentifier;
        payload.label = `${newMethodName} (${newMethodIdentifier})`;
      }

      const res = await fetch('/api/user/payment-methods/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success) {
        setMsg({ success: true, text: `Added ${payload.label} to Agent Memory!` });
        setSelectedMethodId(res.paymentMethod.id);
        setShowAddNew(false);
        if (onPaymentUpdated) onPaymentUpdated(res.paymentMethod);
      }
    } catch (err) {
      setMsg({ success: false, text: err.message || 'Failed to save new method' });
    } finally {
      setLoading(false);
    }
  };

  const filteredPresets = multiPaymentPresets.filter(p => p.category === activeTab);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '580px', background: '#0a192f', border: '1px solid #1e3a8a', color: '#f8fafc' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem', background: '#0284c7', padding: '6px', borderRadius: '8px' }}>💳</span>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Universal Multi-Payment Vault</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Stored in Agent Memory • Synced across LearnHub, NovaStore, and Zomato
              </p>
            </div>
          </div>
          <button className="btn-close-drawer" onClick={onClose} style={{ color: '#fff' }}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: '18px' }}>
          {/* Segmented Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '4px',
            gap: '4px',
            marginBottom: '16px'
          }}>
            {[
              { id: 'cards', label: '💳 Cards' },
              { id: 'netbanking', label: '🏦 NetBanking' },
              { id: 'upi', label: '⚡ Instant UPI' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id); setShowAddNew(false); }}
                style={{
                  flex: 1,
                  border: 'none',
                  background: activeTab === tab.id ? '#0284c7' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#94a3b8',
                  padding: '8px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {!showAddNew ? (
            <div>
              {/* Payment Instrument Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px', maxHeight: '180px', overflowY: 'auto' }}>
                {filteredPresets.map((p) => {
                  const isSelected = selectedMethodId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleMethodSelect(p)}
                      style={{
                        padding: '10px 14px',
                        background: isSelected ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
                        <div>
                          <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.85rem' }}>{p.label}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Limit: ₹{p.autoDebitLimit.toLocaleString()} • Razorpay Verified</div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => handleMethodSelect(p)}
                        style={{ accentColor: '#0284c7', width: '16px', height: '16px' }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Add New Option Button */}
              <button
                type="button"
                onClick={() => { setShowAddNew(true); setNewMethodType(activeTab === 'netbanking' ? 'netbanking' : (activeTab === 'upi' ? 'upi' : 'card')); }}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px dashed rgba(56, 189, 248, 0.4)',
                  borderRadius: '8px',
                  color: '#38bdf8',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginBottom: '14px'
                }}
              >
                + Add Custom {activeTab === 'cards' ? 'Card' : activeTab === 'netbanking' ? 'NetBanking Bank' : 'UPI ID'} to Memory
              </button>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Auto-Debit Toggle */}
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ color: '#34d399', fontSize: '0.82rem', fontWeight: '700' }}>
                      ⚡ Zero-Intervention Auto-Debit Active
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                      Auto-executes purchases on Razorpay within pre-auth limit
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '600' }}>Holder Name:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={holder}
                      onChange={(e) => setHolder(e.target.value)}
                      style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.8rem', padding: '6px 10px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '600' }}>Auto-Debit Limit (₹):</label>
                    <input
                      type="number"
                      className="form-input"
                      value={autoDebitLimit}
                      onChange={(e) => setAutoDebitLimit(e.target.value)}
                      style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.8rem', padding: '6px 10px' }}
                    />
                  </div>
                </div>

                {msg && (
                  <div style={{ color: msg.success ? '#34d399' : '#f87171', fontSize: '0.82rem', fontWeight: '600', textAlign: 'center' }}>
                    {msg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-checkout"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {loading ? 'Saving...' : 'Set Default in Agent Memory'}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleAddNewMethod} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8', marginBottom: '4px' }}>
                Add New {newMethodType === 'card' ? 'Card' : newMethodType === 'netbanking' ? 'NetBanking Bank' : 'UPI ID'}
              </div>

              <div className="form-group">
                <label style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  {newMethodType === 'card' ? 'Card Brand / Label (e.g. Axis Magnus Card)' : newMethodType === 'netbanking' ? 'Bank Name (e.g. Kotak Mahindra Bank)' : 'App / Provider Name (e.g. Google Pay)'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  placeholder={newMethodType === 'card' ? 'Axis Magnus Card' : newMethodType === 'netbanking' ? 'Kotak Mahindra Bank' : 'Google Pay'}
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff' }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  {newMethodType === 'card' ? 'Card Number (Mock tokenized)' : newMethodType === 'netbanking' ? 'Bank IFSC Code / Branch ID (e.g. KKBK)' : 'UPI VPA / ID (e.g. user@okhdfcbank)'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={newMethodIdentifier}
                  onChange={(e) => setNewMethodIdentifier(e.target.value)}
                  placeholder={newMethodType === 'card' ? '4100 2800 0000 9999' : newMethodType === 'netbanking' ? 'KKBK' : 'username@okhdfcbank'}
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff' }}
                />
              </div>

              {msg && (
                <div style={{ color: msg.success ? '#34d399' : '#f87171', fontSize: '0.82rem', fontWeight: '600', textAlign: 'center' }}>
                  {msg.text}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddNew(false)}
                  style={{ flex: 1, padding: '9px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 2, padding: '9px', background: '#0284c7', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '700' }}
                >
                  {loading ? 'Saving...' : 'Save to Agent Memory'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default SavedPaymentModal;
