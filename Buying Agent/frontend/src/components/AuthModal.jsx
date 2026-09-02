import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  Key, 
  Sparkles, 
  Send, 
  User, 
  CreditCard, 
  Package, 
  Sliders, 
  LogOut, 
  CheckCircle2, 
  RefreshCw, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Lock, 
  Smartphone,
  Check
} from 'lucide-react';
import { 
  signupUser, 
  loginUser, 
  sendOtp, 
  verifyOtp, 
  fetchUserProfile, 
  fetchPaymentMethods, 
  fetchUserOrders, 
  setDefaultPaymentMethod, 
  updatePaymentMethod 
} from '../api/agentApi';

const AuthModal = ({ isOpen, onClose, currentUser, onAuthSuccess }) => {
  // If user is logged in, default to 'profile', otherwise default to 'otp'
  const [activeTab, setActiveTab] = useState(currentUser?.email ? 'profile' : 'otp'); // 'profile' | 'cards' | 'orders' | 'policies' | 'otp' | 'password' | 'signup'
  
  // Auth Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Profile Data State
  const [profileData, setProfileData] = useState(currentUser || null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (currentUser?.email) {
        setActiveTab('profile');
        setEmail(currentUser.email);
        loadUserDetails(currentUser.email);
      } else {
        setActiveTab('otp');
      }
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentUser]);

  const loadUserDetails = async (userEmail) => {
    const targetEmail = userEmail || currentUser?.email;
    if (!targetEmail) return;

    try {
      const [profileRes, pmRes, ordersRes] = await Promise.all([
        fetchUserProfile(targetEmail).catch(() => null),
        fetchPaymentMethods(targetEmail).catch(() => null),
        fetchUserOrders(targetEmail).catch(() => null)
      ]);

      if (profileRes?.success && profileRes.user) {
        setProfileData(profileRes.user);
      }
      if (pmRes?.success && pmRes.paymentMethods) {
        setPaymentMethods(pmRes.paymentMethods);
      }
      if (ordersRes?.orders) {
        setUserOrders(ordersRes.orders);
      }
    } catch (_) {}
  };

  const handleRefreshOrders = async () => {
    if (!currentUser?.email) return;
    setLoadingOrders(true);
    try {
      const res = await fetchUserOrders(currentUser.email);
      if (res?.orders) setUserOrders(res.orders);
    } catch (_) {}
    finally {
      setLoadingOrders(false);
    }
  };

  const handleSetDefaultCard = async (methodId) => {
    if (!currentUser?.email) return;
    try {
      await setDefaultPaymentMethod(methodId, currentUser.email);
      setPaymentMethods(prev => prev.map(pm => ({
        ...pm,
        isDefault: pm.id === methodId || pm.id === methodId
      })));
      setSuccessMsg('Default payment instrument updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  // 1. Send OTP Handler
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address to receive the OTP.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await sendOtp({ email, name });
      setOtpSent(true);
      setSuccessMsg(res.message || `6-digit verification code sent to ${email}`);
      setOtpCode('123456'); // Pre-filled for demo convenience
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP Handler
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!otpCode || otpCode.trim().length < 4) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await verifyOtp({ email, otp: otpCode, name, phone });
      
      // Save cookies and storage
      localStorage.setItem('buying_agent_token', res.token);
      localStorage.setItem('agentpay_user', JSON.stringify({ email: res.user.email, name: res.user.name, token: res.token }));
      localStorage.setItem('agentpay_email', res.user.email);
      document.cookie = `agentpay_email=${encodeURIComponent(res.user.email)}; path=/; max-age=604800`;
      document.cookie = `agentpay_token=${encodeURIComponent(res.token)}; path=/; max-age=604800`;
      
      setProfileData(res.user);
      setSuccessMsg(res.message || 'Verified and logged in successfully!');
      if (onAuthSuccess) onAuthSuccess(res.user, res.token);

      // Transition to Profile Dashboard Tab
      setTimeout(() => {
        setActiveTab('profile');
        loadUserDetails(res.user.email);
        setSuccessMsg(null);
      }, 400);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Password / Signup Submit
  const handlePasswordSubmit = async (e) => {
    e?.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      let res;
      if (activeTab === 'password') {
        res = await loginUser({ email, password });
      } else {
        res = await signupUser({ name, email, password, phone });
      }

      localStorage.setItem('buying_agent_token', res.token);
      localStorage.setItem('agentpay_user', JSON.stringify({ email: res.user.email, name: res.user.name, token: res.token }));
      localStorage.setItem('agentpay_email', res.user.email);
      document.cookie = `agentpay_email=${encodeURIComponent(res.user.email)}; path=/; max-age=604800`;
      document.cookie = `agentpay_token=${encodeURIComponent(res.token)}; path=/; max-age=604800`;
      
      setProfileData(res.user);
      setSuccessMsg(res.message || 'Logged in successfully!');
      if (onAuthSuccess) onAuthSuccess(res.user, res.token);

      setTimeout(() => {
        setActiveTab('profile');
        loadUserDetails(res.user.email);
        setSuccessMsg(null);
      }, 400);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Logout Handler
  const handleSignOut = () => {
    localStorage.removeItem('buying_agent_token');
    localStorage.removeItem('agentpay_user');
    localStorage.removeItem('agentpay_email');
    localStorage.removeItem('agentpay_token');
    document.cookie = "agentpay_email=; path=/; max-age=0";
    document.cookie = "agentpay_token=; path=/; max-age=0";
    
    setProfileData(null);
    setPaymentMethods([]);
    setUserOrders([]);
    if (onAuthSuccess) onAuthSuccess(null, null);
    
    setActiveTab('otp');
    setOtpSent(false);
    setOtpCode('');
    setSuccessMsg('Signed out of session.');
  };

  const isLoggedIn = Boolean(currentUser?.email || profileData?.email);
  const activeUser = profileData || currentUser || { name: 'Guest Buyer', email: 'guest@example.com' };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content auth-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: isLoggedIn ? '560px' : '440px', transition: 'all 0.25s ease' }}>
        
        {/* Modal Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              {isLoggedIn ? '👤' : '🔐'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                {isLoggedIn ? 'AgentPay Profile & Account Hub' : 'AgentPay Instant Authentication'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                {isLoggedIn ? `Active: ${activeUser.email}` : 'Secure PostgreSQL Connected Session'}
              </p>
            </div>
          </div>
          {onClose && (
            <button className="modal-close-btn" onClick={onClose} aria-label="Close" title="Close">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Dynamic Navigation Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: '8px',
          padding: '4px',
          margin: '14px 0',
          gap: '4px',
          overflowX: 'auto'
        }}>
          {isLoggedIn ? (
            <>
              <button
                type="button"
                onClick={() => { setActiveTab('profile'); setError(null); }}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12px',
                  background: activeTab === 'profile' ? 'var(--accent-blue, #0284c7)' : 'transparent',
                  color: activeTab === 'profile' ? '#fff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <User size={14} /> Profile
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('cards'); setError(null); }}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12px',
                  background: activeTab === 'cards' ? 'var(--accent-blue, #0284c7)' : 'transparent',
                  color: activeTab === 'cards' ? '#fff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <CreditCard size={14} /> Saved Cards
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('orders'); setError(null); handleRefreshOrders(); }}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12px',
                  background: activeTab === 'orders' ? 'var(--accent-blue, #0284c7)' : 'transparent',
                  color: activeTab === 'orders' ? '#fff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <Package size={14} /> Orders
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setActiveTab('otp'); setError(null); }}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12px',
                  background: activeTab === 'otp' ? 'var(--accent-blue, #0284c7)' : 'transparent',
                  color: activeTab === 'otp' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                ⚡ Quick OTP
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('password'); setError(null); }}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12px',
                  background: activeTab === 'password' ? 'var(--accent-blue, #0284c7)' : 'transparent',
                  color: activeTab === 'password' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                🔑 Password
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('signup'); setError(null); }}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12px',
                  background: activeTab === 'signup' ? 'var(--accent-blue, #0284c7)' : 'transparent',
                  color: activeTab === 'signup' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                ✨ Sign Up
              </button>
            </>
          )}
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '13px',
            color: '#f87171',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '13px',
            color: '#34d399',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= VIEW 1: PROFILE DETAILS TAB ================= */}
        {isLoggedIn && activeTab === 'profile' && (
          <div>
            {/* User Identity Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: '800'
                  }}>
                    {(activeUser.name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {activeUser.name || 'Shahnawaz Nilger'}
                    </h4>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {activeUser.email}
                    </span>
                  </div>
                </div>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <ShieldCheck size={12} /> Verified
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>📱 Phone Number</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{activeUser.phone || '+91 98765 43210'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>🛡️ Spending Capacity</span>
                  <strong style={{ color: '#38bdf8' }}>₹{(activeUser.spendingLimitTotal || 50000).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <MapPin size={16} style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Active Delivery Address</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Flat 402, Sunshine Heights, 12th Main, Koramangala 4th Block, Bengaluru - 560034
              </p>
            </div>

            {/* Sign Out Action */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Close Hub
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        )}

        {/* ================= VIEW 2: SAVED CARDS TAB ================= */}
        {isLoggedIn && activeTab === 'cards' && (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Pre-authorized instruments configured for 0-click autonomous purchases:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {paymentMethods.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  Loading saved payment instruments...
                </div>
              ) : (
                paymentMethods.map(pm => (
                  <div
                    key={pm.id}
                    style={{
                      background: pm.isDefault || pm.is_default ? 'rgba(2, 132, 199, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${pm.isDefault || pm.is_default ? 'rgba(2, 132, 199, 0.4)' : 'var(--border-subtle)'}`,
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '20px' }}>
                        {pm.category === 'UPI' ? '⚡' : pm.category === 'NetBanking' ? '🏦' : '💳'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>
                          {pm.label || pm.brand || 'Card'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Limit: ₹{(pm.autoDebitLimit || pm.auto_debit_limit || 15000).toLocaleString()} • {pm.holder || activeUser.name}
                        </div>
                      </div>
                    </div>

                    <div>
                      {pm.isDefault || pm.is_default ? (
                        <span style={{
                          background: '#0284c7',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '999px'
                        }}>
                          DEFAULT ✓
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultCard(pm.id)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          Set Default
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 3: ORDER HISTORY TAB ================= */}
        {isLoggedIn && activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {userOrders.length} order(s) stored in PostgreSQL
              </span>
              <button
                type="button"
                onClick={handleRefreshOrders}
                disabled={loadingOrders}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={13} className={loadingOrders ? 'spin' : ''} /> Refresh
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {userOrders.length === 0 ? (
                <div style={{
                  padding: '24px 12px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px dashed var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>🛍️</div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>No Orders Yet</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Type or speak to the agent to place your first autonomous order.
                  </p>
                </div>
              ) : (
                userOrders.map(o => (
                  <div
                    key={o.orderId || o.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>
                          #{o.orderId || o.id}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: '800', fontSize: '14px', color: '#34d399' }}>
                          ₹{(o.amount || 0).toLocaleString()}
                        </span>
                        <div>
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '999px',
                            fontWeight: '700'
                          }}>
                            Captured ✓
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {o.productTitle || (o.items && o.items[0]?.title) || 'Autonomous Item'}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>💳 {o.paymentMethod?.label || o.paymentMethod?.brand || 'Razorpay Auto-Debit'}</span>
                      <span>🔒 {o.razorpayPaymentId || o.razorpayOrderId || 'Test Payment'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 4: OTP SIGN-IN (FOR LOGGED OUT USERS) ================= */}
        {!isLoggedIn && activeTab === 'otp' && (
          <div>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. shahnawaznilger@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="config-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Full Name (Optional for new users)
              </label>
              <input
                type="text"
                placeholder="e.g. Shahnawaz"
                value={name}
                onChange={e => setName(e.target.value)}
                className="config-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Send size={16} />
                {loading ? 'Sending Verification Code...' : '📩 Send 6-Digit OTP Code'}
              </button>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="form-group" style={{ marginBottom: '14px', padding: '12px', background: 'rgba(2, 132, 199, 0.08)', borderRadius: '8px', border: '1px solid rgba(2, 132, 199, 0.3)' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#93c5fd' }}>
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    required
                    autoFocus
                    className="config-input"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      fontSize: '20px',
                      fontWeight: '800',
                      letterSpacing: '8px',
                      textAlign: 'center',
                      background: '#0f172a'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', textAlign: 'center' }}>
                    Dispatched to {email}. Demo Master OTP: <strong style={{ color: '#38bdf8' }}>123456</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Resend Code
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 2,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #059669, #10b981)',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Verifying...' : '✅ Verify & Sign In'}
                  </button>
                </div>
              </form>
            )}

            {/* Quick Demo Logins */}
            <div style={{ marginTop: '14px', padding: '10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚡ 1-Click Demo Accounts
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('shahnawaznilger@gmail.com');
                    setName('Shahnawaz Nilger');
                    setPassword('password123');
                    setOtpCode('123456');
                    setOtpSent(true);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--accent-blue)',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  👤 Shahnawaz (Gmail Live)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('nawaz@gmail.com');
                    setName('Nawaz Khan');
                    setPassword('password123');
                    setOtpCode('123456');
                    setOtpSent(true);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#34d399',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  👤 Nawaz Khan (Demo)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 5: PASSWORD / SIGNUP VIEW ================= */}
        {!isLoggedIn && (activeTab === 'password' || activeTab === 'signup') && (
          <form onSubmit={handlePasswordSubmit}>
            {activeTab === 'signup' && (
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nawaz Khan"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required={activeTab === 'signup'}
                  className="config-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. nawaz@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="config-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password (default: password123)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="config-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {activeTab === 'signup' && (
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="config-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff',
                fontWeight: '700',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                marginTop: '6px'
              }}
            >
              {loading ? 'Processing...' : (activeTab === 'password' ? '🔑 Log In with Password' : '✨ Create PostgreSQL Account')}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
