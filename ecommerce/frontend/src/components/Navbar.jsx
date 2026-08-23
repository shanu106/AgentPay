import React from 'react';
import { Zap, Search, Code, ShoppingBag } from 'lucide-react';

export function Navbar({ searchQuery, setSearchQuery, onOpenCodeModal, onOpenCart, totalCartCount }) {
  return (
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
          maxWidth: '460px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={17} color="#64748b" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search mechanical keyboards, ANC headphones, GaN chargers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 42px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
          />
        </div>

        {/* Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={onOpenCodeModal}
            className="secondary-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', padding: '9px 15px' }}
          >
            <Code size={16} />
            <span>Drop-In SDK Code</span>
          </button>

          <button 
            onClick={onOpenCart}
            className="primary-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', padding: '9px 18px', fontSize: '13px' }}
          >
            <ShoppingBag size={17} />
            <span>Cart</span>
            {totalCartCount > 0 && (
              <span style={{
                background: '#38bdf8',
                color: '#0f172a',
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 7px',
                borderRadius: '999px',
                marginLeft: '4px'
              }}>
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
