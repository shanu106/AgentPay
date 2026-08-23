import React from 'react';
import { ArrowLeft, Star, Clock, MapPin, Plus, Minus, Zap } from 'lucide-react';

export function RestaurantDetailView({
  restaurant,
  onBack,
  cart,
  onAddToCart,
  updateCartQty,
  getDishQtyInCart,
  onAgentBuy
}) {
  return (
    <div>
      {/* Back to Restaurants Bar */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: '#1c1c1c',
          fontSize: '14px',
          fontWeight: '700',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to all restaurants</span>
      </button>

      {/* Restaurant Header Banner */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #f0f0f0',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1c1c1c', marginBottom: '8px' }}>
            {restaurant.name}
          </h1>
          <div style={{ fontSize: '14px', color: '#696969', marginBottom: '10px' }}>
            {restaurant.cuisine}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#828282' }}>
            <MapPin size={15} color="#e23744" />
            <span>{restaurant.address}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{
            background: '#24963f',
            color: '#ffffff',
            padding: '8px 14px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <span>{restaurant.rating}</span>
              <Star size={14} fill="#ffffff" color="#ffffff" />
            </div>
            <div style={{ fontSize: '10px', opacity: 0.9 }}>{restaurant.ratingCount || '10K+'} ratings</div>
          </div>

          <div style={{
            background: '#f8f8f8',
            padding: '8px 14px',
            borderRadius: '10px',
            textAlign: 'center',
            border: '1px solid #eeeeee'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Clock size={15} color="#e23744" />
              <span>{restaurant.deliveryTime}</span>
            </div>
            <div style={{ fontSize: '10px', color: '#828282' }}>Delivery Time</div>
          </div>
        </div>
      </div>

      {/* Menu Categories and Dishes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {restaurant.categories.map((category, cIdx) => (
          <div key={cIdx}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1c1c1c', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #f2f2f2' }}>
              {category.name} ({category.dishes.length})
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
              {category.dishes.map((dish) => {
                const qty = getDishQtyInCart(dish.id);
                return (
                  <div key={dish.id} style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '16px',
                    border: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
                  }}>
                    <div style={{ flex: '1' }}>
                      {/* Veg / Non-Veg Indicator */}
                      <div style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '3px',
                        border: dish.isVeg ? '2px solid #24963f' : '2px solid #e23744',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: dish.isVeg ? '#24963f' : '#e23744'
                        }} />
                      </div>

                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#1c1c1c', marginBottom: '4px' }}>
                        {dish.name}
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#1c1c1c', marginBottom: '8px' }}>
                        {dish.priceDisplay || `₹${dish.price}`}
                      </div>

                      <p style={{
                        fontSize: '12px',
                        color: '#828282',
                        lineHeight: 1.4,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {dish.description}
                      </p>
                    </div>

                    {/* Dish Image & Add Button */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '110px' }}>
                      <div style={{ width: '110px', height: '90px', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
                        <img src={dish.image} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>

                      {qty > 0 ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          background: '#fef2f2',
                          border: '1px solid #e23744',
                          borderRadius: '8px',
                          padding: '4px 10px'
                        }}>
                          <button
                            onClick={() => updateCartQty(dish.id, -1)}
                            style={{ background: 'none', border: 'none', color: '#e23744', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#e23744' }}>{qty}</span>
                          <button
                            onClick={() => updateCartQty(dish.id, 1)}
                            style={{ background: 'none', border: 'none', color: '#e23744', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onAddToCart(dish, restaurant)}
                          style={{
                            width: '100%',
                            padding: '6px 12px',
                            background: '#ffffff',
                            color: '#24963f',
                            border: '1px solid #24963f',
                            borderRadius: '8px',
                            fontWeight: '800',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(36, 150, 63, 0.15)'
                          }}
                        >
                          ADD +
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
