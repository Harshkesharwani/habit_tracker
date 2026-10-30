// client/src/pages/Home.jsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import HabitCard from '../components/HabitCard';
import CalendarView from '../components/CalendarView';
import { IconPlus, IconCalendar } from '../components/Icons';
import { 
  CATEGORIES, 
  QUOTES, 
  calculateHabitStreak, 
  generateHabitsCsv, 
  downloadCsv,
  inferHabitCategory,
  matchesCategory
} from '../services/storage';

export default function Home({
  user,
  habits,
  completions,
  selectedDate,
  setSelectedDate,
  onToggleComplete,
  onOpenCreate,
  onEditHabit,
  onArchiveHabit,
  onTrashHabit,
  onOpenPomodoro,
  onStartPomodoro,
  stats,
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [copiedQuote, setCopiedQuote] = useState(false);

  const activeQuote = QUOTES[quoteIndex % QUOTES.length];

  const handleShuffleQuote = () => {
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * QUOTES.length);
    } while (nextIdx === quoteIndex && QUOTES.length > 1);
    setQuoteIndex(nextIdx);
  };

  const handleCopyQuote = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`"${activeQuote.text}" — ${activeQuote.author}`);
      setCopiedQuote(true);
      setTimeout(() => setCopiedQuote(false), 2000);
    }
  };

  const handleExportCsv = () => {
    const csvData = generateHabitsCsv(habits, completions);
    downloadCsv(csvData, `habit_tracker_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  // All active habits for this user
  const activeHabitsAll = habits.filter((h) => (h.status || '').toUpperCase() === 'ACTIVE');

  // Base categories to always display in the filter bar
  const baseCategories = [
    'Health & Fitness',
    'Career & Work',
    'Learning',
    'Mindfulness',
    'Personal',
    'Finance',
    'General',
  ];

  // Discover any unique categories/areas from active habits
  const habitAreas = new Set();
  activeHabitsAll.forEach((h) => {
    const cat = inferHabitCategory(h);
    if (cat) habitAreas.add(cat);
    if (h.category && h.category.trim()) habitAreas.add(h.category.trim());
  });

  const categoryList = ['All'];
  baseCategories.forEach((cat) => {
    if (!categoryList.includes(cat)) {
      categoryList.push(cat);
    }
  });
  habitAreas.forEach((area) => {
    const exists = categoryList.some((c) => c.toLowerCase() === area.toLowerCase());
    if (!exists) {
      categoryList.push(area);
    }
  });

  // Filter active habits by selected category
  const activeHabits = activeHabitsAll.filter((h) => matchesCategory(h, selectedCategory));

  // Categorize into Incomplete vs Completed for the selectedDate
  const completedHabits = [];
  const pendingHabits = [];

  activeHabits.forEach((habit) => {
    const comp = completions.find((c) => String(c.habitId || c.habit) === String(habit.id) && c.date === selectedDate);
    const count = comp ? comp.count : (habit.todayCompletions || 0);
    const goal = habit.goal || 1;

    if (count >= goal) {
      completedHabits.push({ habit, count });
    } else {
      pendingHabits.push({ habit, count });
    }
  });

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="content-body">
      {/* Home Header */}
      <div className="home-header">
        <h1 className="welcome-title">
          Welcome, {user?.name ? user.name.split(' ')[0] : 'Tanay'} 👋
        </h1>

        <div className="date-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Quick Pomodoro Launcher Button */}
          {onOpenPomodoro && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onOpenPomodoro}
              title="Open Pomodoro Focus Timer"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 700 }}
            >
              <span>⏱️</span>
              <span>Pomodoro</span>
            </button>
          )}

          {/* Export CSV Button */}
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCsv}
            title="Export habit completion history to CSV"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 700 }}
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>

          {/* Date Picker Button */}
          <button
            type="button"
            className="date-picker-btn"
            onClick={() => setShowCalendar(!showCalendar)}
            title="Toggle Calendar Date Picker"
          >
            <IconCalendar style={{ width: '16px', height: '16px' }} />
            <span>{isToday ? 'Today ⌵' : `${selectedDate} ⌵`}</span>
          </button>

          {/* Small Floating Calendar Popover: floats OVER the dashboard without stretching content */}
          {showCalendar && (
            <CalendarView
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
              }}
              onClose={() => setShowCalendar(false)}
              completions={completions}
            />
          )}
        </div>
      </div>

      {/* Motivational Daily Quote Card */}
      <div 
        className="quote-card" 
        style={{
          background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)',
          border: '1px solid #99f6e4',
          borderRadius: '14px',
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(13, 148, 136, 0.06)',
          position: 'relative',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '16px' }}>💬</span>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f766e' }}>
              Daily Inspiration {activeQuote.category ? `• ${activeQuote.category}` : ''}
            </span>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', fontStyle: 'italic', lineHeight: 1.4 }}>
            "{activeQuote.text}"
          </p>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginTop: '4px', display: 'block' }}>
            — {activeQuote.author}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleShuffleQuote}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, borderRadius: '8px' }}
            title="Get another quote"
          >
            🎲 Shuffle
          </button>
          <button
            type="button"
            onClick={handleCopyQuote}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, borderRadius: '8px' }}
            title="Copy quote to clipboard"
          >
            {copiedQuote ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-title">Completed</span>
          <span className="stat-number">{stats.completedToday}</span>
          <span className="stat-desc">Total Count</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">In progress</span>
          <span className="stat-number">{stats.inProgress}</span>
          <span className="stat-desc">Total Count</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Overdue</span>
          <span className="stat-number">{stats.overdue}</span>
          <span className="stat-desc">Total Count</span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Total</span>
          <span className="stat-number">{stats.total}</span>
          <span className="stat-desc">Total Count</span>
        </div>
      </div>

      {/* Habit Categories / Areas Filter Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            overflowX: 'auto', 
            paddingBottom: '6px',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginRight: '4px', whiteSpace: 'nowrap' }}>
            Area:
          </span>
          {categoryList.map((cat) => {
            const count = cat === 'All' 
              ? activeHabitsAll.length 
              : activeHabitsAll.filter((h) => matchesCategory(h, cat)).length;
            
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();

            return (
              <button
                key={cat}
                type="button"
                className={`category-pill ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  if (isSelected && cat !== 'All') {
                    setSelectedCategory('All');
                  } else {
                    setSelectedCategory(cat);
                  }
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  background: isSelected ? '#0d9488' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#64748b',
                  border: isSelected ? '1px solid #0d9488' : '1px solid #e2e8f0',
                  boxShadow: isSelected ? '0 2px 8px rgba(13, 148, 136, 0.2)' : 'none',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title={isSelected && cat !== 'All' ? `Click to clear "${cat}" filter` : `Filter by ${cat}`}
              >
                <span>{cat}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#64748b',
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section: My Habits */}
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h2 className="section-title">
            My Habits {selectedCategory !== 'All' ? `• ${selectedCategory}` : '🎯'}
          </h2>
          {selectedCategory !== 'All' && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSelectedCategory('All')}
              style={{ padding: '3px 10px', fontSize: '11px', borderRadius: '12px', color: '#0d9488', borderColor: '#99f6e4', fontWeight: 700 }}
              title="Reset to All areas"
            >
              ✕ Clear Filter
            </button>
          )}
        </div>
        <button 
          type="button" 
          className="btn-inline-create"
          onClick={onOpenCreate}
        >
          <IconPlus style={{ width: '16px', height: '16px' }} />
          <span>Create Habit</span>
        </button>
      </div>

      {/* Empty State when no habits match this category at all */}
      {activeHabits.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: '24px', padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📂</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
            No active habits in "{selectedCategory}"
          </h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
            You haven't assigned any active habits to this area yet.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={onOpenCreate}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              + Create Habit in {selectedCategory}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSelectedCategory('All')}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              View All Habits
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ACTIVE HABITS */}
          <div className="section-subtitle">ACTIVE</div>
          {pendingHabits.length > 0 ? (
            <div className="habits-grid">
              {pendingHabits.map(({ habit, count }) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  completionCount={count}
                  streakInfo={calculateHabitStreak(habit.id, completions)}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEditHabit}
                  onArchive={onArchiveHabit}
                  onTrash={onTrashHabit}
                  onStartPomodoro={onStartPomodoro}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ marginBottom: '24px' }}>
              <h3>All caught up! 🎉</h3>
              <p>
                {selectedCategory !== 'All'
                  ? `All active habits in "${selectedCategory}" are completed for ${isToday ? 'today' : selectedDate}!`
                  : `You have finished all active habits for ${isToday ? 'today' : selectedDate}, or haven't added one yet.`}
              </p>
            </div>
          )}

          {/* COMPLETED HABITS */}
          {completedHabits.length > 0 && (
            <>
              <div className="section-subtitle" style={{ marginTop: '16px' }}>COMPLETED</div>
              <div className="habits-grid">
                {completedHabits.map(({ habit, count }) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    completionCount={count}
                    streakInfo={calculateHabitStreak(habit.id, completions)}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEditHabit}
                    onArchive={onArchiveHabit}
                    onTrash={onTrashHabit}
                    onStartPomodoro={onStartPomodoro}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
