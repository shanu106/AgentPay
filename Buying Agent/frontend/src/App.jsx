import React, { useState, useEffect } from 'react';
import { submitPurchaseRequest, fetchConfig } from './api/agentApi';
import AgentActivityPanel from './components/AgentActivityPanel';
import RazorpayModal from './components/RazorpayModal';
import OrderConfirmationView from './components/OrderConfirmationView';
import AuditLogsModal from './components/AuditLogsModal';
import ApiKeyModal from './components/ApiKeyModal';
import './App.css';

const exampleQueries = [
  {
    label: '⚡ JavaScript Mastery (Price upto ₹500)',
    query: 'Buy me a JavaScript mastery course of price upto 500'
  },
  {
    label: '⭐ Benchmark Demo: Buy DSA Course up to ₹10,000',
    query: 'Buy me a DSA course up to ₹10,000 with good ratings'
  },
  {
    label: '🐍 Python for Data Science (Under ₹1,000)',
    query: 'Buy me a Python Data Science course under ₹1,000'
  },
  {
    label: '⚛️ React & Modern Web Dev (Under ₹800)',
    query: 'Buy me a React & modern web dev course under ₹800'
  },
  {
    label: '🛡️ Test Security: DSA Course under ₹3,000 (Expect Auth Denied)',
    query: 'Buy me a DSA course up to ₹3,000'
  }
];

function App() {
  const [purchaseQuery, setPurchaseQuery] = useState('Buy me a DSA course up to ₹10,000 with good ratings');
  const [customerName, setCustomerName] = useState('Student Buyer');
  const [customerEmail, setCustomerEmail] = useState('student@example.com');
  const [loading, setLoading] = useState(false);

  // Agent State
  const [agentResult, setAgentResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Modals
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await fetchConfig();
      setConfig(data);
    } catch (err) {
      console.warn('Failed to load config:', err);
    }
  };

  const handlePurchaseSubmit = async (queryText) => {
    const text = (queryText || purchaseQuery).trim();
    if (!text || loading) return;

    setLoading(true);
    setConfirmedOrder(null);
    setSelectedProduct(null);
    setActiveOrder(null);
    setPaymentData(null);
    setSteps([
      { text: `Analyzing purchase request: "${text}"`, status: 'completed' }
    ]);

    try {
      const res = await submitPurchaseRequest({
        message: text,
        customerName,
        customerEmail
      });

      setAgentResult(res);
      setSteps(res.steps || []);
      setSelectedProduct(res.selectedProduct);
      setActiveOrder(res.order);
      setPaymentData(res.paymentData);

      if (res.requiresCheckout && res.paymentData) {
        setIsRazorpayOpen(true);
      }
    } catch (err) {
      setSteps(prev => [
        ...prev,
        { text: `Error processing purchase: ${err.message}`, status: 'failed' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (verificationResult) => {
    setConfirmedOrder({
      ...activeOrder,
      verifiedPayment: verificationResult.verification,
      status: 'confirmed'
    });

    setSteps(prev => [
      ...prev,
      { text: `Payment Verified with HMAC SHA256 Signature (Payment ID: ${verificationResult.verification?.paymentId || 'pay_test'})`, status: 'completed' },
      { text: `Merchant Order Confirmed & Enrolled!`, status: 'completed' }
    ]);
  };

  const handleReset = () => {
    setAgentResult(null);
    setSteps([]);
    setSelectedProduct(null);
    setActiveOrder(null);
    setPaymentData(null);
    setConfirmedOrder(null);
    setPurchaseQuery('Buy me a DSA course up to ₹10,000 with good ratings');
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="header">
        <div className="brand-section">
          <div className="brand-logo-icon">🤖</div>
          <div className="brand-info">
            <h1>AI Shopping Buyer Agent</h1>
            <span>Autonomous Purchase • Gemini API • Razorpay Test Mode</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="key-status-btn" onClick={() => setIsAuditOpen(true)}>
            <span>📜</span>
            <span>Audit Logs</span>
          </button>

          <button className="key-status-btn" onClick={() => setIsApiKeyOpen(true)}>
            <span className={`status-dot ${config?.hasGeminiKey ? 'active' : 'simulated'}`}></span>
            <span>{config?.hasGeminiKey ? 'Gemini 2.0 Active' : 'Gemini Key (Demo Mode)'}</span>
          </button>

          <a 
            href="http://localhost:5173" 
            target="_blank" 
            rel="noreferrer"
            className="key-status-btn"
            style={{ textDecoration: 'none' }}
          >
            <span>🛍️</span>
            <span>Merchant Store</span>
          </a>
        </div>
      </header>

      {/* Main Buyer Layout */}
      <main className="buyer-main-layout">
        {/* Left Column: Natural Language Purchase Box & Product Card */}
        <div className="buyer-left-pane">
          {/* Purchase Request Box */}
          <div className="purchase-card">
            <h2 className="purchase-card-title">What do you want to buy?</h2>
            <p className="purchase-card-sub">
              Enter your purchase request and spending limit. The AI Agent will discover, verify, authorize, and prepare payment.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handlePurchaseSubmit(); }} className="purchase-form">
              <div className="purchase-input-wrap">
                <input
                  type="text"
                  className="purchase-input-field"
                  placeholder="e.g. Buy me a DSA course up to ₹10,000 with good ratings"
                  value={purchaseQuery}
                  onChange={(e) => setPurchaseQuery(e.target.value)}
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  disabled={loading || !purchaseQuery.trim()} 
                  className="btn-purchase-submit"
                >
                  {loading ? 'Agent Purchasing...' : '🚀 Purchase'}
                </button>
              </div>
            </form>

            {/* Quick Demo Prompts */}
            <div className="quick-demo-prompts">
              <span className="demo-prompts-label">Quick Demo Scenarios:</span>
              <div className="demo-chips-grid">
                {exampleQueries.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    className="demo-chip"
                    onClick={() => {
                      setPurchaseQuery(ex.query);
                      handlePurchaseSubmit(ex.query);
                    }}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Candidate Product Card / Selection */}
          {selectedProduct && (
            <div className="selected-product-card">
              <div className="sel-prod-header">
                <span className="sel-prod-tag">
                  {activeOrder ? '✓ Selected by Agent' : 'Candidate Inspected'}
                </span>
                <span className="sel-prod-rating">⭐ {selectedProduct.rating} ({selectedProduct.ratingCount || '48k+'})</span>
              </div>

              <div className="sel-prod-body">
                <h3>{selectedProduct.title}</h3>
                <p>{selectedProduct.description || selectedProduct.subtitle}</p>

                <div className="sel-prod-price-row">
                  <div>
                    <span className="price-label">Authoritative Merchant Price:</span>
                    <div className="sel-price">₹{selectedProduct.price?.toLocaleString()} INR</div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <span className="price-label">Availability:</span>
                    <div style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>
                      ● In Stock (Purchasable)
                    </div>
                  </div>
                </div>

                {/* Authorization Status Pill */}
                {activeOrder ? (
                  <div className="auth-status-pill authorized">
                    <span>🛡️ Authorization Engine:</span>
                    <strong>APPROVED (₹{selectedProduct.price} ≤ ₹{agentResult?.intent?.maxPrice || 10000})</strong>
                  </div>
                ) : agentResult?.success === false ? (
                  <div className="auth-status-pill denied">
                    <span>🛡️ Authorization Engine:</span>
                    <strong>DENIED: Price exceeds authorized limit</strong>
                  </div>
                ) : null}

                {/* Direct Action Trigger */}
                {activeOrder && !confirmedOrder && (
                  <button 
                    className="btn-checkout"
                    style={{ marginTop: '14px' }}
                    onClick={() => setIsRazorpayOpen(true)}
                  >
                    💳 Pay ₹{activeOrder.amount?.toLocaleString()} with Razorpay Test Mode →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Confirmed Order View */}
          {confirmedOrder && (
            <OrderConfirmationView
              order={confirmedOrder}
              verification={agentResult}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Right Column: Live Decision Activity Stream */}
        <div className="buyer-right-pane">
          <AgentActivityPanel
            steps={steps}
            toolCalls={agentResult?.toolCalls || []}
            loading={loading}
          />
        </div>
      </main>

      {/* Razorpay Test Modal */}
      <RazorpayModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        paymentData={paymentData}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Audit Logs Modal */}
      <AuditLogsModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />

      {/* Gemini API Key Settings */}
      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        config={config}
        onKeyUpdated={() => loadConfig()}
      />
    </div>
  );
}

export default App;
