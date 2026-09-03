import React, { useState } from 'react';
import { 
  BookOpen, Shield, Cpu, Store, Key, Database, Terminal, 
  CheckCircle2, Sparkles, AlertTriangle, ArrowRight, Copy, Check, Video, FileText
} from 'lucide-react';

const AgentDocumentation = ({ isEmbedded = true, onClose }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const navSections = [
    { id: 'overview', label: '1. Overview & Architecture', icon: Sparkles },
    { id: 'modules', label: '2. Subsystems & Modules', icon: Cpu },
    { id: 'merchants', label: '3. Merchant Ecosystem', icon: Store },
    { id: 'security', label: '4. Security & TOCTOU', icon: Shield },
    { id: 'database', label: '5. DB Schema & APIs', icon: Database }
  ];

  return (
    <div className={isEmbedded ? "terminal-card" : "modal-box"} style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            📖
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              AgentPay System Documentation
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                Razorpay Buildathon Edition
              </span>
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Comprehensive technical specifications, policy engine guardrails, and architecture overview
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
        {navSections.map(sec => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--accent-blue, #2563eb)' : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Panels */}
      <div style={{ maxHeight: '68vh', overflowY: 'auto', paddingRight: '6px' }}>

        {/* ================= SECTION 1: OVERVIEW ================= */}
        {activeSection === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(139, 92, 246, 0.1))', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '18px 20px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', color: '#60a5fa', fontWeight: 700 }}>
                💡 Executive Summary: Pre-Authorized Autonomous Commerce
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.6', color: '#cbd5e1' }}>
                Traditional e-commerce requires human users to manually search across multiple sites, add to individual carts, fill forms, and pass 3D-Secure / OTP challenges for every single purchase. 
                <strong> AgentPay</strong> introduces <strong>Pre-Authorized Autonomous AI Commerce</strong>: users set spending mandates (e.g. ₹15,000/order, ₹50,000/day), and an autonomous AI agent executes real Razorpay orders across courses, electronics, and food merchants with zero manual friction.
              </p>
            </div>

            {/* Comparison Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ color: '#fb7185', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ❌ Traditional E-Commerce Friction
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.6' }}>
                  <li>Fragmented apps and separate logins</li>
                  <li>Manual search, cart creation & address typing</li>
                  <li>Repetitive OTP / 3DS friction for routine purchases</li>
                  <li>No cross-store multi-item consolidation</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ✓ The AgentPay Autonomous Solution
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  <li>Natural language voice/text prompt across all stores</li>
                  <li>Autonomous multi-merchant search & stock check</li>
                  <li>Dynamic Spending Policy evaluation & atomic reserves</li>
                  <li>Direct Razorpay capture & automated email receipts</li>
                </ul>
              </div>
            </div>

            {/* Architecture Flow */}
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '18px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>
                ⚡ End-to-End Execution Pipeline
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                {[
                  { step: '1. NLP Parser', desc: 'Gemini 2.0 / NLP extracts 3+ items across niches' },
                  { step: '2. Catalog Aggregator', desc: 'Parallel search across Course, Tech & Zomato APIs' },
                  { step: '3. Policy Guardrail', desc: 'Daily limits, TOCTOU check & atomic reservation' },
                  { step: '4. Razorpay Capture', desc: 'Auto-payment capture, PostgreSQL audit & email' }
                ].map((s, idx) => (
                  <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa', marginBottom: '4px' }}>{s.step}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 2: MODULES ================= */}
        {activeSection === 'modules' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#38bdf8', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🤖 1. Multilingual Natural Language & Compound Word NLP Engine
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                Extracts multi-item purchase intents from unstructured natural language in <strong>English, Hindi (Devanagari), and Hinglish</strong>. Features compound title protection (e.g. <code>Python for Data Science</code>, <code>AI and Machine Learning</code>, <code>Paneer Butter Masala</code>) and multi-item splitting on determiners (<code>a</code>, <code>an</code>), quantities, commas, and conjunctions.
              </p>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#a78bfa', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🛡️ 2. PolicyEngine & Dynamic SpendingLedger
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                Enforces transactional caps (<code>maxTransactionAmount</code>), daily budgets (<code>dailySpendingLimit</code>), allowed categories, and human confirmation thresholds (<code>requireConfirmationAbove</code>). The ledger dynamically tallies current-day orders using PostgreSQL <code>CURRENT_DATE</code> comparisons and automatically rolls over to ₹0 at midnight.
              </p>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#34d399', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💳 3. Razorpay Autonomous Payment Provider
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                Interacts with Razorpay Orders API, executes pre-authorized tokenized debits, verifies cryptographic signatures, and updates order states to <code>paid</code> and <code>confirmed</code>. Includes automated rollbacks if any payment step fails.
              </p>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#f59e0b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📜 4. Immutable PostgreSQL Audit Ledger & Redaction
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                Every tool call, policy evaluation, price check, payment capture, and email delivery is permanently recorded in the <code>audit_logs</code> table. Automatically sanitizes and redacts raw card numbers, CVVs, passwords, and API keys before insertion.
              </p>
            </div>
          </div>
        )}

        {/* ================= SECTION 3: MERCHANTS ================= */}
        {activeSection === 'merchants' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff' }}>Connected Microservice Ecosystem</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {[
                { title: 'LearnHub Courses', port: '8000 (API) / 5174 (UI)', cat: 'Education', desc: 'Python for Data Science, Full Stack, React, Cloud & AI Masterclasses.' },
                { title: 'TechGear Electronics', port: '8002 (API) / 5175 (UI)', cat: 'Hardware', desc: 'Keychron K2 Keyboards, MX Master 3S Mice, GaN Fast Chargers, Sony ANC.' },
                { title: 'FoodExpress Zomato', port: '8003 (API) / 5176 (UI)', cat: 'Dining & Food', desc: 'Hyderabadi Chicken Dum Biryani, Cheesy-7 Pizza, Burgers, Waffles.' },
                { title: 'AgentPay Command Center', port: '5000 (API) / 5173 (UI)', cat: 'Core Platform', desc: 'Policy manager, central orchestrator, multi-store terminal & audit trail.' }
              ].map((m, idx) => (
                <div key={idx} style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>{m.title}</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' }}>{m.cat}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>Ports: {m.port}</div>
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.4' }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION 4: SECURITY ================= */}
        {activeSection === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.9rem', marginBottom: '4px' }}>
                🛡️ 1. TOCTOU Defense (Time-of-Check to Time-of-Use)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                Prevents price-surge exploitation. Even after an item is found via search, the agent re-fetches the authoritative live price right before creating the order. If the merchant increases the price, the transaction is rejected instantly.
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.9rem', marginBottom: '4px' }}>
                🔑 2. Cryptographic Idempotency Keys
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                Every purchase request generates a unique session key (<code>idem_&#123;userId&#125;_&#123;timestamp&#125;</code>). Network retries return the existing order without creating duplicate Razorpay debits.
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.9rem', marginBottom: '4px' }}>
                🔒 3. Tokenized Payment Instruments
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                No raw card numbers or CVVs are stored in application state. Payments use tokenized references (e.g. <code>nb_sbi_38</code>, <code>card_visa_1007</code>) with customer pre-approval limits.
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 5: DATABASE & APIS ================= */}
        {activeSection === 'database' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff' }}>PostgreSQL Database Tables</h4>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#cbd5e1' }}>
              <span style={{ color: '#93c5fd' }}>• users:</span> id, name, email, password_hash, phone, created_at<br />
              <span style={{ color: '#93c5fd' }}>• agent_authorizations:</span> id, user_id, max_transaction_amount, daily_spending_limit, spent_today, spent_today_reset_date, allowed_categories<br />
              <span style={{ color: '#93c5fd' }}>• orders:</span> id, order_id, user_email, razorpay_order_id, razorpay_payment_id, product_title, amount, quantity, items, status, payment_status<br />
              <span style={{ color: '#93c5fd' }}>• audit_logs:</span> id, user_id, user_email, order_id, action_type, details, timestamp
            </div>

            <h4 style={{ margin: '8px 0 0 0', fontSize: '0.95rem', color: '#fff' }}>Core API Endpoints</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { method: 'POST', path: '/api/agent/purchase', desc: 'Autonomous purchase from natural language prompt' },
                { method: 'GET', path: '/api/agent/audit-logs', desc: 'Fetch immutable audit trails from PostgreSQL' },
                { method: 'GET', path: '/api/user/orders', desc: 'Fetch user orders with Razorpay payment references' },
                { method: 'POST', path: '/api/user/authorization/reset-spent', desc: 'Reset spent today counter to ₹0.00' }
              ].map((ep, idx) => (
                <div key={idx} style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: ep.method === 'POST' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: ep.method === 'POST' ? '#34d399' : '#60a5fa' }}>{ep.method}</span>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#fff' }}>{ep.path}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ep.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

       

      </div>
    </div>
  );
};

export default AgentDocumentation;
