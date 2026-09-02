import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('agentpay_user');
    const storedToken = localStorage.getItem('buying_agent_token');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('agentpay_user');
        localStorage.removeItem('buying_agent_token');
      }
    }

    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('agentpay_user', JSON.stringify(userData));
    localStorage.setItem('buying_agent_token', authToken);
    localStorage.setItem('agentpay_email', userData.email);
    localStorage.setItem('agentpay_name', userData.name);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('agentpay_user');
    localStorage.removeItem('buying_agent_token');
    localStorage.removeItem('agentpay_email');
    localStorage.removeItem('agentpay_name');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('agentpay_user', JSON.stringify(userData));
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      updateUser,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
