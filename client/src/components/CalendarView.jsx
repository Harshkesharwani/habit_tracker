// src/components/CalendarView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { IconClose } from './Icons';

export default function CalendarView({ selectedDate, onSelectDate, onClose, completions = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const popoverRef = useRef(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Handle click outside to close popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (event.target.closest('.date-picker-btn')) {
        return; // Handled by button toggle
      }
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        if (onClose) onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="calendar-popover" ref={popoverRef}>
      {/* Popover Header */}
      <div className="calendar-popover-header">
        <div className="calendar-popover-title">
          <span className="cal-icon">📅</span>
          <span>{format(currentMonth, 'MMM yyyy')}</span>
        </div>

        <div className="calendar-nav-buttons">
          <button 
            type="button" 
            onClick={prevMonth} 
            className="cal-btn-arrow"
            title="Previous Month"
          >
            ‹
          </button>
          <button 
            type="button" 
            onClick={() => {
              const now = new Date();
              setCurrentMonth(now);
              onSelectDate(format(now, 'yyyy-MM-dd'));
              if (onClose) onClose();
            }} 
            className="cal-btn-today"
            title="Go to Today"
          >
            Today
          </button>
          <button 
            type="button" 
            onClick={nextMonth} 
            className="cal-btn-arrow"
            title="Next Month"
          >
            ›
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="cal-btn-close"
              title="Close calendar"
            >
              <IconClose style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="calendar-grid-compact">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="calendar-compact-header">
            {d}
          </div>
        ))}

        {/* Days */}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = isSameDay(day, new Date(selectedDate));
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);

          // Find completions on this date
          const dayCompletions = completions.filter((c) => c.date === dateStr && c.count > 0);
          const hasCompletion = dayCompletions.length > 0;

          return (
            <button
              type="button"
              key={dateStr}
              className={`calendar-compact-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              style={{ opacity: isCurrentMonth ? 1 : 0.35 }}
              onClick={() => {
                onSelectDate(dateStr);
                if (onClose) onClose();
              }}
              title={`${dateStr}: ${dayCompletions.length} habit(s) completed`}
            >
              <span>{format(day, 'd')}</span>
              {hasCompletion && (
                <span className="cal-dot-indicator" />
              )}
            </button>
          );
        })}
      </div>

      <div className="calendar-popover-footer">
        <span className="cal-dot-sample" />
        <span>Indicates completed habit on this day</span>
      </div>
    </div>
  );
}
