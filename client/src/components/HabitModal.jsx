// src/components/HabitModal.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { IconClose } from './Icons';
import { CATEGORIES, inferHabitCategory } from '../services/storage';

export default function HabitModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = null, 
  availableLabels = [] 
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [goal, setGoal] = useState(1);
  const [repeat, setRepeat] = useState('Daily');
  const [color, setColor] = useState('blue');
  const [category, setCategory] = useState('Health & Fitness');
  const [reminderTime, setReminderTime] = useState('');
  const [status, setStatus] = useState('Active');
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setStartDate(initialData.startDate || format(new Date(), 'yyyy-MM-dd'));
      setEndDate(initialData.endDate || '');
      setGoal(initialData.goal || 1);
      setRepeat(initialData.repeat || 'Daily');
      setColor(initialData.color || 'blue');
      setCategory(initialData.category || inferHabitCategory(initialData) || 'Health & Fitness');
      setReminderTime(initialData.reminderTime || '');
      setStatus(initialData.status || 'Active');
      setSelectedLabels(initialData.labels || []);
    } else {
      setName('');
      setDescription('');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setEndDate('');
      setGoal(1);
      setRepeat('Daily');
      setColor('blue');
      setCategory('Health & Fitness');
      setReminderTime('');
      setStatus('Active');
      setSelectedLabels(availableLabels.length > 0 ? [availableLabels[0].name] : []);
    }
    setErrors({});
  }, [initialData, isOpen, availableLabels]);

  if (!isOpen) return null;

  const handleToggleLabel = (labelName) => {
    if (selectedLabels.includes(labelName)) {
      setSelectedLabels(selectedLabels.filter((l) => l !== labelName));
    } else {
      setSelectedLabels([...selectedLabels, labelName]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Habit name is required';
    }
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (endDate && endDate < startDate) {
      newErrors.endDate = 'End date cannot be earlier than start date';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...(initialData || {}),
      name: name.trim(),
      description: description.trim(),
      startDate,
      endDate: endDate || null,
      goal: Number(goal) || 1,
      repeat,
      color,
      category,
      reminderTime: reminderTime || null,
      status,
      labels: selectedLabels,
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{initialData ? 'Edit Habit' : 'New Habit'}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <IconClose style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter name of your habit"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
              />
              {errors.name && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="e.g. 20 minutes before breakfast"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (errors.endDate) setErrors({ ...errors, endDate: null });
                  }}
                />
                {errors.endDate && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.endDate}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Goal</label>
                <select 
                  className="form-control" 
                  value={goal} 
                  onChange={(e) => setGoal(Number(e.target.value))}
                >
                  <option value={1}>1 times</option>
                  <option value={2}>2 times</option>
                  <option value={3}>3 times</option>
                  <option value={5}>5 times</option>
                </select>
              </div>

              <div className="form-group">
                <label>Repeat</label>
                <select 
                  className="form-control" 
                  value={repeat} 
                  onChange={(e) => setRepeat(e.target.value)}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category / Life Area</label>
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
                <label>Daily Reminder 🔔</label>
                <input 
                  type="time" 
                  className="form-control" 
                  value={reminderTime} 
                  onChange={(e) => setReminderTime(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Colour</label>
                <select 
                  className="form-control" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)}
                >
                  <option value="blue">Blue</option>
                  <option value="pink">Pink / Red</option>
                  <option value="yellow">Yellow / Orange</option>
                  <option value="green">Green</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select 
                  className="form-control" 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Select Labels</label>
              <div className="checkbox-group">
                {availableLabels.map((lbl) => (
                  <label key={lbl.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedLabels.includes(lbl.name)}
                      onChange={() => handleToggleLabel(lbl.name)}
                    />
                    <span>{lbl.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Done
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
