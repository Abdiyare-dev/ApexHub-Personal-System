"use client";

import React, { useState } from 'react';

export default function MoodCalendar({ entries = [], onDayClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  const days = [];
  // Pad beginning of month
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
    days.push(null);
  }
  // Add days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push(d.toISOString().split('T')[0]);
  }

  const moodColors = {
    great: '#10b981',   // deep green
    good: '#6ee7b7',    // light green
    neutral: '#fcd34d', // yellow
    low: '#fb923c',     // orange
    rough: '#f43f5e'    // red
  };

  const getMoodColor = (dateStr) => {
    const entry = entries.find(e => e.date === dateStr);
    if (!entry) return 'var(--surface-low)';
    return moodColors[entry.mood] || 'var(--surface-low)';
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  return (
    <div className="mood-calendar">
      <div className="calendar-header">
        <button onClick={prevMonth} className="nav-btn">←</button>
        <span className="month-title">{monthNames[month]} {year}</span>
        <button onClick={nextMonth} className="nav-btn">→</button>
      </div>
      
      <div className="calendar-grid">
        <div className="day-name">M</div>
        <div className="day-name">T</div>
        <div className="day-name">W</div>
        <div className="day-name">T</div>
        <div className="day-name">F</div>
        <div className="day-name">S</div>
        <div className="day-name">S</div>

        {days.map((dateStr, idx) => {
          if (!dateStr) return <div key={`empty-${idx}`} className="calendar-day empty" />;
          
          return (
            <div 
              key={dateStr}
              className="calendar-day"
              style={{ backgroundColor: getMoodColor(dateStr) }}
              title={dateStr}
              onClick={() => onDayClick && onDayClick(dateStr)}
            />
          );
        })}
      </div>

      <style jsx>{`
        .mood-calendar {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 16px;
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .nav-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .nav-btn:hover { background: var(--surface-low); }
        .month-title {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .day-name {
          text-align: center;
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .calendar-day {
          aspect-ratio: 1;
          border-radius: 4px;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .calendar-day.empty { background: transparent; cursor: default; }
        .calendar-day:not(.empty):hover {
          transform: scale(1.1);
          box-shadow: 0 0 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
