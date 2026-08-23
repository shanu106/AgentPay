import React, { useState } from 'react';
import { ShoppingBag, Plus, Minus, Trash2, ShieldCheck, MapPin, Bike } from 'lucide-react';
import { SavedPaymentSelector } from './SavedPaymentSelector';

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  updateCartQty,
  removeFromCart,
  cartItemTotal,
  deliveryFee,
  platformFee,
  taxes,
  grandTotal,
  deliveryAddress,
  onProceedToPayment
}) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        height: '100%',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="#e23744" />
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1c1c1c', margin: 0 }}>
              Your Food Cart ({cart.reduce((a, b) => a + b.qty, 0)})
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: '#f5f5f5',
              border: 'none',
              color: '#696969',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontWeight: '700'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: '1', overflowY: 'auto', padding: '20px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#828282' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍽️</div>
              <p style={{ fontSize: '16px', fontWeight: '800', color: '#1c1c1c' }}>Your cart is empty</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Explore bestsellers or tell the AI agent what you'd like!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Delivery Destination Card */}
              <div style={{
                background: '#f8f8f8',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid #eeeeee'
              }}>
                <MapPin size={20} color="#e23744" />
                <div style={{ flex: '1' }}>
                  <div style={{ fontSize: '11px', color: '#828282', fontWeight: '600' }}>DELIVERING TO</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1c1c1c' }}>{deliveryAddress}</div>
                </div>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#828282', letterSpacing: '0.5px' }}>
                  ITEMS FROM {cart[0]?.restaurantName?.toUpperCase()}
                </div>

                {cart.map(item => (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px dashed #e8e8e8'
                  }}>
                    <div style={{ flex: '1' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1c1c1c' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#696969' }}>
                        ₹{item.price} each
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #e23744', borderRadius: '6px', padding: '3px 8px' }}>
                      <button 
                        onClick={() => updateCartQty(item.id, -1)}
                        style={{ background: 'none', border: 'none', color: '#e23744', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#e23744' }}>{item.qty}</span>
                      <button 
                        onClick={() => updateCartQty(item.id, 1)}
                        style={{ background: 'none', border: 'none', color: '#e23744', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1c1c1c', minWidth: '55px', textAlign: 'right' }}>
                      ₹{item.price * item.qty}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shared Agent Memory Payment Selector */}
              <SavedPaymentSelector
                selectedMethod={selectedPaymentMethod}
                onSelectMethod={setSelectedPaymentMethod}
                userEmail="nawaz@gmail.com"
              />

              {/* Bill Details */}
              <div style={{ background: '#fdfdfd', borderRadius: '12px', padding: '16px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#1c1c1c', marginBottom: '10px' }}>
                  Bill Details
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#696969', marginBottom: '6px' }}>
                  <span>Item Total</span>
                  <span>₹{cartItemTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#696969', marginBottom: '6px' }}>
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#696969', marginBottom: '6px' }}>
                  <span>Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#696969', marginBottom: '10px' }}>
                  <span>GST & Restaurant Charges</span>
                  <span>₹{taxes}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '900', color: '#1c1c1c', borderTop: '1px solid #e8e8e8', paddingTop: '10px' }}>
                  <span>To Pay</span>
                  <span style={{ color: '#e23744' }}>₹{grandTotal}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Checkout */}
        {cart.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f0', background: '#ffffff' }}>
            <button
              onClick={onProceedToPayment}
              style={{
                width: '100%',
                padding: '14px',
                background: '#e23744',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(226, 55, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>Pay with Razorpay</span>
              <span>₹{grandTotal} →</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px', fontSize: '11px', color: '#828282' }}>
              <ShieldCheck size={13} color="#24963f" />
              <span>Razorpay Test Mode 256-Bit SSL Encrypted</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderTrackerModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        maxWidth: '480px',
        width: '100%',
        padding: '28px',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#dcfce7',
          color: '#16a34a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Bike size={32} />
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1c1c1c', marginBottom: '6px' }}>
          Order Confirmed & Payment Captured!
        </h3>
        <p style={{ fontSize: '13px', color: '#696969', marginBottom: '20px' }}>
          {order.restaurant} is preparing your food. Estimated delivery in 25-30 mins.
        </p>

        <div style={{ background: '#f8f8f8', borderRadius: '12px', padding: '16px', textAlign: 'left', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
            <span style={{ color: '#828282' }}>Order ID:</span>
            <span style={{ fontWeight: '700', color: '#1c1c1c' }}>{order.orderId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
            <span style={{ color: '#828282' }}>Razorpay Payment ID:</span>
            <span style={{ fontWeight: '700', color: '#1c1c1c' }}>{order.paymentId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#828282' }}>Total Paid:</span>
            <span style={{ fontWeight: '800', color: '#e23744' }}>₹{order.amount}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: '#1c1c1c',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer style={{ background: '#f8f8f8', borderTop: '1px solid #e8e8e8', padding: '32px 20px', marginTop: '60px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: '900', fontStyle: 'italic', color: '#e23744', marginBottom: '8px' }}>
            zomato
          </div>
          <div style={{ fontSize: '12px', color: '#828282' }}>
            © 2026 Zomato Clone • Integrated with Razorpay Agentic Commerce SDK
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#696969' }}>
          <span>About</span>
          <span>Careers</span>
          <span>Privacy</span>
          <span>Terms</span>
        </div>
      </div>
    </footer>
  );
}
