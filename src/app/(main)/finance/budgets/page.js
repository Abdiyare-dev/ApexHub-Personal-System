"use client";

import { useState, useEffect, useCallback } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/components/ui';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BudgetsPage() {
  const { categories, refreshFinance } = useFinance();
  const { addToast } = useToast();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(now.getMonth()); // 0-11

  const currentMonthKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
  const currentMonthLabel = `${MONTH_NAMES[currentMonthIndex]} ${currentYear}`;

  const [budgetData, setBudgetData] = useState({
    budgets: [],
    unbudgeted: [],
    totalBudgeted: 0,
    totalSpentInBudgets: 0,
    onTrackCount: 0,
    overBudgetCount: 0,
    warningCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Set Budget Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete Budget
  const [deletingId, setDeletingId] = useState(null);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/finance/budgets?month=${currentMonthKey}`);
      if (res.ok) {
        const data = await res.json();
        setBudgetData(data);
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'Failed to load budgets' });
    } finally {
      setLoading(false);
    }
  }, [currentMonthKey, addToast]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Navigate Months
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  // Copy Previous Month Budgets
  const handleCopyPrevious = async () => {
    try {
      const res = await fetch('/api/finance/budgets/copy-previous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonthKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to copy budgets');

      addToast({
        type: 'success',
        message: `Copied ${data.copied} budgets from last month (${data.skipped} skipped).`,
      });
      await fetchBudgets();
      refreshFinance();
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    }
  };

  // Open Set Budget Modal
  const handleOpenSetBudget = (catId = '') => {
    setSelectedCategoryId(catId || (expenseCategoriesList[0]?.id || ''));
    setBudgetAmount('');
    setModalError('');
    setIsModalOpen(true);
  };

  // Save Budget
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      setModalError('Please select a category');
      return;
    }
    const amt = Number(budgetAmount);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Please enter a valid amount greater than 0');
      return;
    }

    try {
      setSaving(true);
      setModalError('');

      const res = await fetch('/api/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: selectedCategoryId,
          amount: amt,
          period: 'monthly',
          month: `${currentMonthKey}-01`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save budget');

      addToast({ type: 'success', message: 'Budget saved successfully' });
      setIsModalOpen(false);
      await fetchBudgets();
      refreshFinance();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Budget
  const handleDeleteBudget = async (id) => {
    try {
      const res = await fetch(`/api/finance/budgets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      addToast({ type: 'success', message: 'Budget removed' });
      setDeletingId(null);
      await fetchBudgets();
      refreshFinance();
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const expenseCategoriesList = categories.filter((c) => c.type === 'expense');

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="module-container fade-in">
      {/* Header Section */}
      <div className="hero-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="hero-greeting">Monthly Budgets</h2>
          <p className="hero-subtitle">Set category spending limits and keep your monthly expenses on track.</p>
        </div>

        <button className="create-budget-btn" onClick={() => handleOpenSetBudget()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Set Budget
        </button>
      </div>

      {/* Month Navigation & Summary Header */}
      <div className="month-navigator-bar glass-3d">
        <button className="month-nav-btn" onClick={handlePrevMonth}>
          ‹ Previous
        </button>

        <div className="month-current-title">
          📅 {currentMonthLabel}
        </div>

        <button className="month-nav-btn" onClick={handleNextMonth}>
          Next ›
        </button>
      </div>

      {/* Overall Budget KPI Overview */}
      <div className="budget-kpi-grid">
        <div className="kpi-card glass-3d">
          <div className="kpi-header">
            <h4 className="kpi-title">Total Budgeted</h4>
            <div className="kpi-icon-wrap blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/></svg>
            </div>
          </div>
          <div className="kpi-value highlight-num">{formatCurrency(budgetData.totalBudgeted)}</div>
          <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '6px', fontWeight: '500' }}>
            {budgetData.budgets.length} Categories
          </div>
        </div>

        <div className="kpi-card glass-3d">
          <div className="kpi-header">
            <h4 className="kpi-title">Actual Spent</h4>
            <div className="kpi-icon-wrap amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
          </div>
          <div className="kpi-value highlight-num" style={{ color: budgetData.totalSpentInBudgets > budgetData.totalBudgeted ? '#ef4444' : 'var(--text-primary)' }}>
            {formatCurrency(budgetData.totalSpentInBudgets)}
          </div>
          <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '6px', fontWeight: '500' }}>
            {budgetData.totalBudgeted > 0
              ? `${Math.round((budgetData.totalSpentInBudgets / budgetData.totalBudgeted) * 100)}% utilized`
              : 'No budget set'}
          </div>
        </div>

        <div className="kpi-card glass-3d">
          <div className="kpi-header">
            <h4 className="kpi-title">Health Status</h4>
            <div className="kpi-icon-wrap green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
          </div>
          <div className="kpi-value highlight-num" style={{ color: budgetData.overBudgetCount > 0 ? '#ef4444' : '#10b981' }}>
            {budgetData.overBudgetCount > 0 ? `${budgetData.overBudgetCount} Over` : 'On Track'}
          </div>
          <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '6px', fontWeight: '500' }}>
            {budgetData.onTrackCount} budget{budgetData.onTrackCount !== 1 ? 's' : ''} healthy
          </div>
        </div>
      </div>

      {/* Budget Grid */}
      {loading ? (
        <div className="empty-budgets glass-3d" style={{ padding: '80px 20px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px', width: '36px', height: '36px', border: '3px solid rgba(var(--accent-rgb), 0.2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Loading Budgets...
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
            Fetching your monthly spending limits.
          </p>
        </div>
      ) : budgetData.budgets.length === 0 ? (
        <div className="empty-budgets glass-3d">
          <div className="empty-icon">📊</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            No Budgets Set for {currentMonthLabel}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '18px' }}>
            Start managing your expenses by setting spending limits for your categories or copy from last month.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="month-nav-btn" onClick={handleCopyPrevious}>
              📋 Copy from Last Month
            </button>
            <button className="create-budget-btn" onClick={() => handleOpenSetBudget()}>
              + Set First Budget
            </button>
          </div>
        </div>
      ) : (
        <div className="budget-cards-grid">
          {budgetData.budgets.map((b) => {
            const percent = b.percentUsed || 0;
            let progressColor = '#10b981'; // < 75% on track
            let statusText = 'On Track';
            if (percent >= 90) {
              progressColor = '#ef4444'; // > 90% near/over limit
              statusText = percent > 100 ? 'Over Budget' : 'Critical';
            } else if (percent >= 75) {
              progressColor = '#f59e0b'; // 75-90% warning
              statusText = 'Warning';
            }

            return (
              <div key={b.id} className="budget-item-card glass-3d">
                <div className="budget-card-header">
                  <div className="cat-title-group">
                    <div className="cat-icon-circle" style={{ background: `${b.categoryColor}20`, color: b.categoryColor }}>
                      {b.categoryIcon || '📌'}
                    </div>
                    <div>
                      <h4 className="cat-name">{b.categoryName}</h4>
                      <span className="status-pill" style={{ color: progressColor, background: `${progressColor}18`, borderColor: `${progressColor}40` }}>
                        {statusText} ({percent}%)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="card-action-btn delete"
                      onClick={() => handleDeleteBudget(b.id)}
                      title="Remove Budget"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="budget-progress-track">
                  <div
                    className="budget-progress-fill"
                    style={{
                      width: `${Math.min(100, percent)}%`,
                      background: progressColor,
                    }}
                  />
                </div>

                {/* Spent vs Budget info */}
                <div className="budget-card-footer">
                  <span className="spent-text">
                    <strong>{formatCurrency(b.actualSpent)}</strong> spent of {formatCurrency(b.amount)}
                  </span>
                  <span className="remaining-text" style={{ color: b.remaining < 0 ? '#ef4444' : 'var(--text-muted)' }}>
                    {b.remaining >= 0 ? `${formatCurrency(b.remaining)} remaining` : `${formatCurrency(Math.abs(b.remaining))} over`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unbudgeted Spending Section */}
      {budgetData.unbudgeted && budgetData.unbudgeted.length > 0 && (
        <div className="unbudgeted-section glass-3d">
          <div className="unbudgeted-header">
            <div>
              <h3 className="unbudgeted-title">Unbudgeted Spending in {currentMonthLabel}</h3>
              <p className="unbudgeted-sub">Categories where you have recorded expenses this month without an assigned budget.</p>
            </div>
          </div>

          <div className="unbudgeted-list">
            {budgetData.unbudgeted.map((u) => (
              <div key={u.categoryId} className="unbudgeted-row">
                <div className="unbudgeted-left">
                  <span className="cat-icon-mini">{u.categoryIcon}</span>
                  <span className="unbudgeted-cat-name">{u.categoryName}</span>
                </div>
                <div className="unbudgeted-right">
                  <span className="unbudgeted-spent-amount">{formatCurrency(u.actualSpent)}</span>
                  <button className="btn-set-budget-quick" onClick={() => handleOpenSetBudget(u.categoryId)}>
                    + Set Budget
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Set Budget Modal */}
      {isModalOpen && (
        <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="custom-modal-box glass-3d" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Set Monthly Budget</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveBudget} className="modal-form">
              <div className="form-group">
                <label className="form-label">Expense Category</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="form-input"
                  required
                >
                  {expenseCategoriesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon || '📌'} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Monthly Limit / Budget ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="form-input"
                  min="1"
                  step="1"
                  required
                  autoFocus
                />
              </div>

              {modalError && <div className="form-error-box">{modalError}</div>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .module-container { padding: 0; }

        .create-budget-btn {
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
        .create-budget-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px var(--accent-glow);
        }

        .month-navigator-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-radius: 14px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          margin-bottom: 20px;
        }
        .month-current-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .month-nav-btn {
          padding: 8px 14px;
          border-radius: 10px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .month-nav-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .budget-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .budget-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }
        .budget-item-card {
          padding: 18px 20px;
          border-radius: 16px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-card);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .budget-item-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }

        .budget-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .cat-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cat-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        .cat-name {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .status-pill {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
          border: 1px solid;
          margin-top: 2px;
        }

        .card-action-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
        }
        .card-action-btn.delete:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .budget-progress-track {
          width: 100%;
          height: 8px;
          border-radius: 10px;
          background: var(--surface-low);
          overflow: hidden;
          margin-bottom: 12px;
          border: 1px solid var(--border-color);
        }
        .budget-progress-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.4s ease;
        }

        .budget-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
        }
        .spent-text {
          color: var(--text-secondary);
        }
        .spent-text strong {
          color: var(--text-primary);
        }
        .remaining-text {
          font-weight: 700;
        }

        /* Unbudgeted */
        .unbudgeted-section {
          padding: 20px;
          border-radius: 16px;
          background: var(--surface);
          border: 1px solid var(--border-color);
        }
        .unbudgeted-header { margin-bottom: 14px; }
        .unbudgeted-title {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 2px;
        }
        .unbudgeted-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 0;
        }
        .unbudgeted-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .unbudgeted-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 10px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
        }
        .unbudgeted-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cat-icon-mini { font-size: 1.1rem; }
        .unbudgeted-cat-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .unbudgeted-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .unbudgeted-spent-amount {
          font-size: 0.9rem;
          font-weight: 800;
          color: #ef4444;
        }
        .btn-set-budget-quick {
          padding: 6px 12px;
          border-radius: 8px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          color: var(--accent);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-set-budget-quick:hover {
          border-color: var(--accent);
        }

        .empty-budgets {
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
