import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Zap,
  CreditCard,
  ShieldCheck,
  Store,
  Receipt,
  FileText,
  HelpCircle,
  Sun,
  Moon,
  User,
  LogOut,
  Search,
  Bell,
  Mic,
  ArrowRight,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Wallet,
  Menu,
  X
} from 'lucide-react';
import {
  submitPurchaseRequest,
  fetchConfig,
  fetchSavedPaymentMethod,
  fetchUserProfile,
  fetchUserOrders,
  fetchAuthorization,
  fetchMerchants
} from './api/agentApi';
import AgentActivityPanel from './components/AgentActivityPanel';
import RazorpayModal from './components/RazorpayModal';
import OrderConfirmationView from './components/OrderConfirmationView';
import AuditLogsModal from './components/AuditLogsModal';
import ApiKeyModal from './components/ApiKeyModal';
import SavedPaymentModal from './components/SavedPaymentModal';
import AuthModal from './components/AuthModal';
import OrderHistoryModal from './components/OrderHistoryModal';
import AuthorizationDashboard from './components/AuthorizationDashboard';
import MerchantDashboard from './components/MerchantDashboard';
import TransactionDashboard from './components/TransactionDashboard';
import './App.css';

const exampleQueriesEn = [
  { label: '🍗 2 Chicken Biryani via SBI NetBanking', query: 'Buy 2 chicken biryani and pay using sbi netbanking' },
  { label: '⚡ JavaScript Mastery Course (Under ₹500)', query: 'Buy me a JavaScript mastery course of price upto 500' },
  { label: '⌨️ Logitech Wireless Mouse via Axis Bank', query: 'Buy a mouse fast from axis bank netbanking' },
  { label: '🐍 Python for Data Science (Under ₹1,000)', query: 'Buy me a Python Data Science course under ₹1,000' },
  { label: '🛡️ Test Security: Exceed Limit (Expect Auth Denied)', query: 'Buy a gaming laptop up to ₹2,50,000' }
];

const exampleQueriesHi = [
  { label: '🍗 2 चिकन बिरयानी (एसबीआई नेटबैंकिंग से)', query: 'दो चिकन बिरयानी आर्डर करो और एसबीआई नेटबैंकिंग से पे करो' },
  { label: '⚡ जावास्क्रिप्ट कोर्स (₹500 के अंदर)', query: 'जावास्क्रिप्ट कोर्स 500 रुपये के अंदर खरीदो' },
  { label: '⌨️ वायरलेस माउस (एक्सिस बैंक नेटबैंकिंग से)', query: 'एक माउस जल्दी भेजो और एक्सिस बैंक नेटबैंकिंग से भुगतान करो' },
  { label: '🐍 पायथन डाटा साइंस कोर्स (₹1,000 के अंदर)', query: 'पायथन डाटा साइंस कोर्स 1000 रुपये के अंदर खरीदो' },
  { label: '🛡️ टेस्ट सिक्योरिटी: अधिक राशि (सीमा से अधिक)', query: '250000 रुपये का गेमिंग लैपटॉप खरीदो' }
];

// Helper: Session Persistence via Cookies and LocalStorage
const setSessionCookiesAndStorage = (userData) => {
  if (!userData || !userData.email) return;
  try {
    localStorage.setItem('agentpay_user', JSON.stringify(userData));
    localStorage.setItem('agentpay_email', userData.email);
    if (userData.name) localStorage.setItem('agentpay_name', userData.name);
    if (userData.token) {
      localStorage.setItem('buying_agent_token', userData.token);
      localStorage.setItem('agentpay_token', userData.token);
    }
    const maxAge = 365 * 24 * 60 * 60; // 1 year session retention
    document.cookie = `agentpay_email=${encodeURIComponent(userData.email)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    if (userData.token) {
      document.cookie = `agentpay_token=${encodeURIComponent(userData.token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
  } catch (_) {}
};

const getStoredSession = () => {
  try {
    const raw = localStorage.getItem('agentpay_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email) return parsed;
    }
  } catch (_) {}
  const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)agentpay_email=([^;]*)/) : null;
  const cookieEmail = match ? decodeURIComponent(match[1]) : null;
  const email = localStorage.getItem('agentpay_email') || cookieEmail || 'shahnawaznilger@gmail.com';
  const name = localStorage.getItem('agentpay_name') || (email.startsWith('shahnawaz') ? 'Shahnawaz Nilger' : 'Nawaz Khan');
  return { email, name };
};

function App() {
  const initialSession = getStoredSession();

  // Theme state: Dark (default) or Light
  const [theme, setTheme] = useState(() => localStorage.getItem('agentpay_theme') || 'dark');
  const [activeNav, setActiveNav] = useState('payments'); // 'payments' | 'terminal' | 'policies' | 'transactions' | 'merchants' | 'cards' | 'audit'

  const [language, setLanguage] = useState('en');
  const [purchaseQuery, setPurchaseQuery] = useState('Buy 2 chicken biryani and pay using sbi netbanking');
  const [customerName, setCustomerName] = useState(initialSession.name);
  const [customerEmail, setCustomerEmail] = useState(initialSession.email);
  const [loading, setLoading] = useState(false);

  // Stats & Ledger state
  const [policyData, setPolicyData] = useState(null);
  const [spendingStats, setSpendingStats] = useState({ spentToday: 0, dailyLimit: 50000, remaining: 50000 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [merchantsList, setMerchantsList] = useState([]);

  // Saved Payment Details
  const [savedPayment, setSavedPayment] = useState({
    enabled: true,
    type: 'card',
    brand: 'Visa Debit',
    cardNumber: '4100 2800 0000 1007',
    last4: '1007',
    expiry: '12/28',
    holder: initialSession.name,
    autoDebitLimit: 15000
  });

  // Agent State
  const [agentResult, setAgentResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Modals & User Auth
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(initialSession.email ? initialSession : null);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isSavedPaymentOpen, setIsSavedPaymentOpen] = useState(false);
  const [config, setConfig] = useState(null);

  // Sidebar mobile drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Voice AI State
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const recognitionRef = useRef(null);

  // Close sidebar when nav item clicked on mobile
  const handleNavClick = (navKey) => {
    setActiveNav(navKey);
    setSidebarOpen(false);
  };

  // Synchronize Theme Attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('agentpay_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const session = getStoredSession();
    setSessionCookiesAndStorage(session);
    loadInitialData(session.email);
  }, []);

  const loadInitialData = async (emailToLoad) => {
    const targetEmail = emailToLoad || customerEmail || 'shahnawaznilger@gmail.com';
    loadConfig();
    loadUserProfile(targetEmail);
    loadSavedPayment(targetEmail);
    loadLedgerData(targetEmail);
  };

  const loadLedgerData = async (emailParam) => {
    try {
      const email = emailParam || customerEmail || 'shahnawaznilger@gmail.com';
      const [authRes, ordersRes, merchRes] = await Promise.all([
        fetchAuthorization(email).catch(() => null),
        fetchUserOrders(email).catch(() => null),
        fetchMerchants().catch(() => null)
      ]);

      if (authRes?.success) {
        setPolicyData(authRes.authorization);
        if (authRes.spendingStats) setSpendingStats(authRes.spendingStats);
      }
      if (ordersRes?.orders) {
        setRecentOrders(ordersRes.orders);
      }
      if (merchRes?.merchants) {
        setMerchantsList(merchRes.merchants);
      }
    } catch (_) {}
  };

  const loadUserProfile = async (emailParam) => {
    try {
      const targetEmail = emailParam || customerEmail || 'shahnawaznilger@gmail.com';
      const res = await fetchUserProfile(targetEmail);
      if (res.success && res.user) {
        setUserProfile(res.user);
        if (res.user.email) setCustomerEmail(res.user.email);
        if (res.user.name) setCustomerName(res.user.name);
        setSessionCookiesAndStorage(res.user);
      }
    } catch (_) {}
  };

  const loadConfig = async () => {
    try {
      const cfg = await fetchConfig();
      setConfig(cfg);
    } catch (_) {}
  };

  const loadSavedPayment = async (emailParam) => {
    try {
      const targetEmail = emailParam || customerEmail || 'shahnawaznilger@gmail.com';
      const payment = await fetchSavedPaymentMethod(targetEmail);
      if (payment?.paymentMethod) {
        setSavedPayment(payment.paymentMethod);
      } else if (payment) {
        setSavedPayment(payment);
      }
    } catch (_) {}
  };

  const handleAuthSuccess = (userData) => {
    if (userData) {
      setUserProfile(userData);
      setCustomerEmail(userData.email);
      setCustomerName(userData.name);
      setSessionCookiesAndStorage(userData);
      loadSavedPayment(userData.email);
      loadLedgerData(userData.email);
    } else {
      // Sign out
      localStorage.removeItem('agentpay_user');
      localStorage.removeItem('agentpay_token');
      localStorage.removeItem('agentpay_email');
      localStorage.removeItem('agentpay_name');
      localStorage.removeItem('buying_agent_token');
      document.cookie = "agentpay_email=; path=/; max-age=0";
      document.cookie = "agentpay_token=; path=/; max-age=0";
      setUserProfile(null);
      setCustomerEmail('shahnawaznilger@gmail.com');
      setCustomerName('Shahnawaz Nilger');
      loadInitialData('shahnawaznilger@gmail.com');
    }
  };

  // Helper: Play Voice Feedback
  const playVoiceFeedback = (spokenText, audioUrl, currentLang = 'en') => {
    if (!isVoiceEnabled || !spokenText) return;
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (audioUrl && audioUrl.startsWith('data:audio/')) {
        const audio = new Audio(audioUrl);
        audio.play().catch(() => speakWithBrowser(spokenText, currentLang));
      } else {
        speakWithBrowser(spokenText, currentLang);
      }
    } catch (_) {}
  };

  const speakWithBrowser = (text, currentLang = 'en') => {
    if (!window.speechSynthesis) return;
    const cleanText = text.replace(/[*_`#]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // Toggle Voice Recognition
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    if (isListening) {
      setIsListening(false);
      try { recognitionRef.current?.stop(); } catch (_) {}
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      let capturedTranscript = '';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        let full = '';
        for (let i = 0; i < event.results.length; ++i) full += event.results[i][0].transcript;
        if (full.trim()) {
          capturedTranscript = full.trim();
          setPurchaseQuery(capturedTranscript);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => {
        setIsListening(false);
        const finalQuery = capturedTranscript.trim() || purchaseQuery.trim();
        if (finalQuery) handlePurchaseSubmit(finalQuery);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (_) {
      setIsListening(false);
    }
  };

  const handlePurchaseSubmit = async (overrideQuery = null) => {
    const queryToExecute = overrideQuery || purchaseQuery;
    if (!queryToExecute.trim()) return;

    setLoading(true);
    setConfirmedOrder(null);
    setSelectedProduct(null);
    setActiveOrder(null);
    setPaymentData(null);
    setAgentResult(null);

    setSteps([{ text: `Searching catalog for "${queryToExecute}"`, status: 'running' }]);

    try {
      const result = await submitPurchaseRequest({
        message: queryToExecute,
        customerName,
        customerEmail,
        userEmail: customerEmail,
        savedPaymentMethod: savedPayment,
        autoExecutePayment: savedPayment.enabled,
        language
      });

      setAgentResult(result);
      if (result.steps?.length > 0) setSteps(result.steps);
      if (result.selectedProduct) setSelectedProduct(result.selectedProduct);
      if (result.order) setActiveOrder(result.order);
      if (result.paymentData) setPaymentData(result.paymentData);
      if (result.autoPaid && result.order) setConfirmedOrder(result.order);

      let voiceText = result.spokenFeedback;
      if (!voiceText) {
        if (result.autoPaid) {
          voiceText = 'Order completed and paid successfully.';
        } else if (result.requiresConfirmation || result.requiresCheckout) {
          voiceText = 'Order exceeds auto-approval limit. User confirmation is required to proceed with payment.';
        } else if (result.reply) {
          voiceText = result.reply;
        } else {
          voiceText = result.success ? 'Your request has been processed.' : 'Order blocked by policy.';
        }
      }
      playVoiceFeedback(voiceText, result.audioUrl, language);
      await loadLedgerData();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Error communicating with AgentPay engine.';
      setSteps(prev => [...prev, { text: `Error: ${errMsg}`, status: 'failed' }]);
      playVoiceFeedback(`Error: ${errMsg}`, null, language);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentResult) => {
    setIsRazorpayOpen(false);
    const updatedOrder = {
      ...activeOrder,
      razorpayPaymentId: paymentResult.razorpay_payment_id,
      status: 'confirmed',
      paymentStatus: 'paid'
    };
    setConfirmedOrder(updatedOrder);
    setSteps(prev => [
      ...prev,
      { text: `Payment captured via Razorpay (ID: ${paymentResult.razorpay_payment_id})`, status: 'completed' },
      { text: `Autonomous Order Complete!`, status: 'completed' }
    ]);

    const orderItems = updatedOrder?.items || [];
    let itemsSpoken = '';
    if (orderItems.length > 1) {
      itemsSpoken = orderItems.map(i => `${i.quantity} ${i.title}`).join(', ');
    } else if (orderItems.length === 1) {
      itemsSpoken = `${orderItems[0].quantity > 1 ? orderItems[0].quantity + ' ' : ''}${orderItems[0].title}`;
    } else {
      itemsSpoken = updatedOrder?.productTitle || 'your items';
    }

    const successVoiceText = language === 'hi'
      ? `आपका ${itemsSpoken} का भुगतान सफलतापूर्वक पूरा हो गया है और ऑर्डर कन्फर्म हो गया है!`
      : `Payment captured successfully! Your order for ${itemsSpoken} is confirmed and complete.`;

    playVoiceFeedback(successVoiceText, null, language);
    loadLedgerData();
  };

  const currentExampleQueries = language === 'hi' ? exampleQueriesHi : exampleQueriesEn;

  return (
    <div className="app-layout">
      {/* Mobile sidebar overlay backdrop */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ================= LEFT SIDEBAR ================= */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <Zap size={18} fill="#fff" />
          </div>
          <span className="brand-title">AgentPay</span>
        </div>

        <div className="sidebar-menu">
          {/* Group 1: General */}
          <div className="menu-group">
            <span className="menu-label">GENERAL</span>
            <button
              type="button"
              className={`nav-item ${activeNav === 'payments' ? 'active' : ''}`}
              onClick={() => handleNavClick('payments')}
            >
              <LayoutDashboard className="nav-icon" />
              <span>Payments</span>
            </button>

            <button
              type="button"
              className={`nav-item ${activeNav === 'terminal' ? 'active' : ''}`}
              onClick={() => handleNavClick('terminal')}
            >
              <Zap className="nav-icon" />
              <span>AI Terminal</span>
            </button>

            <button
              type="button"
              className={`nav-item ${activeNav === 'policies' ? 'active' : ''}`}
              onClick={() => handleNavClick('policies')}
            >
              <ShieldCheck className="nav-icon" />
              <span>Budget &amp; Policies</span>
            </button>

            <button
              type="button"
              className={`nav-item ${activeNav === 'transactions' ? 'active' : ''}`}
              onClick={() => handleNavClick('transactions')}
            >
              <Receipt className="nav-icon" />
              <span>Transactions</span>
            </button>

            <button
              type="button"
              className={`nav-item ${activeNav === 'cards' ? 'active' : ''}`}
              onClick={() => { setSidebarOpen(false); setIsSavedPaymentOpen(true); }}
            >
              <CreditCard className="nav-icon" />
              <span>Cards &amp; Auto-Pay</span>
            </button>

            <button
              type="button"
              className={`nav-item ${activeNav === 'merchants' ? 'active' : ''}`}
              onClick={() => handleNavClick('merchants')}
            >
              <Store className="nav-icon" />
              <span>Merchant Stores</span>
            </button>
          </div>

          {/* Group 2: Support & Audit */}
          <div className="menu-group">
            <span className="menu-label">SUPPORT</span>
            <button
              type="button"
              className={`nav-item ${activeNav === 'audit' ? 'active' : ''}`}
              onClick={() => handleNavClick('audit')}
            >
              <FileText className="nav-icon" />
              <span>Audit Trail</span>
            </button>

            <a
              href="https://razorpay.com/docs"
              target="_blank"
              rel="noreferrer"
              className="nav-item"
              style={{ textDecoration: 'none' }}
            >
              <HelpCircle className="nav-icon" />
              <span>Documentation</span>
            </a>
          </div>
        </div>

        {/* Group 3: Settings & Bottom Controls */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="nav-item"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun className="nav-icon" /> : <Moon className="nav-icon" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => setIsAuthOpen(true)}
          >
            <User className="nav-icon" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => setIsAuthOpen(true)}
          >
            <LogOut className="nav-icon" />
            <span>Switch User</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="main-wrapper">
        {/* Top Header Bar */}
        <header className="top-bar">
          {/* Hamburger (visible on mobile only) */}
          <button
            type="button"
            className="sidebar-hamburger"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Global Search Bar */}
          <div className="top-search-wrap">
            <Search size={16} className="search-icon-pos" />
            <input
              type="text"
              className="top-search-input"
              placeholder="Search transactions, policies, or products..."
            />
            <span className="search-shortcut-badge">⌘K</span>
          </div>

          {/* Top Actions & Indicators */}
          <div className="top-actions">
            {/* Razorpay Test Mode Badge */}
            <div className="test-mode-pill" title="Razorpay Sandbox Test Mode is Active.">
              <span className="test-mode-dot"></span>
              <span>TEST MODE</span>
            </div>

            {/* Language Switcher */}
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                const next = language === 'en' ? 'hi' : 'en';
                setLanguage(next);
                setPurchaseQuery(next === 'hi' ? 'दो चिकन बिरयानी आर्डर करो और एसबीआई नेटबैंकिंग से पे करो' : 'Buy 2 chicken biryani and pay using sbi netbanking');
              }}
              title="Switch Language (EN / HI)"
            >
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{language === 'hi' ? 'HI' : 'EN'}</span>
            </button>

            {/* Voice Toggle */}
            <button
              type="button"
              className="icon-btn"
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              title={isVoiceEnabled ? 'Voice Feedback: Active' : 'Voice Feedback: Muted'}
            >
              <span style={{ fontSize: '0.88rem' }}>{isVoiceEnabled ? '🔊' : '🔇'}</span>
            </button>

            {/* Notifications */}
            <button type="button" className="icon-btn" title="Recent Notifications">
              <Bell size={16} />
            </button>

            {/* API Keys */}
            <button
              type="button"
              className="icon-btn"
              onClick={() => setIsApiKeyOpen(true)}
              title="Configure Gemini & Razorpay API Keys"
            >
              <SlidersHorizontal size={16} />
            </button>

            {/* User Profile Badge */}
            <div className="user-profile-badge" onClick={() => setIsAuthOpen(true)}>
              <div className="user-avatar-circle">
                {(userProfile?.name || customerName).charAt(0).toUpperCase()}
              </div>
              <span className="user-name-text">{userProfile?.name || customerName}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <main className="dashboard-content">
          {/* ================= PRIMARY PAYMENTS VIEW ================= */}
          {activeNav === 'payments' && (
            <>
              {/* Page Title & Header Actions Row */}
              <div className="page-header-row">
                <div className="page-title-area">
                  <h2>Payments</h2>
                  <p>Easily view balances, authorize spending policies, and execute autonomous commerce</p>
                </div>

                <div className="header-action-group">
                  <button
                    type="button"
                    className="btn-primary-blue"
                    onClick={() => {
                      const input = document.getElementById('ai-command-input');
                      if (input) input.focus();
                    }}
                  >
                    <Zap size={16} />
                    <span>New AI Purchase</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary-flat"
                    onClick={() => setActiveNav('policies')}
                  >
                    <ShieldCheck size={16} />
                    <span>Edit Spending Policy</span>
                  </button>

                  <button
                    type="button"
                    className="btn-ghost-flat"
                    onClick={() => setActiveNav('transactions')}
                  >
                    <Download size={16} />
                    <span>Download Ledger</span>
                  </button>
                </div>
              </div>

              {/* 4-Card Top Metric Row (Matching Swiftpay Reference) */}
              <div className="metric-grid-4">
                {/* Metric 1: Total Available Balance */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <div className="stat-icon-wrapper">
                      <Wallet size={18} />
                    </div>
                    <span className="stat-card-title">Daily Available Balance</span>
                  </div>
                  <div className="stat-card-value">
                    ₹{(spendingStats?.remaining || 9501).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="stat-card-footer">
                    <span>Limit: ₹{(spendingStats?.dailyLimit || 10000).toLocaleString()}</span>
                    <span className="stat-link" onClick={() => setActiveNav('policies')}>
                      Adjust Policy <ChevronRight size={14} />
                    </span>
                  </div>
                </div>

                {/* Metric 2: Spent Today */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <div className="stat-icon-wrapper">
                      <Clock size={18} />
                    </div>
                    <span className="stat-card-title">Spent Today</span>
                  </div>
                  <div className="stat-card-value">
                    ₹{(spendingStats?.spentToday || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="stat-card-footer">
                    <span>Reset at 00:00 UTC</span>
                    <span className="stat-link" onClick={() => setActiveNav('transactions')}>
                      View detail <ChevronRight size={14} />
                    </span>
                  </div>
                </div>

                {/* Metric 3: Max Autonomous Cap */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <div className="stat-icon-wrapper">
                      <ShieldCheck size={18} />
                    </div>
                    <span className="stat-card-title">Autonomous Per-Tx Cap</span>
                  </div>
                  <div className="stat-card-value">
                    ₹{(policyData?.max_transaction_amount ? parseFloat(policyData.max_transaction_amount) : 5000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="stat-card-footer">
                    <span>Threshold: ₹{(policyData?.require_confirmation_above ? parseFloat(policyData.require_confirmation_above) : 3000).toLocaleString()}</span>
                    <span className="stat-link" onClick={() => setActiveNav('policies')}>
                      Configure <ChevronRight size={14} />
                    </span>
                  </div>
                </div>

                {/* Metric 4: Realistic Blue VISA Debit Card */}
                <div className="debit-card-realistic" onClick={() => setIsSavedPaymentOpen(true)} style={{ cursor: 'pointer' }}>
                  <div className="card-top-row">
                    <span className="card-brand-logo">VISA</span>
                    <div className="card-chip-pattern"></div>
                  </div>
                  <div className="card-number-masked">
                    •••• •••• •••• {savedPayment.last4 || '1007'}
                  </div>
                  <div className="card-bottom-row">
                    <span className="card-holder-name">{savedPayment.holder || customerName}</span>
                    <span className="card-expiry-val">{savedPayment.expiry || '10/28'}</span>
                  </div>
                </div>
              </div>

              {/* 2-Column Main Workspace */}
              <div className="main-workspace-grid">
                {/* Left Column (65%): AI Purchase Terminal + Recent Transactions Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* AI Autonomous Purchase Console */}
                  <div className="ai-terminal-panel">
                    <div className="terminal-header">
                      <div className="terminal-title">
                        <Zap size={18} color="var(--primary-blue)" />
                        <span>Autonomous AI Shopping Agent</span>
                      </div>
                      {savedPayment.enabled && (
                        <span className="status-pill completed">
                          <CheckCircle2 size={12} />
                          <span>0-Click Auto-Debit Active</span>
                        </span>
                      )}
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handlePurchaseSubmit(); }}>
                      <div className="prompt-bar-wrap">
                        <button
                          type="button"
                          onClick={toggleListening}
                          className={`btn-mic-icon ${isListening ? 'listening' : ''}`}
                          title={isListening ? 'Listening... click to stop' : 'Click to Speak (Voice Agent)'}
                        >
                          <Mic size={16} />
                        </button>
                        <input
                          id="ai-command-input"
                          type="text"
                          className="prompt-bar-input"
                          placeholder={
                            isListening
                              ? (language === 'hi' ? 'सुन रहे हैं... अपना ऑर्डर बोलें...' : 'Listening... speak your purchase order...')
                              : (language === 'hi' ? 'उदा. 2 चिकन बिरयानी एसबीआई नेटबैंकिंग से...' : 'e.g. Buy JavaScript mastery course with Visa card')
                          }
                          value={purchaseQuery}
                          onChange={(e) => setPurchaseQuery(e.target.value)}
                          disabled={loading}
                        />
                        <button
                          type="submit"
                          disabled={loading || !purchaseQuery.trim()}
                          className="btn-primary-blue"
                          style={{ padding: '7px 16px', fontSize: '0.82rem' }}
                        >
                          {loading ? 'Purchasing...' : 'Execute'}
                        </button>
                      </div>
                    </form>

                    {/* Pre-Engineered Scenario Chips */}
                    <div className="quick-scenarios-row">
                      {currentExampleQueries.map((ex, i) => (
                        <button
                          key={i}
                          type="button"
                          className="scenario-pill"
                          onClick={() => {
                            setPurchaseQuery(ex.query);
                            handlePurchaseSubmit(ex.query);
                          }}
                        >
                          {ex.label}
                        </button>
                      ))}
                    </div>

                    {/* Active Order Result Card */}
                    {agentResult && (
                      <div style={{ marginTop: '18px', padding: '16px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {agentResult.autoPaid ? '🎉 Autonomous Purchase Confirmed' : agentResult.requiresConfirmation ? '⚠️ Confirmation Required' : '🛡️ Blocked by Policy'}
                          </span>
                          <span className={`status-pill ${agentResult.autoPaid ? 'completed' : agentResult.requiresConfirmation ? 'processing' : 'denied'}`}>
                            {agentResult.autoPaid ? 'CAPTURED' : agentResult.requiresConfirmation ? 'CONFIRMATION REQUIRED' : 'DENIED'}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.5, marginBottom: '12px' }}>
                          {agentResult.reply}
                        </p>

                        {agentResult.order && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                            <span>Order: <code>{agentResult.order.orderId}</code></span>
                            <span>Razorpay ID: <code>{agentResult.verification?.paymentId || 'Pending'}</code></span>
                            <span style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>₹{agentResult.order.amount?.toLocaleString()}</span>
                          </div>
                        )}

                        {agentResult.requiresCheckout && !confirmedOrder && (
                          <button
                            type="button"
                            className="btn-primary-blue"
                            style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
                            onClick={() => setIsRazorpayOpen(true)}
                          >
                            <span>💳 Complete Razorpay Checkout (₹{activeOrder?.amount?.toLocaleString()})</span>
                            <ArrowRight size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recent Transactions Table (Matching Reference Screenshot) */}
                  <div className="transactions-panel">
                    <div className="panel-header-bar">
                      <span className="panel-title">Recent Transactions</span>
                      <span className="stat-link" onClick={() => setActiveNav('transactions')}>
                        View all <ChevronRight size={14} />
                      </span>
                    </div>

                    <table className="fintech-table">
                      <thead>
                        <tr>
                          <th>Transaction Name</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                              No transactions recorded yet. Execute an AI purchase above!
                            </td>
                          </tr>
                        ) : (
                          recentOrders.slice(0, 5).map((ord) => {
                            const isPaid = ord.payment_status === 'paid' || ord.status === 'confirmed';
                            const isDenied = ord.status === 'denied' || ord.status === 'failed';
                            return (
                              <tr key={ord.id || ord.order_id}>
                                <td>
                                  <div className="table-item-name">{ord.product_title || 'Autonomous Purchase'}</div>
                                  <div className="table-item-sub">{ord.order_id}</div>
                                </td>
                                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  ₹{parseFloat(ord.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td>{new Date(ord.created_at || Date.now()).toLocaleDateString()}</td>
                                <td>
                                  <span className={`status-pill ${isPaid ? 'completed' : isDenied ? 'denied' : 'processing'}`}>
                                    <span className="status-dot-sm"></span>
                                    <span>{isPaid ? 'Completed' : isDenied ? 'Denied' : 'Processing'}</span>
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {ord.razorpay_payment_id ? `Razorpay: ${ord.razorpay_payment_id}` : 'Autonomous Agent Checkout'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column (35%): Agent Reasoning Feed + Merchant Stores Widget */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Live Activity Trace */}
                  <AgentActivityPanel
                    steps={steps}
                    toolCalls={agentResult?.toolCalls || []}
                    loading={loading}
                  />

                  {/* Merchant Stores Widget (Matching Upcoming Payments style from reference screenshot) */}
                  <div className="merchants-widget-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="panel-title">Connected Merchant Stores</span>
                      <span className="stat-link" onClick={() => setActiveNav('merchants')}>
                        Manage <ChevronRight size={14} />
                      </span>
                    </div>

                    <div className="merchants-list">
                      {merchantsList.length === 0 ? (
                        <>
                          <div className="merchant-row-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="merchant-logo-circle">🎓</div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>LearnHub Courses</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Port 8000 • Autonomous Auto-Buy</div>
                              </div>
                            </div>
                            <span className="status-pill completed">Active</span>
                          </div>

                          <div className="merchant-row-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="merchant-logo-circle">💻</div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>TechGear Electronics</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Port 8002 • Autonomous Auto-Buy</div>
                              </div>
                            </div>
                            <span className="status-pill completed">Active</span>
                          </div>

                          <div className="merchant-row-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="merchant-logo-circle">🍔</div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>FoodExpress Zomato</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Port 8003 • Autonomous Auto-Buy</div>
                              </div>
                            </div>
                            <span className="status-pill completed">Active</span>
                          </div>
                        </>
                      ) : (
                        merchantsList.map(m => (
                          <div key={m.id} className="merchant-row-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="merchant-logo-circle">
                                {m.id.includes('course') ? '🎓' : m.id.includes('zomato') ? '🍔' : '💻'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Max ₹{parseFloat(m.max_autonomous_order_amount || 10000).toLocaleString()}</div>
                              </div>
                            </div>
                            <span className={`status-pill ${m.agent_commerce_enabled !== false ? 'completed' : 'denied'}`}>
                              {m.agent_commerce_enabled !== false ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= VIEW 2: AI TERMINAL ================= */}
          {activeNav === 'terminal' && (
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="page-header-row">
                <div className="page-title-area">
                  <h2>AI Autonomous Terminal</h2>
                  <p>Execute agentic purchases across LearnHub, TechGear, and FoodExpress with zero human friction</p>
                </div>
              </div>

              <div className="ai-terminal-panel">
                <form onSubmit={(e) => { e.preventDefault(); handlePurchaseSubmit(); }}>
                  <div className="prompt-bar-wrap">
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`btn-mic-icon ${isListening ? 'listening' : ''}`}
                    >
                      <Mic size={16} />
                    </button>
                    <input
                      type="text"
                      className="prompt-bar-input"
                      value={purchaseQuery}
                      onChange={(e) => setPurchaseQuery(e.target.value)}
                      disabled={loading}
                      placeholder="Enter command e.g. Buy complete DSA mastery course"
                    />
                    <button type="submit" disabled={loading} className="btn-primary-blue">
                      {loading ? 'Purchasing...' : 'Execute'}
                    </button>
                  </div>
                </form>

                <div className="quick-scenarios-row" style={{ marginTop: '14px' }}>
                  {currentExampleQueries.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      className="scenario-pill"
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

              <AgentActivityPanel
                steps={steps}
                toolCalls={agentResult?.toolCalls || []}
                loading={loading}
              />
            </div>
          )}

          {/* ================= VIEW 3: POLICY ENGINE ================= */}
          {activeNav === 'policies' && (
            <AuthorizationDashboard
              isEmbedded={true}
              userEmail={customerEmail}
              onClose={() => setActiveNav('payments')}
              onPolicyUpdated={() => loadLedgerData()}
            />
          )}

          {/* ================= VIEW 4: TRANSACTIONS ================= */}
          {activeNav === 'transactions' && (
            <TransactionDashboard
              isEmbedded={true}
              userEmail={customerEmail}
              onClose={() => setActiveNav('payments')}
            />
          )}

          {/* ================= VIEW 5: MERCHANTS ================= */}
          {activeNav === 'merchants' && (
            <MerchantDashboard
              isEmbedded={true}
              onClose={() => setActiveNav('payments')}
            />
          )}

          {/* ================= VIEW 6: AUDIT TRAIL ================= */}
          {activeNav === 'audit' && (
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
              <AuditLogsModal
                isEmbedded={true}
                isOpen={true}
                onClose={() => setActiveNav('payments')}
              />
            </div>
          )}
        </main>
      </div>

      {/* ================= FIXED MODALS ================= */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={userProfile || { name: customerName, email: customerEmail }}
        onAuthSuccess={handleAuthSuccess}
      />

      <SavedPaymentModal
        isOpen={isSavedPaymentOpen}
        onClose={() => setIsSavedPaymentOpen(false)}
        userEmail={customerEmail}
        savedPayment={savedPayment}
        onPaymentUpdated={(p) => {
          setSavedPayment(p);
          loadLedgerData();
        }}
      />

      <RazorpayModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        paymentData={paymentData}
        onPaymentSuccess={handlePaymentSuccess}
      />

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
