"use client";

import { useState, useMemo } from 'react';
import { useProductivity } from '@/context/ProductivityContext';
import { useHabits } from '@/hooks/useHabits';
import Modal from '@/components/Common/Modal';
import EmptyState from '@/components/ui/EmptyState';
import RoadmapVisualizer from '@/components/goals/RoadmapVisualizer';

export default function Goals() {
  const { goals, addGoal, deleteGoal, addGoalMilestone, toggleGoalMilestone, deleteGoalMilestone, projects = [] } = useProductivity();
  const { habits = [] } = useHabits();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Yearly');
  const [newMilestoneText, setNewMilestoneText] = useState({});
  const [activeTabMap, setActiveTabMap] = useState({});
  
  // Switcher State
  const [mainView, setMainView] = useState('list'); // 'list' | 'roadmap'
  const [generalRoadmapFilter, setGeneralRoadmapFilter] = useState('all'); // 'all' | 'projects' | 'habits'

  // Combine and sort projects and habits addiction milestones for the General Roadmap
  const generalMilestones = useMemo(() => {
    let combined = [];
    if (generalRoadmapFilter === 'all' || generalRoadmapFilter === 'projects') {
      combined.push(...(projects || []).map(p => ({
        id: p.id,
        text: p.name || 'Unnamed Project',
        state: (p.is_completed || p.isCompleted) ? 'completed' : 'active',
        type: 'project',
        createdAt: new Date(p.created_at || Date.now()).getTime()
      })));
    }
    if (generalRoadmapFilter === 'all' || generalRoadmapFilter === 'habits') {
      const STAGES = [
        { name: 'Spark', days: 7, icon: '🔥' },
        { name: 'Routine', days: 21, icon: '⚡' },
        { name: 'Identity', days: 66, icon: '👑' },
        { name: 'Mastery', days: 100, icon: '🏆' }
      ];

      (habits || []).forEach(h => {
        const streak = h.currentStreak || 0;
        STAGES.forEach((st, sIdx) => {
          const isDone = streak >= st.days;
          const prevDays = sIdx > 0 ? STAGES[sIdx - 1].days : 0;
          const isActive = streak >= prevDays && streak < st.days;
          combined.push({
            id: `habit-${h.id}-${st.days}`,
            text: `${st.icon} ${h.title}: ${st.name} (${streak}/${st.days}d)`,
            state: isDone ? 'completed' : isActive ? 'active' : 'locked',
            type: 'habit',
            createdAt: (new Date(h.created_at || Date.now()).getTime()) + (st.days * 86400000)
          });
        });
      });
    }
    // Sort by oldest first
    combined.sort((a, b) => a.createdAt - b.createdAt);
    
    // Limit to prevent huge SVG breaking
    const limit = combined.slice(-35);
    
    return limit.map((m, idx) => ({ ...m, step: idx + 1 }));
  }, [projects, habits, generalRoadmapFilter]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!title || saving) return;
    setSaveError('');
    setSaving(true);
    try {
      await addGoal({ title, type });
      setTitle('');
      setType('Yearly');
      setIsModalOpen(false);
    } catch (err) {
      setSaveError(err?.message || 'Could not save this goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMilestone = (goalId) => {
    const text = newMilestoneText[goalId];
    if (!text) return;
    addGoalMilestone(goalId, text);
    setNewMilestoneText(prev => ({ ...prev, [goalId]: '' }));
  };

  return (
    <div className="module-container fade-in">
      <div className="hero-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="hero-greeting">Personal Goals</h2>
          <p className="hero-subtitle">Define and track your overarching objectives.</p>
        </div>
        
        {/* Main View Switcher */}
        <div className="segmented-control">
          <button 
            className={`seg-btn ${mainView === 'list' ? 'active' : ''}`}
            onClick={() => setMainView('list')}
          >
            Goals List
          </button>
          <button 
            className={`seg-btn ${mainView === 'roadmap' ? 'active' : ''}`}
            onClick={() => setMainView('roadmap')}
          >
            General Roadmap
          </button>
        </div>
        
        {mainView === 'list' && (
          <button className="create-goal-btn" onClick={() => setIsModalOpen(true)}>
             + Create Goal
          </button>
        )}
      </div>

      <div className="goals-list-container">
        {mainView === 'roadmap' ? (
          <div className="general-roadmap-container">
            <div className="roadmap-filter-switcher">
              <div className="segmented-control small">
                <button 
                  className={`seg-btn ${generalRoadmapFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setGeneralRoadmapFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`seg-btn ${generalRoadmapFilter === 'projects' ? 'active' : ''}`}
                  onClick={() => setGeneralRoadmapFilter('projects')}
                >
                  Projects
                </button>
                <button 
                  className={`seg-btn ${generalRoadmapFilter === 'habits' ? 'active' : ''}`}
                  onClick={() => setGeneralRoadmapFilter('habits')}
                >
                  Habits Mastery
                </button>
              </div>
            </div>
            
            <div className="roadmap-section-wrapper standalone">
              {generalMilestones.length > 0 ? (
                <RoadmapVisualizer 
                  milestones={generalMilestones} 
                  goalTitle="General Progress Roadmap" 
                  goalColor="#3b82f6" 
                />
              ) : (
                <EmptyState icon="🛣️" title="No items to map" text="Create some projects or habits to see them on the roadmap." />
              )}
            </div>
          </div>
        ) : (
          <div className="goals-grid">
            {goals.length === 0 ? (
              <EmptyState
              icon="🎯"
              title="No goals yet"
              text="Set a goal, break it into milestones, and track completion as you go."
              actionLabel="Create goal"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            goals.map(g => {
              const totalMilestones = g.milestones?.length || 0;
              const completedMilestones = (g.milestones || []).filter(m => m.completed).length;
              const activeTab = activeTabMap[g.id] || 'milestones';

              return (
              <div key={g.id} className="goal-card">
                <div className="goal-header">
                  <div className="goal-title-group">
                    <span className={`goal-badge ${(g.type || 'yearly').toLowerCase()}`}>{g.type || 'Yearly'}</span>
                    <h4 className="goal-title">{g.title}</h4>
                  </div>
                  <button onClick={() => deleteGoal(g.id)} className="btn-delete" title="Delete goal">✕</button>
                </div>
                
                <div className="goal-progress-section">
                  <div className="progress-labels">
                    <span className="progress-subtext">
                      <strong>{completedMilestones}</strong> of {totalMilestones} steps completed
                    </span>
                    <span className="progress-pill-badge">{g.completionRate}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${g.completionRate}%` }}></div>
                  </div>
                  
                  {/* Goal Card Tabs Switcher */}
                  <div className="goal-segmented-tabs">
                    <button 
                      className={`goal-tab-pill ${activeTab === 'milestones' ? 'active' : ''}`}
                      onClick={() => setActiveTabMap(prev => ({ ...prev, [g.id]: 'milestones' }))}
                    >
                      <span className="tab-pill-icon">📋</span>
                      <span>Milestones</span>
                      <span className="tab-pill-count">{completedMilestones}/{totalMilestones}</span>
                    </button>
                    <button 
                      className={`goal-tab-pill ${activeTab === 'roadmap' ? 'active' : ''}`}
                      onClick={() => setActiveTabMap(prev => ({ ...prev, [g.id]: 'roadmap' }))}
                    >
                      <span className="tab-pill-icon">🗺️</span>
                      <span>Roadmap Visualizer</span>
                    </button>
                  </div>

                  {activeTab === 'milestones' ? (
                    <div className="milestones-section">
                      <ul className="milestone-list">
                        {totalMilestones === 0 ? (
                          <div className="empty-milestones-prompt">
                            <span>No milestone steps added yet. Add your first step below!</span>
                          </div>
                        ) : (
                          g.milestones?.map((m, idx) => (
                            <li key={m.id} className={`milestone-item ${m.completed ? 'completed' : ''}`}>
                              <button
                                type="button"
                                className={`custom-milestone-checkbox ${m.completed ? 'checked' : ''}`}
                                onClick={() => toggleGoalMilestone(g.id, m.id)}
                                aria-label={m.completed ? "Mark step incomplete" : "Mark step complete"}
                              >
                                {m.completed ? (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <span className="checkbox-inner-circle" />
                                )}
                              </button>
                              <span className="step-num-badge">{String(idx + 1).padStart(2, '0')}</span>
                              <span className="milestone-text">{m.text}</span>
                              <button onClick={() => deleteGoalMilestone(g.id, m.id)} className="btn-remove-milestone" title="Delete step">✕</button>
                            </li>
                          ))
                        )}
                      </ul>
                      
                      <div className="add-milestone-form">
                        <div className="add-input-wrapper">
                          <span className="add-input-icon">+</span>
                          <input 
                            type="text" 
                            value={newMilestoneText[g.id] || ''}
                            onChange={e => setNewMilestoneText(prev => ({ ...prev, [g.id]: e.target.value }))}
                            placeholder="Add next milestone step..."
                            className="add-milestone-input"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone(g.id)}
                          />
                        </div>
                        <button onClick={() => handleAddMilestone(g.id)} className="btn-add-milestone">
                          Add Step
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="roadmap-section-wrapper">
                      <RoadmapVisualizer 
                        milestones={g.milestones || []} 
                        goalTitle={g.title} 
                        goalColor={g.type === 'Weekly' ? '#10b981' : g.type === 'Monthly' ? '#00e5ff' : '#8b5cf6'} 
                      />
                    </div>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
        )}
      </div>

      {/* CREATE GOAL MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="modal-header">
          <h3>Create New Goal</h3>
          <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
        </div>
        
        <form onSubmit={handleCreateGoal} className="goals-form">
          <div className="form-group">
            <label>Goal Description</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Master React and Next.js"
              className="glowing-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Goal Type (Strict Selection)</label>
            <select value={type} onChange={e => setType(e.target.value)} className="glowing-input">
              <option value="Yearly">Yearly</option>
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>

          {saveError && <p className="form-error">{saveError}</p>}
          <button type="submit" className="btn-submit goals-gradient" disabled={saving}>{saving ? 'Saving…' : 'Set New Goal'}</button>
        </form>
      </Modal>

      <style jsx>{`
        .segmented-control { display: flex; background: var(--surface-low); border-radius: 12px; padding: 4px; gap: 4px; border: 1px solid var(--border-color); }
        .segmented-control.small { border-radius: 8px; padding: 3px; }
        .seg-btn { flex: 1; padding: 8px 16px; border: none; background: transparent; color: var(--text-secondary); font-size: 0.9rem; font-weight: 600; border-radius: 8px; cursor: pointer; transition: 0.2s; }
        .segmented-control.small .seg-btn { padding: 6px 12px; font-size: 0.8rem; border-radius: 6px; }
        .seg-btn.active { background: var(--surface); color: var(--text-primary); box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .seg-btn:hover:not(.active) { color: var(--text-primary); }

        .create-goal-btn {
          background: linear-gradient(135deg, var(--accent-start), #0284c7);
          color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700;
          font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3); transition: transform 0.2s, box-shadow 0.2s;
        }
        .create-goal-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 229, 255, 0.5); }

        /* Modal uses global .modal-overlay / .modal-content from globals.css */
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-header h3 { margin: 0; color: var(--text-primary); }
        .close-btn { background: transparent; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; transition: 0.2s; }
        .close-btn:hover { color: var(--accent-danger); }

        .goals-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-size: 0.9rem;
          color: var(--text-primary);
          font-weight: 700;
        }
        .glowing-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-primary);
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.3s ease;
          color-scheme: dark;
        }
        .glowing-input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
        }
        .form-error { margin: 10px 0 0; padding: 10px 14px; border-radius: 10px; background: rgba(244,63,94,0.12); border: 1px solid rgba(244,63,94,0.35); color: #fda4af; font-size: 0.85rem; line-height: 1.45; }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-submit {
          padding: 14px;
          border-radius: 8px;
          border: none;
          color: white;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 10px;
        }
        .goals-gradient {
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }
        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
        }

        .goals-list-container {
          margin-top: 24px;
        }
        .goals-list-container h3 {
          margin-bottom: 20px;
          color: var(--text-primary);
        }
        
        .goals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 20px;
        }
        
        .goal-card {
          background: var(--surface);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid var(--border-color);
          transition: 0.3s;
        }
        .goal-card:hover {
          border-color: #8b5cf6;
          box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .goal-badge {
          font-size: 0.7rem;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 8px;
          display: inline-block;
        }
        .goal-badge.yearly { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
        .goal-badge.monthly { background: rgba(0, 229, 255, 0.2); color: #67e8f9; }
        .goal-badge.weekly { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
        
        .goal-title-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .goal-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.01em;
        }
        .btn-delete {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.1rem;
          padding: 4px;
          border-radius: 6px;
          transition: 0.2s;
        }
        .btn-delete:hover {
          color: var(--accent-danger);
          background: rgba(239, 68, 68, 0.1);
        }
        
        .goal-progress-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
        }
        .progress-labels {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
        }
        .progress-subtext {
          color: var(--text-secondary);
          font-size: 0.8rem;
        }
        .progress-subtext strong {
          color: var(--text-primary);
          font-weight: 700;
        }
        .progress-pill-badge {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 12px;
          background: rgba(139, 92, 246, 0.15);
          color: #a78bfa;
        }
        
        .progress-bar-bg {
          width: 100%;
          height: 8px;
          background: var(--surface-low);
          border-radius: 999px;
          overflow: hidden;
          position: relative;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6, #00e5ff);
          border-radius: 999px;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Segmented Pill Tabs for Goal Card */
        .goal-segmented-tabs {
          display: flex;
          gap: 6px;
          margin-top: 14px;
          background: var(--surface-low);
          padding: 4px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
        }
        .goal-tab-pill {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          padding: 7px 10px;
          border-radius: 7px;
          transition: 0.2s;
        }
        .goal-tab-pill:hover {
          color: var(--text-primary);
        }
        .goal-tab-pill.active {
          background: var(--surface);
          color: #8b5cf6;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }
        .tab-pill-icon {
          font-size: 0.85rem;
        }
        .tab-pill-count {
          font-size: 0.72rem;
          background: rgba(139, 92, 246, 0.15);
          color: #a78bfa;
          padding: 1px 6px;
          border-radius: 10px;
          font-weight: 700;
        }

        .roadmap-section-wrapper {
          margin-top: 14px;
        }
        .milestones-section {
          margin-top: 14px;
        }
        .milestone-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 14px;
        }
        .empty-milestones-prompt {
          padding: 16px;
          text-align: center;
          font-size: 0.82rem;
          color: var(--text-muted);
          border: 1px dashed var(--border-color);
          border-radius: 8px;
        }
        
        /* Modern Milestone Item */
        .milestone-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.88rem;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          padding: 8px 12px;
          border-radius: 10px;
          transition: 0.2s;
        }
        .milestone-item:hover {
          border-color: rgba(139, 92, 246, 0.35);
          transform: translateX(2px);
        }
        .milestone-item.completed {
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.2);
        }
        .milestone-item.completed .milestone-text {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        /* Custom Checkbox */
        .custom-milestone-checkbox {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid var(--border-color);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .custom-milestone-checkbox:hover {
          border-color: #8b5cf6;
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.3);
          transform: scale(1.08);
        }
        .custom-milestone-checkbox.checked {
          background: linear-gradient(135deg, #10b981, #059669);
          border-color: #10b981;
          color: white;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
        }
        .checkbox-inner-circle {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: transparent;
          transition: 0.2s;
        }
        .custom-milestone-checkbox:hover .checkbox-inner-circle {
          background: #8b5cf6;
        }

        /* Step Badge */
        .step-num-badge {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--text-muted);
          background: var(--surface);
          padding: 2px 6px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          font-family: monospace;
          letter-spacing: 0.5px;
        }

        .milestone-text {
          flex: 1;
          color: var(--text-primary);
          font-weight: 500;
          line-height: 1.35;
          word-break: break-word;
        }
        .btn-remove-milestone {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.8rem;
          padding: 4px;
          border-radius: 4px;
          opacity: 0.4;
          transition: 0.2s;
        }
        .milestone-item:hover .btn-remove-milestone {
          opacity: 1;
        }
        .btn-remove-milestone:hover { 
          color: var(--accent-danger); 
          background: rgba(239, 68, 68, 0.1);
        }

        /* Add Milestone Form */
        .add-milestone-form {
          display: flex;
          gap: 8px;
        }
        .add-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0 10px;
          transition: 0.2s;
        }
        .add-input-wrapper:focus-within {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.15);
        }
        .add-input-icon {
          color: var(--text-muted);
          font-weight: bold;
          font-size: 1rem;
          margin-right: 6px;
        }
        .add-milestone-input {
          width: 100%;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.85rem;
          padding: 8px 0;
          outline: none;
        }
        .add-milestone-input::placeholder {
          color: var(--text-muted);
          font-size: 0.82rem;
        }
        .btn-add-milestone {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 0 14px;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.82rem;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.25);
          transition: 0.2s;
        }
        .btn-add-milestone:hover { 
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

