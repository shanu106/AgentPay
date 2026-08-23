import React, { useState } from 'react';
import { ShoppingBag, Plus, Minus, Trash2, ShieldCheck } from 'lucide-react';
import { SavedPaymentSelector } from './SavedPaymentSelector';

export function CartDrawer({ isOpen, onClose, cart, updateQuantity, removeFromCart, cartTotal, onCheckout }) {
  const [selectedMethod, setSelectedMethod] = useState(null);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        height: '100%',
        background: '#0a0f1d',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-20px 0 50px rgba(0,0,0,0.8)'
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
              Shopping Cart ({cart.reduce((a, b) => a + b.qty, 0)})
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Cart Items List */}
        <div style={{ flex: '1', overflowY: 'auto', padding: '20px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛒</div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>Your cart is empty</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Add gear or ask the AI agent to order for you!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cart.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <img 
                    src={item.image} 
                    alt={item.title}
                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: '1' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', marginBottom: '4px', lineHeight: 1.3 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8', marginBottom: '8px' }}>
                      {item.priceDisplay || `₹${item.price}`}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '2px 6px' }}>
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#f8fafc' }}>{item.qty}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Shared Agent Memory Payment Selector */}
              <SavedPaymentSelector
                selectedMethod={selectedMethod}
                onSelectMethod={setSelectedMethod}
                userEmail="nawaz@gmail.com"
              />
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.9)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>Total Amount:</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8' }}>₹{cartTotal.toLocaleString()}</span>
            </div>

            <button
              onClick={() => onCheckout(selectedMethod)}
              className="primary-btn"
              style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700', borderRadius: '12px' }}
            >
              Checkout with Razorpay (₹{cartTotal.toLocaleString()})
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px', color: '#64748b', fontSize: '11px' }}>
              <ShieldCheck size={13} color="#10b981" />
              <span>Razorpay Test Mode 256-Bit SSL Encrypted</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
