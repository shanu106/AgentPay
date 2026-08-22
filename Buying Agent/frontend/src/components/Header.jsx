import React from 'react';

function Header({ 
  activeTab, 
  setActiveTab, 
  cartCount, 
  onOpenCart, 
  config, 
  onOpenApiKeyModal, 
  onOpenAutonomousModal 
}) {
  return (
    <header className="header">
      <div className="brand-section" onClick={() => setActiveTab('dual')}>
        <div className="brand-logo-icon">🤖</div>
        <div className="brand-info">
          <h1>NovaBuy AI</h1>
          <span>Autonomous Shopping Agent</span>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'dual' ? 'active' : ''}`}
          onClick={() => setActiveTab('dual')}
        >
          <span>✨</span> Dual View
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <span>💬</span> AI Agent
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <span>🛍️</span> Store Catalog
        </button>
        <button
          className="nav-tab-btn"
          onClick={onOpenAutonomousModal}
          style={{ background: 'rgba(0, 242, 254, 0.1)', color: '#00f2fe', border: '1px solid rgba(0, 242, 254, 0.3)' }}
        >
          <span>⚡</span> Auto-Pilot Mission
        </button>
      </nav>

      <div className="header-actions">
        <button 
          className="key-status-btn"
          onClick={onOpenApiKeyModal}
          title="Configure Google Gemini API Key"
        >
          <span className={`status-dot ${config?.hasKey ? 'active' : 'simulated'}`}></span>
          <span>{config?.hasKey ? 'Gemini 2.0 Active' : 'Gemini Key (Demo Mode)'}</span>
        </button>

        <button className="cart-toggle-btn" onClick={onOpenCart}>
          <span>🛒</span>
          <span>Cart</span>
          {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}

export default Header;
