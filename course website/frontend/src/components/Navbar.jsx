import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">📚</span>
          <span className="brand-text">
            <span className="brand-highlight">Learn</span>Hub
          </span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className="nav-link">Courses</Link>
          <a href="http://localhost:5174" target="_blank" rel="noreferrer" className="nav-link" style={{ color: '#00f2fe', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🤖</span> AI Buyer Agent
          </a>
        </div>
        <div className="navbar-actions">
          <a href="http://localhost:5174" target="_blank" rel="noreferrer" className="btn-signup" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #6366f1, #00f2fe)', color: '#07090e' }}>
            Launch AI Agent →
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;