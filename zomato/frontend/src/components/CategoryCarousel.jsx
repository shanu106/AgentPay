import React from 'react';

export function CategoryCarousel({ cuisines, onSelectCuisine }) {
  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1c1c1c', marginBottom: '18px' }}>
        Eat what makes you happy
      </h2>
      <div style={{
        display: 'flex',
        gap: '24px',
        overflowX: 'auto',
        paddingBottom: '12px'
      }}>
        {cuisines.map((c, i) => (
          <div
            key={i}
            onClick={() => onSelectCuisine(c.name)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              minWidth: '96px',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              marginBottom: '10px'
            }}>
              <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#363636', textAlign: 'center' }}>
              {c.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FilterBar({
  isVegOnly,
  setIsVegOnly,
  selectedRatingFilter,
  setSelectedRatingFilter,
  selectedFastDelivery,
  setSelectedFastDelivery,
  selectedOfferFilter,
  setSelectedOfferFilter
}) {
  const filterBtnStyle = (active) => ({
    padding: '7px 14px',
    borderRadius: '8px',
    border: active ? '1px solid #e23744' : '1px solid #cfcfcf',
    background: active ? '#fef2f2' : '#ffffff',
    color: active ? '#e23744' : '#696969',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease'
  });

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
      <button onClick={() => setIsVegOnly(!isVegOnly)} style={filterBtnStyle(isVegOnly)}>
        🌱 Pure Veg
      </button>
      <button onClick={() => setSelectedRatingFilter(!selectedRatingFilter)} style={filterBtnStyle(selectedRatingFilter)}>
        ⭐ Rating: 4.4+
      </button>
      <button onClick={() => setSelectedFastDelivery(!selectedFastDelivery)} style={filterBtnStyle(selectedFastDelivery)}>
        ⚡ Fast Delivery (≤25m)
      </button>
      <button onClick={() => setSelectedOfferFilter(!selectedOfferFilter)} style={filterBtnStyle(selectedOfferFilter)}>
        🏷️ Great Offers
      </button>
    </div>
  );
}
