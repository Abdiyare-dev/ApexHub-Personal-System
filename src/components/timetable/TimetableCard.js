"use client";

import { useState, useEffect } from 'react';

const CATEGORY_COLORS = {
  Work: '#0ea5e9',
  Education: '#8b5cf6',
  Health: '#10b981',
  Personal: '#f59e0b',
  Focus: '#f43f5e',
  Default: '#06b6d4',
};

export function getCategoryStyle(category = '') {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Default;
}

export default function TimetableCard({ onNavigate }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Convert current day to 0-6 Saturday-first: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
  const now = new Date();
  const todaySatFirst = (now.getDay() + 1) % 7;

  useEffect(() => {
    async function fetchTimetable() {
      try {
        setLoading(true);
        const res = await fetch('/api/timetable');
        if (res.ok) {
          const data = await res.json();
          const todayEntries = (data || [])
            .filter((item) => Number(item.day_of_week) === todaySatFirst)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
          setEntries(todayEntries);
        }
      } catch (err) {
        console.error('Failed to load timetable:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTimetable();
  }, [todaySatFirst]);

  const handleHeaderClick = () => {
    if (onNavigate) {
      onNavigate('Timetable');
    }
  };

  return (
    <div className="timetable-card-widget glass-3d">
      {/* Header */}
      <div className="widget-header">
        <div className="widget-title-group" onClick={handleHeaderClick}>
          <div className="widget-icon">📅</div>
          <div>
            <h4 className="widget-heading">Today's Schedule</h4>
            <span className="widget-subtitle">{entries.length} Activities Today</span>
          </div>
        </div>

        <button className="view-all-btn" onClick={handleHeaderClick}>
          View All →
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="widget-loading">Loading schedule...</div>
      ) : entries.length === 0 ? (
        <div className="widget-empty">
          <span className="empty-sun">☀️</span>
          <p className="empty-text">No schedule for today</p>
          <span className="empty-sub">Enjoy your free time or add activities.</span>
        </div>
      ) : (
        <div className="widget-list">
          {entries.map((item) => {
            const catColor = getCategoryStyle(item.category);
            return (
              <div
                key={item.id}
                className="schedule-row-item"
                style={{ borderLeft: `3px solid ${catColor}` }}
              >
                <div className="schedule-info">
                  <span className="schedule-title">{item.title}</span>
                  <span className="schedule-time">{item.start_time} – {item.end_time}</span>
                </div>

                {item.category && (
                  <span
                    className="schedule-cat-badge"
                    style={{ color: catColor, borderColor: `${catColor}40` }}
                  >
                    {item.category}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .timetable-card-widget {
          padding: 18px 20px;
          border-radius: 16px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-card);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .timetable-card-widget:hover {
          transform: translateY(-3px);
          border-color: var(--accent);
          box-shadow: 0 10px 30px rgba(0,0,0,0.18), 0 2px 8px var(--accent-glow);
        }

        .widget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 12px;
        }
        .widget-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .widget-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(0, 153, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
        .widget-heading {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .widget-subtitle {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .view-all-btn {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--accent);
          background: none;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        .view-all-btn:hover {
          opacity: 0.8;
        }

        .widget-loading {
          text-align: center;
          padding: 24px 0;
          color: var(--text-muted);
          font-size: 0.82rem;
        }
        .widget-empty {
          text-align: center;
          padding: 20px 0;
        }
        .empty-sun {
          font-size: 1.6rem;
          display: block;
          margin-bottom: 4px;
        }
        .empty-text {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .empty-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .widget-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .schedule-row-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          border-radius: 10px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          border-left-width: 3px;
        }
        .schedule-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }
        .schedule-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .schedule-time {
          font-size: 0.72rem;
          color: var(--text-secondary);
          margin-top: 1px;
        }
        .schedule-cat-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 6px;
          background: var(--surface);
          border: 1px solid;
          margin-left: 8px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
