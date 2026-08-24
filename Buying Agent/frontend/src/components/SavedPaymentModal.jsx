import React, { useState, useEffect } from 'react';
import { fetchPaymentMethods, addPaymentMethod, setDefaultPaymentMethod, deletePaymentMethod, updatePaymentMethod } from '../api/agentApi';

const popularBanks = [
  { code: 'SBIN', name: 'State Bank of India', label: 'SBI NetBanking' },
  { code: 'HDFC', name: 'HDFC Bank', label: 'HDFC Bank NetBanking' },
  { code: 'ICIC', name: 'ICICI Bank', label: 'ICICI Bank NetBanking' },
  { code: 'BARB_R', name: 'Bank of Baroda', label: 'Bank of Baroda NetBanking' },
  { code: 'UTIB', name: 'Axis Bank', label: 'Axis Bank NetBanking' },
  { code: 'KKBK', name: 'Kotak Mahindra Bank', label: 'Kotak Mahindra NetBanking' },
  { code: 'PUNB_R', name: 'Punjab National Bank', label: 'PNB NetBanking' },
  { code: 'CNRB', name: 'Canara Bank', label: 'Canara Bank NetBanking' }
];

function SavedPaymentModal({ isOpen, onClose, userEmail = 'nawaz@gmail.com', savedPayment, onPaymentUpdated }) {
  const [methods, setMethods] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'add_card' | 'add_nb' | 'add_upi'
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // New Card Form
  const [cardHolder, setCardHolder] = useState('Nawaz Khan');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardBrand, setCardBrand] = useState('Visa Platinum Debit');
  const [cardLimit, setCardLimit] = useState(25000);

  // New NetBanking Form
  const [selectedBankCode, setSelectedBankCode] = useState('SBIN');
  const [nbHolder, setNbHolder] = useState('Nawaz Khan');
  const [nbLimit, setNbLimit] = useState(50000);

  // New UPI Form
  const [upiVpa, setUpiVpa] = useState('');
  const [upiProvider, setUpiProvider] = useState('Google Pay');
  const [upiLimit, setUpiLimit] = useState(25000);

  useEffect(() => {
    if (isOpen) {
      loadMethods();
    }
  }, [isOpen, userEmail]);

  const loadMethods = async () => {
    try {
      setLoading(true);
      const data = await fetchPaymentMethods(userEmail);
      if (data.paymentMethods) {
        setMethods(data.paymentMethods);
      }
    } catch (err) {
      console.warn('Failed to load payment methods from PostgreSQL:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSetDefault = async (methodId) => {
    try {
      setLoading(true);
      const res = await setDefaultPaymentMethod(methodId, userEmail);
      setMsg({ success: true, text: res.message || 'Default payment method updated in PostgreSQL!' });
      await loadMethods();
      if (onPaymentUpdated) onPaymentUpdated(res.paymentMethod);
    } catch (err) {
      setMsg({ success: false, text: err.message || 'Failed to update default payment method.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMethod = async (methodId, label) => {
    if (!window.confirm(`Are you sure you want to remove "${label}" from your payment methods?`)) {
      return;
    }
    try {
      setLoading(true);
      const res = await deletePaymentMethod(methodId, userEmail);
      setMsg({ success: true, text: `"${label}" removed successfully from PostgreSQL database.` });
      await loadMethods();
      if (onPaymentUpdated && res.defaultMethod) onPaymentUpdated(res.defaultMethod);
    } catch (err) {
      setMsg({ success: false, text: err.message || 'Failed to delete payment method.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 12) {
      setMsg({ success: false, text: 'Please enter a valid card number (at least 12-16 digits).' });
      return;
    }

    try {
      setLoading(true);
      const last4 = cleanNum.slice(-4);
      const res = await addPaymentMethod({
        type: 'card',
        method: 'card',
        brand: cardBrand,
        last4,
        cardNumber: cleanNum,
        expiry: cardExpiry,
        holder: cardHolder,
        label: `${cardBrand} (•••• ${last4})`,
        category: 'Cards',
        autoDebitLimit: Number(cardLimit) || 25000,
        isDefault: true
      }, userEmail);

      setMsg({ success: true, text: 'New card stored securely in PostgreSQL database!' });
      setCardNumber('');
      setActiveTab('all');
      await loadMethods();
      if (onPaymentUpdated && res.paymentMethod) onPaymentUpdated(res.paymentMethod);
    } catch (err) {
      setMsg({ success: false, text: err.message || 'Failed to save card.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNetBanking = async (e) => {
    e.preventDefault();
    const bankObj = popularBanks.find(b => b.code === selectedBankCode) || popularBanks[0];

    try {
      setLoading(true);
      const res = await addPaymentMethod({
        type: 'netbanking',
        method: 'netbanking',
        brand: bankObj.name,
        bank: bankObj.code,
        bankName: bankObj.name,
        holder: nbHolder,
        label: bankObj.label,
        category: 'NetBanking',
        autoDebitLimit: Number(nbLimit) || 50000,
        isDefault: true
      }, userEmail);

      setMsg({ success: true, text: `NetBanking account for ${bankObj.name} stored in PostgreSQL database!` });
      setActiveTab('all');
      await loadMethods();
      if (onPaymentUpdated && res.paymentMethod) onPaymentUpdated(res.paymentMethod);
    } catch (err) {
      setMsg({ success: false, text: err.message || 'Failed to save NetBanking account.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUpi = async (e) => {
    e.preventDefault();
    if (!upiVpa.includes('@')) {
      setMsg({ success: false, text: 'Please enter a valid UPI ID / VPA (e.g. yourname@okaxis).' });
      return;
    }

    try {
      setLoading(true);
      const res = await addPaymentMethod({
        type: 'upi',
        method: 'upi',
        brand: upiProvider,
        vpa: upiVpa.trim(),
        holder: userEmail.split('@')[0],
        label: `${upiProvider} (${upiVpa.trim()})`,
        category: 'UPI',
        autoDebitLimit: Number(upiLimit) || 25000,
        isDefault: true
      }, userEmail);

      setMsg({ success: true, text: 'UPI VPA stored securely in PostgreSQL database!' });
      setUpiVpa('');
      setActiveTab('all');
      await loadMethods();
      if (onPaymentUpdated && res.paymentMethod) onPaymentUpdated(res.paymentMethod);
    } catch (err) {
      setMsg({ success: false, text: err.message || 'Failed to save UPI VPA.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', width: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Modal Header */}
        <div className="modal-header" style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              💳
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                Payment Methods & Pre-Authorized Auto-Debit
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                PostgreSQL Stored Payment Instruments for <strong>{userEmail}</strong>
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: '8px',
          padding: '4px',
          margin: '14px 0 10px 0',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => { setActiveTab('all'); setMsg(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '13px',
              background: activeTab === 'all' ? 'var(--accent-blue, #2563eb)' : 'transparent',
              color: activeTab === 'all' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            📋 All Saved ({methods.length})
          </button>
          <button
            onClick={() => { setActiveTab('add_card'); setMsg(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '13px',
              background: activeTab === 'add_card' ? 'var(--accent-blue, #2563eb)' : 'transparent',
              color: activeTab === 'add_card' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            💳 + Add Card
          </button>
          <button
            onClick={() => { setActiveTab('add_nb'); setMsg(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '13px',
              background: activeTab === 'add_nb' ? 'var(--accent-blue, #2563eb)' : 'transparent',
              color: activeTab === 'add_nb' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            🏦 + Add NetBanking
          </button>
          <button
            onClick={() => { setActiveTab('add_upi'); setMsg(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '13px',
              background: activeTab === 'add_upi' ? 'var(--accent-blue, #2563eb)' : 'transparent',
              color: activeTab === 'add_upi' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            ⚡ + Add UPI
          </button>
        </div>

        {msg && (
          <div style={{
            background: msg.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${msg.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '13px',
            color: msg.success ? '#34d399' : '#f87171',
            marginBottom: '12px'
          }}>
            {msg.success ? '✓' : '⚠️'} {msg.text}
          </div>
        )}

        {/* Tab Content Container */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          
          {/* TAB 1: ALL METHODS LIST */}
          {activeTab === 'all' && (
            <div>
              {loading ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading payment methods from PostgreSQL...
                </div>
              ) : methods.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No payment methods stored yet. Click "+ Add Card" or "+ Add NetBanking" above!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {methods.map((method) => (
                    <div
                      key={method.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: method.isDefault ? 'rgba(37, 99, 235, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${method.isDefault ? 'rgba(37, 99, 235, 0.4)' : 'var(--border-subtle)'}`,
                        borderRadius: '10px',
                        padding: '12px 16px',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>
                          {method.type === 'card' ? '💳' : (method.type === 'netbanking' ? '🏦' : '⚡')}
                        </span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '700', fontSize: '14px', color: '#f8fafc' }}>
                              {method.label || method.brand}
                            </span>
                            {method.isDefault && (
                              <span style={{
                                background: 'rgba(16, 185, 129, 0.2)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: '800'
                              }}>
                                ★ DEFAULT
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {method.type === 'card' && `•••• ${method.last4 || '1007'} | Exp: ${method.expiry || '12/28'} | ${method.holder || 'Nawaz Khan'}`}
                            {method.type === 'netbanking' && `Bank Code: ${method.bank || 'SBIN'} | ${method.bankName || 'State Bank of India'}`}
                            {method.type === 'upi' && `VPA: ${method.vpa || 'nawaz@okaxis'}`}
                            {' • '}
                            <span style={{ color: '#93c5fd', fontWeight: '600' }}>
                              Auto-Debit Limit: ₹{(method.autoDebitLimit || 15000).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!method.isDefault && (
                          <button
                            onClick={() => handleSetDefault(method.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: '#cbd5e1',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMethod(method.id, method.label || method.brand)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                          title="Delete payment method from PostgreSQL"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD NEW CARD */}
          {activeTab === 'add_card' && (
            <form onSubmit={handleCreateCard} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Card Brand / Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Visa Platinum Debit, HDFC Millennia"
                  value={cardBrand}
                  onChange={e => setCardBrand(e.target.value)}
                  required
                  className="config-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Card Number (16 Digits)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4100 2800 0000 1007"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  required
                  className="config-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Expiry (MM/YY)
                  </label>
                  <input
                    type="text"
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value)}
                    required
                    className="config-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="Nawaz Khan"
                    value={cardHolder}
                    onChange={e => setCardHolder(e.target.value)}
                    required
                    className="config-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Pre-Authorized Auto-Debit Spending Limit (INR ₹)
                </label>
                <input
                  type="number"
                  placeholder="25000"
                  value={cardLimit}
                  onChange={e => setCardLimit(e.target.value)}
                  min="100"
                  max="100000"
                  required
                  className="config-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '6px'
                }}
              >
                {loading ? 'Saving to Database...' : '💾 Save Card to PostgreSQL'}
              </button>
            </form>
          )}

          {/* TAB 3: ADD NEW NETBANKING */}
          {activeTab === 'add_nb' && (
            <form onSubmit={handleCreateNetBanking} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Select Bank
                </label>
                <select
                  value={selectedBankCode}
                  onChange={e => setSelectedBankCode(e.target.value)}
                  className="config-input"
                  style={{ width: '100%', boxSizing: 'border-box', background: '#1e293b' }}
                >
                  {popularBanks.map(b => (
                    <option key={b.code} value={b.code}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Account Holder Name
                </label>
                <input
                  type="text"
                  placeholder="Nawaz Khan"
                  value={nbHolder}
                  onChange={e => setNbHolder(e.target.value)}
                  required
                  className="config-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Pre-Authorized Auto-Debit Limit (INR ₹)
                </label>
                <input
                  type="number"
                  placeholder="50000"
                  value={nbLimit}
                  onChange={e => setNbLimit(e.target.value)}
                  min="500"
                  max="100000"
                  required
                  className="config-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '6px'
                }}
              >
                {loading ? 'Saving to Database...' : '💾 Save NetBanking Account to PostgreSQL'}
              </button>
            </form>
          )}

          {/* TAB 4: ADD NEW UPI */}
          {activeTab === 'add_upi' && (
            <form onSubmit={handleCreateUpi} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  UPI App Provider
                </label>
                <select
                  value={upiProvider}
                  onChange={e => setUpiProvider(e.target.value)}
                  className="config-input"
                  style={{ width: '100%', boxSizing: 'border-box', background: '#1e293b' }}
                >
                  <option value="Google Pay">Google Pay (GPay)</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Paytm">Paytm UPI</option>
                  <option value="BHIM UPI">BHIM UPI</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  UPI ID / VPA
                </label>
                <input
                  type="text"
                  placeholder="e.g. nawaz@okaxis or 9876543210@ybl"
                  value={upiVpa}
                  onChange={e => setUpiVpa(e.target.value)}
                  required
                  className="config-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Pre-Authorized Auto-Debit Limit (INR ₹)
                </label>
                <input
                  type="number"
                  placeholder="25000"
                  value={upiLimit}
                  onChange={e => setUpiLimit(e.target.value)}
                  min="500"
                  max="50000"
                  required
                  className="config-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '6px'
                }}
              >
                {loading ? 'Saving to Database...' : '💾 Save UPI VPA to PostgreSQL'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default SavedPaymentModal;
