// client/src/pages/Challenges.jsx
import React, { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { IconPlus, IconCheck, IconTrash } from '../components/Icons';
import { CATEGORIES } from '../services/storage';

export default function Challenges({
  challenges = [],
  onSaveChallenge,
  onToggleComplete,
  onDeleteChallenge,
  onAdoptAsHabit,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [durationDays, setDurationDays] = useState(21);

  const activeChallenges = challenges.filter((c) => !c.isCompleted);
  const completedChallenges = challenges.filter((c) => c.isCompleted);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSaveChallenge({
      title: title.trim(),
      description: description.trim(),
      category,
      durationDays: Number(durationDays) || 21,
      startDate: format(new Date(), 'yyyy-MM-dd'),
    });
    setTitle('');
    setDescription('');
    setDurationDays(21);
    setIsModalOpen(false);
  };

  const calculateProgress = (c) => {
    if (c.isCompleted) return 100;
    const start = new Date(c.startDate);
    const today = new Date();
    const daysPassed = Math.max(0, differenceInDays(today, start) + 1);
    const duration = c.durationDays || 21;
    return Math.min(100, Math.round((daysPassed / duration) * 100));
  };

  return (
    <div className="content-body">
      <div className="section-header" style={{ marginTop: '10px' }}>
        <div>
          <h1 className="section-title">HABIT CHALLENGES 🏆</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Build momentum with time-bounded sprints (7-day, 21-day, or 30-day challenges).
          </p>
        </div>
        <button
          type="button"
          className="btn-inline-create"
          onClick={() => setIsModalOpen(true)}
        >
          <IconPlus style={{ width: '16px', height: '16px' }} />
          <span>New Challenge</span>
        </button>
      </div>

      {/* Challenge Metrics Row */}
      <div className="stats-row" style={{ marginTop: '16px', marginBottom: '24px' }}>
        <div className="stat-card">
          <span className="stat-title">Active Challenges</span>
          <span className="stat-number">{activeChallenges.length}</span>
          <span className="stat-desc">In Progress</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Completed 🏆</span>
          <span className="stat-number">{completedChallenges.length}</span>
          <span className="stat-desc">Victories Achieved</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Total Challenge Sprints</span>
          <span className="stat-number">{challenges.length}</span>
          <span className="stat-desc">System Volume</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Success Rate</span>
          <span className="stat-number">
            {challenges.length > 0
              ? `${Math.round((completedChallenges.length / challenges.length) * 100)}%`
              : '0%'}
          </span>
          <span className="stat-desc">Sprint Completion</span>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="habits-grid">
        {challenges.map((c) => {
          const progress = calculateProgress(c);
          const isDone = c.isCompleted;

          return (
            <div
              key={c.id}
              className={`habit-card ${isDone ? 'green' : 'blue'}`}
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="card-category-badge">{c.category || 'Challenge'}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f766e', background: '#ccfbf1', padding: '2px 8px', borderRadius: '12px' }}>
                    {c.durationDays} Days Sprint
                  </span>
                </div>

                <h3 className="card-title" style={{ fontSize: '17px', marginBottom: '6px' }}>
                  {c.title} {isDone && '🏆'}
                </h3>
                {c.description && (
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', lineHeight: 1.4 }}>
                    {c.description}
                  </p>
                )}
              </div>

              <div>
                {/* Progress Bar */}
                <div style={{ margin: '10px 0 6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: isDone ? '#10b981' : '#0d9488',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Challenge Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => onToggleComplete(c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isDone ? '#10b981' : '#0d9488',
                      background: isDone ? '#ecfdf5' : '#f0fdfa',
                      padding: '4px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    <IconCheck style={{ width: '14px', height: '14px' }} />
                    <span>{isDone ? 'Completed' : 'Mark Done'}</span>
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {onAdoptAsHabit && (
                      <button
                        type="button"
                        onClick={() => onAdoptAsHabit(c)}
                        title="Add this challenge as a regular tracked habit"
                        style={{ fontSize: '12px', fontWeight: 600, color: '#0284c7', padding: '4px 8px', borderRadius: '6px', background: '#f0f9ff' }}
                      >
                        + Habit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteChallenge(c.id)}
                      title="Delete challenge"
                      style={{ color: '#94a3b8', padding: '4px' }}
                    >
                      <IconTrash style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Challenge Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Custom Challenge</h2>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Challenge Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 21-Day Daily Reading Sprint"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="What rule will you stick to during this challenge?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="form-control"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Duration</label>
                    <select
                      className="form-control"
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                    >
                      <option value={7}>7 Days (Sprint)</option>
                      <option value={14}>14 Days (Two Weeks)</option>
                      <option value={21}>21 Days (Habit Anchor)</option>
                      <option value={30}>30 Days (Monthly Mastery)</option>
                      <option value={60}>60 Days (Neuroplasticity)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Start Challenge 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
