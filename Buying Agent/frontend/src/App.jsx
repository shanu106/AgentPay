import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import AgentDashboard from './components/AgentDashboard';

function App() {
  const { user, token, loading, login, logout, isAuthenticated } = useAuth();
  const [showLogoutToast, setShowLogoutToast] = useState(false);

  const handleLoginSuccess = (userData, authToken) => {
    login(userData, authToken);
  };

  const handleLogout = () => {
    logout();
    setShowLogoutToast(true);
    setTimeout(() => setShowLogoutToast(false), 3000);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 0.6s linear infinite'
          }}></div>
          <p>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      {/* Logout Toast */}
      {showLogoutToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: '#ef4444',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <p style={{ margin: 0, fontSize: '14px' }}>Logged out successfully</p>
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(400px); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Main Dashboard */}
      <AgentDashboard 
        user={user} 
        token={token} 
        onLogout={handleLogout}
      />
    </>
  );
}

export default App;
