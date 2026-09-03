"use client";

import { useState, useMemo } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { formatDate } from '@/lib/streaks';

const DAYS_OF_WEEK = [
  { label: 'S', dayIndex: 0, full: 'Saturday', num: 1 },
  { label: 'S', dayIndex: 1, full: 'Sunday', num: 2 },
  { label: 'M', dayIndex: 2, full: 'Monday', num: 3 },
  { label: 'T', dayIndex: 3, full: 'Tuesday', num: 4 },
  { label: 'W', dayIndex: 4, full: 'Wednesday', num: 5 },
  { label: 'T', dayIndex: 5, full: 'Thursday', num: 6 },
  { label: 'F', dayIndex: 6, full: 'Friday', num: 7 },
];

export default function HabitsPage() {
  const {
    habits,
    loading,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleLog,
  } = useHabits();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [targetDays, setTargetDays] = useState([0, 1, 2, 3, 4]); // default Sat-Wed
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingHabitId, setDeletingHabitId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Animation trigger state for checkboxes
  const [animatingId, setAnimatingId] = useState(null);

  const today = new Date();
  const todayStr = formatDate(today);
  const todaySatFirst = (today.getDay() + 1) % 7; // 0=Sat, 1=Sun, 2=Mon...

  // Helper to check if a habit is due today
  const isHabitDueToday = (habit) => {
    if (habit.frequency === 'daily') return true;
    if (habit.frequency === 'weekly') {
      const days = habit.target_days || [];
      return days.includes(todaySatFirst);
    }
    return true;
  };

  // Helper to check if habit is logged for a given date
  const isHabitLoggedOn = (habit, dateStr) => {
    const logs = habit.habit_logs || [];
    return logs.some(
      (l) =>
        (l.log_date?.split('T')[0] || l.log_date) === dateStr &&
        (l.completed === true || l.completed === 'true' || l.completed === 1)
    );
  };

  // Check if all due habits today are completed
  const { dueHabitsCount, completedDueHabitsCount, allDueCompleted } = useMemo(() => {
    const due = habits.filter(isHabitDueToday);
    const completed = due.filter((h) => isHabitLoggedOn(h, todayStr));
    return {
      dueHabitsCount: due.length,
      completedDueHabitsCount: completed.length,
      allDueCompleted: due.length > 0 && due.length === completed.length,
    };
  }, [habits, todayStr, todaySatFirst]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingHabit(null);
    setTitle('');
    setFrequency('daily');
    setTargetDays([0, 1, 2, 3, 4]);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (habit) => {
    setEditingHabit(habit);
    setTitle(habit.title);
    setFrequency(habit.frequency || 'daily');
    setTargetDays(habit.target_days || [0, 1, 2, 3, 4]);
    setFormError('');
    setIsModalOpen(true);
  };

  // Toggle Day Selection for Weekly Habits
  const handleToggleDay = (dayIndex) => {
    if (targetDays.includes(dayIndex)) {
      if (targetDays.length === 1) {
        setFormError('At least 1 day must be selected for weekly habits.');
        return;
      }
      setTargetDays(targetDays.filter((d) => d !== dayIndex));
    } else {
      setTargetDays([...targetDays, dayIndex].sort());
      setFormError('');
    }
  };

  // Save Habit
  const handleSaveHabit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Habit title is required.');
      return;
    }
    if (frequency === 'weekly' && (!targetDays || targetDays.length === 0)) {
      setFormError('Please select at least one day for weekly habit.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      if (editingHabit) {
        await updateHabit(editingHabit.id, {
          title: title.trim(),
          frequency,
          target_days: frequency === 'weekly' ? targetDays : [],
        });
      } else {
        await createHabit({
          title: title.trim(),
          frequency,
          target_days: frequency === 'weekly' ? targetDays : [],
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save habit');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Checkbox Toggle
  const handleToggleCheckbox = async (habit) => {
    setAnimatingId(habit.id);
    setTimeout(() => setAnimatingId(null), 400);

    try {
      await toggleLog(habit.id, todayStr);
    } catch (err) {
      console.error(err);
    }
  };

  // Generate 21 days dates array (3 weeks, 21 days ending today)
  const last21Days = useMemo(() => {
    const dates = [];
    for (let i = 20; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(formatDate(d));
    }
    return dates;
  }, []);

  // Break last 21 days into 3 rows of 7
  const dotRows = useMemo(() => {
    return [
      last21Days.slice(0, 7),
      last21Days.slice(7, 14),
      last21Days.slice(14, 21),
    ];
  }, [last21Days]);

  return (
    <div className="module-container fade-in">
      {/* Header Section */}
      <div className="hero-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="hero-greeting">Habits & Streaks</h2>
          <p className="hero-subtitle">Build unbreakable routines, track streaks, and master daily discipline.</p>
        </div>
        <button className="create-habit-btn" onClick={handleOpenAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Habit
        </button>
      </div>

      {/* Celebratory Banner when all due habits are done */}
      {allDueCompleted && (
        <div className="celebration-banner glass-3d">
          <div className="celebration-content">
            <div className="celebration-icon">🎉</div>
            <div>
              <h3 className="celebration-title">All habits done for today! 🎉</h3>
              <p className="celebration-sub">Sensational! You checked off all {dueHabitsCount} active habits scheduled for today.</p>
            </div>
          </div>
          <span className="celebration-badge">100% Completed</span>
        </div>
      )}

      {/* Habits List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div className="loading-spinner" />
          <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>Loading your habits...</p>
        </div>
      ) : habits.length === 0 ? (
        <div className="empty-habits glass-3d">
          <div className="empty-icon">🔥</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>No Habits Tracked Yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '18px' }}>Start small! Create your first daily or weekly habit and watch your streak grow.</p>
          <button className="create-habit-btn" onClick={handleOpenAdd}>
            + Create First Habit
          </button>
        </div>
      ) : (
        <div className="habits-grid">
          {habits.map((habit) => {
            const isDueToday = isHabitDueToday(habit);
            const isLoggedToday = isHabitLoggedOn(habit, todayStr);
            const isAnimating = animatingId === habit.id;

            return (
              <div key={habit.id} className={`habit-card glass-3d ${isLoggedToday ? 'done-card' : ''}`}>
                {/* Left Section: Checkbox + Habit Info */}
                <div className="habit-left">
                  {/* Today Checkbox */}
                  {isDueToday ? (
                    <button
                      type="button"
                      onClick={() => handleToggleCheckbox(habit)}
                      className={`habit-check-btn ${isLoggedToday ? 'checked' : ''} ${isAnimating ? 'bounce' : ''}`}
                      title={isLoggedToday ? 'Mark Incomplete' : 'Mark Complete for Today'}
                    >
                      {isLoggedToday && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>
                  ) : (
                    <div className="habit-rest-pill" title="Not scheduled for today">
                      Rest
                    </div>
                  )}

                  <div className="habit-info">
                    <div className="habit-title-row">
                      <h3 className={`habit-name ${isLoggedToday ? 'crossed' : ''}`}>
                        {habit.title}
                      </h3>
                      <span className="habit-freq-badge">
                        {habit.frequency === 'daily'
                          ? 'Daily'
                          : `Weekly (${(habit.target_days || [])
                              .map((d) => DAYS_OF_WEEK.find((item) => item.dayIndex === d)?.label)
                              .join('')})`}
                      </span>
                    </div>

                    <div className="habit-streak-row">
                      <span className="current-streak-badge">
                        <span className="flame-icon">🔥</span> {habit.currentStreak || 0} days
                      </span>
                      <span className="best-streak-text">
                        Best: {habit.bestStreak || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section: 21-Day History Dots + Action Controls */}
                <div className="habit-right">
                  {/* 21 Days Dot History Grid */}
                  <div className="history-dots-container" title="Last 21 Days History (3 Rows × 7 Days)">
                    {dotRows.map((row, rowIdx) => (
                      <div key={rowIdx} className="history-dot-row">
                        {row.map((dateStr) => {
                          const isDone = isHabitLoggedOn(habit, dateStr);
                          const isTodayDate = dateStr === todayStr;
                          return (
                            <div
                              key={dateStr}
                              title={`${dateStr}: ${isDone ? 'Completed' : 'Missed'}`}
                              className={`history-dot ${isDone ? 'active' : ''} ${isTodayDate ? 'today-dot' : ''}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="habit-actions">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(habit)}
                      className="action-icon-btn edit"
                      title="Edit Habit"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingHabitId(habit.id)}
                      className="action-icon-btn delete"
                      title="Delete Habit"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="custom-modal-box glass-3d" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingHabit ? 'Edit Habit' : 'Create New Habit'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveHabit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Habit Title</label>
                <input
                  type="text"
                  placeholder="e.g. Read 20 pages, Morning Jog, Deep Coding"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Frequency</label>
                <div className="toggle-segment">
                  <button
                    type="button"
                    onClick={() => setFrequency('daily')}
                    className={`segment-btn ${frequency === 'daily' ? 'active' : ''}`}
                  >
                    Daily Routine
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency('weekly')}
                    className={`segment-btn ${frequency === 'weekly' ? 'active' : ''}`}
                  >
                    Custom Weekly Days
                  </button>
                </div>
              </div>

              {frequency === 'weekly' && (
                <div className="form-group">
                  <label className="form-label">Target Days (Saturday – Friday)</label>
                  <div className="days-picker">
                    {DAYS_OF_WEEK.map((item) => {
                      const isSelected = targetDays.includes(item.dayIndex);
                      return (
                        <button
                          key={item.dayIndex}
                          type="button"
                          onClick={() => handleToggleDay(item.dayIndex)}
                          className={`day-chip ${isSelected ? 'selected' : ''}`}
                          title={item.full}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {formError && (
                <div className="form-error-box">{formError}</div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingHabit ? 'Save Changes' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingHabitId && (
        <div className="custom-modal-overlay" onClick={() => setDeletingHabitId(null)}>
          <div className="custom-modal-box glass-3d" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#ef4444' }}>Delete Habit</h3>
              <button className="modal-close" onClick={() => setDeletingHabitId(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '14px 0 20px' }}>
              Are you sure you want to delete this habit? All recorded streaks and logs will be permanently deleted.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setDeletingHabitId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await deleteHabit(deletingHabitId);
                    setDeletingHabitId(null);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Habit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .module-container {
          padding: 0;
        }

        .create-habit-btn {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          color: #fff;
          font-weight: 700;
          font-size: 0.9rem;
          padding: 10px 20px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 16px var(--accent-glow);
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
        }
        .create-habit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px var(--accent-glow);
        }

        .celebration-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.12));
          border: 1px solid rgba(16, 185, 129, 0.35);
          margin-bottom: 24px;
        }
        .celebration-content {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .celebration-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #10b981;
          color: white;
          font-size: 1.4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
        }
        .celebration-title {
          font-size: 1rem;
          font-weight: 800;
          color: #10b981;
          margin-bottom: 2px;
        }
        .celebration-sub {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }
        .celebration-badge {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 6px 12px;
          border-radius: 20px;
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .habits-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .habit-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 14px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-card);
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease, border-color 0.25s ease;
          gap: 16px;
        }
        .habit-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15), 0 2px 8px var(--accent-glow);
        }
        .habit-card.done-card {
          border-color: rgba(16, 185, 129, 0.3);
          background: linear-gradient(135deg, var(--surface), rgba(16, 185, 129, 0.03));
        }

        .habit-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }

        .habit-check-btn {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 2px solid var(--border-color);
          background: var(--surface-low);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          flex-shrink: 0;
        }
        .habit-check-btn:hover {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.08);
        }
        .habit-check-btn.checked {
          background: linear-gradient(135deg, #10b981, #059669);
          border-color: #10b981;
          color: #fff;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
        }
        .habit-check-btn.bounce {
          animation: checkBounce 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes checkBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }

        .habit-rest-pill {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: var(--surface-low);
          border: 1px dashed var(--border-color);
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .habit-info {
          min-width: 0;
          flex: 1;
        }
        .habit-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .habit-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .habit-name.crossed {
          color: var(--text-secondary);
        }
        .habit-freq-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 3px 8px;
          border-radius: 6px;
          background: var(--surface-low);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .habit-streak-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }
        .current-streak-badge {
          font-size: 0.82rem;
          font-weight: 800;
          color: #f59e0b;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .best-streak-text {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .habit-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .history-dots-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .history-dot-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .history-dot {
          width: 9px;
          height: 9px;
          border-radius: 3px;
          background: var(--border-color);
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .history-dot.active {
          background: #10b981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
        }
        .history-dot.today-dot {
          outline: 1.5px solid var(--accent);
          outline-offset: 1px;
        }

        .habit-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .action-icon-btn.edit:hover {
          background: var(--bg-sidebar-hover);
          color: var(--accent);
        }
        .action-icon-btn.delete:hover {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }

        /* Modal Styles */
        .custom-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .custom-modal-box {
          width: 100%;
          max-width: 480px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
          animation: modalAppear 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes modalAppear {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .modal-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .modal-close {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.2rem;
          cursor: pointer;
        }

        .form-group {
          margin-bottom: 16px;
        }
        .form-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
        .form-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-primary);
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .form-input:focus {
          border-color: var(--accent);
        }

        .toggle-segment {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding: 4px;
          background: var(--surface-low);
          border-radius: 10px;
          border: 1px solid var(--border-color);
        }
        .segment-btn {
          padding: 8px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-secondary);
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .segment-btn.active {
          background: var(--surface);
          color: var(--accent);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .days-picker {
          display: flex;
          gap: 6px;
          justify-content: space-between;
        }
        .day-chip {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          font-weight: 800;
          font-size: 0.85rem;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .day-chip.selected {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
          box-shadow: 0 2px 8px var(--accent-glow);
        }

        .form-error-box {
          padding: 10px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          font-size: 0.82rem;
          font-weight: 600;
          margin-bottom: 14px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
        }
        .btn-cancel {
          padding: 9px 16px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          font-weight: 700;
          cursor: pointer;
        }
        .btn-submit {
          padding: 9px 20px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px var(--accent-glow);
        }
        .btn-danger {
          padding: 9px 20px;
          border-radius: 10px;
          border: none;
          background: #ef4444;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }

        .empty-habits {
          text-align: center;
          padding: 48px 24px;
          border-radius: 18px;
          background: var(--surface);
          border: 1px dashed var(--border-color);
        }
        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
        }

        @media (max-width: 768px) {
          .habit-card {
            flex-direction: column;
            align-items: stretch;
          }
          .habit-right {
            justify-content: space-between;
            padding-top: 10px;
            border-top: 1px solid var(--border-color);
          }
        }
      `}</style>
    </div>
  );
}
