// src/pages/Profile.jsx
import React, { useState } from 'react';
import { QUOTES } from '../services/storage';

export default function Profile({ 
  user, 
  stats, 
  mood, 
  onSetMood, 
  onLogout 
}) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const activeQuote = QUOTES[quoteIndex % QUOTES.length];

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
  };

  return (
    <div className="content-body">
      <h1 className="profile-page-title">My Profile</h1>

      {/* 4 Profile Metric Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-title">Current Streak 🔥</span>
          <span className="stat-number">{stats.streak} <span style={{ fontSize: '18px', fontWeight: 600 }}>days</span></span>
          <span className="stat-desc">Consecutive consistency</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Today 1 times ⏱️</span>
          <span className="stat-number">{stats.completedToday} <span style={{ fontSize: '18px', fontWeight: 600 }}>times</span></span>
          <span className="stat-desc">Target completed today</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Habit Score 🎯️</span>
          <span className="stat-number">{stats.habitScore} <span style={{ fontSize: '18px', fontWeight: 600 }}>/ 100</span></span>
          <span className="stat-desc">Completion efficiency</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Mood Score 🎯️</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span className="stat-number">{mood}</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#64748b' }}>/ 5</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => onSetMood(score)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  fontSize: '12px',
                  fontWeight: 800,
                  background: mood === score ? 'var(--primary)' : '#f1f5f9',
                  color: mood === score ? '#ffffff' : '#475569',
                  border: '1px solid #cbd5e1',
                  transition: 'all 0.15s',
                }}
                title={`Set mood to ${score}/5`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quote of the Day (Template Page 7) */}
      <div className="quote-card">
        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Quote of the day
        </div>
        <div className="quote-mark">“ ”</div>
        <p className="quote-text">
          {activeQuote.text}
        </p>
        <div className="quote-author">
          — {activeQuote.author}
        </div>
        <button
          type="button"
          onClick={handleNextQuote}
          style={{
            marginTop: '20px',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--primary)',
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'var(--primary-light)',
            border: '1px solid var(--primary-border)',
          }}
        >
          🔄 Inspire Me With Another Quote
        </button>
      </div>

      {/* Account Info Box */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', marginTop: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>
          User Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Full Name</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{user?.name || 'Tanay Pratap'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Email</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{user?.email || 'tanay@example.com'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Member Since</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{user?.joinedDate || '2026-01-15'}</div>
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={onLogout}
          style={{ color: '#ef4444', borderColor: '#fca5a5' }}
        >
          Log Out from Account
        </button>
      </div>
    </div>
  );
}
