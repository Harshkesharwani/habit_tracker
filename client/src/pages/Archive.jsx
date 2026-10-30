// src/pages/Archive.jsx
import React from 'react';
import HabitCard from '../components/HabitCard';

export default function Archive({ habits, onUnarchive, onTrash, searchQuery = '' }) {
  const archivedHabits = habits
    .filter((h) => (h.status || '').toUpperCase() === 'ARCHIVED')
    .filter((h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.labels && h.labels.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase())))
    );

  return (
    <div className="content-body">
      <div className="section-header" style={{ marginTop: '10px' }}>
        <h1 className="section-title">Archive</h1>
      </div>

      {archivedHabits.length > 0 ? (
        <div className="habits-grid">
          {archivedHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              isArchiveView={true}
              onRestore={onUnarchive}
              onTrash={onTrash}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No archived habits</h3>
          <p>Archived habits will be stored here so they don't clutter your active list while preserving your history.</p>
        </div>
      )}
    </div>
  );
}
