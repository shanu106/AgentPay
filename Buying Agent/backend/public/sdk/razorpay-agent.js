/**
 * Razorpay Agentic Commerce SDK (Embeddable Widget)
 * Enables autonomous, pre-authorized, zero-click AI shopping on any merchant platform.
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
    key: currentScript?.getAttribute('data-key') || 'rzp_test_TSqKSZKcvQdzJs',
    merchantApi: currentScript?.getAttribute('data-merchant-api') || window.location.origin + '/api',
    agentApi: currentScript?.getAttribute('data-agent-api') || 'http://localhost:8001/api/agent',
    autoDebit: currentScript?.getAttribute('data-auto-debit') !== 'false',
    theme: currentScript?.getAttribute('data-theme') || 'razorpay-blue',
    position: currentScript?.getAttribute('data-position') || 'bottom-right'
  };

  // State
  let isOpen = false;
  let isSettingsOpen = false;
  let isLoading = false;
  let messages = [];
  let savedPayment = {
    enabled: config.autoDebit,
    brand: 'Visa (Domestic)',
    last4: '1007',
    holder: 'Student Buyer',
    autoDebitLimit: 15000,
    cardNumber: '4100 2800 0000 1007'
  };

  // Fetch initial saved payment details from agent backend
  fetch(`${config.agentApi}/saved-payment-method`)
    .then(r => r.json())
    .then(data => {
      if (data.success && data.paymentMethod) {
        savedPayment = { ...savedPayment, ...data.paymentMethod };
        updateWidgetHeader();
      }
    })
    .catch(() => {});

  // Inject Styles
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .rzp-agent-root {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #0f172a;
      box-sizing: border-box;
      z-index: 999999;
    }
    .rzp-agent-root *, .rzp-agent-root *::before, .rzp-agent-root *::after {
      box-sizing: border-box;
    }
    
    /* Floating Trigger Button */
    .rzp-agent-trigger {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px 12px 14px;
      background: linear-gradient(135deg, #0c2340 0%, #002970 50%, #0284c7 100%);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 9999px;
      cursor: pointer;
      box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.4), 0 8px 10px -6px rgba(0, 41, 112, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 999999;
      user-select: none;
    }
    .rzp-agent-trigger:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 20px 30px -10px rgba(2, 132, 199, 0.6);
    }
    .rzp-agent-trigger .pulse-icon {
      position: relative;
      width: 32px;
      height: 32px;
      background: #0284c7;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .rzp-agent-trigger .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid #38bdf8;
      animation: rzpPulse 2s infinite;
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
      font-size: 13px;
      letter-spacing: 0.2px;
    }
    .rzp-agent-trigger-sub {
      font-size: 11px;
      color: #93c5fd;
    }

    /* Copilot Modal Drawer */
    .rzp-agent-drawer {
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 420px;
      max-width: calc(100vw - 32px);
      height: 620px;
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 999999;
      transform: translateY(20px) scale(0.96);
      opacity: 0;
      pointer-events: none;
      transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .rzp-agent-drawer.open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }

    /* Drawer Header */
    .rzp-agent-header {
      background: linear-gradient(135deg, #07192f 0%, #0a3a78 100%);
      color: #ffffff;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .rzp-agent-header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .rzp-agent-badge-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #fff;
      font-size: 16px;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4);
    }
    .rzp-agent-title-wrap h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
    }
    .rzp-agent-title-wrap span {
      font-size: 11px;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .rzp-agent-title-wrap span::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
    }
    .rzp-agent-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .rzp-agent-btn-icon {
      background: rgba(255, 255, 255, 0.12);
      border: none;
      color: #ffffff;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .rzp-agent-btn-icon:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    /* Pre-Auth Banner */
    .rzp-agent-auth-banner {
      background: #f0f9ff;
      border-bottom: 1px solid #bae6fd;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #0369a1;
      font-weight: 600;
    }
    .rzp-agent-auth-banner span {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    /* Content & Chat Area */
    .rzp-agent-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: #f8fafc;
    }
    .rzp-agent-empty {
      text-align: center;
      padding: 24px 12px;
      color: #64748b;
    }
    .rzp-agent-empty-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .rzp-agent-empty-title {
      font-weight: 700;
      color: #1e293b;
      font-size: 15px;
      margin-bottom: 4px;
    }
    .rzp-agent-empty-desc {
      font-size: 12px;
      line-height: 1.4;
      margin-bottom: 16px;
    }

    /* Quick Chips */
    .rzp-agent-chips {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .rzp-agent-chip {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 10px 14px;
      border-radius: 10px;
      text-align: left;
      font-size: 12px;
      color: #1e293b;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .rzp-agent-chip:hover {
      border-color: #0284c7;
      background: #f0f9ff;
      color: #0284c7;
      transform: translateX(3px);
    }

    /* Message Bubbles */
    .rzp-agent-msg {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .rzp-agent-msg.user {
      align-items: flex-end;
    }
    .rzp-agent-msg-bubble {
      padding: 10px 14px;
      border-radius: 14px;
      max-width: 85%;
      font-size: 13px;
      line-height: 1.4;
    }
    .rzp-agent-msg.user .rzp-agent-msg-bubble {
      background: #0284c7;
      color: #ffffff;
      border-bottom-right-radius: 4px;
    }
    .rzp-agent-msg.agent .rzp-agent-msg-bubble {
      background: #ffffff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    /* Reasoning Stream Card */
    .rzp-agent-reasoning-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .rzp-agent-reasoning-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .rzp-agent-step {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 12px;
      color: #334155;
      animation: fadeIn 0.2s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .rzp-agent-step-icon {
      font-size: 13px;
      margin-top: 1px;
    }

    /* Confirmed Order Card */
    .rzp-agent-order-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1px solid #86efac;
      border-radius: 14px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .rzp-agent-order-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #166534;
      font-weight: 700;
      font-size: 13px;
    }
    .rzp-agent-order-details {
      background: #ffffff;
      border-radius: 8px;
      padding: 10px;
      font-size: 11px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: #1e293b;
      border: 1px solid #bbf7d0;
    }
    .rzp-agent-order-details strong {
      color: #0f172a;
    }

    /* Input Footer */
    .rzp-agent-footer {
      padding: 12px 16px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .rzp-agent-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .rzp-agent-input:focus {
      border-color: #0284c7;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
    }
    .rzp-agent-send-btn {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 10px 16px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .rzp-agent-send-btn:hover {
      background: #0369a1;
    }
    .rzp-agent-send-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Settings Modal / Overlay */
    .rzp-agent-settings-modal {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #ffffff;
      z-index: 10;
      display: flex;
      flex-direction: column;
      padding: 20px;
      transform: translateX(100%);
      transition: transform 0.25s ease-in-out;
    }
    .rzp-agent-settings-modal.open {
      transform: translateX(0);
    }
    .rzp-agent-settings-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .rzp-agent-settings-header h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    .rzp-agent-form-group {
      margin-bottom: 16px;
    }
    .rzp-agent-form-group label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 6px;
    }
    .rzp-agent-form-group input, .rzp-agent-form-group select {
      width: 100%;
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
        <div class="rzp-agent-trigger-title">Razorpay Agentic Pay</div>
        <div class="rzp-agent-trigger-sub">Pre-Authorized AI Buying</div>
      </div>
    </div>

    <!-- Copilot Drawer -->
    <div class="rzp-agent-drawer" id="rzp-agent-drawer">
      <!-- Header -->
      <div class="rzp-agent-header">
        <div class="rzp-agent-header-brand">
          <div class="rzp-agent-badge-icon">R</div>
          <div class="rzp-agent-title-wrap">
            <h3>Razorpay AI Shopping Agent</h3>
            <span id="rzp-agent-status-label">Autonomous 0-Click Ready</span>
          </div>
        </div>
        <div class="rzp-agent-header-actions">
          <button class="rzp-agent-btn-icon" id="rzp-agent-settings-btn" title="Pre-Authorization Settings">
            ⚙️
          </button>
          <button class="rzp-agent-btn-icon" id="rzp-agent-close-btn" title="Close">
            ✕
          </button>
        </div>
      </div>

      <!-- Auth Banner -->
      <div class="rzp-agent-auth-banner">
        <span>🛡️ Pre-Auth Limit: <strong id="rzp-agent-banner-limit">₹${(savedPayment.autoDebitLimit || 15000).toLocaleString()}</strong></span>
        <span>💳 <span id="rzp-agent-banner-card">${savedPayment.brand || 'Visa'} (•••• ${savedPayment.last4 || '1007'})</span></span>
      </div>

      <!-- Body / Chat -->
      <div class="rzp-agent-body" id="rzp-agent-chat-body">
        <div class="rzp-agent-empty" id="rzp-agent-empty-state">
          <div class="rzp-agent-empty-icon">⚡</div>
          <div class="rzp-agent-empty-title">Instant AI Autonomous Shopping</div>
          <div class="rzp-agent-empty-desc">Tell the AI agent what to buy on this store. It will evaluate products, verify budget pre-authorization, and complete payment on Razorpay with 0 clicks.</div>
          
          <div class="rzp-agent-chips">
            <button class="rzp-agent-chip" data-prompt="Order 2 chicken biryani under 1000 and pay using net banking of bob">
              <span>🍗 2 Chicken Biryani via BOB NetBanking</span>
              <span>→</span>
            </button>
            <button class="rzp-agent-chip" data-prompt="Buy me a Keychron mechanical keyboard under 4000 and pay using amazon credit card">
              <span>⌨️ Keychron Keyboard via Amazon Card</span>
              <span>→</span>
            </button>
            <button class="rzp-agent-chip" data-prompt="Order 2 crispy chicken whopper meals under 600">
              <span>🍔 2 Whopper Burger Meals under ₹600</span>
              <span>→</span>
            </button>
            <button class="rzp-agent-chip" data-prompt="Buy me ANC wireless headphones under 3000">
              <span>🎧 ANC Headphones under ₹3,000</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer / Input -->
      <div class="rzp-agent-footer">
        <input 
          type="text" 
          class="rzp-agent-input" 
          id="rzp-agent-input" 
          placeholder="e.g. Buy me mechanical keyboard under ₹4000..." 
        />
        <button class="rzp-agent-send-btn" id="rzp-agent-send-btn">
          Buy
        </button>
      </div>

      <!-- Settings Panel -->
      <div class="rzp-agent-settings-modal" id="rzp-agent-settings-modal">
        <div class="rzp-agent-settings-header">
          <h4>Pre-Authorization Settings</h4>
          <button class="rzp-agent-btn-icon" id="rzp-agent-settings-close-btn" style="background:#e2e8f0; color:#0f172a;">✕</button>
        </div>
        <div class="rzp-agent-form-group">
          <label>Pre-Authorized Spending Limit (₹)</label>
          <input type="number" id="rzp-settings-limit" value="${savedPayment.autoDebitLimit || 15000}" />
        </div>
        <div class="rzp-agent-form-group">
          <label>Saved Payment Card</label>
          <select id="rzp-settings-card">
            <option value="4100280000001007" selected>Visa (Domestic Test) •••• 1007</option>
            <option value="6527658900001005">RuPay (Domestic Test) •••• 1005</option>
          </select>
        </div>
        <div class="rzp-agent-form-group">
          <label>Cardholder Name</label>
          <input type="text" id="rzp-settings-holder" value="${savedPayment.holder || 'Student Buyer'}" />
        </div>
        <div class="rzp-agent-form-group">
          <label>Auto-Debit Mode</label>
          <select id="rzp-settings-autodebit">
            <option value="true" selected>Enabled (0-Click Autonomous Payment)</option>
            <option value="false">Disabled (Ask before payment)</option>
          </select>
        </div>
        <button class="rzp-agent-send-btn" id="rzp-settings-save-btn" style="width:100%; margin-top:10px;">
          Save Pre-Authorization Limits
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
  const settingsModal = document.getElementById('rzp-agent-settings-modal');
  const settingsCloseBtn = document.getElementById('rzp-agent-settings-close-btn');
  const settingsSaveBtn = document.getElementById('rzp-settings-save-btn');
  const inputEl = document.getElementById('rzp-agent-input');
  const sendBtn = document.getElementById('rzp-agent-send-btn');
  const chatBody = document.getElementById('rzp-agent-chat-body');
  const emptyState = document.getElementById('rzp-agent-empty-state');

  // Toggle Drawer
  function toggleDrawer(open) {
    isOpen = open !== undefined ? open : !isOpen;
    if (isOpen) {
      drawerEl.classList.add('open');
      inputEl.focus();
    } else {
      drawerEl.classList.remove('open');
      settingsModal.classList.remove('open');
    }
  }

  triggerEl.addEventListener('click', () => toggleDrawer());
  closeBtn.addEventListener('click', () => toggleDrawer(false));

  // Toggle Settings
  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('open');
  });
  settingsCloseBtn.addEventListener('click', () => {
    settingsModal.classList.remove('open');
  });

  settingsSaveBtn.addEventListener('click', () => {
    const limit = parseInt(document.getElementById('rzp-settings-limit').value, 10) || 15000;
    const holder = document.getElementById('rzp-settings-holder').value || 'Student Buyer';
    const autodebit = document.getElementById('rzp-settings-autodebit').value === 'true';

    savedPayment.autoDebitLimit = limit;
    savedPayment.holder = holder;
    savedPayment.enabled = autodebit;

    updateWidgetHeader();
    settingsModal.classList.remove('open');

    // Save to backend
    fetch(`${config.agentApi}/saved-payment-method`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savedPayment)
    }).catch(() => {});
  });

  function updateWidgetHeader() {
    const limitEl = document.getElementById('rzp-agent-banner-limit');
    const cardEl = document.getElementById('rzp-agent-banner-card');
    if (limitEl) limitEl.textContent = `₹${(savedPayment.autoDebitLimit || 15000).toLocaleString()}`;
    if (cardEl) cardEl.textContent = `${savedPayment.brand || 'Visa'} (•••• ${savedPayment.last4 || '1007'})`;
  }

  // Quick Chips Click
  document.querySelectorAll('.rzp-agent-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt) {
        inputEl.value = prompt;
        handleSend();
      }
    });
  });

  // Handle Send Purchase Prompt
  async function handleSend() {
    const query = inputEl.value.trim();
    if (!query || isLoading) return;

    isLoading = true;
    sendBtn.disabled = true;
    inputEl.value = '';

    if (emptyState) emptyState.style.display = 'none';

    // 1. Add User Message
    appendMessage({ role: 'user', text: query });

    // 2. Add Live Reasoning Stream Card
    const reasoningCardId = 'rzp-reasoning-' + Date.now();
    appendReasoningCard(reasoningCardId, `Processing autonomous purchase request...`);

    try {
      // 3. Call Agent Backend Purchase Endpoint
      const response = await fetch(`${config.agentApi}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          customerName: savedPayment.holder,
          customerEmail: 'student@example.com',
          autoExecutePayment: savedPayment.enabled !== false,
          savedPaymentMethod: savedPayment,
          merchantApiBase: config.merchantApi
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
          productTitle: data.selectedProduct?.title || 'Product',
          amount: data.order?.amount || 499,
          orderId: data.order?.orderId,
          razorpayOrderId: data.order?.razorpayOrderId || data.paymentData?.razorpayOrderId,
          razorpayPaymentId: data.verification?.paymentId || 'pay_live_captured'
        });
      } else if (data.reply) {
        appendMessage({ role: 'agent', text: data.reply });
      }

    } catch (err) {
      appendMessage({ role: 'agent', text: `❌ Error processing purchase: ${err.message}` });
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
    msgEl.innerHTML = `<div class="rzp-agent-msg-bubble">${escapeHtml(text)}</div>`;
    chatBody.appendChild(msgEl);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendReasoningCard(id, initialText) {
    const cardEl = document.createElement('div');
    cardEl.className = 'rzp-agent-reasoning-card';
    cardEl.id = id;
    cardEl.innerHTML = `
      <div class="rzp-agent-reasoning-title">
        <span>⚡ Agent Decision & Execution Stream</span>
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

    let stepsHtml = `<div class="rzp-agent-reasoning-title"><span>⚡ Agent Decision & Execution Stream</span></div>`;
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

  function appendConfirmedOrderCard({ productTitle, amount, orderId, razorpayOrderId, razorpayPaymentId }) {
    const cardEl = document.createElement('div');
    cardEl.className = 'rzp-agent-order-card';
    cardEl.innerHTML = `
      <div class="rzp-agent-order-header">
        <span>🎉 Order Autonomously Placed & Captured!</span>
        <span>₹${amount.toLocaleString()}</span>
      </div>
      <div class="rzp-agent-order-details">
        <div><strong>Item:</strong> ${escapeHtml(productTitle)}</div>
        <div><strong>Store Order:</strong> <code>#${orderId || 'ORD-NEW'}</code></div>
        <div><strong>Razorpay Order:</strong> <code>${razorpayOrderId || 'order_xxx'}</code></div>
        <div><strong>Razorpay Payment ID:</strong> <code style="color:#0284c7; font-weight:bold;">${razorpayPaymentId}</code> (Captured ✓)</div>
        <div style="color:#059669; font-weight:600; margin-top:4px;">✓ 0 Human Intervention Auto-Debit Verified</div>
      </div>
    `;
    chatBody.appendChild(cardEl);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Global API
  window.RazorpayAgent = {
    open: () => toggleDrawer(true),
    close: () => toggleDrawer(false),
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

  console.log('[Razorpay Agentic Pay] Embedded SDK Initialized Successfully.');
})();
