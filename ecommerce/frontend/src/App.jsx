import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Star, 
  Zap, 
  CreditCard, 
  CheckCircle2, 
  Code, 
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  Lock
} from 'lucide-react';

const API_BASE = 'http://localhost:8002/api';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const categories = ['All', 'Keyboards', 'Audio', 'Accessories', 'Wearables', 'Bags & Sleeves'];

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery) params.append('query', searchQuery);

      const res = await fetch(`${API_BASE}/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`Added ${product.title} to cart`);
  };

  const triggerAgentPurchase = (productPrompt) => {
    if (window.RazorpayAgent && typeof window.RazorpayAgent.purchase === 'function') {
      window.RazorpayAgent.purchase(productPrompt);
    } else if (window.RazorpayAgent && typeof window.RazorpayAgent.open === 'function') {
      window.RazorpayAgent.open();
    } else {
      showToast('Razorpay Agent script is initializing...');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          background: '#0284c7',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)'
            }}>
              <Zap size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', color: '#ffffff' }}>
                Nova<span style={{ color: '#38bdf8' }}>Store</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                Next-Gen Tech & Gear
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{
            flex: '1',
            maxWidth: '440px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '14px' }} />
            <input 
              type="text"
              placeholder="Search gear (e.g. keyboard, headphones, charger)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                background: 'rgba(16, 24, 40, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {/* Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setShowCodeModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Code size={14} />
              <span>Embed Code</span>
            </button>

            <button 
              onClick={() => triggerAgentPurchase("Buy me the best tech gear on this store")}
              className="glow-badge green"
              style={{ cursor: 'pointer', padding: '8px 12px' }}
            >
              <Sparkles size={14} />
              <span>AI Agent Active</span>
            </button>

            {/* Cart Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <ShoppingBag size={18} />
              {cart.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: '700',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: '1', maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', width: '100%' }}>
        
        {/* Hero Section */}
        <section style={{
          position: 'relative',
          padding: '40px 32px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(7, 25, 47, 0.9) 0%, rgba(10, 58, 120, 0.6) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
          marginBottom: '36px',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: '720px', position: 'relative', zIndex: 2 }}>
            <div className="glow-badge" style={{ marginBottom: '14px' }}>
              <Sparkles size={13} />
              <span>Razorpay Agentic Commerce Drop-In Module</span>
            </div>
            
            <h1 style={{
              fontSize: '36px',
              fontWeight: '800',
              lineHeight: 1.2,
              letterSpacing: '-0.8px',
              color: '#ffffff',
              marginBottom: '14px'
            }}>
              Autonomous 0-Click Shopping for Modern E-Commerce
            </h1>

            <p style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#cbd5e1',
              marginBottom: '24px'
            }}>
              This dummy store demonstrates how any merchant can embed the <strong>Razorpay AI Shopping Agent</strong> via a single <code className="font-mono" style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', color: '#38bdf8' }}>&lt;script&gt;</code> tag. Shoppers can command the AI to search, evaluate, and execute pre-authorized purchases captured directly on Razorpay!
            </p>

            {/* Quick Demo Action Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button 
                onClick={() => triggerAgentPurchase("Buy me a Keychron mechanical keyboard under 4000")}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(2, 132, 199, 0.2)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <span>⌨️</span>
                <span>Buy Keychron K2 under ₹4,000</span>
                <ChevronRight size={14} color="#38bdf8" />
              </button>

              <button 
                onClick={() => triggerAgentPurchase("Buy me Sony ANC headphones under 3000")}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <span>🎧</span>
                <span>Buy Sony ANC under ₹3,000</span>
                <ChevronRight size={14} color="#38bdf8" />
              </button>

              <button 
                onClick={() => triggerAgentPurchase("Buy me a GaN fast charger under 1000")}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <span>⚡</span>
                <span>Buy 100W GaN Charger under ₹1,000</span>
                <ChevronRight size={14} color="#38bdf8" />
              </button>
            </div>
          </div>
        </section>

        {/* Category Filter Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '24px'
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                border: 'none',
                background: selectedCategory === cat ? '#0284c7' : 'rgba(255, 255, 255, 0.05)',
                color: selectedCategory === cat ? '#ffffff' : '#94a3b8',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <div>Loading catalog...</div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <h3>No products found</h3>
            <p>Try clearing your search filters</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {products.map(prod => (
              <div 
                key={prod.id} 
                className="glass-panel glass-panel-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* Product Image */}
                <div style={{
                  position: 'relative',
                  height: '210px',
                  background: '#070d19',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={prod.image} 
                    alt={prod.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(8px)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#38bdf8'
                  }}>
                    {prod.subcategory || prod.category}
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(8px)',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Star size={12} fill="#fbbf24" color="#fbbf24" />
                    <span>{prod.rating}</span>
                  </div>
                </div>

                {/* Product Details */}
                <div style={{ padding: '20px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#ffffff',
                    marginBottom: '6px',
                    lineHeight: 1.3
                  }}>
                    {prod.title}
                  </h3>
                  
                  <p style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                    flex: '1'
                  }}>
                    {prod.description.length > 120 ? prod.description.slice(0, 120) + '...' : prod.description}
                  </p>

                  {/* Price & Action */}
                  <div style={{
                    paddingTop: '14px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
                        {prod.priceDisplay || `₹${prod.price}`}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', textDecoration: 'line-through' }}>
                        {prod.originalPrice || '₹4,999'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => triggerAgentPurchase(`Buy me ${prod.title} under ${Math.ceil(prod.price * 1.1)}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          border: 'none',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                        }}
                      >
                        <Sparkles size={13} />
                        <span>AI Buy</span>
                      </button>

                      <button 
                        onClick={() => addToCart(prod)}
                        style={{
                          padding: '8px 10px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          cursor: 'pointer'
                        }}
                        title="Add to manual cart"
                      >
                        <ShoppingBag size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '380px',
          maxWidth: '100vw',
          background: '#0f172a',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>Your Shopping Cart</h3>
            <button 
              onClick={() => setIsCartOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: '1', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>
                <ShoppingBag size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <div>Your cart is empty</div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px'
                }}>
                  <img src={item.image} alt={item.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                  <div style={{ flex: '1' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '2px' }}>₹{item.price.toLocaleString()} × {item.qty}</div>
                  </div>
                  <button 
                    onClick={() => setCart(cart.filter(i => i.id !== item.id))}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#ffffff', fontWeight: '700' }}>
                <span>Subtotal</span>
                <span>₹{cartTotal.toLocaleString()}</span>
              </div>
              <button 
                onClick={() => {
                  setIsCartOpen(false);
                  triggerAgentPurchase(`Buy my cart items for ₹${cartTotal}`);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Sparkles size={16} />
                <span>Autonomous Checkout with Razorpay</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Embed Code Modal */}
      {showCodeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            maxWidth: '620px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800' }}>R</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>Razorpay Agentic Commerce Script</h3>
              </div>
              <button onClick={() => setShowCodeModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
              Add this 1-line script to any merchant website HTML header/body to enable the floating AI Shopping Copilot with pre-authorized zero-click payments:
            </p>

            <div style={{
              background: '#070b14',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              lineHeight: 1.6,
              overflowX: 'auto',
              marginBottom: '20px'
            }}>
              &lt;script <br/>
              &nbsp;&nbsp;src="http://localhost:8001/sdk/razorpay-agent.js"<br/>
              &nbsp;&nbsp;data-key="rzp_test_TSqKSZKcvQdzJs"<br/>
              &nbsp;&nbsp;data-merchant-api="http://localhost:8002/api"<br/>
              &nbsp;&nbsp;data-agent-api="http://localhost:8001/api/agent"<br/>
              &nbsp;&nbsp;data-auto-debit="true"&gt;<br/>
              &lt;/script&gt;
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`<script src="http://localhost:8001/sdk/razorpay-agent.js" data-key="rzp_test_TSqKSZKcvQdzJs" data-merchant-api="http://localhost:8002/api" data-agent-api="http://localhost:8001/api/agent" data-auto-debit="true"></script>`);
                  showToast('Embed script copied to clipboard!');
                  setShowCodeModal(false);
                }}
                style={{
                  padding: '10px 18px',
                  background: '#0284c7',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Copy Embed Script
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '13px'
      }}>
        <div>NovaStore Demo — Powered by <strong>Razorpay Agentic Commerce Embed SDK</strong> (Option 1)</div>
      </footer>
    </div>
  );
}
