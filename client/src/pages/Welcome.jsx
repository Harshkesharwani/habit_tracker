// src/pages/Welcome.jsx
import React, { useState } from 'react';
import { IconCheck, IconClose } from '../components/Icons';

export default function Welcome({ onLogin, onSignup }) {
  const [authMode, setAuthMode] = useState(null); // 'login' | 'signup' | null
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
          setError('Please fill in all required fields.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        await onSignup(firstName.trim(), lastName.trim(), email.trim(), password);
      } else {
        if (!email.trim() || !password.trim()) {
          setError('Please enter your email and password.');
          setLoading(false);
          return;
        }
        await onLogin(email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await onLogin('tanay@example.com', 'password123');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <div className="welcome-left">
          <div className="welcome-logo">
            <span style={{ fontSize: '28px', marginRight: '8px' }}>🎯</span>
            MyWebsite
          </div>

          <h1 className="welcome-headline">
            Meet your modern
            <span>Habit Tracker App</span>
          </h1>

          <p className="welcome-description">
            Manage your daily tasks and workflow in a modern way and boost your efficiency without any efforts.
          </p>

          <div className="welcome-actions">
            <button 
              className="btn-join"
              onClick={() => setAuthMode('signup')}
            >
              Join Now
            </button>

            <button
              className="welcome-login-link"
              onClick={() => setAuthMode('login')}
            >
              Already have an account? Log In
            </button>

            <button
              type="button"
              className="btn-demo"
              onClick={handleQuickDemo}
              style={{
                marginTop: '12px',
                padding: '10px 16px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#475569',
              }}
            >
              ⚡ Quick Demo Login (Tanay Pratap)
            </button>
          </div>
        </div>

        <div className="welcome-illustration">
          <svg viewBox="0 0 400 400" width="340" height="340">
            <defs>
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ccfbf1" />
                <stop offset="100%" stopColor="#99f6e4" />
              </linearGradient>
              <linearGradient id="peakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#0f766e" />
              </linearGradient>
            </defs>
            <circle cx="200" cy="200" r="180" fill="url(#skyGrad)" opacity="0.6" />
            <polygon points="120,340 200,160 280,340" fill="#94a3b8" opacity="0.4" />
            <polygon points="180,340 250,110 330,340" fill="url(#peakGrad)" />
            <polygon points="250,110 230,150 250,140 270,150" fill="#ffffff" />
            
            {/* Flagpole on mountain */}
            <line x1="250" y1="110" x2="250" y2="60" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
            <polygon points="250,60 300,75 250,90" fill="#0d9488" />

            {/* Achievement Check badge */}
            <circle cx="130" cy="140" r="28" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
            <circle cx="130" cy="140" r="22" fill="#10b981" />
            <path d="M122 140 L128 146 L138 134" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Habit Streak flame badge */}
            <circle cx="290" cy="230" r="26" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
            <text x="278" y="240" fontSize="24">🔥</text>
          </svg>
        </div>
      </div>

      {authMode && (
        <div className="modal-overlay" onClick={() => setAuthMode(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {authMode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setAuthMode(null)}
              >
                <IconClose style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleAuthSubmit}>
              <div className="modal-body">
                {error && (
                  <div style={{ padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '13px' }}>
                    {error}
                  </div>
                )}

                {authMode === 'signup' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Tanay"
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Pratap"
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="tanay@example.com"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="••••••••"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                >
                  {authMode === 'signup' ? 'Switch to Log In' : 'Need an account? Sign Up'}
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Please wait...' : (authMode === 'signup' ? 'Sign Up' : 'Log In')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
