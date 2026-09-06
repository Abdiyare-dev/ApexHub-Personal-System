"use client";

import { useState, useMemo } from 'react';
import { useProductivity } from '@/context/ProductivityContext';
import Modal from '@/components/Common/Modal';
import EmptyState from '@/components/ui/EmptyState';
import RoadmapVisualizer from '@/components/goals/RoadmapVisualizer';

// Helper to determine if a task is for today
const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth() === now.getMonth() &&
         d.getDate() === now.getDate();
};

// Helper to determine if a task is for this week
const isThisWeek = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
};

// TaskCard component
const TaskCard = ({ task, goals, toggleTaskStatus, updateTask, deleteTask }) => {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title || '',
    description: task.description || '',
    dueDate: task.dueDate || '',
    period: task.period || 'None'
  });

  const isCompleted = task.status === 'Completed';
  const linkedGoal = goals.find(g => g.id === task.goalId);
  const isDaily = task.period === 'Daily' || isToday(task.dueDate);
  const isWeekly = task.period === 'Weekly' || task.period === 'Weekly Planner' || isThisWeek(task.dueDate);
  
  const formatDateTime = (dateStr) => {
    if (!dateStr) return { datePart: '', timePart: '', hasTime: false };
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const hasTime = dateStr.includes('T') && dateStr.length > 11;
    const timePart = hasTime ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    return { datePart, timePart, hasTime };
  };

  const { datePart, timePart, hasTime } = formatDateTime(task.dueDate);

  const handleSave = () => {
    updateTask(task.id, {
      title: editData.title,
      description: editData.description,
      dueDate: editData.dueDate,
      period: editData.period
    });
    setEditMode(false);
  };

  return (
    <>
      <div className={`ms-task-card ${isCompleted ? 'completed' : ''}`}>
        <div className="ms-task-header" onClick={() => setExpanded(!expanded)}>
          <div className="ms-left-cont">
            <div 
              className={`ms-circle-check ${isCompleted ? 'checked' : ''}`} 
              onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
            >
              {isCompleted && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              )}
            </div>
            
            <div className="ms-task-info">
              <span className="ms-task-title" style={{ textDecoration: isCompleted ? 'line-through' : 'none' }}>
                {task.title}
              </span>
              <div className="ms-task-meta">
                {/* Scope Badges */}
                {isDaily ? (
                  <span className="scope-badge daily">☀️ Daily Task</span>
                ) : isWeekly ? (
                  <span className="scope-badge weekly">📅 Weekly Planner</span>
                ) : (
                  <span className="scope-badge standard">📋 General</span>
                )}

                {task.dueDate && (
                  <span className="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {datePart}
                  </span>
                )}
                {task.period !== 'None' && (
                  <span className="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.34 15.57a10 10 0 1 0 4.3-11.53L2 6"></path></svg>
                    {task.period}
                  </span>
                )}
                {task.reminder && (
                  <span className="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    {hasTime ? timePart : 'Reminder'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="ms-right-cont" onClick={e => e.stopPropagation()}>
            <button 
              className="ms-icon-btn delete-quick" 
              title="Delete task"
              onClick={() => deleteTask(task.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>

        {expanded && (
          <div className="ms-task-details fade-in">
            {editMode ? (
              <div className="ms-edit-body">
                <input 
                  value={editData.title} 
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="ms-input"
                  placeholder="Task Title"
                />
                <textarea 
                  value={editData.description} 
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  className="ms-input textarea"
                  rows="2"
                  placeholder="Add a step or description..."
                />
                <div className="edit-row">
                  <input 
                    type="datetime-local" 
                    value={editData.dueDate} 
                    onChange={(e) => setEditData({...editData, dueDate: e.target.value})}
                    className="ms-input"
                  />
                  <select 
                    value={editData.period} 
                    onChange={(e) => setEditData({...editData, period: e.target.value})}
                    className="ms-input"
                  >
                    <option value="None">Standard</option>
                    <option value="Daily">Daily Task</option>
                    <option value="Weekly">Weekly Planner</option>
                  </select>
                </div>
                <div className="ms-action-row">
                  <button onClick={handleSave} className="ms-btn primary">Save Changes</button>
                  <button onClick={() => setEditMode(false)} className="ms-btn secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="ms-view-body">
                {task.description && (
                  <div className="ms-detail-row">
                    <span className="desc-text">{task.description}</span>
                  </div>
                )}
                {linkedGoal && (
                  <div className="ms-detail-row">
                    <span className="goal-badge">🎯 Linked to: {linkedGoal.title}</span>
                  </div>
                )}
                <div className="ms-action-row split">
                  <button onClick={() => setEditMode(true)} className="ms-text-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Edit Task
                  </button>
                  <button onClick={() => deleteTask(task.id)} className="ms-text-btn danger">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Delete Task
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .ms-task-card {
          border-bottom: 1px solid var(--border-color);
          background: var(--surface);
          transition: background 0.2s;
        }
        .ms-task-card:last-child { border-bottom: none; }
        .ms-task-card:hover { background: var(--surface-low); }
        .ms-task-card.completed .ms-task-title { color: var(--text-muted); }
        
        .ms-task-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 20px; cursor: pointer;
        }
        .ms-left-cont { display: flex; align-items: center; gap: 16px; flex: 1; }
        
        .ms-circle-check {
          width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--text-muted);
          display: flex; justify-content: center; align-items: center; cursor: pointer;
          transition: 0.2s; background: transparent; color: white;
          flex-shrink: 0;
        }
        .ms-circle-check:hover { border-color: var(--accent-start); transform: scale(1.05); }
        .ms-circle-check.checked { background: var(--accent-start); border-color: var(--accent-start); }

        .ms-task-info { display: flex; flex-direction: column; gap: 6px; }
        .ms-task-title { font-size: 0.95rem; font-weight: 500; color: var(--text-primary); }
        
        /* Task Meta & Badges */
        .ms-task-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.75rem; color: var(--text-secondary); align-items: center; }
        .meta-item { display: flex; align-items: center; gap: 4px; color: var(--text-muted); }
        
        .scope-badge {
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .scope-badge.daily {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .scope-badge.weekly {
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .scope-badge.standard {
          background: rgba(148, 163, 184, 0.1);
          color: var(--text-muted);
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .ms-icon-btn {
          background: transparent; border: none; color: var(--text-muted); cursor: pointer; transition: 0.2s;
          padding: 6px; border-radius: 6px;
        }
        .ms-icon-btn.delete-quick:hover { color: var(--accent-danger); background: rgba(244, 63, 94, 0.1); }

        /* Expanded Details Area */
        .ms-task-details {
          background: rgba(0,0,0,0.1); border-top: 1px dashed var(--border-color);
          padding: 16px 20px 16px 58px;
          font-size: 0.85rem;
        }
        .ms-view-body { display: flex; flex-direction: column; gap: 12px; }
        .ms-detail-row { display: flex; align-items: center; gap: 10px; color: var(--text-secondary); }
        .desc-text { line-height: 1.5; color: var(--text-secondary); }
        .goal-badge { background: rgba(0,229,255,0.1); color: var(--accent-start); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
        
        .ms-action-row.split { display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 4px; }
        .ms-text-btn { display: flex; align-items: center; gap: 6px; background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: 0.2s; }
        .ms-text-btn:hover { color: var(--accent-start); }
        .ms-text-btn.danger:hover { color: var(--accent-danger); }

        .ms-edit-body { display: flex; flex-direction: column; gap: 10px; }
        .edit-row { display: flex; gap: 10px; }
        .ms-input {
          width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color);
          background: var(--surface); color: var(--text-primary); font-size: 0.85rem; transition: 0.3s;
        }
        .ms-input.textarea { resize: vertical; }
        .ms-input:focus { outline: none; border-color: var(--accent-start); }
        .ms-action-row { display: flex; gap: 10px; margin-top: 6px; }
        .ms-btn { padding: 6px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; font-size: 0.85rem; transition: 0.2s; }
        .ms-btn.primary { background: var(--accent-start); color: #fff; }
        .ms-btn.secondary { background: var(--surface-high); color: var(--text-primary); border: 1px solid var(--border-color); }
        .ms-btn.primary:hover { filter: brightness(1.1); }

        .fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default function Tasks() {
  const { tasks = [], goals = [], addTask, updateTaskStatus, updateTask, deleteTask } = useProductivity();

  // Switchers State
  const [mainView, setMainView] = useState('list'); // 'list' | 'roadmap'
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'daily' | 'weekly'

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminder, setReminder] = useState(false);
  const [period, setPeriod] = useState('None'); // 'None' | 'Daily' | 'Weekly'
  const [goalId, setGoalId] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title || saving) return;
    setSaveError('');
    setSaving(true);
    try {
      await addTask({
        title,
        description,
        dueDate,
        reminder,
        period,
        goalId: goalId === '' ? null : goalId,
        status: 'Incomplete'
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setReminder(false);
      setPeriod('None');
      setGoalId('');
      setIsModalOpen(false);
    } catch (err) {
      setSaveError(err?.message || 'Could not save this task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTaskStatus = (task) => {
    const newStatus = task.status === 'Completed' ? 'Incomplete' : 'Completed';
    updateTaskStatus(task.id, newStatus);
  };

  // Filter tasks based on the scope switcher
  const filteredTasks = useMemo(() => {
    if (scopeFilter === 'daily') {
      return tasks.filter(t => t.period === 'Daily' || isToday(t.dueDate));
    }
    if (scopeFilter === 'weekly') {
      return tasks.filter(t => t.period === 'Weekly' || t.period === 'Weekly Planner' || isThisWeek(t.dueDate));
    }
    return tasks;
  }, [tasks, scopeFilter]);

  const incompleteTasks = filteredTasks.filter(t => t.status !== 'Completed');
  const completedTasks = filteredTasks.filter(t => t.status === 'Completed');

  // Counts for Switcher Badges
  const dailyCount = useMemo(() => tasks.filter(t => t.period === 'Daily' || isToday(t.dueDate)).length, [tasks]);
  const weeklyCount = useMemo(() => tasks.filter(t => t.period === 'Weekly' || t.period === 'Weekly Planner' || isThisWeek(t.dueDate)).length, [tasks]);

  // Tasks Roadmap Milestones
  const taskMilestones = useMemo(() => {
    return filteredTasks.map((t, idx) => ({
      id: t.id,
      text: t.title,
      state: t.status === 'Completed' ? 'completed' : 'active',
      step: idx + 1,
      type: 'task'
    }));
  }, [filteredTasks]);

  return (
    <div className="module-container fade-in">
      {/* Header & Main Switcher */}
      <div className="hero-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="hero-greeting">Task Management</h2>
          <p className="hero-subtitle">Organize and execute your actionable items seamlessly.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Main View Switcher (List vs Roadmap) */}
          <div className="segmented-control">
            <button 
              className={`seg-btn ${mainView === 'list' ? 'active' : ''}`}
              onClick={() => setMainView('list')}
            >
              Task Lists
            </button>
            <button 
              className={`seg-btn ${mainView === 'roadmap' ? 'active' : ''}`}
              onClick={() => setMainView('roadmap')}
            >
              Execution Roadmap
            </button>
          </div>

          <button className="create-task-btn" onClick={() => setIsModalOpen(true)}>
            + Create Task
          </button>
        </div>
      </div>

      {/* Scope Switcher Filter Bar */}
      <div className="scope-switcher-bar">
        <div className="scope-pills">
          <button 
            className={`scope-pill ${scopeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setScopeFilter('all')}
          >
            📋 All Tasks ({tasks.length})
          </button>
          <button 
            className={`scope-pill ${scopeFilter === 'daily' ? 'active' : ''}`}
            onClick={() => setScopeFilter('daily')}
          >
            ☀️ Daily Tasks ({dailyCount})
          </button>
          <button 
            className={`scope-pill ${scopeFilter === 'weekly' ? 'active' : ''}`}
            onClick={() => setScopeFilter('weekly')}
          >
            📅 Weekly Planner ({weeklyCount})
          </button>
        </div>
      </div>

      {/* Main View Body */}
      {mainView === 'roadmap' ? (
        <div className="task-roadmap-container">
          <div className="roadmap-wrapper-card">
            {taskMilestones.length > 0 ? (
              <RoadmapVisualizer 
                milestones={taskMilestones}
                goalTitle={scopeFilter === 'daily' ? '☀️ Daily Execution Flow' : scopeFilter === 'weekly' ? '📅 Weekly Planner Flow' : '📋 All Tasks Execution Roadmap'}
                goalColor="#06b6d4"
              />
            ) : (
              <EmptyState 
                icon="🛣️" 
                title="No tasks in this view" 
                text="Create tasks or change the filter above to view your execution path." 
                actionLabel="Create Task"
                onAction={() => setIsModalOpen(true)}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="full-layout">
          {/* List Areas */}
          <div className="lists-wrapper">
            <div className="ms-list-container">
              <h3 className="ms-list-title" style={{color: 'var(--accent-start)'}}>
                To-Do ({incompleteTasks.length})
              </h3>
              <div className="ms-list">
                {incompleteTasks.length === 0 ? (
                  <p className="empty-message">You're all caught up for this view!</p>
                ) : (
                  incompleteTasks.map(t => <TaskCard 
                    key={t.id} task={t} goals={goals} 
                    toggleTaskStatus={toggleTaskStatus} 
                    updateTask={updateTask} 
                    deleteTask={deleteTask} 
                  />)
                )}
              </div>
            </div>

            <div className="ms-list-container">
              <h3 className="ms-list-title" style={{color: 'var(--accent-success)'}}>
                Completed ({completedTasks.length})
              </h3>
              <div className="ms-list">
                {completedTasks.length === 0 ? (
                  <p className="empty-message">No completed tasks yet in this view.</p>
                ) : (
                  completedTasks.map(t => <TaskCard 
                    key={t.id} task={t} goals={goals} 
                    toggleTaskStatus={toggleTaskStatus} 
                    updateTask={updateTask} 
                    deleteTask={deleteTask} 
                  />)
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="modal-header">
          <h3>Create New Task</h3>
          <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
        </div>
        <form onSubmit={handleCreateTask} className="productivity-form">
          <div className="form-group">
            <label>Task Name</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Design Homepage Wireframes"
              className="glowing-input"
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Optional details or sub-steps..."
              className="glowing-input textarea"
              rows="2"
            />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Due Date & Time</label>
              <input 
                type="datetime-local" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)} 
                className="glowing-input"
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Task Scope / Frequency</label>
              <select value={period} onChange={e => setPeriod(e.target.value)} className="glowing-input">
                <option value="None">Standard Task</option>
                <option value="Daily">☀️ Daily Task</option>
                <option value="Weekly">📅 Weekly Planner Task</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Link to Goal (Optional)</label>
            <select value={goalId} onChange={e => setGoalId(e.target.value)} className="glowing-input">
              <option value="">-- No Goal --</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>
          <div className="form-checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={reminder} 
                onChange={e => setReminder(e.target.checked)} 
              />
              Set Reminder Alert
            </label>
          </div>
          {saveError && <p className="form-error">{saveError}</p>}
          <button type="submit" className="btn-submit primary-gradient" style={{marginTop: '10px'}} disabled={saving}>
            {saving ? 'Saving…' : 'Add Task'}
          </button>
        </form>
      </Modal>

      <style jsx>{`
        .scope-switcher-bar {
          margin: 18px 0 24px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .scope-pills {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .scope-pill {
          padding: 8px 16px;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .scope-pill:hover {
          color: var(--text-primary);
          border-color: rgba(0, 229, 255, 0.4);
          transform: translateY(-1px);
        }
        .scope-pill.active {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(59, 130, 246, 0.2));
          color: var(--accent-start);
          border-color: var(--accent-start);
          box-shadow: 0 0 12px rgba(0, 229, 255, 0.2);
        }

        .task-roadmap-container {
          margin-top: 8px;
        }
        .roadmap-wrapper-card {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .full-layout {
          margin-top: 8px;
        }
        .create-task-btn {
          background: linear-gradient(135deg, var(--accent-start), #0284c7);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .create-task-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 229, 255, 0.5);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-header h3 {
          margin: 0;
          color: var(--text-primary);
        }
        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.2rem;
          cursor: pointer;
          transition: 0.2s;
        }
        .close-btn:hover { color: var(--accent-danger); }

        .productivity-form { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-row { display: flex; gap: 16px; }
        .form-group label { font-size: 0.8rem; color: var(--text-primary); font-weight: 700; }
        .form-checkbox label { font-size: 0.85rem; color: var(--text-primary); cursor: pointer; display: flex; gap: 8px; align-items: center; }
        .form-checkbox input { accent-color: var(--accent-start); width: 16px; height: 16px; }
        .glowing-input {
          width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color);
          background: var(--surface-low); color: var(--text-primary); font-size: 0.9rem; transition: 0.3s; color-scheme: dark;
        }
        .glowing-input:focus { border-color: var(--accent-start); box-shadow: 0 0 10px rgba(0,229,255,0.15); outline: none; }
        .textarea { resize: vertical; }
        .form-error {
          margin: 10px 0 0;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.35);
          color: #fda4af;
          font-size: 0.85rem;
          line-height: 1.45;
        }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-submit {
          padding: 12px; border-radius: 8px; border: none; color: white; font-weight: 600; cursor: pointer;
          background: linear-gradient(135deg, var(--accent-start), #0284c7); transition: 0.2s;
        }
        .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,229,255,0.3); filter: brightness(1.1); }

        /* Modern MS To-Do Style Lists */
        .lists-wrapper { display: flex; flex-direction: column; gap: 24px; max-width: 900px; margin: 0 auto; }
        .ms-list-container {
          background: var(--surface); border-radius: 12px;
          border: 1px solid var(--border-color); overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .ms-list-title {
          font-size: 1rem; font-weight: 700; padding: 16px 20px;
          border-bottom: 1px solid var(--border-color); background: var(--surface-low); color: var(--text-primary);
          margin: 0;
        }
        .ms-list { display: flex; flex-direction: column; }
        .empty-message { padding: 20px; color: var(--text-muted); text-align: center; margin: 0; font-size: 0.9rem; }

        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
