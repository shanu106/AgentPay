import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, LogIn } from 'lucide-react';
import { loginUser, signupUser } from '../api/agentApi';
import '../styles/LoginPage.css';

const LoginPage = ({ onLoginSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (isSignup) {
      if (!formData.name) {
        setError('Full name is required');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      
      if (isSignup) {
        response = await signupUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || ''
        });
      } else {
        response = await loginUser({
          email: formData.email,
          password: formData.password
        });
      }

      if (response.success) {
        setSuccess(isSignup ? 'Account created successfully!' : 'Login successful!');
        
        localStorage.setItem('buying_agent_token', response.token);
        localStorage.setItem('agentpay_user', JSON.stringify(response.user));
        localStorage.setItem('agentpay_email', response.user.email);
        localStorage.setItem('agentpay_name', response.user.name);

        setTimeout(() => {
          onLoginSuccess(response.user, response.token);
        }, 500);
      } else {
        setError(response.message || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-branding">
          <div className="login-branding-content">
            <div className="login-logo">
              <LogIn size={48} />
            </div>
            <h1>AgentPay Shopping</h1>
            <p>AI-Powered Shopping Assistant</p>
            <div className="login-features">
              <div className="feature">
                <CheckCircle2 size={20} />
                <span>Secure Authentication</span>
              </div>
              <div className="feature">
                <CheckCircle2 size={20} />
                <span>Real-time Shopping</span>
              </div>
              <div className="feature">
                <CheckCircle2 size={20} />
                <span>Payment Protection</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-form-wrapper">
          <div className="login-form-content">
            <div className="form-header">
              <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
              <p>{isSignup ? 'Join AgentPay Shopping' : 'Sign in to your account'}</p>
            </div>

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <CheckCircle2 size={20} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {isSignup && (
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required={isSignup}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Email Address *</label>
                <div className="input-with-icon">
                  <Mail size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              {isSignup && (
                <div className="form-group">
                  <label>Phone Number (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Password *</label>
                <div className="input-with-icon password-input">
                  <Lock size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter secure password (min 8 characters)"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {isSignup && (
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <div className="input-with-icon password-input">
                    <Lock size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      required={isSignup}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    {isSignup ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  <>
                    {isSignup ? 'Create Account' : 'Sign In'}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                {isSignup ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <button
                type="button"
                className="btn-toggle"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                  setSuccess('');
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    phone: ''
                  });
                }}
              >
                {isSignup ? 'Sign In Instead' : 'Create New Account'}
              </button>
            </div>

            <div className="security-notice">
              <p>🔒 Your data is encrypted and secured with industry-standard protocols.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
