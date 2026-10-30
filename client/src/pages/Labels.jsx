// src/pages/Labels.jsx
import React, { useState } from 'react';
import { IconPlus, IconEdit, IconTrash } from '../components/Icons';

export default function Labels({ labels, habits, onSaveLabel, onDeleteLabel, searchQuery = '' }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const filteredLabels = labels.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    onSaveLabel(newLabelName.trim());
    setNewLabelName('');
    setIsCreating(false);
  };

  const handleUpdate = (id) => {
    if (!editingName.trim()) return;
    onSaveLabel(editingName.trim());
    setEditingId(null);
  };

  const getHabitCountForLabel = (labelName) => {
    return habits.filter((h) => h.labels && h.labels.includes(labelName)).length;
  };

  return (
    <div className="content-body">
      <div className="section-header" style={{ marginTop: '10px' }}>
        <h1 className="section-title">LABELS</h1>
        <button
          type="button"
          className="btn-inline-create"
          onClick={() => setIsCreating(true)}
        >
          <IconPlus style={{ width: '16px', height: '16px' }} />
          <span>Create Label</span>
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '24px', maxWidth: '400px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Label name (e.g. Reading, Exercise)"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>
            Add
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '8px 14px' }}
            onClick={() => setIsCreating(false)}
          >
            Cancel
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
        {filteredLabels.map((lbl) => {
          const count = getHabitCountForLabel(lbl.name);
          const isEditing = editingId === lbl.id;

          return (
            <div
              key={lbl.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
              }}
            >
              {isEditing ? (
                <div style={{ display: 'flex', gap: '8px', flex: 1, marginRight: '12px' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                    onClick={() => handleUpdate(lbl.id)}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                    {lbl.name.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                    {count} habit{count === 1 ? '' : 's'}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!isEditing && (
                  <button
                    type="button"
                    className="action-icon-btn"
                    onClick={() => {
                      setEditingId(lbl.id);
                      setEditingName(lbl.name);
                    }}
                    title="Edit Label"
                  >
                    <IconEdit style={{ width: '15px', height: '15px' }} />
                  </button>
                )}
                <button
                  type="button"
                  className="action-icon-btn"
                  onClick={() => onDeleteLabel(lbl.id)}
                  title="Delete Label"
                >
                  <IconTrash style={{ width: '15px', height: '15px' }} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredLabels.length === 0 && (
          <div className="empty-state">
            <h3>No labels found</h3>
            <p>Create a label using the button above to categorize your habits.</p>
          </div>
        )}
      </div>
    </div>
  );
}
