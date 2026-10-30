// client/src/components/PomodoroModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { IconClose } from './Icons';

export default function PomodoroModal({
  isOpen,
  onClose,
  habits = [],
  initialHabit = null,
  onLogSession,
  onAutoIncrementHabit,
}) {
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro' | 'shortBreak' | 'longBreak'
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const timerRef = useRef(null);

  useEffect(() => {
    if (initialHabit) {
      setSelectedHabitId(initialHabit.id);
    } else if (habits.length > 0 && !selectedHabitId) {
      setSelectedHabitId(habits[0].id);
    }
  }, [initialHabit, habits, isOpen]);

  // Set duration based on mode
  const switchMode = (newMode) => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    setMode(newMode);
    let seconds = 25 * 60;
    if (newMode === 'shortBreak') seconds = 5 * 60;
    if (newMode === 'longBreak') seconds = 15 * 60;
    setTimeLeft(seconds);
    setTotalSeconds(seconds);
  };

  // Play subtle chime using Web Audio API
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio chime unavailable', e);
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playChime();

            // Session completed!
            const mins = Math.round(totalSeconds / 60);
            const habit = habits.find((h) => String(h.id) === String(selectedHabitId));
            if (onLogSession) {
              onLogSession({
                habitId: selectedHabitId || null,
                habitTitle: habit ? habit.name : 'Focus Session',
                durationMinutes: mins,
              });
            }

            if (mode === 'pomodoro' && selectedHabitId && onAutoIncrementHabit) {
              onAutoIncrementHabit(selectedHabitId);
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, totalSeconds, mode, selectedHabitId, habits]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    setTimeLeft(totalSeconds);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '440px', textAlign: 'center' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⏱️</span>
            <h2 className="modal-title">Pomodoro Focus Timer</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <IconClose style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 20px' }}>
          {/* Mode Selector Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            <button
              type="button"
              className={`pomo-tab ${mode === 'pomodoro' ? 'active' : ''}`}
              onClick={() => switchMode('pomodoro')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                background: mode === 'pomodoro' ? '#0d9488' : 'transparent',
                color: mode === 'pomodoro' ? '#ffffff' : '#64748b',
              }}
            >
              Focus (25m)
            </button>
            <button
              type="button"
              className={`pomo-tab ${mode === 'shortBreak' ? 'active' : ''}`}
              onClick={() => switchMode('shortBreak')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                background: mode === 'shortBreak' ? '#0284c7' : 'transparent',
                color: mode === 'shortBreak' ? '#ffffff' : '#64748b',
              }}
            >
              Short Break (5m)
            </button>
            <button
              type="button"
              className={`pomo-tab ${mode === 'longBreak' ? 'active' : ''}`}
              onClick={() => switchMode('longBreak')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                background: mode === 'longBreak' ? '#6366f1' : 'transparent',
                color: mode === 'longBreak' ? '#ffffff' : '#64748b',
              }}
            >
              Long Break (15m)
            </button>
          </div>

          {/* Big Time Display */}
          <div style={{ position: 'relative', margin: '14px 0' }}>
            <div style={{ fontSize: '56px', fontWeight: 800, letterSpacing: '-1px', color: '#0f172a' }}>
              {formattedTime}
            </div>
            {/* Progress bar under time */}
            <div style={{ width: '220px', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', margin: '0 auto' }}>
              <div 
                style={{ 
                  width: `${progressPercent}%`, 
                  height: '100%', 
                  background: mode === 'pomodoro' ? '#0d9488' : '#0284c7', 
                  transition: 'width 0.3s ease' 
                }} 
              />
            </div>
          </div>

          {/* Linked Habit Selection */}
          <div style={{ width: '100%', textAlign: 'left' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px', display: 'block' }}>
              Anchor To Habit (Optional):
            </label>
            <select
              className="form-control"
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              disabled={isRunning}
            >
              <option value="">-- No specific habit (General Focus) --</option>
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.category || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={handleToggleTimer}
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: '16px', minWidth: '120px' }}
            >
              {isRunning ? 'Pause' : (timeLeft === 0 ? 'Restart' : 'Start Focus')}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
              style={{ padding: '12px 18px', fontSize: '15px' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
