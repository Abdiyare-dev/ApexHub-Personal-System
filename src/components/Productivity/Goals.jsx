"use client";

import { useState } from 'react';
import { useProductivity } from '@/context/ProductivityContext';
import Modal from '@/components/Common/Modal';
import EmptyState from '@/components/ui/EmptyState';

export default function Goals() {
  const { goals, addGoal, deleteGoal, addGoalMilestone, toggleGoalMilestone, deleteGoalMilestone } = useProductivity();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Yearly');
  const [newMilestoneText, setNewMilestoneText] = useState({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateGoal = (e) => {
    e.preventDefault();
    if (!title) return;
    addGoal({ title, type });
    setTitle('');
    setType('Yearly');
    setIsModalOpen(false); // Close Modal on success
  };

  const handleAddMilestone = (goalId) => {
    const text = newMilestoneText[goalId];
    if (!text) return;
    addGoalMilestone(goalId, text);
    setNewMilestoneText(prev => ({ ...prev, [goalId]: '' }));
  };

  return (
    <div className="module-container fade-in">
      <div className="hero-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="hero-greeting">Personal Goals</h2>
          <p className="hero-subtitle">Define and track your overarching objectives.</p>
        </div>
        <button className="create-goal-btn" onClick={() => setIsModalOpen(true)}>
           + Create Goal
        </button>
      </div>

      <div className="goals-list-container">
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
            goals.map(g => (
              <div key={g.id} className="goal-card">
                <div className="goal-header">
                  <div>
                    <span className={`goal-badge ${g.type.toLowerCase()}`}>{g.type}</span>
                    <h4 className="goal-title">{g.title}</h4>
                  </div>
                  <button onClick={() => deleteGoal(g.id)} className="btn-delete">✕</button>
                </div>
                
                <div className="goal-progress-section">
                  <div className="progress-labels">
                    <span>Progress</span>
                    <span>{g.completionRate}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${g.completionRate}%` }}></div>
                  </div>
                  
                  {/* Milestones Checklist */}
                  <div className="milestones-section">
                    <span className="milestones-title">Milestones</span>
                    <ul className="milestone-list">
                      {g.milestones?.map(m => (
                        <li key={m.id} className={`milestone-item ${m.completed ? 'completed' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={m.completed} 
                            onChange={() => toggleGoalMilestone(g.id, m.id)} 
                            className="milestone-checkbox"
                          />
                          <span className="milestone-text">{m.text}</span>
                          <button onClick={() => deleteGoalMilestone(g.id, m.id)} className="btn-remove-milestone">✕</button>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="add-milestone-form">
                      <input 
                        type="text" 
                        value={newMilestoneText[g.id] || ''}
                        onChange={e => setNewMilestoneText(prev => ({ ...prev, [g.id]: e.target.value }))}
                        placeholder="Add step..."
                        className="glowing-input mini"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone(g.id)}
                      />
                      <button onClick={() => handleAddMilestone(g.id)} className="btn-add-milestone">+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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

          <button type="submit" className="btn-submit goals-gradient">Set New Goal</button>
        </form>
      </Modal>

      <style jsx>{`
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
        
        .goal-title {
          font-size: 1.1rem;
          color: var(--text-primary);
        }
        .btn-delete {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.2rem;
          transition: 0.2s;
        }
        .btn-delete:hover {
          color: var(--accent-danger);
        }
        
        .goal-progress-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
        }
        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        
        .progress-bar-bg {
          width: 100%;
          height: 8px;
          background: var(--surface-low);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6, #00e5ff);
          border-radius: 4px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .milestones-section {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed var(--border-color);
        }
        .milestones-title {
          font-size: 0.8rem;
          color: var(--text-secondary);
          display: block;
          margin-bottom: 8px;
        }
        .milestone-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }
        .milestone-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          background: var(--surface-low);
          padding: 6px 10px;
          border-radius: 6px;
        }
        .milestone-item.completed .milestone-text {
          text-decoration: line-through;
          color: var(--text-muted);
        }
        .milestone-checkbox {
          cursor: pointer;
        }
        .milestone-text {
          flex: 1;
          color: var(--text-primary);
        }
        .btn-remove-milestone {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .btn-remove-milestone:hover { color: var(--accent-danger); }

        .add-milestone-form {
          display: flex;
          gap: 8px;
        }
        .glowing-input.mini {
          padding: 6px 10px;
          font-size: 0.8rem;
        }
        .btn-add-milestone {
          background: rgba(139, 92, 246, 0.2);
          color: #a78bfa;
          border: none;
          border-radius: 6px;
          padding: 0 12px;
          cursor: pointer;
          font-weight: bold;
          transition: 0.2s;
        }
        .btn-add-milestone:hover { background: #8b5cf6; color: #fff; }

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
