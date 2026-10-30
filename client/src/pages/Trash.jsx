// src/pages/Trash.jsx
import React from 'react';
import HabitCard from '../components/HabitCard';

export default function Trash({ 
  trash, 
  onRestore, 
  onPermanentDelete, 
  onEmptyTrash, 
  searchQuery = '' 
}) {
  const filteredTrash = trash.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.labels && h.labels.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="content-body">
      <div className="section-header" style={{ marginTop: '10px' }}>
        <h1 className="section-title">Trash</h1>
        {trash.length > 0 && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onEmptyTrash}
            style={{ color: '#ef4444', borderColor: '#fca5a5' }}
          >
            Empty Trash
          </button>
        )}
      </div>

      {filteredTrash.length > 0 ? (
        <div className="habits-grid">
          {filteredTrash.map((item) => (
            <HabitCard
              key={item.id}
              habit={item}
              isTrashView={true}
              onRestore={onRestore}
              onPermanentDelete={onPermanentDelete}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>Trash is empty</h3>
          <p>Habits you delete will appear here before being permanently removed.</p>
        </div>
      )}
    </div>
  );
}
