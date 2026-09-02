/**
 * Razorpay Agentic Commerce SDK (Embeddable Widget)
 * Institutional-Grade Autonomous AI Buying & Pre-Authorized Auto-Debit Engine
 * Dynamic Merchant Niche-Aware Suggestions & Multi-Payment Wallet
 * 
 * Usage:
 * <script 
 *   src="http://localhost:8001/sdk/razorpay-agent.js"
 *   data-key="rzp_test_TSqKSZKcvQdzJs"
 *   data-merchant-api="http://localhost:8002/api"
 *   data-agent-api="http://localhost:8001/api/agent"
 *   data-auto-debit="true">
 * </script>
 */

(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.__RAZORPAY_AGENT_LOADED__) return;
  window.__RAZORPAY_AGENT_LOADED__ = true;

  // Extract config from script tag attributes
  const currentScript = document.currentScript || document.querySelector('script[src*="razorpay-agent.js"]');
  const config = {
    key: currentScript?.getAttribute('data-key') || '',
    merchantApi: currentScript?.getAttribute('data-merchant-api') || window.location.origin + '/api',
    agentApi: currentScript?.getAttribute('data-agent-api') || 'http://localhost:8001/api/agent',
    autoDebit: currentScript?.getAttribute('data-auto-debit') !== 'false',
    theme: currentScript?.getAttribute('data-theme') || 'razorpay-navy',
    position: currentScript?.getAttribute('data-position') || 'bottom-right'
  };

  // State
  let isOpen = false;
  let isSettingsOpen = false;
  let isLoginModalOpen = false;
  let isLoading = false;
  let activeTab = 'cards'; // 'cards' | 'netbanking' | 'upi'
  let messages = [];

  let currentUser = {
    name: 'Guest Buyer',
    email: 'guest@example.com',
    phone: '',
    addresses: [],
    paymentMethods: []
  };

  const getStoredSession = () => {
    try {
      const raw = localStorage.getItem('agentpay_user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) {
      return null;
    }
  };

  const getStoredToken = () => {
    const session = getStoredSession();
    if (session?.token) return session.token;

    const legacyToken = localStorage.getItem('buying_agent_token') || localStorage.getItem('agentpay_token');
    return legacyToken || null;
  };

  const getAuthHeaders = (extraHeaders = {}) => {
    const token = getStoredToken();
    return {
      ...extraHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  let currentAddress = {
    id: 'addr_home',
    label: 'Home',
    recipientName: 'Nawaz Khan',
    street: 'Flat 402, Sunshine Heights, 12th Main',
    area: 'Koramangala 4th Block',
    city: 'Bengaluru',
    pincode: '560034',
    isDefault: true
  };

  let savedPayment = {
    id: 'pm_visa_1007',
    enabled: config.autoDebit,
    type: 'card',
    method: 'card',
    brand: 'Visa (Domestic)',
    last4: '1007',
    holder: 'Nawaz Khan',
    autoDebitLimit: 15000,
    label: 'Visa Debit (•••• 1007)'
  };

  let allPaymentMethods = [];

  // Check for existing user session
  try {
    const savedSession = getStoredSession();
    if (savedSession) {
      const sessionUser = savedSession.user || savedSession;
      if (sessionUser?.email) {
        currentUser = {
          ...currentUser,
          ...sessionUser,
          email: sessionUser.email,
          name: sessionUser.name || currentUser.name || 'Guest Buyer'
        };
      }
    }
  } catch (_) {}

  function persistSession(data = {}) {
    const user = data.user || currentUser || {};
    const token = data.token || getStoredToken();
    const nextUser = {
      name: user.name || currentUser.name || 'Guest Buyer',
      email: user.email || currentUser.email || 'guest@example.com',
      phone: user.phone || currentUser.phone || '',
      addresses: user.addresses || currentUser.addresses || [],
      paymentMethods: user.paymentMethods || currentUser.paymentMethods || [],
      token: token || null
    };

    currentUser = { ...currentUser, ...nextUser };

    if (token) {
      localStorage.setItem('buying_agent_token', token);
      localStorage.setItem('agentpay_token', token);
    } else {
      localStorage.removeItem('buying_agent_token');
      localStorage.removeItem('agentpay_token');
    }
    localStorage.setItem('agentpay_user', JSON.stringify(nextUser));
    return nextUser;
  }

  // Fetch initial profile & saved payment from agent backend
  function fetchUserProfile(email) {
    if (!email && (!currentUser.email || currentUser.email === 'guest@example.com')) return;
    const targetEmail = (email || currentUser.email || '').trim();
    if (!targetEmail) return;

    fetch(`${config.agentApi.replace(/\/agent$/, '')}/user/profile?email=${encodeURIComponent(targetEmail)}`, {
      headers: getAuthHeaders()
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.user) {
          currentUser = { ...currentUser, ...data.user };
          if (data.user.addresses && data.user.addresses.length > 0) {
            currentAddress = data.user.addresses.find(a => a.isDefault) || data.user.addresses[0];
          }
          if (data.user.paymentMethods && data.user.paymentMethods.length > 0) {
            allPaymentMethods = data.user.paymentMethods;
            const defPm = data.user.paymentMethods.find(pm => pm.isDefault) || data.user.paymentMethods[0];
            savedPayment = { ...savedPayment, ...defPm };
          }
          updateWidgetHeader();
          renderPaymentOptionsInSettings();
        }
      })
      .catch(() => {});
  }

  fetchUserProfile();


  // Inject High-Trust Institutional CSS Styles
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .rzp-agent-root {
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 13.5px;
      line-height: 1.5;
      color: #0f172a;
      box-sizing: border-box;
      z-index: 999999;
      -webkit-font-smoothing: antialiased;
    }
    .rzp-agent-root *, .rzp-agent-root *::before, .rzp-agent-root *::after {
      box-sizing: border-box;
    }
    
    /* Institutional Floating Trigger Button */
    .rzp-agent-trigger {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 18px 12px 14px;
      background: linear-gradient(135deg, #07192f 0%, #0c2340 50%, #0a3a78 100%);
      color: #ffffff;
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 9999px;
      cursor: pointer;
      box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.45), 0 8px 12px -6px rgba(12, 35, 64, 0.4);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 999999;
      user-select: none;
    }
    .rzp-agent-trigger:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 20px 35px -8px rgba(2, 132, 199, 0.6);
      border-color: rgba(56, 189, 248, 0.5);
    }
    .rzp-agent-trigger .pulse-icon {
      position: relative;
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.5);
    }
    .rzp-agent-trigger .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid #38bdf8;
      animation: rzpPulse 2.2s infinite;
    }
    @keyframes rzpPulse {
      0% { transform: scale(1); opacity: 0.9; }
      100% { transform: scale(1.8); opacity: 0; }
    }
    .rzp-agent-trigger-text {
      display: flex;
      flex-direction: column;
      text-align: left;
    }
    .rzp-agent-trigger-title {
      font-weight: 700;
      font-size: 13.5px;
      letter-spacing: 0.2px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .rzp-agent-trigger-sub {
      font-size: 11px;
      color: #93c5fd;
      font-weight: 500;
    }

    /* Copilot Institutional Modal Drawer */
    .rzp-agent-drawer {
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 440px;
      max-width: calc(100vw - 32px);
      height: 650px;
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(12, 35, 64, 0.35), 0 0 0 1px rgba(12, 35, 64, 0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 999999;
      transform: translateY(20px) scale(0.96);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .rzp-agent-drawer.open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }

    /* Razorpay Enterprise Header */
    .rzp-agent-header {
      padding: 14px 18px;
      background: linear-gradient(135deg, #07192f 0%, #0c2340 60%, #0a3a78 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }
    .rzp-agent-header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .rzp-agent-badge-icon {
      width: 34px;
      height: 34px;
      background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      color: #ffffff;
      font-size: 17px;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4);
      letter-spacing: -0.5px;
    }
    .rzp-agent-title-wrap h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .rzp-agent-title-wrap span {
      font-size: 10.5px;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
    }
    .rzp-agent-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .rzp-agent-btn-icon {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ffffff;
      width: 30px;
      height: 30px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 13px;
    }
    .rzp-agent-btn-icon:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: scale(1.05);
    }

    /* Trust & Security Verification Bar */
    .rzp-agent-trust-strip {
      background: #071526;
      padding: 4px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #94a3b8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-weight: 600;
      letter-spacing: 0.2px;
    }
    .rzp-trust-badge-green {
      color: #34d399;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* User Profile Bar */
    .rzp-agent-profile-bar {
      background: #f8fafc;
      padding: 8px 14px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
    }
    .rzp-profile-info {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .rzp-switch-btn {
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #0284c7;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .rzp-switch-btn:hover {
      background: #0284c7;
      color: #ffffff;
      border-color: #0284c7;
    }

    /* Active Payment & Pre-Auth Banner */
    .rzp-agent-auth-banner {
      background: linear-gradient(90deg, #eff6ff 0%, #f0fdf4 100%);
      border-bottom: 1px solid #dbeafe;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #1e40af;
      font-weight: 600;
    }
    .rzp-auth-banner-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Chat Body */
    .rzp-agent-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Empty state */
    .rzp-agent-empty {
      margin: auto 0;
      text-align: center;
      padding: 12px;
    }
    .rzp-agent-empty-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 10px;
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: #ffffff;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      box-shadow: 0 8px 16px -4px rgba(2, 132, 199, 0.4);
    }
    .rzp-agent-empty-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .rzp-agent-empty-desc {
      font-size: 12px;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 16px;
    }
    .rzp-agent-chips {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .rzp-agent-chip {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 12px;
      color: #334155;
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s;
    }
    .rzp-agent-chip:hover {
      background: #f0f9ff;
      border-color: #0284c7;
      color: #0284c7;
      transform: translateX(2px);
    }

    /* Message Bubbles */
    .rzp-agent-msg {
      display: flex;
      flex-direction: column;
      max-width: 88%;
    }
    .rzp-agent-msg.user {
      align-self: flex-end;
    }
    .rzp-agent-msg.agent {
      align-self: flex-start;
    }
    .rzp-agent-msg-bubble {
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.45;
      white-space: pre-wrap;
    }
    .rzp-agent-msg.user .rzp-agent-msg-bubble {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      border-bottom-right-radius: 4px;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);
    }
    .rzp-agent-msg.agent .rzp-agent-msg-bubble {
      background: #f8fafc;
      color: #1e293b;
      border-bottom-left-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    /* Reasoning Stream Card */
    .rzp-agent-reasoning-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .rzp-agent-reasoning-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .rzp-agent-step {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      color: #334155;
      line-height: 1.4;
    }
    .rzp-agent-step-icon {
      font-size: 12px;
      margin-top: 1px;
    }

    /* Confirmed Order Card - High-Trust Fintech Receipt */
    .rzp-agent-order-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-top: 3px solid #059669;
      border-radius: 12px;
      padding: 14px;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .rzp-agent-order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      color: #065f46;
      font-size: 13.5px;
      padding-bottom: 6px;
      border-bottom: 1px dashed #cbd5e1;
    }
    .rzp-agent-order-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: #1f2937;
    }

    /* Footer Input */
    .rzp-agent-footer {
      padding: 12px 16px;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .rzp-agent-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 13px;
      outline: none;
      transition: all 0.2s;
    }
    .rzp-agent-input:focus {
      border-color: #0284c7;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
    }
    .rzp-agent-send-btn {
      padding: 10px 18px;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.3);
    }
    .rzp-agent-send-btn:hover {
      background: #0284c7;
      transform: translateY(-1px);
    }
    .rzp-agent-send-btn:disabled {
      background: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
    }

    /* Modals */
    .rzp-agent-modal {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #ffffff;
      z-index: 10;
      display: flex;
      flex-direction: column;
      padding: 18px;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      overflow-y: auto;
    }
    .rzp-agent-modal.open {
      transform: translateY(0);
    }
    .rzp-agent-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .rzp-agent-modal-header h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }

    /* Voice Mic Button & Pulse */
    .rzp-agent-mic-btn {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .rzp-agent-mic-btn:hover {
      background: #e0f2fe;
      border-color: #0284c7;
    }
    .rzp-agent-mic-btn.listening {
      background: #ef4444 !important;
      border-color: #dc2626 !important;
      color: #ffffff !important;
      animation: rzp-mic-pulse 1.2s infinite;
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
    }
    @keyframes rzp-mic-pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1.08); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    .rzp-voice-wave-banner {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 7px 14px;
      background: #fef2f2;
      border-top: 1px solid #fecaca;
      font-size: 11.5px;
      color: #dc2626;
      font-weight: 700;
    }
    .rzp-voice-wave-banner.active {
      display: flex;
    }
    .rzp-voice-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef4444;
      animation: rzp-dot-blink 1s infinite;
    }
    @keyframes rzp-dot-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* Segmented Tab Controls in Settings */
    .rzp-segmented-tabs {
      display: flex;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 3px;
      margin-bottom: 12px;
      gap: 3px;
    }
    .rzp-tab-btn {
      flex: 1;
      border: none;
      background: transparent;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .rzp-tab-btn.active {
      background: #ffffff;
      color: #0284c7;
      box-shadow: 0 2px 4px rgba(0,0,0,0.06);
    }

    /* Payment Instrument Option Card */
    .rzp-payment-option-card {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s;
    }
    .rzp-payment-option-card:hover {
      border-color: #93c5fd;
      background: #f0f9ff;
    }
    .rzp-payment-option-card.selected {
      border-color: #0284c7;
      background: #f0f9ff;
      box-shadow: 0 0 0 1px #0284c7;
    }
    .rzp-pm-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .rzp-pm-icon {
      width: 32px;
      height: 32px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .rzp-pm-info {
      display: flex;
      flex-direction: column;
    }
    .rzp-pm-title {
      font-weight: 700;
      font-size: 12px;
      color: #0f172a;
    }
    .rzp-pm-sub {
      font-size: 10.5px;
      color: #64748b;
    }
    .rzp-pm-radio {
      width: 16px;
      height: 16px;
      accent-color: #0284c7;
    }

    .rzp-agent-form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 12px;
    }
    .rzp-agent-form-group label {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
    }
    .rzp-agent-form-group input, .rzp-agent-form-group select {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
    }
  `;
  document.head.appendChild(styleEl);

  // Inject Container HTML
  const containerEl = document.createElement('div');
  containerEl.className = 'rzp-agent-root';
  containerEl.innerHTML = `
    <!-- Floating Trigger -->
    <div class="rzp-agent-trigger" id="rzp-agent-trigger">
      <div class="pulse-icon">
        <div class="pulse-ring"></div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
      </div>
      <div class="rzp-agent-trigger-text">
        <div class="rzp-agent-trigger-title">
          <span>Razorpay AI Assistant</span>
          <span style="font-size:10px; background:#0284c7; padding:1px 5px; border-radius:4px;">AI</span>
        </div>
        <div class="rzp-agent-trigger-sub">Instant Voice & Chat Pay</div>
      </div>
    </div>

    <!-- Copilot Drawer -->
    <div class="rzp-agent-drawer" id="rzp-agent-drawer">
      <!-- Enterprise Header -->
      <div class="rzp-agent-header">
        <div class="rzp-agent-header-brand">
          <div class="rzp-agent-badge-icon">R</div>
          <div class="rzp-agent-title-wrap">
            <h3>
              <span>Razorpay AI Assistant</span>
              <span style="font-size:10px; background:#0284c7; padding:1px 5px; border-radius:4px; font-weight:700;">PRO</span>
            </h3>
            <span>⚡ Instant Checkout Enabled</span>
          </div>
        </div>
        <div class="rzp-agent-header-actions">
          <button class="rzp-agent-btn-icon" id="rzp-agent-lang-btn" title="Language: English (Click for हिंदी)" style="font-size:11px; font-weight:800; width:auto; padding:2px 7px; border-radius:6px; letter-spacing:0.5px;">🌐 EN</button>
          <button class="rzp-agent-btn-icon" id="rzp-agent-voice-toggle-btn" title="Voice Audio Feedback (ElevenLabs)">🔊</button>
          <button class="rzp-agent-btn-icon" id="rzp-agent-settings-btn" title="Payment & Authorization Settings">⚙️</button>
          <button class="rzp-agent-btn-icon" id="rzp-agent-close-btn" title="Close">✕</button>
        </div>
      </div>

      <!-- Trust & Security Strip -->
      <div class="rzp-agent-trust-strip">
        <span class="rzp-trust-badge-green">🔒 256-Bit Encrypted Payments</span>
        <span>Razorpay Verified Gateway ✓</span>
      </div>

      <!-- User Profile & Delivery Memory Bar -->
      <div class="rzp-agent-profile-bar" id="rzp-agent-profile-bar">
        <div class="rzp-profile-info" style="cursor:pointer;" id="rzp-agent-profile-info-click">
          <span style="font-weight:700; color:#0f172a;" id="rzp-profile-name">👤 ${currentUser.name}</span>
          <span style="color:#64748b;" id="rzp-profile-email">(${currentUser.email})</span>
          <span style="color:#0284c7; font-weight:600;" id="rzp-profile-addr">📍 ${currentAddress.label}</span>
        </div>
        <button class="rzp-switch-btn" id="rzp-agent-profile-btn" style="background:#0284c7; color:#ffffff; font-weight:700; display:flex; align-items:center; gap:4px; border-radius:6px; border:none; padding:5px 12px; cursor:pointer; font-size:12px;">
          👤 Profile
        </button>
      </div>

      <!-- Active Payment Method & Pre-Auth Banner -->
      <div class="rzp-agent-auth-banner">
        <span class="rzp-auth-banner-item">🛡️ Pre-Auth: <strong id="rzp-agent-banner-limit">₹${(savedPayment.autoDebitLimit || 15000).toLocaleString()}</strong></span>
        <span class="rzp-auth-banner-item" style="cursor:pointer;" id="rzp-agent-banner-card-btn" title="Change Payment Method">
          💳 <span id="rzp-agent-banner-card" style="text-decoration:underline;">${savedPayment.label || 'Visa Debit (•••• 1007)'}</span>
        </span>
      </div>

      <!-- Body / Chat -->
      <div class="rzp-agent-body" id="rzp-agent-chat-body">
        <div class="rzp-agent-empty" id="rzp-agent-empty-state">
          <div class="rzp-agent-empty-icon">⚡</div>
          <div class="rzp-agent-empty-title">Razorpay AI Assistant</div>
          <div class="rzp-agent-empty-desc">Tell the assistant what you need via Voice or Text. It checks live availability, applies your saved preferences, and secures your order instantly.</div>
          
          <div class="rzp-agent-chips" id="rzp-agent-suggestion-chips">
            <!-- Populated dynamically based on merchant niche -->
          </div>
        </div>
      </div>

      <!-- Voice Listening Wave Banner -->
      <div class="rzp-voice-wave-banner" id="rzp-voice-wave-banner">
        <span class="rzp-voice-status-dot"></span>
        <span>🎙️ Listening... Speak your order (e.g. "Buy 2 chicken biryani with SBI netbanking")</span>
      </div>

      <!-- Footer / Input -->
      <div class="rzp-agent-footer">
        <button class="rzp-agent-mic-btn" id="rzp-agent-mic-btn" title="Voice Agent: Speak to Order">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
        <input 
          type="text" 
          class="rzp-agent-input" 
          id="rzp-agent-input" 
          placeholder="Ask or click 🎙️ mic to speak your order..." 
        />
        <button class="rzp-agent-send-btn" id="rzp-agent-send-btn">
          Buy
        </button>
      </div>

      <!-- Unified Auth, Profile & Orders Modal -->
      <div class="rzp-agent-modal" id="rzp-agent-user-modal">
        <div class="rzp-agent-modal-header">
          <h4 id="rzp-modal-title">👤 Account & Orders</h4>
          <button class="rzp-agent-btn-icon" id="rzp-agent-user-close-btn" style="background:#e2e8f0; color:#0f172a;">✕</button>
        </div>

        <!-- Segmented Navigation Tabs -->
        <div class="rzp-segmented-tabs" style="margin-bottom:12px; display:flex; gap:3px; overflow-x:auto;">
          <button class="rzp-tab-btn active" id="rzp-auth-tab-otp" type="button">⚡ Quick OTP</button>
          <button class="rzp-tab-btn" id="rzp-auth-tab-login" type="button">🔑 Password</button>
          <button class="rzp-tab-btn" id="rzp-auth-tab-signup" type="button">✨ Sign Up</button>
          <button class="rzp-tab-btn" id="rzp-auth-tab-profile" type="button">👤 Profile</button>
          <button class="rzp-tab-btn" id="rzp-auth-tab-orders" type="button">📦 Orders</button>
        </div>

        <!-- Auth Status Alert -->
        <div id="rzp-auth-alert" style="display:none; padding:8px 12px; border-radius:6px; font-size:12px; margin-bottom:10px;"></div>

        <!-- View 1: QUICK OTP LOGIN / SIGNIN -->
        <div id="rzp-auth-view-otp">
          <div class="rzp-agent-form-group" id="rzp-otp-step1-group">
            <label>Enter Email Address</label>
            <input type="email" id="rzp-otp-email" value="${currentUser.email !== 'guest@example.com' ? currentUser.email : ''}" placeholder="yourname@gmail.com" />
          </div>
          <div class="rzp-agent-form-group" id="rzp-otp-name-group">
            <label>Full Name (Optional)</label>
            <input type="text" id="rzp-otp-name" value="${currentUser.name !== 'Guest Buyer' ? currentUser.name : ''}" placeholder="e.g. Shahnawaz" />
          </div>
          <button class="rzp-agent-send-btn" id="rzp-otp-send-btn" style="width:100%; margin-top:6px;">
            📩 Send Verification Code (OTP)
          </button>

          <!-- OTP Code Step 2 (hidden until OTP sent) -->
          <div id="rzp-otp-step2-wrap" style="display:none; margin-top:14px; padding-top:12px; border-top:1px dashed #cbd5e1;">
            <div class="rzp-agent-form-group">
              <label>Enter 6-Digit OTP Code</label>
              <input type="text" id="rzp-otp-code" placeholder="• • • • • •" maxlength="6" style="letter-spacing:6px; font-weight:800; text-align:center; font-size:18px;" />
            </div>
            <button class="rzp-agent-send-btn" id="rzp-otp-verify-btn" style="width:100%; margin-top:6px; background:#059669;">
              ✅ Verify OTP & Sign In
            </button>
            <p style="font-size:11px; color:#64748b; margin-top:8px; text-align:center;">
              Dispatched via Gmail SMTP. Demo Master OTP: <code style="color:#0284c7; font-weight:bold;">123456</code>
            </p>
          </div>
        </div>

        <!-- View 2: PASSWORD LOGIN -->
        <div id="rzp-auth-view-login" style="display:none;">
          <div class="rzp-agent-form-group">
            <label>Email Address</label>
            <input type="email" id="rzp-login-email" value="${currentUser.email !== 'guest@example.com' ? currentUser.email : ''}" placeholder="yourname@gmail.com" />
          </div>
          <div class="rzp-agent-form-group">
            <label>Password</label>
            <input type="password" id="rzp-login-password" value="password123" placeholder="••••••••" />
          </div>
          <button class="rzp-agent-send-btn" id="rzp-auth-login-btn" style="width:100%; margin-top:8px;">
            🔑 Log In with Password
          </button>
        </div>

        <!-- View 3: CREATE ACCOUNT / SIGN UP -->
        <div id="rzp-auth-view-signup" style="display:none;">
          <div class="rzp-agent-form-group">
            <label>Full Name</label>
            <input type="text" id="rzp-signup-name" placeholder="e.g. Rahul Sharma" />
          </div>
          <div class="rzp-agent-form-group">
            <label>Email Address</label>
            <input type="email" id="rzp-signup-email" placeholder="rahul@example.com" />
          </div>
          <div class="rzp-agent-form-group">
            <label>Create Password</label>
            <input type="password" id="rzp-signup-password" placeholder="At least 6 characters" />
          </div>
          <div class="rzp-agent-form-group">
            <label>Phone Number (Optional)</label>
            <input type="tel" id="rzp-signup-phone" placeholder="+91 9876543210" />
          </div>
          <button class="rzp-agent-send-btn" id="rzp-auth-signup-btn" style="width:100%; margin-top:8px;">
            ✨ Create Agent Account
          </button>
        </div>

        <!-- View 4: PROFILE & SETTINGS -->
        <div id="rzp-auth-view-profile" style="display:none;">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-weight:700; font-size:14px;" id="rzp-profile-card-name">${currentUser.name}</div>
                <div style="font-size:12px; color:#64748b;" id="rzp-profile-card-email">${currentUser.email}</div>
              </div>
              <span style="background:#dcfce7; color:#166534; font-size:11px; padding:3px 8px; border-radius:999px; font-weight:700;">Active Account ✓</span>
            </div>
            <div style="font-size:12px; color:#0284c7; margin-top:8px; font-weight:600;" id="rzp-profile-card-limit">
              🛡️ Pre-Authorized Limit: ₹${(savedPayment.autoDebitLimit || 15000).toLocaleString()}
            </div>
            <div style="font-size:12px; color:#475569; margin-top:4px;" id="rzp-profile-card-payment">
              💳 Active Instrument: ${savedPayment.label || savedPayment.brand || 'Visa Debit'}
            </div>
          </div>
          <div class="rzp-agent-form-group">
            <label>Default Delivery Address</label>
            <select id="rzp-user-address-select">
              <option value="home" selected>Home: Flat 402, Sunshine Heights, Koramangala - 560034</option>
              <option value="office">Office: WeWork Galaxy, Residency Road - 560025</option>
            </select>
          </div>
          <button class="rzp-agent-send-btn" id="rzp-user-save-btn" style="width:100%; margin-top:6px;">
            Save Address Preference
          </button>
          <button type="button" id="rzp-auth-logout-btn" style="width:100%; margin-top:10px; background:#fff1f2; color:#e11d48; border:1px solid #fecdd3; padding:8px; border-radius:6px; cursor:pointer; font-weight:700; font-size:12px;">
            🚪 Sign Out / Switch Account
          </button>
        </div>

        <!-- View 5: RECENT ORDERS TAB -->
        <div id="rzp-auth-view-orders" style="display:none;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="font-size:12px; font-weight:700; color:#475569;">📦 Order History & Invoices</div>
            <button type="button" id="rzp-orders-refresh-btn" style="background:transparent; border:none; color:#0284c7; cursor:pointer; font-size:12px; font-weight:600;">🔄 Refresh</button>
          </div>
          <div id="rzp-orders-list" style="max-height:280px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
            <div style="text-align:center; padding:20px; color:#94a3b8; font-size:12px;">Loading your orders...</div>
          </div>
        </div>
      </div>



      <!-- Multiple Payment Options & Pre-Auth Settings Modal -->
      <div class="rzp-agent-modal" id="rzp-agent-settings-modal">
        <div class="rzp-agent-modal-header">
          <h4>💳 Payment Methods & Preferences</h4>
          <button class="rzp-agent-btn-icon" id="rzp-agent-settings-close-btn" style="background:#e2e8f0; color:#0f172a;">✕</button>
        </div>

        <!-- Segmented Category Tabs -->
        <div class="rzp-segmented-tabs">
          <button class="rzp-tab-btn active" id="rzp-tab-cards" data-tab="cards">💳 Cards</button>
          <button class="rzp-tab-btn" id="rzp-tab-netbanking" data-tab="netbanking">🏦 NetBanking</button>
          <button class="rzp-tab-btn" id="rzp-tab-upi" data-tab="upi">⚡ Instant UPI</button>
        </div>

        <div style="font-size:11px; color:#64748b; margin-bottom:8px; font-weight:600;">
          SELECT DEFAULT PAYMENT METHOD:
        </div>

        <!-- Payment Options Container -->
        <div id="rzp-payment-options-list" style="display:flex; flex-direction:column; gap:4px; max-height:220px; overflow-y:auto; margin-bottom:12px;">
          <!-- Populated dynamically via JS -->
        </div>

        <div class="rzp-agent-form-group">
          <label>Pre-Authorized Spending Limit (₹)</label>
          <input type="number" id="rzp-settings-limit" value="${savedPayment.autoDebitLimit || 15000}" />
        </div>

        <div class="rzp-agent-form-group">
          <label>Payment Confirmation Mode</label>
          <select id="rzp-settings-autodebit">
            <option value="true" selected>Pre-Authorized Instant Pay (Recommended)</option>
            <option value="false">Confirm before charging</option>
          </select>
        </div>

        <button class="rzp-agent-send-btn" id="rzp-settings-save-btn" style="width:100%;">
          Save Payment Preferences
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(containerEl);

  // DOM Elements
  const triggerEl = document.getElementById('rzp-agent-trigger');
  const drawerEl = document.getElementById('rzp-agent-drawer');
  const closeBtn = document.getElementById('rzp-agent-close-btn');
  const settingsBtn = document.getElementById('rzp-agent-settings-btn');
  const bannerCardBtn = document.getElementById('rzp-agent-banner-card-btn');
  const settingsModal = document.getElementById('rzp-agent-settings-modal');
  const settingsCloseBtn = document.getElementById('rzp-agent-settings-close-btn');
  const settingsSaveBtn = document.getElementById('rzp-settings-save-btn');
  const switchUserBtn = document.getElementById('rzp-agent-switch-user-btn');
  const userModal = document.getElementById('rzp-agent-user-modal');
  const userCloseBtn = document.getElementById('rzp-agent-user-close-btn');
  const userSaveBtn = document.getElementById('rzp-user-save-btn');
  const inputEl = document.getElementById('rzp-agent-input');
  const sendBtn = document.getElementById('rzp-agent-send-btn');
  const chatBody = document.getElementById('rzp-agent-chat-body');
  const emptyState = document.getElementById('rzp-agent-empty-state');
  const paymentOptionsList = document.getElementById('rzp-payment-options-list');
  const suggestionChipsContainer = document.getElementById('rzp-agent-suggestion-chips');

  // Toggle Drawer
  function toggleDrawer(open) {
    isOpen = open !== undefined ? open : !isOpen;
    if (isOpen) {
      drawerEl.classList.add('open');
      inputEl.focus();
    } else {
      drawerEl.classList.remove('open');
      settingsModal.classList.remove('open');
      userModal.classList.remove('open');
    }
  }

  triggerEl.addEventListener('click', () => toggleDrawer());
  closeBtn.addEventListener('click', () => toggleDrawer(false));

  // Toggle Settings
  settingsBtn.addEventListener('click', () => {
    renderPaymentOptionsInSettings();
    settingsModal.classList.add('open');
  });
  if (bannerCardBtn) {
    bannerCardBtn.addEventListener('click', () => {
      renderPaymentOptionsInSettings();
      settingsModal.classList.add('open');
    });
  }
  settingsCloseBtn.addEventListener('click', () => settingsModal.classList.remove('open'));

  // Toggle User Login Modal
  switchUserBtn?.addEventListener('click', () => userModal?.classList.add('open'));
  userCloseBtn?.addEventListener('click', () => userModal?.classList.remove('open'));

  // Segmented Tabs Handling
  ['cards', 'netbanking', 'upi'].forEach(tab => {
    const tabBtn = document.getElementById(`rzp-tab-${tab}`);
    if (tabBtn) {
      tabBtn.addEventListener('click', () => {
        document.querySelectorAll('.rzp-tab-btn').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        activeTab = tab;
        renderPaymentOptionsInSettings();
      });
    }
  });

  // Render Payment Options in Settings Modal
  function renderPaymentOptionsInSettings() {
    if (!paymentOptionsList) return;
    const methods = allPaymentMethods.length > 0 ? allPaymentMethods : [
      { id: 'pm_visa_1007', type: 'card', brand: 'Visa (Domestic)', last4: '1007', label: 'Visa Debit (•••• 1007)', autoDebitLimit: 15000, isDefault: true },
      { id: 'pm_icici_4022', type: 'card', brand: 'Amazon Pay ICICI Card', last4: '4022', label: 'Amazon Pay ICICI (•••• 4022)', autoDebitLimit: 25000 },
      { id: 'pm_hdfc_3003', type: 'card', brand: 'HDFC Millennia Card', last4: '3003', label: 'HDFC Millennia (•••• 3003)', autoDebitLimit: 20000 },
      { id: 'pm_bob_nb', type: 'netbanking', bankName: 'Bank of Baroda', label: 'Bank of Baroda NetBanking', autoDebitLimit: 50000 },
      { id: 'pm_hdfc_nb', type: 'netbanking', bankName: 'HDFC Bank', label: 'HDFC Bank NetBanking', autoDebitLimit: 50000 },
      { id: 'pm_sbi_nb', type: 'netbanking', bankName: 'State Bank of India', label: 'SBI NetBanking', autoDebitLimit: 50000 },
      { id: 'pm_upi_gpay', type: 'upi', vpa: 'nawaz@okhdfcbank', label: 'Google Pay UPI (nawaz@okhdfcbank)', autoDebitLimit: 25000 },
      { id: 'pm_upi_phonepe', type: 'upi', vpa: 'nawaz@ybl', label: 'PhonePe UPI (nawaz@ybl)', autoDebitLimit: 25000 }
    ];

    const filtered = methods.filter(m => {
      if (activeTab === 'cards') return m.type === 'card';
      if (activeTab === 'netbanking') return m.type === 'netbanking';
      if (activeTab === 'upi') return m.type === 'upi';
      return true;
    });

    let html = '';
    filtered.forEach(m => {
      const isSel = (savedPayment.id === m.id) || (m.isDefault && !savedPayment.id);
      let icon = '💳';
      let sub = `Tokenized Card •••• ${m.last4 || '1007'}`;
      if (m.type === 'netbanking') {
        icon = '🏦';
        sub = `Internet Banking • ${m.bankName || 'Instant'}`;
      } else if (m.type === 'upi') {
        icon = '⚡';
        sub = `Instant VPA • ${m.vpa || 'Direct UPI'}`;
      }

      html += `
        <div class="rzp-payment-option-card ${isSel ? 'selected' : ''}" data-pm-id="${m.id}">
          <div class="rzp-pm-left">
            <div class="rzp-pm-icon">${icon}</div>
            <div class="rzp-pm-info">
              <span class="rzp-pm-title">${escapeHtml(m.label || m.brand)}</span>
              <span class="rzp-pm-sub">${escapeHtml(sub)}</span>
            </div>
          </div>
          <input type="radio" name="rzp-pm-radio" class="rzp-pm-radio" ${isSel ? 'checked' : ''} value="${m.id}" />
        </div>
      `;
    });

    paymentOptionsList.innerHTML = html;

    // Attach click listeners to cards
    paymentOptionsList.querySelectorAll('.rzp-payment-option-card').forEach(card => {
      card.addEventListener('click', () => {
        const pmId = card.getAttribute('data-pm-id');
        const chosen = methods.find(m => m.id === pmId);
        if (chosen) {
          savedPayment = { ...savedPayment, ...chosen };
          document.getElementById('rzp-settings-limit').value = chosen.autoDebitLimit || 15000;
          renderPaymentOptionsInSettings();
        }
      });
    });
  }

  // Save Settings & Default Payment Method
  settingsSaveBtn.addEventListener('click', () => {
    const limit = parseInt(document.getElementById('rzp-settings-limit').value, 10) || 15000;
    const autodebit = document.getElementById('rzp-settings-autodebit').value === 'true';

    savedPayment.autoDebitLimit = limit;
    savedPayment.enabled = autodebit;

    updateWidgetHeader();
    settingsModal.classList.remove('open');

    // Save to backend default selection
    fetch(`${config.agentApi}/saved-payment-method`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        email: currentUser.email,
        methodId: savedPayment.id,
        autoDebitLimit: limit,
        isDefault: true
      })
    }).catch(() => {});

    appendMessage({
      role: 'agent',
      text: `✅ **Default Payment Method Updated!**\n\n- **Active Instrument**: ${savedPayment.label || savedPayment.brand}\n- **Auto-Debit Limit**: ₹${limit.toLocaleString()}\n- **Mode**: ${autodebit ? '0-Click Autonomous Pay' : 'Manual Confirmation'}\n\nAll future orders without an explicit payment clause will default to this instrument.`
    });
  });

  // Auth & Profile Modal Elements
  const authTabOtp = document.getElementById('rzp-auth-tab-otp');
  const authTabLogin = document.getElementById('rzp-auth-tab-login');
  const authTabSignup = document.getElementById('rzp-auth-tab-signup');
  const authTabProfile = document.getElementById('rzp-auth-tab-profile');
  const authTabOrders = document.getElementById('rzp-auth-tab-orders');

  const authViewOtp = document.getElementById('rzp-auth-view-otp');
  const authViewLogin = document.getElementById('rzp-auth-view-login');
  const authViewSignup = document.getElementById('rzp-auth-view-signup');
  const authViewProfile = document.getElementById('rzp-auth-view-profile');
  const authViewOrders = document.getElementById('rzp-auth-view-orders');
  const authAlert = document.getElementById('rzp-auth-alert');

  function setAuthTab(tab) {
    [authTabOtp, authTabLogin, authTabSignup, authTabProfile, authTabOrders].forEach(t => t?.classList.remove('active'));
    [authViewOtp, authViewLogin, authViewSignup, authViewProfile, authViewOrders].forEach(v => { if (v) v.style.display = 'none'; });
    if (authAlert) authAlert.style.display = 'none';

    if (tab === 'otp') {
      authTabOtp?.classList.add('active');
      if (authViewOtp) authViewOtp.style.display = 'block';
    } else if (tab === 'login') {
      authTabLogin?.classList.add('active');
      if (authViewLogin) authViewLogin.style.display = 'block';
    } else if (tab === 'signup') {
      authTabSignup?.classList.add('active');
      if (authViewSignup) authViewSignup.style.display = 'block';
    } else if (tab === 'profile') {
      authTabProfile?.classList.add('active');
      if (authViewProfile) authViewProfile.style.display = 'block';
      const profName = document.getElementById('rzp-profile-card-name');
      const profEmail = document.getElementById('rzp-profile-card-email');
      const profLimit = document.getElementById('rzp-profile-card-limit');
      const profPayment = document.getElementById('rzp-profile-card-payment');
      if (profName) profName.textContent = currentUser.name || 'Nawaz Khan';
      if (profEmail) profEmail.textContent = currentUser.email || 'nawaz@gmail.com';
      if (profLimit) profLimit.textContent = `🛡️ Pre-Authorized Limit: ₹${(savedPayment.autoDebitLimit || 15000).toLocaleString()}`;
      if (profPayment) profPayment.textContent = `💳 Active Instrument: ${savedPayment.label || savedPayment.brand || 'Visa Debit'}`;
    } else if (tab === 'orders') {
      authTabOrders?.classList.add('active');
      if (authViewOrders) authViewOrders.style.display = 'block';
      fetchAndRenderOrders();
    }
  }

  authTabOtp?.addEventListener('click', () => setAuthTab('otp'));
  authTabLogin?.addEventListener('click', () => setAuthTab('login'));
  authTabSignup?.addEventListener('click', () => setAuthTab('signup'));
  authTabProfile?.addEventListener('click', () => setAuthTab('profile'));
  authTabOrders?.addEventListener('click', () => setAuthTab('orders'));

  // Profile button in header opens Profile Modal
  const profileBtn = document.getElementById('rzp-agent-profile-btn');
  const profileInfoClick = document.getElementById('rzp-agent-profile-info-click');
  
  function openProfileModal(tab = 'profile') {
    userModal.classList.add('open');
    const isGuest = !currentUser || !currentUser.email || currentUser.email === 'guest@example.com';
    setAuthTab(isGuest ? 'otp' : tab);
  }

  profileBtn?.addEventListener('click', () => openProfileModal('profile'));
  profileInfoClick?.addEventListener('click', () => openProfileModal('profile'));

  function showAuthAlert(msg, isSuccess = false) {
    if (!authAlert) return;
    authAlert.textContent = (isSuccess ? '✓ ' : '⚠️ ') + msg;
    authAlert.style.display = 'block';
    authAlert.style.background = isSuccess ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
    authAlert.style.border = isSuccess ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)';
    authAlert.style.color = isSuccess ? '#10b981' : '#ef4444';
  }

  // 1. Send OTP Handler
  const otpSendBtn = document.getElementById('rzp-otp-send-btn');
  const otpStep2Wrap = document.getElementById('rzp-otp-step2-wrap');
  const otpCodeInput = document.getElementById('rzp-otp-code');

  otpSendBtn?.addEventListener('click', async () => {
    const email = document.getElementById('rzp-otp-email')?.value.trim();
    const name = document.getElementById('rzp-otp-name')?.value.trim();
    if (!email || !email.includes('@')) {
      showAuthAlert('Please enter a valid email address.');
      return;
    }

    try {
      otpSendBtn.disabled = true;
      otpSendBtn.textContent = 'Sending OTP...';

      const res = await fetch(`${config.agentApi.replace(/\/agent$/, '')}/user/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to dispatch verification code.');
      }

      if (otpStep2Wrap) otpStep2Wrap.style.display = 'block';
      showAuthAlert(`6-digit code sent to ${email}! Check inbox or use demo OTP 123456.`, true);
      if (otpCodeInput) {
        otpCodeInput.value = '123456';
        otpCodeInput.focus();
      }
    } catch (err) {
      showAuthAlert(err.message);
    } finally {
      otpSendBtn.disabled = false;
      otpSendBtn.textContent = '📩 Resend Verification Code';
    }
  });

  // 2. Verify OTP Handler
  const otpVerifyBtn = document.getElementById('rzp-otp-verify-btn');
  otpVerifyBtn?.addEventListener('click', async () => {
    const email = document.getElementById('rzp-otp-email')?.value.trim();
    const name = document.getElementById('rzp-otp-name')?.value.trim();
    const otp = otpCodeInput?.value.trim();

    if (!email) {
      showAuthAlert('Please enter your email.');
      return;
    }
    if (!otp || otp.length < 4) {
      showAuthAlert('Please enter the 6-digit verification code.');
      return;
    }

    try {
      otpVerifyBtn.disabled = true;
      otpVerifyBtn.textContent = 'Verifying...';

      const res = await fetch(`${config.agentApi.replace(/\/agent$/, '')}/user/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, name })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid or expired verification code.');
      }

      currentUser = { ...currentUser, ...data.user };
      if (data.user.paymentMethods && data.user.paymentMethods.length > 0) {
        allPaymentMethods = data.user.paymentMethods;
        const def = data.user.paymentMethods.find(m => m.isDefault) || data.user.paymentMethods[0];
        savedPayment = { ...savedPayment, ...def };
      }
      if (data.user.addresses && data.user.addresses.length > 0) {
        currentAddress = data.user.addresses.find(a => a.isDefault) || data.user.addresses[0];
      }

      persistSession({ user: data.user, token: data.token });

      showAuthAlert(`Verified & Logged in as ${data.user.name}!`, true);
      updateWidgetHeader();
      renderPaymentOptionsInSettings();

      setTimeout(() => {
        // CLOSE MODAL IMMEDIATELY
        userModal.classList.remove('open');
        appendMessage({
          role: 'agent',
          text: `👋 **Welcome, ${currentUser.name}!**\n\n- **Account**: \`${currentUser.email}\`\n- **Pre-Authorized Limit**: **₹${(savedPayment.autoDebitLimit || 15000).toLocaleString()}**\n- **Payment Instrument**: ${savedPayment.label || savedPayment.brand}\n\nYour session is verified. You can now place 0-click autonomous orders!`
        });
      }, 400);
    } catch (err) {
      showAuthAlert(err.message);
    } finally {
      otpVerifyBtn.disabled = false;
      otpVerifyBtn.textContent = '✅ Verify OTP & Sign In';
    }
  });

  // 3. Password Login Submit
  const authLoginBtn = document.getElementById('rzp-auth-login-btn');
  authLoginBtn?.addEventListener('click', async () => {
    const email = document.getElementById('rzp-login-email')?.value.trim();
    const password = document.getElementById('rzp-login-password')?.value.trim();
    if (!email) {
      showAuthAlert('Please enter your email address.');
      return;
    }

    try {
      authLoginBtn.disabled = true;
      authLoginBtn.textContent = 'Logging in...';

      const res = await fetch(`${config.agentApi.replace(/\/agent$/, '')}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      currentUser = { ...currentUser, ...data.user };
      if (data.user.paymentMethods && data.user.paymentMethods.length > 0) {
        allPaymentMethods = data.user.paymentMethods;
        const def = data.user.paymentMethods.find(m => m.isDefault) || data.user.paymentMethods[0];
        savedPayment = { ...savedPayment, ...def };
      }
      if (data.user.addresses && data.user.addresses.length > 0) {
        currentAddress = data.user.addresses.find(a => a.isDefault) || data.user.addresses[0];
      }

      persistSession({ user: data.user, token: data.token });

      showAuthAlert(`Logged in as ${data.user.name}!`, true);
      updateWidgetHeader();
      renderPaymentOptionsInSettings();

      setTimeout(() => {
        // CLOSE MODAL IMMEDIATELY
        userModal.classList.remove('open');
        appendMessage({
          role: 'agent',
          text: `👋 **Welcome back, ${currentUser.name}!** (\`${currentUser.email}\`)`
        });
      }, 400);
    } catch (err) {
      showAuthAlert(err.message);
    } finally {
      authLoginBtn.disabled = false;
      authLoginBtn.textContent = '🔑 Log In with Password';
    }
  });

  // 4. Signup Submit
  const authSignupBtn = document.getElementById('rzp-auth-signup-btn');
  authSignupBtn?.addEventListener('click', async () => {
    const name = document.getElementById('rzp-signup-name')?.value.trim();
    const email = document.getElementById('rzp-signup-email')?.value.trim();
    const password = document.getElementById('rzp-signup-password')?.value.trim();
    const phone = document.getElementById('rzp-signup-phone')?.value.trim();

    if (!email) {
      showAuthAlert('Please enter a valid email address.');
      return;
    }
    if (!name) {
      showAuthAlert('Please enter your full name.');
      return;
    }

    try {
      authSignupBtn.disabled = true;
      authSignupBtn.textContent = 'Creating Account...';

      const res = await fetch(`${config.agentApi.replace(/\/agent$/, '')}/user/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: password || 'password123', phone })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create account.');
      }

      currentUser = { ...currentUser, ...data.user };
      if (data.user.paymentMethods && data.user.paymentMethods.length > 0) {
        allPaymentMethods = data.user.paymentMethods;
        const def = data.user.paymentMethods.find(m => m.isDefault) || data.user.paymentMethods[0];
        savedPayment = { ...savedPayment, ...def };
      }
      if (data.user.addresses && data.user.addresses.length > 0) {
        currentAddress = data.user.addresses.find(a => a.isDefault) || data.user.addresses[0];
      }

      persistSession({ user: data.user, token: data.token });

      showAuthAlert(`Account created for ${data.user.name}!`, true);
      updateWidgetHeader();
      renderPaymentOptionsInSettings();

      setTimeout(() => {
        // CLOSE MODAL IMMEDIATELY
        userModal.classList.remove('open');
        appendMessage({
          role: 'agent',
          text: `🎉 **Account Created Successfully!** Welcome, **${currentUser.name}**.`
        });
      }, 400);
    } catch (err) {
      showAuthAlert(err.message);
    } finally {
      authSignupBtn.disabled = false;
      authSignupBtn.textContent = '✨ Create Agent Account';
    }
  });

  // 5. Fetch and Render Orders Tab
  async function fetchAndRenderOrders() {
    const ordersList = document.getElementById('rzp-orders-list');
    if (!ordersList) return;

    const email = currentUser?.email || 'nawaz@gmail.com';
    ordersList.innerHTML = '<div style="text-align:center; padding:16px; color:#94a3b8; font-size:12px;">⏳ Loading orders...</div>';

    try {
      const res = await fetch(`${config.agentApi.replace(/\/agent$/, '')}/user/orders?email=${encodeURIComponent(email)}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      const orders = data.orders || [];

      if (orders.length === 0) {
        ordersList.innerHTML = `
          <div style="text-align:center; padding:24px 12px; background:#f8fafc; border-radius:8px; border:1px dashed #cbd5e1;">
            <div style="font-size:24px; margin-bottom:6px;">🛍️</div>
            <div style="font-weight:700; font-size:13px; color:#334155;">No Orders Found</div>
            <div style="font-size:11px; color:#64748b; margin-top:4px;">Ask or speak to the agent to place your first autonomous order!</div>
          </div>
        `;
        return;
      }

      let html = '';
      orders.forEach(o => {
        const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';
        const isPaid = (o.paymentStatus || o.status || '').toLowerCase().includes('paid') || (o.status || '').toLowerCase().includes('completed');
        const badgeBg = isPaid ? '#dcfce7' : '#fef3c7';
        const badgeColor = isPaid ? '#166534' : '#92400e';
        const badgeText = isPaid ? 'Captured ✓' : (o.status || 'Pending');

        html += `
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; font-size:12px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <span style="font-weight:700; color:#0f172a;">#${escapeHtml(o.orderId || 'ORD')}</span>
                <div style="font-size:11px; color:#64748b;">${dateStr}</div>
              </div>
              <div style="text-align:right;">
                <span style="font-weight:800; font-size:13px; color:#0f172a;">₹${(o.amount || 0).toLocaleString()}</span>
                <div><span style="background:${badgeBg}; color:${badgeColor}; font-size:10px; padding:2px 6px; border-radius:999px; font-weight:700;">${badgeText}</span></div>
              </div>
            </div>
            <div style="margin-top:6px; font-weight:600; color:#334155;">
              ${escapeHtml(o.productTitle || (o.items && o.items[0]?.title) || 'Merchant Item')}
            </div>
            <div style="font-size:11px; color:#64748b; margin-top:4px; display:flex; justify-content:space-between;">
              <span>💳 ${escapeHtml(o.paymentMethod?.label || o.paymentMethod?.brand || 'Razorpay Test')}</span>
              <span>🔒 ${escapeHtml(o.razorpayPaymentId || o.razorpayOrderId || '')}</span>
            </div>
          </div>
        `;
      });
      ordersList.innerHTML = html;
    } catch (err) {
      ordersList.innerHTML = `<div style="text-align:center; padding:12px; color:#ef4444; font-size:11px;">Failed to load orders: ${err.message}</div>`;
    }
  }

  document.getElementById('rzp-orders-refresh-btn')?.addEventListener('click', fetchAndRenderOrders);

  // 6. Handle Logout
  const authLogoutBtn = document.getElementById('rzp-auth-logout-btn');
  authLogoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('agentpay_user');
    localStorage.removeItem('buying_agent_token');
    localStorage.removeItem('agentpay_token');
    currentUser = {
      name: 'Guest Buyer',
      email: 'guest@example.com',
      phone: '',
      addresses: [],
      paymentMethods: []
    };
    updateWidgetHeader();
    userModal?.classList.remove('open');
    appendMessage({
      role: 'agent',
      text: `👋 You have signed out. Click **👤 Profile** to log in with OTP.`
    });
  });

  // Save User Address Preference
  userSaveBtn?.addEventListener('click', () => {
    const addrChoice = document.getElementById('rzp-user-address-select')?.value;
    if (addrChoice === 'office') {
      currentAddress = { id: 'addr_office', label: 'Office', recipientName: currentUser.name, street: 'WeWork Galaxy, 43 Residency Road', area: 'Shanthala Nagar', city: 'Bengaluru', pincode: '560025' };
    } else {
      currentAddress = { id: 'addr_home', label: 'Home', recipientName: currentUser.name, street: 'Flat 402, Sunshine Heights, 12th Main', area: 'Koramangala 4th Block', city: 'Bengaluru', pincode: '560034' };
    }
    updateWidgetHeader();
    userModal.classList.remove('open');
    appendMessage({ role: 'agent', text: `📍 Delivery address updated to **${currentAddress.label}** (${currentAddress.city} - ${currentAddress.pincode}).` });
  });

  function updateWidgetHeader() {
    const limitEl = document.getElementById('rzp-agent-banner-limit');
    const cardEl = document.getElementById('rzp-agent-banner-card');
    const profileNameEl = document.getElementById('rzp-profile-name');
    const profileEmailEl = document.getElementById('rzp-profile-email');
    const profileAddrEl = document.getElementById('rzp-profile-addr');

    if (limitEl) limitEl.textContent = `₹${(savedPayment.autoDebitLimit || 15000).toLocaleString()}`;
    if (cardEl) cardEl.textContent = savedPayment.label || `${savedPayment.brand || 'Visa'} (•••• ${savedPayment.last4 || '1007'})`;
    if (profileNameEl) profileNameEl.textContent = `👤 ${currentUser.name || 'Nawaz Khan'}`;
    if (profileEmailEl) profileEmailEl.textContent = `(${currentUser.email || 'nawaz@gmail.com'})`;
    if (profileAddrEl) profileAddrEl.textContent = `📍 ${currentAddress.label || 'Home'}`;
  }


  // Dynamic Merchant Niche Suggestions Loader
  function fetchMerchantProductsAndRenderNicheChips() {
    const chipsContainer = document.getElementById('rzp-agent-suggestion-chips');
    const inputField = document.getElementById('rzp-agent-input');
    if (!chipsContainer) return;

    fetch(`${config.merchantApi}/products`)
      .then(r => r.json())
      .then(data => {
        const prods = data.products || data || [];
        if (Array.isArray(prods) && prods.length > 0) {
          // Detect Niche from merchant products
          const isFood = prods.some(p => p.restaurantName || (p.category && /food|biryani|pizza|burger|dessert|snack/i.test(p.category)));
          const isTech = prods.some(p => p.brand || (p.category && /hardware|electronics|accessories|audio|gear|keyboard|charger/i.test(p.category)));
          const isCourse = prods.some(p => p.instructor || (p.category && /course|education|tech|programming/i.test(p.category)));

          let chips = [];
          // Standard memory recall chip
          chips.push({
            icon: '📋',
            label: 'What was my last order? (Memory Recall)',
            prompt: 'What was my last order?'
          });

          if (isFood) {
            if (inputField) inputField.placeholder = "e.g. Buy 2 chicken biryani or ask 'what restaurants do you have?'...";
            chips.push({
              icon: '🍗',
              label: '2 Chicken Biryani under ₹1,000 via BOB NetBanking',
              prompt: 'Order 2 chicken biryani under 1000 and pay using net banking of bob'
            });
            chips.push({
              icon: '🍕',
              label: 'Buy 2 Cheesy-7 Pizza and 1 Farm Villa Pizza',
              prompt: 'Buy 2 Cheesy-7 Pizza and 1 Farm Villa Veg Special Pizza'
            });
            chips.push({
              icon: '🍔',
              label: 'Buy 2 Crispy Chicken Whopper Meals to Office',
              prompt: 'Buy 2 Crispy Chicken Whopper Meals and deliver to office'
            });
          } else if (isTech) {
            if (inputField) inputField.placeholder = "e.g. Buy Keychron keyboard or ask 'is there any GaN charger?'...";
            chips.push({
              icon: '⌨️',
              label: 'Buy Keychron Wireless Mechanical Keyboard',
              prompt: 'Buy 1 Keychron K2 Wireless Mechanical Keyboard and pay using amazon credit card'
            });
            chips.push({
              icon: '⚡',
              label: 'Is there any 100W GaN Fast Charger in stock?',
              prompt: 'is there any GaN charger available'
            });
            chips.push({
              icon: '🎧',
              label: 'Buy 1 Sony WH-1000XM5 Wireless Headphones',
              prompt: 'Buy 1 Sony WH-1000XM5 Wireless Noise Cancelling Headphones'
            });
          } else if (isCourse) {
            if (inputField) inputField.placeholder = "e.g. Buy JavaScript mastery course under 500...";
            chips.push({
              icon: '⚡',
              label: 'Buy JavaScript Mastery Course under ₹500',
              prompt: 'Buy me a JavaScript mastery course of price upto 500'
            });
            chips.push({
              icon: '🐍',
              label: 'Buy Python for Data Science under ₹1,000',
              prompt: 'Buy me a Python Data Science course under 1000'
            });
            chips.push({
              icon: '⭐',
              label: 'Buy Full Stack Web Dev Course via BOB NetBanking',
              prompt: 'Buy Full Stack Web Dev Mastery course and pay using net banking of bob'
            });
          } else {
            // General dynamic merchant product chips from live catalog
            const p1 = prods[0];
            const p2 = prods[1] || prods[0];
            const p3 = prods[2] || prods[0];
            if (p1) chips.push({ icon: '🛍️', label: `Buy 1 ${p1.title} (₹${p1.price})`, prompt: `Buy 1 ${p1.title}` });
            if (p2 && p2.id !== p1.id) chips.push({ icon: '✨', label: `Buy 1 ${p2.title} (₹${p2.price})`, prompt: `Buy 1 ${p2.title}` });
            if (p3 && p3.id !== p2.id && p3.id !== p1.id) chips.push({ icon: '🔍', label: `Check availability of ${p3.title}`, prompt: `is ${p3.title} available?` });
          }

          renderChipsHtml(chipsContainer, chips);
        }
      })
      .catch(() => {
        const fallbackChips = [
          { icon: '📋', label: 'What was my last order? (Memory Recall)', prompt: 'What was my last order?' },
          { icon: '🛍️', label: 'What products do you have available?', prompt: 'What products and items do you have?' },
          { icon: '💳', label: 'What payment methods do you accept?', prompt: 'What payment methods do you accept?' }
        ];
        renderChipsHtml(chipsContainer, fallbackChips);
      });
  }

  function renderChipsHtml(container, chips) {
    let html = '';
    chips.forEach(c => {
      html += `
        <button class="rzp-agent-chip" data-prompt="${escapeHtml(c.prompt)}">
          <span>${c.icon} ${escapeHtml(c.label)}</span>
          <span>→</span>
        </button>
      `;
    });
    container.innerHTML = html;

    // Attach click listeners
    container.querySelectorAll('.rzp-agent-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const isGuest = !currentUser || !currentUser.email || currentUser.email === 'guest@example.com';
        if (isGuest) {
          userModal.classList.add('open');
          setAuthTab('otp');
          showAuthAlert('Please sign in with your email & OTP to place orders.');
          return;
        }
        const prompt = chip.getAttribute('data-prompt');
        if (prompt) {
          inputEl.value = prompt;
          handleSend();
        }
      });
    });
  }

  fetchMerchantProductsAndRenderNicheChips();

  // Voice & Language State
  let currentLanguage = 'en'; // 'en' | 'hi'
  let isVoiceEnabled = true;
  let isListening = false;
  let currentAudio = null;
  let recognition = null;

  const langBtn = document.getElementById('rzp-agent-lang-btn');
  const micBtn = document.getElementById('rzp-agent-mic-btn');
  const voiceToggleBtn = document.getElementById('rzp-agent-voice-toggle-btn');
  const voiceWaveBanner = document.getElementById('rzp-voice-wave-banner');

  // Initialize Speech Recognition if supported
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // Language Switching Handler
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      currentLanguage = currentLanguage === 'en' ? 'hi' : 'en';
      const isHindi = currentLanguage === 'hi';
      
      langBtn.textContent = isHindi ? '🌐 HI' : '🌐 EN';
      langBtn.title = isHindi ? 'Language: हिंदी (Hindi) - Click for English' : 'Language: English - Click for हिंदी';
      
      if (recognition) {
        recognition.lang = isHindi ? 'hi-IN' : 'en-IN';
      }

      if (inputEl) {
        inputEl.placeholder = isHindi 
          ? 'पूछें या 🎙️ बोलकर आर्डर करें (उदा. 2 चिकन बिरयानी)...' 
          : 'Ask or click 🎙️ mic to speak your order...';
      }

      if (voiceWaveBanner) {
        const span = voiceWaveBanner.querySelector('span:last-child');
        if (span) {
          span.textContent = isHindi 
            ? '🎙️ सुन रहे हैं... अपना ऑर्डर बोलें (जैसे: 2 चिकन बिरयानी एसबीआई नेटबैंकिंग से आर्डर करो)' 
            : '🎙️ Listening... Speak your order (e.g. "Buy 2 chicken biryani with SBI netbanking")';
        }
      }

      appendMessage({
        role: 'agent',
        text: isHindi 
          ? '🇮🇳 **हिंदी भाषा सक्रिय!** अब आप हिंदी में बोलकर या लिखकर सुरक्षित ऑर्डर कर सकते हैं।' 
          : '🌐 **Language set to English.** You can speak or type your orders naturally.'
      });
    });
  }

  function startListening() {
    if (!SpeechRecognition) {
      appendMessage({
        role: 'agent',
        text: '⚠️ Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.'
      });
      return;
    }

    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      if (recognition) {
        try { recognition.abort(); } catch (_) {}
      }

      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        isListening = true;
        if (micBtn) micBtn.classList.add('listening');
        if (voiceWaveBanner) voiceWaveBanner.classList.add('active');
      };

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }
        fullTranscript = fullTranscript.trim();
        console.log('[SDK Speech Recognized]:', fullTranscript);
        if (inputEl && fullTranscript) inputEl.value = fullTranscript;
      };

      recognition.onerror = (event) => {
        console.warn('[Voice Recognition Error]:', event.error);
        stopListening();
      };

      recognition.onend = () => {
        stopListening();
        // Auto-submit if recognized transcript is present
        if (inputEl && inputEl.value.trim().length > 1) {
          handleSend();
        }
      };

      recognition.start();
    } catch (e) {
      console.warn('Recognition start note:', e.message);
      stopListening();
    }
  }

  function stopListening() {
    isListening = false;
    if (micBtn) micBtn.classList.remove('listening');
    if (voiceWaveBanner) voiceWaveBanner.classList.remove('active');
  }

  if (micBtn) {
    micBtn.addEventListener('click', () => {
      const isGuest = !currentUser || !currentUser.email || currentUser.email === 'guest@example.com';
      if (isGuest) {
        userModal.classList.add('open');
        setAuthTab('otp');
        showAuthAlert('Please sign in with your email & OTP before speaking your order.');
        return;
      }

      if (isListening) {
        if (recognition) {
          try { recognition.stop(); } catch (_) {}
        }
        stopListening();
      } else {
        startListening();
      }
    });
  }

  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener('click', () => {
      isVoiceEnabled = !isVoiceEnabled;
      voiceToggleBtn.textContent = isVoiceEnabled ? '🔊' : '🔇';
      voiceToggleBtn.title = isVoiceEnabled ? 'Voice Audio Feedback: ON (ElevenLabs)' : 'Voice Audio Feedback: MUTED';
      if (!isVoiceEnabled) {
        if (currentAudio) currentAudio.pause();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      }
    });
  }

  // Play Spoken Voice Feedback (ElevenLabs TTS with browser synthesis fallback)
  function playVoiceFeedback(spokenText, audioUrl, language = 'en') {
    if (!isVoiceEnabled || !spokenText) return;

    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      // 1. Try ElevenLabs Audio first if audioUrl is provided
      if (audioUrl && audioUrl.startsWith('data:audio/')) {
        currentAudio = new Audio(audioUrl);
        currentAudio.play().catch((err) => {
          console.warn('[ElevenLabs Playback Fallback]:', err.message);
          speakWithBrowser(spokenText, language);
        });
      } else {
        // 2. High quality browser SpeechSynthesis fallback
        speakWithBrowser(spokenText, language);
      }
    } catch (err) {
      console.warn('[Voice Feedback]:', err.message);
    }
  }

  function speakWithBrowser(text, language = 'en') {
    if (!window.speechSynthesis) return;
    const cleanText = text.replace(/[*_`#]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = language === 'hi' || currentLanguage === 'hi' ? 'hi-IN' : 'en-US';

    // Pick best available natural voice if present
    const voices = window.speechSynthesis.getVoices();
    const targetLang = language === 'hi' || currentLanguage === 'hi' ? 'hi' : 'en';
    const naturalVoice = voices.find(v => v.lang.startsWith(targetLang) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Lekha') || v.name.includes('Samantha')));
    if (naturalVoice) utterance.voice = naturalVoice;

    window.speechSynthesis.speak(utterance);
  }

  // Handle Send Purchase Prompt
  async function handleSend() {
    const query = inputEl.value.trim();
    if (!query || isLoading) return;

    // Login Gate Enforcement
    const isGuest = !currentUser || !currentUser.email || currentUser.email === 'guest@example.com';
    if (isGuest) {
      userModal.classList.add('open');
      setAuthTab('otp');
      showAuthAlert('Please log in with Email & OTP to use the Autonomous Agent.');
      return;
    }

    isLoading = true;
    sendBtn.disabled = true;
    inputEl.value = '';

    if (emptyState) emptyState.style.display = 'none';


    // 1. Add User Message
    appendMessage({ role: 'user', text: query });

    // 2. Add Live Reasoning Stream Card
    const reasoningCardId = 'rzp-reasoning-' + Date.now();
    const initialReasonText = currentLanguage === 'hi' 
      ? 'मेमोरी और प्री-ऑथराइजेशन के साथ अनुरोध प्रोसेस किया जा रहा है...' 
      : 'Processing request with memory & pre-authorization...';
    appendReasoningCard(reasoningCardId, initialReasonText);

    try {
      // 3. Call Agent Backend Purchase Endpoint (with language setting)
      const response = await fetch(`${config.agentApi}/purchase`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          message: query,
          userEmail: currentUser.email,
          customerName: currentUser.name,
          customerEmail: currentUser.email,
          deliveryAddress: currentAddress,
          autoExecutePayment: savedPayment.enabled !== false,
          savedPaymentMethod: savedPayment,
          merchantApiBase: config.merchantApi,
          enableVoice: isVoiceEnabled,
          language: currentLanguage
        })
      });

      const data = await response.json();

      // Render streaming steps
      if (data.steps && data.steps.length > 0) {
        renderStepsInCard(reasoningCardId, data.steps);
      }

      if (data.success && data.autoPaid) {
        // Render Confirmed Order Card
        appendConfirmedOrderCard({
          productTitle: data.order?.productTitle || data.verification?.courseTitle || data.selectedProduct?.title || 'Product',
          items: data.order?.items || [],
          amount: data.order?.amount || 499,
          orderId: data.order?.orderId,
          razorpayOrderId: data.order?.razorpayOrderId || data.paymentData?.razorpayOrderId,
          razorpayPaymentId: data.verification?.paymentId || 'pay_live_captured',
          deliveryAddress: data.order?.deliveryAddress || currentAddress,
          paymentMethod: data.order?.paymentMethod || savedPayment,
          userEmail: currentUser.email
        });

        // 🔊 Spoken Voice Feedback on SUCCESS
        if (data.spokenFeedback) {
          playVoiceFeedback(data.spokenFeedback, data.audioUrl, currentLanguage);
        }
      } else if (data.reply) {
        appendMessage({ role: 'agent', text: data.reply });

        // 🔊 Spoken Voice Feedback on Conversational Query
        if (data.spokenFeedback) {
          playVoiceFeedback(data.spokenFeedback, data.audioUrl, currentLanguage);
        }
      } else if (!data.success) {
        const errorMsg = data.message || (currentLanguage === 'hi' ? 'ऑर्डर पूरा नहीं किया जा सका।' : 'Purchase could not be completed.');
        appendMessage({ role: 'agent', text: `❌ **${currentLanguage === 'hi' ? 'ऑर्डर अनुरोध पूरा नहीं हुआ' : 'Purchase Request Not Completed'}**\n\n${errorMsg}` });

        // 🔊 Spoken Voice Feedback on FAILURE / DENIAL
        const failText = data.spokenFeedback || (currentLanguage === 'hi' ? `क्षमा करें, आपका ऑर्डर पूरा नहीं हो सका। ${errorMsg}` : `Sorry, your order could not be completed. ${errorMsg}`);
        playVoiceFeedback(failText, data.audioUrl, currentLanguage);
      }

    } catch (err) {
      const errText = `❌ Error processing purchase: ${err.message}`;
      appendMessage({ role: 'agent', text: errText });
      playVoiceFeedback(currentLanguage === 'hi' ? `क्षमा करें, आर्डर प्रोसेस करते समय समस्या आई।` : `Sorry, an error occurred while processing your purchase.`, null, currentLanguage);
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  sendBtn.addEventListener('click', handleSend);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  // UI Helpers
  function appendMessage({ role, text }) {
    const msgEl = document.createElement('div');
    msgEl.className = `rzp-agent-msg ${role}`;
    msgEl.innerHTML = `<div class="rzp-agent-msg-bubble">${formatMarkdown(text)}</div>`;
    chatBody.appendChild(msgEl);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendReasoningCard(id, initialText) {
    const cardEl = document.createElement('div');
    cardEl.className = 'rzp-agent-reasoning-card';
    cardEl.id = id;
    cardEl.innerHTML = `
      <div class="rzp-agent-reasoning-title">
        <span>⚡ Order Progress</span>
      </div>
      <div class="rzp-agent-step">
        <span class="rzp-agent-step-icon">⏳</span>
        <span>${escapeHtml(initialText)}</span>
      </div>
    `;
    chatBody.appendChild(cardEl);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function renderStepsInCard(cardId, steps) {
    const cardEl = document.getElementById(cardId);
    if (!cardEl) return;

    let stepsHtml = `<div class="rzp-agent-reasoning-title"><span>⚡ Order Progress</span></div>`;
    steps.forEach(s => {
      const icon = s.status === 'completed' ? '✓' : (s.status === 'failed' || s.status === 'denied' ? '⚠️' : '⏳');
      const color = s.status === 'completed' ? '#059669' : (s.status === 'denied' ? '#dc2626' : '#2563eb');
      stepsHtml += `
        <div class="rzp-agent-step">
          <span class="rzp-agent-step-icon" style="color: ${color}; font-weight: bold;">${icon}</span>
          <span>${escapeHtml(s.text)}</span>
        </div>
      `;
    });
    cardEl.innerHTML = stepsHtml;
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendConfirmedOrderCard({ productTitle, items = [], amount, orderId, razorpayOrderId, razorpayPaymentId, deliveryAddress, paymentMethod, userEmail }) {
    const cardEl = document.createElement('div');
    cardEl.className = 'rzp-agent-order-card';
    
    let itemsHtml = '';
    if (items && items.length > 0) {
      itemsHtml = `
        <div style="margin: 6px 0; padding: 6px 8px; background: #f8fafc; border-radius: 6px; font-size: 11px; border: 1px solid #e2e8f0;">
          ${items.map(i => `<div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span><strong>${i.quantity || 1}x</strong> ${escapeHtml(i.title || i.productTitle)}</span><span style="color:#0f172a; font-weight:700;">₹${(i.lineTotal || (i.price * (i.quantity || 1)) || 0).toLocaleString()}</span></div>`).join('')}
        </div>
      `;
    }

    const addrStr = deliveryAddress ? `${deliveryAddress.label || 'Home'} - ${deliveryAddress.street || ''}, ${deliveryAddress.city || 'Bengaluru'}` : 'Home (Bengaluru)';
    const payLabel = paymentMethod?.label || paymentMethod?.brand || 'Visa Debit (•••• 1007)';

    cardEl.innerHTML = `
      <div class="rzp-agent-order-header">
        <span style="display:flex; align-items:center; gap:6px;">
          <span>🎉</span> <span>Order Confirmed & Paid!</span>
        </span>
        <span style="color:#0f172a; font-size:15px;">₹${amount.toLocaleString()}</span>
      </div>
      <div class="rzp-agent-order-details">
        <div><strong>Item(s):</strong> ${escapeHtml(productTitle)}</div>
        ${itemsHtml}
        <div><strong>📍 Delivery Destination:</strong> ${escapeHtml(addrStr)}</div>
        <div><strong>💳 Payment Instrument:</strong> <span style="color:#0369a1; font-weight:600;">${escapeHtml(payLabel)}</span></div>
        <div><strong>🆔 Store Order ID:</strong> <code>#${orderId || 'ORD-NEW'}</code></div>
        <div><strong>⚡ Razorpay Order ID:</strong> <code>${razorpayOrderId || 'order_xxx'}</code></div>
        <div><strong>🔒 Razorpay Payment ID:</strong> <code style="color:#0284c7; font-weight:bold;">${razorpayPaymentId}</code> (Captured ✓)</div>
        <div style="color:#2563eb; font-weight:600; margin-top:2px;">📧 Confirmation Receipt dispatched to: <strong>${escapeHtml(userEmail || 'nawaz@gmail.com')}</strong> ✓</div>
        <div style="color:#059669; font-weight:700; margin-top:3px;">🛡️ Pre-Authorized Secure Payment Verified</div>
      </div>
    `;
    chatBody.appendChild(cardEl);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function formatMarkdown(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Global API
  window.RazorpayAgent = {
    open: () => toggleDrawer(true),
    close: () => toggleDrawer(false),
    login: (email) => fetchUserProfile(email),
    purchase: (prompt) => {
      toggleDrawer(true);
      inputEl.value = prompt;
      handleSend();
    },
    setBudgetLimit: (limit) => {
      savedPayment.autoDebitLimit = Number(limit);
      updateWidgetHeader();
    }
  };

  console.log('[Razorpay Agentic Pay] Enterprise Fintech SDK with Niche-Aware Suggestions Initialized.');
})();
