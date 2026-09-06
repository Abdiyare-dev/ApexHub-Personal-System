"use client";

import { useState, useMemo } from 'react';
import { useProductivity } from '@/context/ProductivityContext';
import Modal from '@/components/Common/Modal';
import EmptyState from '@/components/ui/EmptyState';
import RoadmapVisualizer from '@/components/goals/RoadmapVisualizer';

export default function Goals() {
  const { goals = [], addGoal, deleteGoal, addGoalMilestone, toggleGoalMilestone, deleteGoalMilestone } = useProductivity();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Yearly');
  const [newMilestoneText, setNewMilestoneText] = useState({});
  const [activeTabMap, setActiveTabMap] = useState({});
  
  // Switcher State
  const [mainView, setMainView] = useState('list'); // 'list' | 'roadmap'
  const [selectedGoalId, setSelectedGoalId] = useState('all');

  // Compute Goals Roadmap Milestones (dedicated to Goals & their Milestones)
  const goalRoadmapMilestones = useMemo(() => {
    if (selectedGoalId === 'all') {
      let combined = [];
      goals.forEach(g => {
        const milestones = g.milestones || [];
        const allDone = milestones.length > 0 && milestones.every(m => m.completed);
        const isGoalDone = g.completionRate === 100 || allDone;

        if (milestones.length === 0) {
          combined.push({
            id: `goal-${g.id}`,
            text: `🎯 ${g.title}`,
            state: isGoalDone ? 'completed' : 'active',
            type: 'goal'
          });
        } else {
          milestones.forEach(m => {
            combined.push({
              id: m.id,
              text: m.text || m.title || 'Step',
              state: m.completed ? 'completed' : 'locked',
              type: 'milestone'
            });
          });
          // Append terminal milestone for the goal
          combined.push({
            id: `goal-${g.id}-achieved`,
            text: `🏆 ${g.title} (Achieved)`,
            state: isGoalDone ? 'completed' : allDone ? 'active' : 'locked',
            type: 'goal-completed'
          });
        }
      });
      return combined.map((m, idx) => ({ ...m, step: idx + 1 }));
    }

    const currentGoal = goals.find(g => g.id === selectedGoalId);
    if (!currentGoal) return [];

    const milestones = currentGoal.milestones || [];
    const allDone = milestones.length > 0 && milestones.every(m => m.completed);
    const isGoalDone = currentGoal.completionRate === 100 || allDone;

    if (milestones.length === 0) {
      return [
        { id: `${currentGoal.id}-start`, text: `🎯 ${currentGoal.title} (Started)`, state: 'completed', step: 1 },
        { id: `${currentGoal.id}-finish`, text: `🏆 Goal Objective Reached`, state: isGoalDone ? 'completed' : 'active', step: 2 }
      ];
    }

    const steps = milestones.map((m, idx) => ({
      id: m.id,
      text: m.text || m.title || `Milestone ${idx + 1}`,
      state: m.completed ? 'completed' : 'locked',
      step: idx + 1,
      type: 'milestone'
    }));

    // Terminal Milestone Checkpoint
    steps.push({
      id: `${currentGoal.id}-achieved`,
      text: `🏆 ${currentGoal.title} (Achieved)`,
      state: isGoalDone ? 'completed' : allDone ? 'active' : 'locked',
      step: steps.length + 1,
      type: 'goal-completed'
    });

    return steps;
  }, [goals, selectedGoalId]);

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

  const activeGoal = goals.find(g => g.id === selectedGoalId);

  return (
    <div className="module-container fade-in">
      <div className="hero-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="hero-greeting">Personal Goals</h2>
          <p className="hero-subtitle">Define, plan, and conquer your overarching objectives.</p>
        </div>
        
        {/* Main View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="segmented-control">
            <button 
              className={`seg-btn ${mainView === 'list' ? 'active' : ''}`}
              onClick={() => setMainView('list')}
            >
              🎯 Goals List
            </button>
            <button 
              className={`seg-btn ${mainView === 'roadmap' ? 'active' : ''}`}
              onClick={() => setMainView('roadmap')}
            >
              🛣️ Goals Roadmap
            </button>
          </div>
          
          <button className="create-goal-btn" onClick={() => setIsModalOpen(true)}>
             + Create Goal
          </button>
        </div>
      </div>

      <div className="goals-list-container">
        {mainView === 'roadmap' ? (
          <div className="general-roadmap-container">
            {/* Goal Selector Filter */}
            <div className="goal-selector-bar">
              <span className="selector-label">🎯 View Roadmap For:</span>
              <div className="goal-filter-pills">
                <button 
                  className={`filter-pill ${selectedGoalId === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedGoalId('all')}
                >
                  All Goals ({goals.length})
                </button>
                {goals.map(g => (
                  <button 
                    key={`pill-${g.id}`}
                    className={`filter-pill ${selectedGoalId === g.id ? 'active' : ''}`}
                    onClick={() => setSelectedGoalId(g.id)}
                  >
                    {g.title}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="roadmap-section-wrapper standalone">
              {goalRoadmapMilestones.length > 0 ? (
                <RoadmapVisualizer 
                  milestones={goalRoadmapMilestones} 
                  goalTitle={selectedGoalId === 'all' ? 'All Goals Execution Roadmap' : `${activeGoal?.title || 'Goal'} Roadmap`} 
                  goalColor="#8b5cf6" 
                />
              ) : (
                <EmptyState 
                  icon="🎯" 
                  title="No goal milestones to map" 
                  text="Create a goal with milestone steps to visualize its roadmap path." 
                  actionLabel="Create Goal"
                  onAction={() => setIsModalOpen(true)}
                />
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
                  </div>

                  {/* Goal Milestones Section */}
                  <div className="milestones-container">
                    <div className="milestones-header">
                      <span className="milestones-title">MILESTONES & STEPS</span>
                      <span className="milestones-count">{completedMilestones}/{totalMilestones}</span>
                    </div>

                    <div className="milestones-list">
                      {(g.milestones || []).map(m => (
                        <div key={m.id} className={`milestone-item ${m.completed ? 'completed' : ''}`}>
                          <div 
                            className={`m-check-circle ${m.completed ? 'checked' : ''}`}
                            onClick={() => toggleGoalMilestone(g.id, m.id)}
                          >
                            {m.completed && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            )}
                          </div>
                          <span className="m-text">{m.text || m.title}</span>
                          <button onClick={() => deleteGoalMilestone(g.id, m.id)} className="btn-del-milestone">✕</button>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleAddMilestone(g.id); }} className="add-milestone-form">
                      <input 
                        type="text" 
                        placeholder="+ Add milestone step & press Enter..." 
                        value={newMilestoneText[g.id] || ''}
                        onChange={e => setNewMilestoneText(prev => ({ ...prev, [g.id]: e.target.value }))}
                        className="milestone-input"
                      />
                      <button type="submit" className="btn-add-milestone">+</button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
          </div>
        )}
      </div>

      {/* Goal Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="modal-header">
          <h3>Create New Goal</h3>
          <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
        </div>
        <form onSubmit={handleCreateGoal} className="productivity-form">
          <div className="form-group">
            <label>Goal Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Master Cloud Architecture"
              className="glowing-input"
              required
            />
          </div>
          <div className="form-group">
            <label>Goal Horizon / Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="glowing-input">
              <option value="Quarterly">Quarterly Goal</option>
              <option value="Yearly">Yearly Goal</option>
              <option value="Long-Term">Long-Term Vision</option>
            </select>
          </div>
          {saveError && <p className="form-error">{saveError}</p>}
          <button type="submit" className="btn-submit primary-gradient" style={{marginTop: '10px'}} disabled={saving}>
            {saving ? 'Saving…' : 'Create Goal'}
          </button>
        </form>
      </Modal>

      <style jsx>{`
        .segmented-control {
          display: inline-flex;
          background: var(--surface-low);
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
          border: 1px solid var(--border-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .segmented-control.small {
          border-radius: 8px;
          padding: 3px;
          gap: 3px;
        }
        .seg-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .seg-btn:hover { color: var(--text-primary); }
        .seg-btn.active {
          background: var(--surface);
          color: var(--accent-start);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 229, 255, 0.3);
        }

        .create-goal-btn {
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
        .create-goal-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 229, 255, 0.5);
        }

        .goal-selector-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 12px 16px;
          background: var(--surface);
          border-radius: 12px;
          border: 1px solid var(--border-color);
          margin-bottom: 16px;
        }
        .selector-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .goal-filter-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-pill {
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-pill:hover {
          color: var(--text-primary);
          border-color: rgba(139, 92, 246, 0.4);
        }
        .filter-pill.active {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2));
          color: #a78bfa;
          border-color: #8b5cf6;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.25);
        }

        .goals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 24px;
          margin-top: 20px;
        }
        .goal-card {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .goal-card:hover {
          transform: translateY(-2px);
          border-color: rgba(139, 92, 246, 0.35);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
        }

        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .goal-title-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .goal-badge {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 3px 8px;
          border-radius: 6px;
          width: fit-content;
        }
        .goal-badge.quarterly { background: rgba(0, 229, 255, 0.15); color: var(--accent-start); }
        .goal-badge.yearly { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
        .goal-badge.long-term { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }

        .goal-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.4;
        }

        .btn-delete {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1rem;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: 0.2s;
        }
        .btn-delete:hover { color: var(--accent-danger); }

        .goal-progress-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
        }
        .progress-subtext { color: var(--text-muted); }
        .progress-pill-badge { font-weight: 700; color: var(--accent-start); }
        .progress-bar-bg {
          height: 8px;
          background: var(--surface-low);
          border-radius: 9999px;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6, #00e5ff);
          border-radius: 9999px;
          transition: width 0.4s ease;
        }

        /* Milestones Section */
        .milestones-container {
          border-top: 1px dashed var(--border-color);
          padding-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .milestones-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .milestones-title {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }
        .milestones-count {
          font-size: 0.75rem;
          font-weight: 700;
          color: #a78bfa;
        }
        .milestones-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 180px;
          overflow-y: auto;
        }
        .milestone-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          font-size: 0.85rem;
        }
        .milestone-item.completed .m-text {
          text-decoration: line-through;
          color: var(--text-muted);
        }
        .m-check-circle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: 0.2s;
        }
        .m-check-circle:hover { border-color: #8b5cf6; }
        .m-check-circle.checked { background: #8b5cf6; border-color: #8b5cf6; color: #fff; }
        .m-text { flex: 1; color: var(--text-primary); line-height: 1.4; }
        .btn-del-milestone {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.8rem;
          padding: 2px 4px;
        }
        .btn-del-milestone:hover { color: var(--accent-danger); }

        .add-milestone-form {
          display: flex;
          gap: 6px;
          margin-top: 4px;
        }
        .milestone-input {
          flex: 1;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-primary);
          font-size: 0.8rem;
        }
        .milestone-input:focus { outline: none; border-color: #8b5cf6; }
        .btn-add-milestone {
          padding: 8px 14px;
          border-radius: 8px;
          border: none;
          background: rgba(139, 92, 246, 0.2);
          color: #a78bfa;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-add-milestone:hover { background: #8b5cf6; color: #fff; }

        .roadmap-section-wrapper {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
        }

        /* Modal Styles */
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-header h3 { margin: 0; color: var(--text-primary); }
        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.2rem;
          cursor: pointer;
        }
        .close-btn:hover { color: var(--accent-danger); }

        .productivity-form { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 0.8rem; color: var(--text-primary); font-weight: 700; }
        .glowing-input {
          width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color);
          background: var(--surface-low); color: var(--text-primary); font-size: 0.9rem; transition: 0.3s;
        }
        .glowing-input:focus { border-color: #8b5cf6; box-shadow: 0 0 10px rgba(139,92,246,0.2); outline: none; }
        .form-error {
          margin: 10px 0 0; padding: 10px 14px; border-radius: 10px; background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.35); color: #fda4af; font-size: 0.85rem;
        }
        .btn-submit {
          padding: 12px; border-radius: 8px; border: none; color: white; font-weight: 600; cursor: pointer;
          background: linear-gradient(135deg, #8b5cf6, #00e5ff); transition: 0.2s;
        }
        .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(139,92,246,0.3); }

        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
