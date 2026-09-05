"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useProductivity } from '@/context/ProductivityContext';

export default function Planner() {
  const { tasks } = useProductivity(); // Add habits here if a habits context exists
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(); // 0 = Sun
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
    const monday = new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday;
  });

  const [plannerItems, setPlannerItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newItemText, setNewItemText] = useState({});

  useEffect(() => {
    fetchPlannerItems();
  }, [currentWeekStart]);

  const fetchPlannerItems = async () => {
    setLoading(true);
    try {
      const weekOf = currentWeekStart.toISOString().split('T')[0];
      const res = await fetch(`/api/planner?weekOf=${weekOf}`);
      const data = await res.json();
      if (data.plannerItems) setPlannerItems(data.plannerItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    monday.setHours(0,0,0,0);
    setCurrentWeekStart(monday);
  };

  const handleAddNote = async (dateStr) => {
    const text = newItemText[dateStr];
    if (!text?.trim()) return;

    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, type: 'note', content: text })
      });
      const data = await res.json();
      if (!data.error) {
        setPlannerItems(prev => [...prev, data]);
        setNewItemText(prev => ({ ...prev, [dateStr]: '' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await fetch(`/api/planner/${id}`, { method: 'DELETE' });
      setPlannerItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and Drop for Tasks (mock implementation for UI)
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e, dateStr) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    // In a real app, we'd update the task's due date in ProductivityContext
    // updateTask(taskId, { due_date: dateStr })
    console.log(`Move task ${taskId} to ${dateStr}`);
    alert('Task rescheduling via drag and drop requires context integration update. Due date would change to: ' + dateStr);
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="module-container fade-in">
      <div className="hero-section planner-hero">
        <div>
          <h2 className="hero-greeting">Weekly Planner</h2>
          <p className="hero-subtitle">Plan your week, allocate tasks, and set daily focuses.</p>
        </div>
        <div className="week-nav">
          <button onClick={navPrevWeek} className="nav-btn">← Prev</button>
          <button onClick={navThisWeek} className="nav-btn current">This Week</button>
          <button onClick={navNextWeek} className="nav-btn">Next →</button>
        </div>
      </div>

      <div className="week-header-info">
        Week of {currentWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </div>

      <div className="planner-grid">
        {days.map((day, idx) => {
          const dateStr = day.toISOString().split('T')[0];
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          
          const dayItems = plannerItems.filter(item => item.date === dateStr);
          const dayNotes = dayItems.filter(i => i.type === 'note');
          const dayFocus = dayItems.find(i => i.type === 'focus');

          // Tasks due this day
          const dayTasks = tasks.filter(t => {
            const tDate = t.due_date ? t.due_date.split('T')[0] : (t.dueDate ? t.dueDate.split('T')[0] : null);
            return tDate === dateStr;
          });

          return (
            <div 
              key={dateStr} 
              className={`day-column ${isToday ? 'is-today' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, dateStr)}
            >
              <div className="day-header">
                <span className="day-name">{dayNames[idx]}</span>
                <span className="day-date">{day.getDate()}</span>
              </div>

              <div className="focus-block">
                {dayFocus ? (
                  <div className="focus-item">
                    <span className="focus-label">FOCUS:</span> {dayFocus.content}
                  </div>
                ) : (
                  <div className="focus-placeholder">+ Set Focus</div>
                )}
              </div>

              <div className="content-blocks">
                {dayTasks.length > 0 && (
                  <div className="tasks-block">
                    <h4 className="block-title">Tasks</h4>
                    {dayTasks.map(t => (
                      <div 
                        key={t.id} 
                        className={`planner-task ${t.status === 'Completed' ? 'completed' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                      >
                        <span className="task-dot" /> {t.title || t.text}
                      </div>
                    ))}
                  </div>
                )}

                <div className="notes-block">
                  <h4 className="block-title">Notes</h4>
                  {dayNotes.map(note => (
                    <div key={note.id} className="planner-note">
                      {note.content}
                      <button className="del-note" onClick={() => handleDeleteNote(note.id)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="add-note-footer">
                <input 
                  type="text" 
                  value={newItemText[dateStr] || ''}
                  onChange={e => setNewItemText({ ...newItemText, [dateStr]: e.target.value })}
                  placeholder="Add note..." 
                  className="note-input"
                  onKeyDown={e => e.key === 'Enter' && handleAddNote(dateStr)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .planner-hero { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .week-nav { display: flex; gap: 8px; }
        .nav-btn { background: var(--surface-low); border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.85rem; transition: 0.2s; }
        .nav-btn:hover { background: var(--surface); border-color: #0ea5e9; }
        .nav-btn.current { background: rgba(14,165,233,0.1); color: #0ea5e9; border-color: rgba(14,165,233,0.3); }

        .week-header-info { text-align: center; font-size: 1.1rem; font-weight: bold; color: var(--text-primary); margin-bottom: 20px; }

        .planner-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; overflow-x: auto; padding-bottom: 12px; }
        @media (max-width: 1100px) { .planner-grid { grid-template-columns: repeat(7, minmax(200px, 1fr)); } }

        .day-column { background: var(--surface); border: 1px solid var(--border-color); border-radius: 12px; display: flex; flex-direction: column; min-height: 500px; transition: 0.2s; }
        .day-column:hover { border-color: rgba(14,165,233,0.4); }
        .day-column.is-today { border-color: #0ea5e9; box-shadow: 0 0 10px rgba(14,165,233,0.15); }
        
        .day-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border-color); }
        .day-name { font-weight: bold; font-size: 0.9rem; color: var(--text-secondary); text-transform: uppercase; }
        .day-date { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); }
        .is-today .day-date { color: #0ea5e9; }

        .focus-block { padding: 12px; background: rgba(14,165,233,0.05); border-bottom: 1px solid var(--border-color); }
        .focus-item { font-size: 0.85rem; color: var(--text-primary); font-weight: 600; line-height: 1.4; }
        .focus-label { color: #0ea5e9; font-weight: 800; font-size: 0.75rem; margin-right: 4px; }
        .focus-placeholder { font-size: 0.8rem; color: var(--text-muted); cursor: pointer; text-align: center; border: 1px dashed var(--border-color); border-radius: 6px; padding: 6px; transition: 0.2s; }
        .focus-placeholder:hover { color: #0ea5e9; border-color: #0ea5e9; }

        .content-blocks { padding: 12px; flex: 1; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
        .block-title { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0; }
        
        .tasks-block { display: flex; flex-direction: column; gap: 6px; }
        .planner-task { font-size: 0.8rem; padding: 8px; background: var(--surface-low); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); display: flex; align-items: center; gap: 6px; cursor: grab; }
        .planner-task:active { cursor: grabbing; }
        .planner-task.completed { opacity: 0.6; text-decoration: line-through; }
        .task-dot { width: 8px; height: 8px; border-radius: 50%; background: #0ea5e9; }
        .planner-task.completed .task-dot { background: #10b981; }

        .notes-block { display: flex; flex-direction: column; gap: 6px; }
        .planner-note { font-size: 0.85rem; padding: 8px; background: rgba(252,211,77,0.1); border-left: 3px solid #fcd34d; border-radius: 4px; color: var(--text-primary); position: relative; line-height: 1.4; }
        .del-note { position: absolute; top: 4px; right: 4px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.7rem; opacity: 0; transition: 0.2s; }
        .planner-note:hover .del-note { opacity: 1; }
        .del-note:hover { color: #f43f5e; }

        .add-note-footer { padding: 12px; border-top: 1px solid var(--border-color); background: var(--surface-low); border-radius: 0 0 12px 12px; }
        .note-input { width: 100%; background: transparent; border: none; color: var(--text-primary); font-size: 0.85rem; outline: none; }
        .note-input::placeholder { color: var(--text-muted); }

        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
