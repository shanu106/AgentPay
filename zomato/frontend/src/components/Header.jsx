import React from 'react';
import { MapPin, Search, ChevronDown, ShoppingBag } from 'lucide-react';

export function Header({ 
  searchQuery, 
  setSearchQuery, 
  onOpenCart, 
  totalCartCount, 
  deliveryAddress = 'Indiranagar, Bangalore' 
}) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: '#ffffff',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '900',
            fontStyle: 'italic',
            letterSpacing: '-1.5px',
            color: '#e23744',
            cursor: 'pointer'
          }}>
            zomato
          </div>
        </div>

        {/* Location & Search Bar Combined */}
        <div style={{
          flex: '1',
          maxWidth: '720px',
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(28, 28, 28, 0.1)',
          border: '1px solid #e8e8e8',
          height: '46px'
        }}>
          {/* Location Picker */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 14px',
            cursor: 'pointer',
            borderRight: '1px solid #e8e8e8',
            minWidth: '200px'
          }}>
            <MapPin size={18} color="#e23744" />
            <span style={{ fontSize: '13px', color: '#1c1c1c', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {deliveryAddress}
            </span>
            <ChevronDown size={14} color="#828282" />
          </div>

          {/* Search Input */}
          <div style={{ flex: '1', display: 'flex', alignItems: 'center', padding: '0 14px', gap: '10px' }}>
            <Search size={17} color="#828282" />
            <input
              type="text"
              placeholder="Search for Biryani, Pizza, Burger, Waffles, Desserts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                color: '#1c1c1c',
                background: 'transparent'
              }}
            />
          </div>
        </div>

        {/* Cart Button */}
        <button
          onClick={onOpenCart}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#e23744',
            color: '#ffffff',
            border: 'none',
            padding: '9px 18px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(226, 55, 68, 0.3)'
          }}
        >
          <ShoppingBag size={17} />
          <span>Cart</span>
          {totalCartCount > 0 && (
            <span style={{
              background: '#ffffff',
              color: '#e23744',
              fontSize: '11px',
              fontWeight: '800',
              padding: '2px 7px',
              borderRadius: '999px',
              marginLeft: '2px'
            }}>
              {totalCartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
