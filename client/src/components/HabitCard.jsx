// src/components/HabitCard.jsx
import React from 'react';
import { IconCheck, IconEdit, IconArchive, IconTrash } from './Icons';
import { inferHabitCategory } from '../services/storage';

export default function HabitCard({ 
  habit, 
  completionCount = 0, 
  streakInfo = { current: 0, longest: 0 },
  onToggleComplete, 
  onEdit, 
  onArchive, 
  onTrash,
  onStartPomodoro,
  isArchiveView = false,
  isTrashView = false,
  onRestore,
  onPermanentDelete,
}) {
  const goal = habit.goal || 1;
  const isCompleted = completionCount >= goal;
  const colorClass = habit.color || 'blue';
  const displayCategory = (habit.category && habit.category.trim() && habit.category !== 'General')
    ? habit.category
    : (inferHabitCategory(habit) || habit.category);

  return (
    <div className={`habit-card ${colorClass}`}>
      <div className="card-top">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0, marginRight: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {displayCategory && (
              <span className="card-category-badge" title={`Life Area: ${displayCategory}`}>
                {displayCategory}
              </span>
            )}
            {streakInfo.current > 0 && (
              <span 
                className="streak-badge" 
                title={`Current streak: ${streakInfo.current} days (Best: ${streakInfo.longest} days)`}
              >
                🔥 {streakInfo.current}d
              </span>
            )}
            {habit.reminderTime && (
              <span 
                className="reminder-badge" 
                title={`Daily reminder set for ${habit.reminderTime}`}
              >
                🔔 {habit.reminderTime}
              </span>
            )}
          </div>
          <h3 className="card-title">{habit.name}</h3>
        </div>

        {!isArchiveView && !isTrashView && (
          <button
            type="button"
            className={`card-check-btn ${isCompleted ? 'checked' : ''}`}
            onClick={() => onToggleComplete(habit.id, goal)}
            title={isCompleted ? "Completed! Click to undo or change" : "Click to mark completion"}
          >
            <IconCheck style={{ width: '16px', height: '16px' }} />
          </button>
        )}
      </div>

      <div className="card-labels">
        {habit.labels && habit.labels.map((lbl, idx) => (
          <span key={idx} className="label-pill">
            {lbl}
          </span>
        ))}
      </div>

      {(isArchiveView || isTrashView) && habit.startDate && (
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
          {habit.startDate} {habit.endDate ? `- ${habit.endDate}` : ''}
        </div>
      )}

      <div className="card-bottom">
        <div className="card-progress-text">
          {isArchiveView || isTrashView ? (
            `${habit.goal || 1} times ${(habit.repeat || habit.frequency || 'Daily').toLowerCase()}`
          ) : (
            `${completionCount}/${goal} times today`
          )}
        </div>

        <div className="card-actions">
          {!isArchiveView && !isTrashView && (
            <>
              {onStartPomodoro && (
                <button
                  type="button"
                  className="action-icon-btn"
                  onClick={() => onStartPomodoro(habit)}
                  title="Start Pomodoro Focus Session on this habit"
                  style={{ fontSize: '13px' }}
                >
                  ⏱️
                </button>
              )}
              <button 
                type="button" 
                className="action-icon-btn" 
                onClick={() => onEdit(habit)} 
                title="Edit habit"
              >
                <IconEdit style={{ width: '14px', height: '14px' }} />
              </button>
              <button 
                type="button" 
                className="action-icon-btn" 
                onClick={() => onArchive(habit.id)} 
                title="Archive habit"
              >
                <IconArchive style={{ width: '14px', height: '14px' }} />
              </button>
              <button 
                type="button" 
                className="action-icon-btn" 
                onClick={() => onTrash(habit.id)} 
                title="Move to trash"
              >
                <IconTrash style={{ width: '14px', height: '14px' }} />
              </button>
            </>
          )}

          {isArchiveView && (
            <>
              <button
                type="button"
                className="action-icon-btn"
                onClick={() => onRestore(habit.id)}
                title="Restore to active habits"
                style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}
              >
                Unarchive
              </button>
              <button
                type="button"
                className="action-icon-btn"
                onClick={() => onTrash(habit.id)}
                title="Move to trash"
              >
                <IconTrash style={{ width: '14px', height: '14px' }} />
              </button>
            </>
          )}

          {isTrashView && (
            <>
              <button
                type="button"
                className="action-icon-btn"
                onClick={() => onRestore(habit.id)}
                title="Restore habit"
                style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}
              >
                Restore
              </button>
              <button
                type="button"
                className="action-icon-btn"
                onClick={() => onPermanentDelete(habit.id)}
                title="Delete forever"
                style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
