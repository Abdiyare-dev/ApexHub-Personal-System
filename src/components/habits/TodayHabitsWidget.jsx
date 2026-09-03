"use client";

import { useMemo, useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { formatDate } from '@/lib/streaks';

export default function TodayHabitsWidget({ onNavigate }) {
  const { habits, loading, toggleLog } = useHabits();
  const [animatingId, setAnimatingId] = useState(null);

  const today = new Date();
  const todayStr = formatDate(today);
  const todaySatFirst = (today.getDay() + 1) % 7; // 0=Sat, 1=Sun...

  // Filter habits due today
  const dueHabits = useMemo(() => {
    return habits.filter((habit) => {
      if (habit.frequency === 'daily') return true;
      if (habit.frequency === 'weekly') {
        const days = habit.target_days || [];
        return days.includes(todaySatFirst);
      }
      return true;
    });
  }, [habits, todaySatFirst]);

  // Helper to check if habit is logged for today
  const isLoggedToday = (habit) => {
    const logs = habit.habit_logs || [];
    return logs.some(
      (l) =>
        (l.log_date?.split('T')[0] || l.log_date) === todayStr &&
        (l.completed === true || l.completed === 'true' || l.completed === 1)
    );
  };

  const handleToggle = async (habit) => {
    setAnimatingId(habit.id);
    setTimeout(() => setAnimatingId(null), 350);
    try {
      await toggleLog(habit.id, todayStr);
    } catch (err) {
      console.error(err);
    }
  };

  const handleHeaderClick = (e) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate('Habits');
    }
  };

  // If loading or none due today, return null (hide section entirely)
  if (loading || dueHabits.length === 0) {
    return null;
  }

  const completedCount = dueHabits.filter(isLoggedToday).length;
  const isAllCompleted = completedCount === dueHabits.length;

  return (
    <div className="today-habits-widget glass-3d">
      {/* Header */}
      <div className="widget-header">
        <div className="widget-title-group" onClick={handleHeaderClick}>
          <div className="widget-icon">🔥</div>
          <div>
            <h4 className="widget-heading">Today's Habits</h4>
            <span className="widget-subtitle">
              {completedCount} of {dueHabits.length} Done
            </span>
          </div>
        </div>

        <button className="view-all-btn" onClick={handleHeaderClick}>
          View All →
        </button>
      </div>

      {/* Habits List */}
      <div className="widget-list">
        {dueHabits.map((habit) => {
          const done = isLoggedToday(habit);
          const isAnimating = animatingId === habit.id;

          return (
            <div
              key={habit.id}
              className={`habit-row-item ${done ? 'done' : ''}`}
            >
              <div className="habit-row-left">
                <button
                  type="button"
                  onClick={() => handleToggle(habit)}
                  className={`widget-checkbox ${done ? 'checked' : ''} ${isAnimating ? 'bounce' : ''}`}
                >
                  {done && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>

                <span className={`habit-row-name ${done ? 'crossed' : ''}`}>
                  {habit.title}
                </span>
              </div>

              <div className="habit-streak-tag">
                🔥 {habit.currentStreak || 0}d
              </div>
            </div>
          );
        })}
      </div>

      {isAllCompleted && (
        <div className="widget-celebration">
          All habits done for today! 🎉
        </div>
      )}

      <style jsx>{`
        .today-habits-widget {
          padding: 18px 20px;
          border-radius: 16px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-card);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .today-habits-widget:hover {
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
          background: rgba(245, 158, 11, 0.12);
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

        .widget-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .habit-row-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 10px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          transition: all 0.2s ease;
        }
        .habit-row-item.done {
          border-color: rgba(16, 185, 129, 0.3);
          background: rgba(16, 185, 129, 0.05);
        }

        .habit-row-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }
        .widget-checkbox {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 2px solid var(--border-color);
          background: var(--surface);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .widget-checkbox.checked {
          background: #10b981;
          border-color: #10b981;
          color: #fff;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
        }
        .widget-checkbox.bounce {
          animation: checkBounce 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .habit-row-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .habit-row-name.crossed {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        .habit-streak-tag {
          font-size: 0.75rem;
          font-weight: 800;
          color: #f59e0b;
          flex-shrink: 0;
        }

        .widget-celebration {
          margin-top: 10px;
          padding: 8px;
          border-radius: 8px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          font-size: 0.78rem;
          font-weight: 800;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
