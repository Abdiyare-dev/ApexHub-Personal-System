"use client";

import { useState, useEffect, useCallback } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/components/ui';

export default function SavingsPage() {
  const { refreshFinance } = useFinance();
  const { addToast } = useToast();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Goal Modal
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [creating, setCreating] = useState(false);
  const [newGoalError, setNewGoalError] = useState('');

  // Add Contribution Modal
  const [contributeGoal, setContributeGoal] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);
  const [contributeError, setContributeError] = useState('');

  // Abandoned / Archived Accordion Toggle
  const [showAbandoned, setShowAbandoned] = useState(false);

  // Delete Goal
  const [deletingId, setDeletingId] = useState(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance/savings');
      if (res.ok) {
        const data = await res.json();
        setGoals(data || []);
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'Failed to load savings goals' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Create Goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) {
      setNewGoalError('Goal title is required');
      return;
    }
    const numTarget = Number(newGoalTarget);
    if (isNaN(numTarget) || numTarget <= 0) {
      setNewGoalError('Target amount must be greater than 0');
      return;
    }

    try {
      setCreating(true);
      setNewGoalError('');

      const res = await fetch('/api/finance/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGoalTitle.trim(),
          targetAmount: numTarget,
          deadline: newGoalDeadline || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create goal');

      addToast({ type: 'success', message: 'Savings goal created' });
      setIsNewGoalModalOpen(false);
      setNewGoalTitle('');
      setNewGoalTarget('');
      setNewGoalDeadline('');
      await fetchGoals();
      refreshFinance();
    } catch (err) {
      setNewGoalError(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Contribute to Goal
  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contributeGoal) return;
    const amt = Number(contributeAmount);
    if (isNaN(amt) || amt <= 0) {
      setContributeError('Contribution must be greater than 0');
      return;
    }

    try {
      setContributing(true);
      setContributeError('');

      const res = await fetch(`/api/finance/savings/${contributeGoal.id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add savings');

      if (data.justReached) {
        addToast({
          type: 'success',
          message: `🎉 Goal Reached! You have completed "${contributeGoal.title}"!`,
        });
      } else {
        addToast({ type: 'success', message: `Added $${amt} to "${contributeGoal.title}"` });
      }

      setContributeGoal(null);
      setContributeAmount('');
      await fetchGoals();
      refreshFinance();
    } catch (err) {
      setContributeError(err.message);
    } finally {
      setContributing(false);
    }
  };

  // Update Status (e.g. Abandon / Reactivate)
  const handleUpdateStatus = async (goalId, newStatus) => {
    try {
      const res = await fetch(`/api/finance/savings/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      addToast({ type: 'success', message: `Goal status updated to ${newStatus}` });
      await fetchGoals();
      refreshFinance();
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (goalId) => {
    try {
      const res = await fetch(`/api/finance/savings/${goalId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      addToast({ type: 'success', message: 'Savings goal deleted' });
      setDeletingId(null);
      await fetchGoals();
      refreshFinance();
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // Calculate days left
  const getDeadlineText = (deadline) => {
    if (!deadline) return 'No deadline';
    const now = new Date();
    const d = new Date(deadline);
    const diffTime = d - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Passed deadline';
    if (diffDays === 0) return 'Due today';
    return `${diffDays} days left`;
  };

  const activeGoals = goals.filter((g) => g.status === 'active' || g.status === 'reached');
  const abandonedGoals = goals.filter((g) => g.status === 'abandoned');

  // SVG Progress Ring Constants
  const RADIUS = 40;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~251.327

  return (
    <div className="module-container fade-in">
      {/* Header Section */}
      <div className="hero-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="hero-greeting">Savings Goals</h2>
          <p className="hero-subtitle">Visualize your milestones, track contributions, and celebrate accomplishments.</p>
        </div>

        <button className="create-goal-btn" onClick={() => setIsNewGoalModalOpen(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Goal
        </button>
      </div>

      {/* Active Goals Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div className="loading-spinner" />
          <p style={{ marginTop: '12px' }}>Loading savings goals...</p>
        </div>
      ) : activeGoals.length === 0 ? (
        <div className="empty-goals glass-3d">
          <div className="empty-icon">🎯</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            No Active Savings Goals
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '18px' }}>
            Set a target for your dream purchase, emergency fund, or travel adventure.
          </p>
          <button className="create-goal-btn" onClick={() => setIsNewGoalModalOpen(true)}>
            + Create First Goal
          </button>
        </div>
      ) : (
        <div className="goals-cards-grid">
          {activeGoals.map((g) => {
            const isReached = g.status === 'reached' || g.percent >= 100;
            const strokeDashoffset = CIRCUMFERENCE - (Math.min(100, g.percent || 0) / 100) * CIRCUMFERENCE;

            return (
              <div key={g.id} className={`goal-item-card glass-3d ${isReached ? 'reached-card' : ''}`}>
                {/* Header */}
                <div className="goal-card-header">
                  <div>
                    <h3 className="goal-title">{g.title}</h3>
                    <span className={`goal-status-badge ${isReached ? 'reached' : 'active'}`}>
                      {isReached ? 'Goal Reached! 🎉' : 'Active'}
                    </span>
                  </div>

                  <div className="goal-actions-top">
                    <button
                      className="goal-icon-btn"
                      onClick={() => handleUpdateStatus(g.id, g.status === 'abandoned' ? 'active' : 'abandoned')}
                      title="Archive / Abandon Goal"
                    >
                      📦
                    </button>
                    <button
                      className="goal-icon-btn delete"
                      onClick={() => handleDeleteGoal(g.id)}
                      title="Delete Goal"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* SVG Progress Ring */}
                <div className="ring-container">
                  <svg className="progress-ring" width="120" height="120" viewBox="0 0 100 100">
                    {/* Background Ring */}
                    <circle
                      className="ring-bg"
                      cx="50"
                      cy="50"
                      r={RADIUS}
                      strokeWidth="8"
                    />
                    {/* Active Gradient Ring */}
                    <circle
                      className={`ring-fill ${isReached ? 'reached' : ''}`}
                      cx="50"
                      cy="50"
                      r={RADIUS}
                      strokeWidth="8"
                      strokeDasharray={CIRCUMFERENCE}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Centered Ring Text */}
                  <div className="ring-center-content">
                    <span className="ring-percent">{g.percent}%</span>
                    <span className="ring-saved-label">saved</span>
                  </div>
                </div>

                {/* Amounts & Deadline */}
                <div className="goal-amounts-row">
                  <div className="amount-col">
                    <span className="amount-label">Current Saved</span>
                    <span className="amount-value" style={{ color: '#10b981' }}>{formatCurrency(g.current_amount)}</span>
                  </div>
                  <div className="amount-col" style={{ textAlign: 'right' }}>
                    <span className="amount-label">Target Goal</span>
                    <span className="amount-value">{formatCurrency(g.target_amount)}</span>
                  </div>
                </div>

                <div className="goal-card-footer">
                  <span className="deadline-tag">
                    ⏱ {getDeadlineText(g.deadline)}
                  </span>

                  {!isReached ? (
                    <button className="btn-add-savings" onClick={() => setContributeGoal(g)}>
                      + Add Savings
                    </button>
                  ) : (
                    <span className="celebrate-pill">🎉 Completed!</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Abandoned / Archived Goals Section */}
      {abandonedGoals.length > 0 && (
        <div className="abandoned-section glass-3d">
          <button
            className="abandoned-toggle-btn"
            onClick={() => setShowAbandoned(!showAbandoned)}
          >
            <span>Archived / Abandoned Goals ({abandonedGoals.length})</span>
            <span>{showAbandoned ? '▲' : '▼'}</span>
          </button>

          {showAbandoned && (
            <div className="abandoned-list">
              {abandonedGoals.map((g) => (
                <div key={g.id} className="abandoned-row">
                  <div>
                    <h4 className="abandoned-title">{g.title}</h4>
                    <span className="abandoned-meta">
                      {formatCurrency(g.current_amount)} of {formatCurrency(g.target_amount)} saved ({g.percent}%)
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-restore"
                      onClick={() => handleUpdateStatus(g.id, 'active')}
                    >
                      Reactivate
                    </button>
                    <button
                      className="goal-icon-btn delete"
                      onClick={() => handleDeleteGoal(g.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Goal Modal */}
      {isNewGoalModalOpen && (
        <div className="custom-modal-overlay" onClick={() => setIsNewGoalModalOpen(false)}>
          <div className="custom-modal-box glass-3d" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Savings Goal</h3>
              <button className="modal-close" onClick={() => setIsNewGoalModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateGoal} className="modal-form">
              <div className="form-group">
                <label className="form-label">Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g. New Macbook Pro, Tokyo Trip, Emergency Fund"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Amount ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 2500"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="form-input"
                  min="1"
                  step="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Deadline (Optional)</label>
                <input
                  type="date"
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                  className="form-input"
                />
              </div>

              {newGoalError && <div className="form-error-box">{newGoalError}</div>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsNewGoalModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contribution Modal */}
      {contributeGoal && (
        <div className="custom-modal-overlay" onClick={() => setContributeGoal(null)}>
          <div className="custom-modal-box glass-3d" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add to "{contributeGoal.title}"</h3>
              <button className="modal-close" onClick={() => setContributeGoal(null)}>✕</button>
            </div>

            <form onSubmit={handleContribute} className="modal-form">
              <div className="form-group">
                <label className="form-label">Contribution Amount ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="form-input"
                  min="1"
                  step="1"
                  required
                  autoFocus
                />
              </div>

              {contributeError && <div className="form-error-box">{contributeError}</div>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setContributeGoal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={contributing}>
                  {contributing ? 'Adding...' : 'Deposit Savings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .module-container { padding: 0; }

        .create-goal-btn {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          color: #fff;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 9px 18px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 16px var(--accent-glow);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .create-goal-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px var(--accent-glow);
        }

        .goals-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
          margin-bottom: 28px;
        }

        .goal-item-card {
          padding: 20px;
          border-radius: 18px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .goal-item-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }
        .goal-item-card.reached-card {
          border-color: rgba(16, 185, 129, 0.4);
          background: linear-gradient(135deg, var(--surface), rgba(16, 185, 129, 0.05));
        }

        .goal-card-header {
          width: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .goal-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 4px;
        }
        .goal-status-badge {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .goal-status-badge.active {
          background: rgba(0, 153, 255, 0.12);
          color: var(--accent);
        }
        .goal-status-badge.reached {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .goal-actions-top {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .goal-icon-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
        }
        .goal-icon-btn.delete:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        /* Progress Ring */
        .ring-container {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 10px 0 16px;
        }
        .progress-ring {
          transform: rotate(-90deg);
        }
        .ring-bg {
          fill: none;
          stroke: var(--surface-low);
          stroke-width: 8;
        }
        .ring-fill {
          fill: none;
          stroke: #10b981;
          stroke-width: 8;
          transition: stroke-dashoffset 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .ring-fill.reached {
          stroke: #10b981;
          filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.5));
        }

        .ring-center-content {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .ring-percent {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .ring-saved-label {
          font-size: 0.68rem;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
        }

        .goal-amounts-row {
          width: 100%;
          display: flex;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 12px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          margin-bottom: 14px;
        }
        .amount-label {
          display: block;
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 700;
        }
        .amount-value {
          display: block;
          font-size: 0.92rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-top: 2px;
        }

        .goal-card-footer {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .deadline-tag {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 700;
        }
        .btn-add-savings {
          padding: 6px 14px;
          border-radius: 9px;
          background: var(--accent);
          color: #fff;
          border: none;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px var(--accent-glow);
        }
        .celebrate-pill {
          font-size: 0.78rem;
          font-weight: 800;
          color: #10b981;
        }

        /* Abandoned Section */
        .abandoned-section {
          padding: 16px 20px;
          border-radius: 16px;
          background: var(--surface);
          border: 1px solid var(--border-color);
        }
        .abandoned-toggle-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }
        .abandoned-list {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px solid var(--border-color);
          padding-top: 12px;
        }
        .abandoned-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 10px;
          background: var(--surface-low);
        }
        .abandoned-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin: 0;
        }
        .abandoned-meta {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .btn-restore {
          padding: 4px 10px;
          border-radius: 6px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          color: var(--accent);
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }

        .empty-goals {
          text-align: center;
          padding: 48px 20px;
          border-radius: 18px;
          background: var(--surface);
          border: 1px dashed var(--border-color);
        }
        .empty-icon { font-size: 2.5rem; margin-bottom: 12px; }

        /* Modal */
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
          max-width: 440px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
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
        .form-group { margin-bottom: 16px; }
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
        }
        .form-input:focus { border-color: var(--accent); }
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
      `}</style>
    </div>
  );
}
