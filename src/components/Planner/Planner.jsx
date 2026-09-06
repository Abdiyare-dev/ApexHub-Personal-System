"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useProductivity } from '@/context/ProductivityContext';

export default function Planner() {
  const { tasks = [], updateTask, updateTaskStatus, addTask } = useProductivity() || {};
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(); // 0 = Sun
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [plannerItems, setPlannerItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newItemText, setNewItemText] = useState({});
  const [newTaskInput, setNewTaskInput] = useState({});
  const [activeInputType, setActiveInputType] = useState({}); // { [dateStr]: 'note' | 'task' | null }
  
  // Focus Modal / Inline Editing
  const [focusEditingDate, setFocusEditingDate] = useState(null);
  const [focusInputText, setFocusInputText] = useState('');
  
  // Mobile day tab view
  const [selectedMobileDayIndex, setSelectedMobileDayIndex] = useState(0);

  // Unscheduled Tray toggle
  const [showUnscheduledTray, setShowUnscheduledTray] = useState(true);

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const weekOf = useMemo(() => {
    return currentWeekStart.toISOString().split('T')[0];
  }, [currentWeekStart]);

  useEffect(() => {
    fetchPlannerItems();
  }, [weekOf]);

  const getLocalPlannerKey = (week) => `apexhub_planner_items_${week}`;

  const fetchPlannerItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/planner?weekOf=${weekOf}`);
      if (res.ok) {
        const data = await res.json();
        if (data.plannerItems) {
          setPlannerItems(data.plannerItems);
          return;
        }
      }
      // Fallback to localStorage
      const cached = localStorage.getItem(getLocalPlannerKey(weekOf));
      if (cached) {
        setPlannerItems(JSON.parse(cached));
      } else {
        setPlannerItems([]);
      }
    } catch (err) {
      console.warn('Using offline planner cache:', err);
      const cached = localStorage.getItem(getLocalPlannerKey(weekOf));
      if (cached) {
        setPlannerItems(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveLocalPlannerFallback = (updatedItems) => {
    setPlannerItems(updatedItems);
    try {
      localStorage.setItem(getLocalPlannerKey(weekOf), JSON.stringify(updatedItems));
    } catch (e) {
      console.error(e);
    }
  };

  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [currentWeekStart]);

  const navPrevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const navNextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const navThisWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  // Add Note
  const handleAddNote = async (dateStr) => {
    const text = newItemText[dateStr];
    if (!text?.trim()) return;

    const newItem = {
      id: `note-${Date.now()}`,
      date: dateStr,
      type: 'note',
      content: text.trim(),
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, type: 'note', content: text.trim() })
      });
      if (res.ok) {
        const saved = await res.json();
        setPlannerItems(prev => [...prev, saved]);
      } else {
        saveLocalPlannerFallback([...plannerItems, newItem]);
      }
    } catch (err) {
      saveLocalPlannerFallback([...plannerItems, newItem]);
    }
    setNewItemText(prev => ({ ...prev, [dateStr]: '' }));
    setActiveInputType(prev => ({ ...prev, [dateStr]: null }));
  };

  // Add Quick Task for specific date
  const handleAddQuickTask = async (dateStr) => {
    const text = newTaskInput[dateStr];
    if (!text?.trim() || !addTask) return;

    try {
      await addTask({
        title: text.trim(),
        dueDate: dateStr,
        priority: 'Medium',
        status: 'Incomplete'
      });
      setNewTaskInput(prev => ({ ...prev, [dateStr]: '' }));
      setActiveInputType(prev => ({ ...prev, [dateStr]: null }));
    } catch (err) {
      console.error('Failed to add quick task:', err);
    }
  };

  // Delete Note
  const handleDeleteNote = async (id) => {
    try {
      await fetch(`/api/planner/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Delete note offline fallback');
    }
    const updated = plannerItems.filter(item => item.id !== id);
    saveLocalPlannerFallback(updated);
  };

  // Set / Edit Daily Focus
  const handleSaveFocus = async (dateStr) => {
    if (!focusInputText.trim()) {
      // If empty, remove focus
      const existing = plannerItems.find(i => i.date === dateStr && i.type === 'focus');
      if (existing) {
        handleDeleteNote(existing.id);
      }
      setFocusEditingDate(null);
      setFocusInputText('');
      return;
    }

    const focusItem = {
      id: `focus-${Date.now()}`,
      date: dateStr,
      type: 'focus',
      content: focusInputText.trim(),
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, type: 'focus', content: focusInputText.trim() })
      });
      if (res.ok) {
        const saved = await res.json();
        setPlannerItems(prev => [...prev.filter(i => !(i.date === dateStr && i.type === 'focus')), saved]);
      } else {
        const filtered = plannerItems.filter(i => !(i.date === dateStr && i.type === 'focus'));
        saveLocalPlannerFallback([...filtered, focusItem]);
      }
    } catch (err) {
      const filtered = plannerItems.filter(i => !(i.date === dateStr && i.type === 'focus'));
      saveLocalPlannerFallback([...filtered, focusItem]);
    }

    setFocusEditingDate(null);
    setFocusInputText('');
  };

  // Drag and Drop for Task Rescheduling
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (e, dateStr) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId || !updateTask) return;

    try {
      await updateTask(taskId, { dueDate: dateStr });
    } catch (err) {
      console.error('Failed to reschedule task:', err);
    }
  };

  // Unscheduled tasks (tasks with no dueDate, or overdue tasks)
  const unscheduledTasks = useMemo(() => {
    return safeTasks.filter(t => t.status !== 'Completed' && (!t.dueDate && !t.due_date));
  }, [safeTasks]);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="module-container fade-in">
      {/* Header & Week Switcher */}
      <div className="hero-section planner-hero">
        <div>
          <h2 className="hero-greeting">Weekly Planner</h2>
          <p className="hero-subtitle">Plan your priorities, schedule tasks day-by-day, and set focus targets.</p>
        </div>
        <div className="week-controls">
          <div className="week-nav">
            <button onClick={navPrevWeek} className="nav-btn" title="Previous Week">← Prev</button>
            <button onClick={navThisWeek} className="nav-btn current" title="Jump to Current Week">This Week</button>
            <button onClick={navNextWeek} className="nav-btn" title="Next Week">Next →</button>
          </div>
          <button 
            className={`tray-toggle-btn ${showUnscheduledTray ? 'active' : ''}`}
            onClick={() => setShowUnscheduledTray(!showUnscheduledTray)}
            title="Toggle Unscheduled Task Tray"
          >
            📋 Backlog ({unscheduledTasks.length})
          </button>
        </div>
      </div>

      <div className="week-banner">
        <span className="week-badge">Active Week</span>
        <h3 className="week-header-info">
          {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </h3>
      </div>

      {/* Unscheduled / Backlog Tasks Tray */}
      {showUnscheduledTray && (
        <div className="backlog-tray">
          <div className="backlog-header">
            <div className="backlog-title">
              <span className="backlog-icon">📥</span>
              <strong>Unscheduled Tasks Backlog</strong>
              <span className="backlog-count">{unscheduledTasks.length} pending</span>
            </div>
            <p className="backlog-hint">Drag any task below directly into a day column to schedule it.</p>
          </div>
          <div className="backlog-list">
            {unscheduledTasks.length === 0 ? (
              <div className="backlog-empty">🎉 All tasks are scheduled! Great job planning ahead.</div>
            ) : (
              unscheduledTasks.map(t => (
                <div 
                  key={t.id} 
                  className="backlog-task-chip"
                  draggable
                  onDragStart={(e) => handleDragStart(e, t.id)}
                >
                  <span className="drag-handle">⠿</span>
                  <span className="task-title-text">{t.title || t.text}</span>
                  {t.priority && <span className={`priority-tag ${t.priority.toLowerCase()}`}>{t.priority}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mobile Day Switcher Tabs */}
      <div className="mobile-day-tabs">
        {days.map((day, idx) => {
          const dStr = day.toISOString().split('T')[0];
          const isToday = dStr === todayStr;
          const isSelected = selectedMobileDayIndex === idx;
          return (
            <button
              key={`mob-${dStr}`}
              className={`mob-tab-btn ${isSelected ? 'active' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={() => setSelectedMobileDayIndex(idx)}
            >
              <span className="mob-day-letter">{dayNames[idx].slice(0, 3)}</span>
              <span className="mob-day-num">{day.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Main Planner Grid */}
      <div className="planner-grid">
        {days.map((day, idx) => {
          const dateStr = day.toISOString().split('T')[0];
          const isToday = dateStr === todayStr;
          const isMobileActive = selectedMobileDayIndex === idx;
          
          const dayItems = plannerItems.filter(item => item.date === dateStr);
          const dayNotes = dayItems.filter(i => i.type === 'note');
          const dayFocus = dayItems.find(i => i.type === 'focus');

          // Tasks due this day
          const dayTasks = safeTasks.filter(t => {
            const rawDue = t.dueDate || t.due_date;
            if (!rawDue) return false;
            const tDate = typeof rawDue === 'string' ? rawDue.split('T')[0] : '';
            return tDate === dateStr;
          });

          return (
            <div 
              key={dateStr} 
              className={`day-column ${isToday ? 'is-today' : ''} ${isMobileActive ? 'mob-visible' : 'mob-hidden'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, dateStr)}
            >
              {/* Day Header */}
              <div className="day-header">
                <div>
                  <span className="day-name">{dayNames[idx]}</span>
                  {isToday && <span className="today-badge">Today</span>}
                </div>
                <span className="day-date">{day.getDate()}</span>
              </div>

              {/* Focus of the Day */}
              <div className="focus-block">
                {focusEditingDate === dateStr ? (
                  <div className="focus-edit-form">
                    <input
                      type="text"
                      className="focus-input"
                      placeholder="e.g. Finish Sprint Report"
                      value={focusInputText}
                      onChange={(e) => setFocusInputText(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveFocus(dateStr);
                        if (e.key === 'Escape') setFocusEditingDate(null);
                      }}
                    />
                    <div className="focus-edit-actions">
                      <button className="focus-save-btn" onClick={() => handleSaveFocus(dateStr)}>Save</button>
                      <button className="focus-cancel-btn" onClick={() => setFocusEditingDate(null)}>Cancel</button>
                    </div>
                  </div>
                ) : dayFocus ? (
                  <div 
                    className="focus-item" 
                    onClick={() => {
                      setFocusEditingDate(dateStr);
                      setFocusInputText(dayFocus.content || '');
                    }}
                    title="Click to edit focus"
                  >
                    <span className="focus-label">🎯 FOCUS:</span>
                    <span className="focus-text">{dayFocus.content}</span>
                  </div>
                ) : (
                  <div 
                    className="focus-placeholder"
                    onClick={() => {
                      setFocusEditingDate(dateStr);
                      setFocusInputText('');
                    }}
                  >
                    + Set Main Focus
                  </div>
                )}
              </div>

              {/* Content Blocks */}
              <div className="content-blocks">
                {/* Tasks Section */}
                <div className="tasks-block">
                  <div className="block-header">
                    <h4 className="block-title">Tasks ({dayTasks.length})</h4>
                    <button 
                      className="quick-add-btn" 
                      onClick={() => setActiveInputType(prev => ({ ...prev, [dateStr]: prev[dateStr] === 'task' ? null : 'task' }))}
                      title="Add task to this day"
                    >
                      + Task
                    </button>
                  </div>

                  {activeInputType[dateStr] === 'task' && (
                    <div className="inline-add-row">
                      <input 
                        type="text" 
                        placeholder="Task name & press Enter..." 
                        className="inline-input"
                        value={newTaskInput[dateStr] || ''}
                        onChange={(e) => setNewTaskInput({ ...newTaskInput, [dateStr]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddQuickTask(dateStr)}
                        autoFocus
                      />
                      <button className="btn-confirm-add" onClick={() => handleAddQuickTask(dateStr)}>✓</button>
                    </div>
                  )}

                  {dayTasks.length === 0 && activeInputType[dateStr] !== 'task' ? (
                    <div className="tasks-empty-drop-zone">
                      <span>Drag tasks here or click + Task</span>
                    </div>
                  ) : (
                    dayTasks.map(t => (
                      <div 
                        key={t.id} 
                        className={`planner-task ${t.status === 'Completed' ? 'completed' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                      >
                        <input
                          type="checkbox"
                          className="task-checkbox"
                          checked={t.status === 'Completed'}
                          onChange={() => updateTaskStatus && updateTaskStatus(t.id, t.status === 'Completed' ? 'Incomplete' : 'Completed')}
                        />
                        <span className="task-title">{t.title || t.text}</span>
                        {t.priority && (
                          <span className={`task-prio-dot ${t.priority.toLowerCase()}`} title={`Priority: ${t.priority}`} />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Notes Section */}
                <div className="notes-block">
                  <div className="block-header">
                    <h4 className="block-title">Notes & Reminders</h4>
                    <button 
                      className="quick-add-btn" 
                      onClick={() => setActiveInputType(prev => ({ ...prev, [dateStr]: prev[dateStr] === 'note' ? null : 'note' }))}
                      title="Add note to this day"
                    >
                      + Note
                    </button>
                  </div>

                  {activeInputType[dateStr] === 'note' && (
                    <div className="inline-add-row">
                      <input 
                        type="text" 
                        placeholder="Note & press Enter..." 
                        className="inline-input note-variant"
                        value={newItemText[dateStr] || ''}
                        onChange={(e) => setNewItemText({ ...newItemText, [dateStr]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote(dateStr)}
                        autoFocus
                      />
                      <button className="btn-confirm-add note-btn" onClick={() => handleAddNote(dateStr)}>✓</button>
                    </div>
                  )}

                  {dayNotes.map(note => (
                    <div key={note.id} className="planner-note">
                      <span className="note-text">{note.content}</span>
                      <button className="del-note" onClick={() => handleDeleteNote(note.id)} title="Delete note">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Quick Action */}
              <div className="column-footer">
                <input 
                  type="text" 
                  value={newItemText[dateStr] || ''}
                  onChange={e => setNewItemText({ ...newItemText, [dateStr]: e.target.value })}
                  placeholder="Quick note (Enter)..." 
                  className="footer-note-input"
                  onKeyDown={e => e.key === 'Enter' && handleAddNote(dateStr)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .planner-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }
        .week-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .week-nav {
          display: flex;
          gap: 6px;
          background: var(--surface-low);
          padding: 4px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
        }
        .nav-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          transition: 0.2s;
        }
        .nav-btn:hover {
          background: var(--surface);
          color: var(--text-primary);
        }
        .nav-btn.current {
          background: rgba(14, 165, 233, 0.15);
          color: #0ea5e9;
          font-weight: 700;
        }
        .tray-toggle-btn {
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: 0.2s;
        }
        .tray-toggle-btn:hover, .tray-toggle-btn.active {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
          color: #a78bfa;
        }

        .week-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .week-badge {
          background: rgba(14, 165, 233, 0.15);
          color: #0ea5e9;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 20px;
          letter-spacing: 0.5px;
        }
        .week-header-info {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        /* Backlog Tray */
        .backlog-tray {
          background: var(--surface);
          border: 1px dashed rgba(139, 92, 246, 0.4);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .backlog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        .backlog-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-primary);
          font-size: 0.95rem;
        }
        .backlog-count {
          background: rgba(139, 92, 246, 0.15);
          color: #a78bfa;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .backlog-hint {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0;
        }
        .backlog-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .backlog-empty {
          color: var(--text-muted);
          font-size: 0.85rem;
          font-style: italic;
        }
        .backlog-task-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          color: var(--text-primary);
          cursor: grab;
          transition: 0.2s;
        }
        .backlog-task-chip:hover {
          border-color: #8b5cf6;
          transform: translateY(-1px);
        }
        .drag-handle {
          color: var(--text-muted);
          font-size: 1rem;
        }
        .priority-tag {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .priority-tag.high { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .priority-tag.medium { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .priority-tag.low { background: rgba(16, 185, 129, 0.15); color: #10b981; }

        /* Mobile Day Tabs */
        .mobile-day-tabs {
          display: none;
          gap: 6px;
          overflow-x: auto;
          margin-bottom: 16px;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .mob-tab-btn {
          flex: 1;
          min-width: 44px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 4px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .mob-tab-btn.active {
          background: #0ea5e9;
          color: white;
          border-color: #0ea5e9;
        }
        .mob-tab-btn.is-today {
          border-color: #0ea5e9;
        }
        .mob-day-letter { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .mob-day-num { font-size: 1rem; font-weight: 800; }

        /* Grid */
        .planner-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px;
        }

        .day-column {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          min-height: 540px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .day-column.drag-over {
          border-color: #0ea5e9;
          background: rgba(14, 165, 233, 0.05);
        }
        .day-column.is-today {
          border-color: #0ea5e9;
          box-shadow: 0 0 14px rgba(14, 165, 233, 0.15);
        }
        
        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-color);
        }
        .day-name {
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        .today-badge {
          margin-left: 6px;
          font-size: 0.65rem;
          font-weight: 800;
          background: #0ea5e9;
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
        }
        .day-date {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .is-today .day-date { color: #0ea5e9; }

        /* Focus Block */
        .focus-block {
          padding: 10px 12px;
          background: rgba(14, 165, 233, 0.06);
          border-bottom: 1px solid var(--border-color);
        }
        .focus-item {
          font-size: 0.82rem;
          color: var(--text-primary);
          font-weight: 600;
          line-height: 1.35;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .focus-label {
          color: #0ea5e9;
          font-weight: 800;
          font-size: 0.72rem;
          letter-spacing: 0.5px;
        }
        .focus-text {
          word-break: break-word;
        }
        .focus-placeholder {
          font-size: 0.78rem;
          color: var(--text-muted);
          cursor: pointer;
          text-align: center;
          border: 1px dashed var(--border-color);
          border-radius: 6px;
          padding: 6px;
          transition: 0.2s;
        }
        .focus-placeholder:hover {
          color: #0ea5e9;
          border-color: #0ea5e9;
        }
        .focus-edit-form {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .focus-input {
          width: 100%;
          background: var(--bg-card);
          border: 1px solid #0ea5e9;
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 0.8rem;
          padding: 6px 8px;
          outline: none;
        }
        .focus-edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
        }
        .focus-save-btn {
          background: #0ea5e9;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }
        .focus-cancel-btn {
          background: transparent;
          color: var(--text-muted);
          border: none;
          padding: 3px 6px;
          font-size: 0.75rem;
          cursor: pointer;
        }

        /* Content Blocks */
        .content-blocks {
          padding: 12px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
        }
        .block-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .block-title {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
          font-weight: 700;
        }
        .quick-add-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
        }
        .quick-add-btn:hover {
          color: #0ea5e9;
          background: rgba(14, 165, 233, 0.1);
        }

        .inline-add-row {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
        }
        .inline-input {
          flex: 1;
          background: var(--bg-card);
          border: 1px solid #0ea5e9;
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 0.8rem;
          padding: 6px 8px;
          outline: none;
        }
        .inline-input.note-variant {
          border-color: #f59e0b;
        }
        .btn-confirm-add {
          background: #0ea5e9;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0 10px;
          font-weight: bold;
          cursor: pointer;
        }
        .btn-confirm-add.note-btn {
          background: #f59e0b;
        }

        .tasks-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tasks-empty-drop-zone {
          padding: 12px 8px;
          border: 1px dashed var(--border-color);
          border-radius: 8px;
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .planner-task {
          font-size: 0.8rem;
          padding: 8px 10px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: grab;
          transition: 0.15s;
        }
        .planner-task:hover {
          border-color: rgba(14, 165, 233, 0.4);
          transform: translateY(-1px);
        }
        .planner-task.completed {
          opacity: 0.6;
        }
        .planner-task.completed .task-title {
          text-decoration: line-through;
          color: var(--text-muted);
        }
        .task-checkbox {
          cursor: pointer;
          accent-color: #10b981;
        }
        .task-title {
          flex: 1;
          word-break: break-word;
        }
        .task-prio-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .task-prio-dot.high { background: #ef4444; }
        .task-prio-dot.medium { background: #f59e0b; }
        .task-prio-dot.low { background: #10b981; }

        .notes-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .planner-note {
          font-size: 0.82rem;
          padding: 8px 10px;
          background: rgba(245, 158, 11, 0.08);
          border-left: 3px solid #f59e0b;
          border-radius: 6px;
          color: var(--text-primary);
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 6px;
          line-height: 1.35;
        }
        .note-text {
          flex: 1;
          word-break: break-word;
        }
        .del-note {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.75rem;
          padding: 0;
          line-height: 1;
          opacity: 0.6;
          transition: 0.15s;
        }
        .del-note:hover {
          color: #ef4444;
          opacity: 1;
        }

        .column-footer {
          padding: 10px 12px;
          border-top: 1px solid var(--border-color);
          background: var(--surface-low);
          border-radius: 0 0 14px 14px;
        }
        .footer-note-input {
          width: 100%;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.8rem;
          outline: none;
        }
        .footer-note-input::placeholder {
          color: var(--text-muted);
          font-size: 0.78rem;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1100px) {
          .planner-grid {
            grid-template-columns: repeat(7, minmax(200px, 1fr));
            overflow-x: auto;
            padding-bottom: 12px;
          }
        }

        @media (max-width: 768px) {
          .mobile-day-tabs {
            display: flex;
          }
          .planner-grid {
            grid-template-columns: 1fr;
            overflow-x: visible;
          }
          .day-column.mob-hidden {
            display: none;
          }
          .day-column.mob-visible {
            display: flex;
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
}
