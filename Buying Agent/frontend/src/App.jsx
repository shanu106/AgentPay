import React, { useState, useEffect, useRef } from 'react';
import { submitPurchaseRequest, fetchConfig, fetchSavedPaymentMethod, fetchUserProfile } from './api/agentApi';
import AgentActivityPanel from './components/AgentActivityPanel';
import RazorpayModal from './components/RazorpayModal';
import OrderConfirmationView from './components/OrderConfirmationView';
import AuditLogsModal from './components/AuditLogsModal';
import ApiKeyModal from './components/ApiKeyModal';
import SavedPaymentModal from './components/SavedPaymentModal';
import AuthModal from './components/AuthModal';
import OrderHistoryModal from './components/OrderHistoryModal';
import './App.css';

const SUPPORTED_LANGUAGES = {
  EN: 'en',
  HI: 'hi'
};

const exampleQueriesEn = [
  {
    label: '🍗 2 Chicken Biryani via SBI NetBanking',
    query: 'Buy 2 chicken biryani and pay using sbi netbanking'
  },
  {
    label: '⚡ JavaScript Mastery Course (Under ₹500)',
    query: 'Buy me a JavaScript mastery course of price upto 500'
  },
  {
    label: '⌨️ Logitech Wireless Mouse via Axis Bank',
    query: 'Buy a mouse fast from axis bank netbanking'
  },
  {
    label: '🐍 Python for Data Science (Under ₹1,000)',
    query: 'Buy me a Python Data Science course under ₹1,000'
  },
  {
    label: '🛡️ Test Security: Exceed Limit (Expect Auth Denied)',
    query: 'Buy a gaming laptop up to ₹2,50,000'
  }
];

const exampleQueriesHi = [
  {
    label: '🍗 2 चिकन बिरयानी (एसबीआई नेटबैंकिंग से)',
    query: 'दो चिकन बिरयानी आर्डर करो और एसबीआई नेटबैंकिंग से पे करो'
  },
  {
    label: '⚡ जावास्क्रिप्ट कोर्स (₹500 के अंदर)',
    query: 'जावास्क्रिप्ट कोर्स 500 रुपये के अंदर खरीदो'
  },
  {
    label: '⌨️ वायरलेस माउस (एक्सिस बैंक नेटबैंकिंग से)',
    query: 'एक माउस जल्दी भेजो और एक्सिस बैंक नेटबैंकिंग से भुगतान करो'
  },
  {
    label: '🐍 पायथन डाटा साइंस कोर्स (₹1,000 के अंदर)',
    query: 'पायथन डाटा साइंस कोर्स 1000 रुपये के अंदर खरीदो'
  },
  {
    label: '🛡️ टेस्ट सिक्योरिटी: अधिक राशि (सीमा से अधिक)',
    query: '250000 रुपये का गेमिंग लैपटॉप खरीदो'
  }
];

function App() {
  const [language, setLanguage] = useState('en');
  const [purchaseQuery, setPurchaseQuery] = useState('Buy 2 chicken biryani and pay using sbi netbanking');
  const [customerName, setCustomerName] = useState('Student Buyer');
  const [customerEmail, setCustomerEmail] = useState('student@example.com');
  const [loading, setLoading] = useState(false);

  // Saved Payment Details state
  const [savedPayment, setSavedPayment] = useState({
    enabled: true,
    type: 'card',
    brand: 'Visa (Domestic)',
    cardNumber: '4100 2800 0000 1007',
    last4: '1007',
    expiry: '12/28',
    holder: 'Student Buyer',
    autoDebitLimit: 15000
  });

  // Agent State
  const [agentResult, setAgentResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Modals & User Auth State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isSavedPaymentOpen, setIsSavedPaymentOpen] = useState(false);
  const [config, setConfig] = useState(null);

  // Voice Agent State
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  // Helper: Play Spoken Voice Feedback (ElevenLabs Audio / Web Speech API fallback)
  const playVoiceFeedback = (spokenText, audioUrl, currentLang = 'en') => {
    if (!isVoiceEnabled || !spokenText) return;

    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      if (audioUrl && audioUrl.startsWith('data:audio/')) {
        const audio = new Audio(audioUrl);
        audio.play().catch(err => {
          console.warn('[ElevenLabs Playback Fallback]:', err.message);
          speakWithBrowser(spokenText, currentLang);
        });
      } else {
        speakWithBrowser(spokenText, currentLang);
      }
    } catch (err) {
      console.warn('[Voice Feedback Error]:', err);
    }
  };

  const speakWithBrowser = (text, currentLang = 'en') => {
    if (!window.speechSynthesis) return;
    const cleanText = text.replace(/[*_`#]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const targetPrefix = currentLang === 'hi' ? 'hi' : 'en';
    const naturalVoice = voices.find(v => v.lang.startsWith(targetPrefix) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Lekha')));
    if (naturalVoice) utterance.voice = naturalVoice;

    window.speechSynthesis.speak(utterance);
  };

  // Voice Recognition Ref
  const recognitionRef = useRef(null);

  // Toggle Voice Input Microphone
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    if (isListening) {
      setIsListening(false);
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : (navigator.language || 'en-US');
      let capturedTranscript = '';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }
        fullTranscript = fullTranscript.trim();
        console.log('[Speech Input]:', fullTranscript);
        if (fullTranscript) {
          capturedTranscript = fullTranscript;
          setPurchaseQuery(fullTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (capturedTranscript && capturedTranscript.trim().length > 1) {
          handlePurchaseSubmit(capturedTranscript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err.message);
      setIsListening(false);
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
      { text: language === 'hi' ? `अनुरोध का विश्लेषण किया जा रहा है: "${text}"` : `Analyzing purchase request: "${text}"`, status: 'completed' }
    ]);

    try {
      const res = await submitPurchaseRequest({
        message: text,
        customerName: savedPayment.holder || customerName,
        customerEmail,
        autoExecutePayment: savedPayment.enabled !== false,
        savedPaymentMethod: savedPayment,
        language
      });

      setAgentResult(res);
      setSteps(res.steps || []);
      setSelectedProduct(res.selectedProduct);
      setActiveOrder(res.order);
      setPaymentData(res.paymentData);

      // Play Spoken Voice Feedback on both Success and Failure
      if (res.spokenFeedback) {
        playVoiceFeedback(res.spokenFeedback, res.audioUrl, language);
      }

      // Zero Human Intervention: If autoPaid is true, order is confirmed & captured on Razorpay
      if (res.autoPaid && res.order) {
        setConfirmedOrder({
          ...res.order,
          verifiedPayment: res.verification,
          status: 'confirmed'
        });
        setIsRazorpayOpen(false);
      } else if (!res.autoPaid && res.requiresCheckout && res.paymentData) {
        // Only open manual checkout if auto-debit was explicitly turned off
        setIsRazorpayOpen(true);
      }
    } catch (err) {
      const errMsg = `Error processing purchase: ${err.message}`;
      setSteps(prev => [
        ...prev,
        { text: errMsg, status: 'failed' }
      ]);
      playVoiceFeedback(language === 'hi' ? `क्षमा करें, आपका ऑर्डर पूरा नहीं हो सका।` : `Sorry, your purchase could not be completed. ${err.message}`, null, language);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    loadUserProfile('nawaz@gmail.com');
  }, []);

  const loadUserProfile = async (email = 'nawaz@gmail.com') => {
    try {
      const data = await fetchUserProfile(email);
      if (data.user) {
        setUserProfile(data.user);
        setCustomerName(data.user.name || 'Nawaz Khan');
        setCustomerEmail(data.user.email || 'nawaz@gmail.com');
        if (data.user.defaultPaymentMethod) {
          setSavedPayment(data.user.defaultPaymentMethod);
        }
      }
    } catch (err) {
      console.warn('Failed to load PostgreSQL user profile:', err);
      loadSavedPayment();
    }
  };

  const handleAuthSuccess = (user, token) => {
    if (user) {
      setUserProfile(user);
      setCustomerName(user.name || 'Nawaz Khan');
      setCustomerEmail(user.email || 'nawaz@gmail.com');
      if (user.defaultPaymentMethod) {
        setSavedPayment(user.defaultPaymentMethod);
      }
    }
  };

  const loadConfig = async () => {
    try {
      const data = await fetchConfig();
      setConfig(data);
    } catch (err) {
      console.warn('Failed to load config:', err);
    }
  };

  const loadSavedPayment = async () => {
    try {
      const data = await fetchSavedPaymentMethod();
      if (data.paymentMethod) {
        setSavedPayment(data.paymentMethod);
      }
    } catch (err) {
      console.warn('Failed to load saved payment method:', err);
    }
  };

  const handlePaymentSuccess = (verificationResult) => {
    const verifiedData = verificationResult.verification || verificationResult;
    setConfirmedOrder({
      ...(activeOrder || agentResult?.order || {}),
      verifiedPayment: verifiedData,
      status: 'confirmed'
    });

    setSteps(prev => [
      ...prev,
      { text: `Payment Captured in Razorpay (Payment ID: ${verifiedData.paymentId || verifiedData.razorpay_payment_id || 'pay_verified'})`, status: 'completed' },
      { text: `HMAC SHA256 Signature Verified with Merchant Backend!`, status: 'completed' },
      { text: `Course Enrollment Activated! Payment visible in Razorpay Dashboard.`, status: 'completed' }
    ]);
  };

  const handleReset = () => {
    setAgentResult(null);
    setSteps([]);
    setSelectedProduct(null);
    setActiveOrder(null);
    setPaymentData(null);
    setConfirmedOrder(null);
    setPurchaseQuery(language === 'hi' ? 'दो चिकन बिरयानी आर्डर करो और एसबीआई नेटबैंकिंग से पे करो' : 'Buy 2 chicken biryani and pay using sbi netbanking');
  };

  const currentExampleQueries = language === 'hi' ? exampleQueriesHi : exampleQueriesEn;

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="header">
        <div className="brand-section">
          <div className="brand-logo-icon">🤖</div>
          <div className="brand-info">
            <h1>AI Shopping Buyer Agent</h1>
            <span>Autonomous Purchase • Pre-Authorized Auto-Debit • PostgreSQL DB</span>
          </div>
        </div>

        <div className="header-actions">
          {/* User Account / PostgreSQL Auth Button */}
          <button 
            className="key-status-btn"
            onClick={() => setIsAuthOpen(true)}
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(2, 132, 199, 0.12))',
              borderColor: 'rgba(37, 99, 235, 0.45)',
              color: '#93c5fd',
              fontWeight: '700'
            }}
            title="User Account & PostgreSQL Database Login / Signup"
          >
            <span>👤</span>
            <span>{userProfile?.name ? `${userProfile.name} (${userProfile.email.split('@')[0]})` : 'PostgreSQL User'}</span>
          </button>

          {/* Language Switcher (English / Hindi) */}
          <button 
            className="key-status-btn"
            onClick={() => {
              const newLang = language === 'en' ? 'hi' : 'en';
              setLanguage(newLang);
              setPurchaseQuery(newLang === 'hi' ? 'दो चिकन बिरयानी आर्डर करो और एसबीआई नेटबैंकिंग से पे करो' : 'Buy 2 chicken biryani and pay using sbi netbanking');
            }}
            style={{
              background: language === 'hi' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.12)',
              borderColor: language === 'hi' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(59, 130, 246, 0.35)',
              color: language === 'hi' ? '#fbbf24' : '#60a5fa',
              fontWeight: '800'
            }}
            title="Switch Language / भाषा बदलें (English / हिंदी)"
          >
            <span>{language === 'hi' ? '🌐 भाषा: हिंदी (HI)' : '🌐 Lang: English (EN)'}</span>
          </button>

          {/* Voice AI Audio Feedback Toggle */}
          <button 
            className="key-status-btn"
            onClick={() => {
              setIsVoiceEnabled(!isVoiceEnabled);
              if (isVoiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
            }}
            style={{
              background: isVoiceEnabled ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: isVoiceEnabled ? 'rgba(59, 130, 246, 0.35)' : 'var(--border-subtle)',
              color: isVoiceEnabled ? '#60a5fa' : 'var(--text-secondary)'
            }}
            title={isVoiceEnabled ? 'ElevenLabs Voice Feedback: ACTIVE' : 'Voice Feedback: MUTED'}
          >
            <span>{isVoiceEnabled ? '🔊 Voice: ON' : '🔇 Voice: Muted'}</span>
          </button>

          {/* Pre-Saved Payment Badge / Button */}
          <button 
            className="key-status-btn"
            onClick={() => setIsSavedPaymentOpen(true)}
            style={{ 
              background: savedPayment.enabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: savedPayment.enabled ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)',
              color: savedPayment.enabled ? 'var(--accent-emerald)' : 'var(--text-secondary)'
            }}
            title="Manage Saved Cards, NetBanking, and Auto-Debit Limits in PostgreSQL"
          >
            <span>💳</span>
            <span>{savedPayment.enabled ? `Auto-Pay: ${savedPayment.brand || savedPayment.label} ${savedPayment.last4 ? '•••• ' + savedPayment.last4 : ''}` : 'Auto-Pay: Off'}</span>
          </button>

          {/* Orders History Button */}
          <button 
            className="key-status-btn"
            onClick={() => setIsOrderHistoryOpen(true)}
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              borderColor: 'rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontWeight: '700'
            }}
            title="View All Past Orders & Payment Receipts in PostgreSQL"
          >
            <span>📦</span>
            <span>My Orders</span>
          </button>

          <button className="key-status-btn" onClick={() => setIsAuditOpen(true)}>
            <span>📜</span>
            <span>Audit Logs</span>
          </button>

          <button className="key-status-btn" onClick={() => setIsApiKeyOpen(true)}>
            <span className={`status-dot ${config?.hasGeminiKey ? 'active' : 'simulated'}`}></span>
            <span>{config?.hasGeminiKey ? 'Gemini 2.0 Active' : 'Gemini Key'}</span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 className="purchase-card-title" style={{ margin: 0 }}>
                {language === 'hi' ? 'आप क्या खरीदना चाहते हैं?' : 'What do you want to buy?'}
              </h2>
              {savedPayment.enabled && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  color: 'var(--accent-emerald)',
                  fontWeight: '700'
                }}>
                  <span>⚡</span> Auto-Buy Enabled
                </div>
              )}
            </div>

            <p className="purchase-card-sub">
              {language === 'hi'
                ? 'अपना अनुरोध लिखें या 🎙️ बोलें। एआई एजेंट आपके लिए कैटलॉग खोजेगा और प्री-ऑथराइज्ड पेमेंट से सुरक्षित ऑर्डर करेगा।'
                : 'Enter your purchase request or click 🎙️ to speak. The AI Agent will discover, verify, and complete checkout with pre-authorized payment details.'}
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handlePurchaseSubmit(); }} className="purchase-form">
              <div className="purchase-input-wrap">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`btn-voice-mic ${isListening ? 'listening' : ''}`}
                  title={isListening ? 'Listening... click to stop' : 'Click to Speak (Voice Agent)'}
                >
                  {isListening ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="mic-pulse-dot"></span>
                      <span>🎙️ {language === 'hi' ? 'सुन रहे हैं...' : 'Listening...'}</span>
                    </span>
                  ) : (
                    <span>🎙️ {language === 'hi' ? 'आवाज़ (Voice)' : 'Voice'}</span>
                  )}
                </button>
                <input
                  type="text"
                  className="purchase-input-field"
                  placeholder={
                    isListening 
                      ? (language === 'hi' ? 'सुन रहे हैं... अभी अपना ऑर्डर बोलें...' : 'Listening... speak your order now...') 
                      : (language === 'hi' ? 'उदा. 2 चिकन बिरयानी एसबीआई नेटबैंकिंग से आर्डर करो...' : 'e.g. Buy 2 chicken biryani with SBI netbanking or speak with mic')
                  }
                  value={purchaseQuery}
                  onChange={(e) => setPurchaseQuery(e.target.value)}
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  disabled={loading || !purchaseQuery.trim()} 
                  className="btn-purchase-submit"
                >
                  {loading ? (language === 'hi' ? 'ऑर्डर हो रहा है...' : 'Agent Purchasing...') : (language === 'hi' ? '🚀 खरीदें' : '🚀 Purchase')}
                </button>
              </div>
            </form>

            {/* Quick Demo Prompts */}
            <div className="quick-demo-prompts">
              <span className="demo-prompts-label">
                {language === 'hi' ? 'त्वरित डेमो उदाहरण:' : 'Quick Demo Scenarios:'}
              </span>
              <div className="demo-chips-grid">
                {currentExampleQueries.map((ex, i) => (
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
                  {confirmedOrder ? '✓ Purchased & Enrolled' : activeOrder ? '✓ Selected by Agent' : 'Candidate Inspected'}
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
                    <span>🛡️ Pre-Authorization Engine:</span>
                    <strong>APPROVED & AUTO-DEBITED (₹{selectedProduct.price} ≤ ₹{agentResult?.intent?.maxPrice || 10000})</strong>
                  </div>
                ) : agentResult?.success === false ? (
                  <div className="auth-status-pill denied">
                    <span>🛡️ Pre-Authorization Engine:</span>
                    <strong>DENIED: Price exceeds authorized limit</strong>
                  </div>
                ) : null}

                {/* Direct Action Trigger only if not auto-paid */}
                {activeOrder && !confirmedOrder && !agentResult?.autoPaid && (
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

      {/* User Auth Modal (PostgreSQL Login / Signup) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={userProfile || { name: customerName, email: customerEmail }}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Razorpay Test Modal (Fallback if manual checkout requested) */}
      <RazorpayModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        paymentData={paymentData}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Pre-Saved Payment Details Modal (Add / Remove Cards & NetBanking) */}
      <SavedPaymentModal
        isOpen={isSavedPaymentOpen}
        onClose={() => setIsSavedPaymentOpen(false)}
        userEmail={customerEmail}
        savedPayment={savedPayment}
        onPaymentUpdated={(p) => setSavedPayment(p)}
      />

      {/* Order History Modal (All Past Orders in PostgreSQL) */}
      <OrderHistoryModal
        isOpen={isOrderHistoryOpen}
        onClose={() => setIsOrderHistoryOpen(false)}
        userEmail={customerEmail}
        userName={customerName}
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
