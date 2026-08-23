import React from 'react';

export function CategoryFilter({ categories, selectedCategory, setSelectedCategory }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      overflowX: 'auto',
      paddingBottom: '10px',
      marginBottom: '28px'
    }}>
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 18px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              background: isSelected ? '#0284c7' : 'rgba(15, 23, 42, 0.6)',
              color: isSelected ? '#ffffff' : '#94a3b8',
              border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none'
            }}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
