import React from 'react';
import { Star, Clock } from 'lucide-react';

export function RestaurantCard({ restaurant, onSelectRestaurant }) {
  return (
    <div
      onClick={() => onSelectRestaurant(restaurant)}
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#ffffff',
        border: '1px solid transparent',
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.12)';
        e.currentTarget.style.borderColor = '#f2f2f2';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      {/* Restaurant Image with Discount & Delivery Badges */}
      <div style={{ position: 'relative', height: '180px', width: '100%' }}>
        <img 
          src={restaurant.image} 
          alt={restaurant.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {restaurant.discount && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '0',
            background: 'linear-gradient(90deg, #256fef 0%, #1e40af 100%)',
            color: '#ffffff',
            padding: '3px 10px',
            fontSize: '11px',
            fontWeight: '700',
            borderTopRightRadius: '4px',
            borderBottomRightRadius: '4px'
          }}>
            {restaurant.discount}
          </div>
        )}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '700',
          color: '#363636',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Clock size={12} color="#1c1c1c" />
          <span>{restaurant.deliveryTime}</span>
        </div>
      </div>

      {/* Info Details */}
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1c1c1c', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {restaurant.name}
          </h3>
          <div style={{
            background: '#24963f',
            color: '#ffffff',
            padding: '2px 6px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <span>{restaurant.rating}</span>
            <Star size={10} fill="#ffffff" color="#ffffff" />
          </div>
        </div>

        <div style={{ fontSize: '13px', color: '#696969', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {restaurant.cuisine}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#828282', borderTop: '1px solid #f2f2f2', paddingTop: '8px' }}>
          <span>{restaurant.distance}</span>
          <span>{restaurant.costForTwo}</span>
        </div>
      </div>
    </div>
  );
}

export function RestaurantList({ restaurants, loading, onSelectRestaurant }) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ height: '280px', borderRadius: '16px', background: '#f5f5f5', animation: 'pulse 1.5s infinite ease-in-out' }} />
        ))}
      </div>
    );
  }

  if (!restaurants || restaurants.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🍽️</div>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1c1c1c' }}>No restaurants found</h3>
        <p style={{ fontSize: '13px', color: '#828282' }}>Try adjusting your filters or searching for something else.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
      {restaurants.map(rest => (
        <RestaurantCard
          key={rest.id}
          restaurant={rest}
          onSelectRestaurant={onSelectRestaurant}
        />
      ))}
    </div>
  );
}
