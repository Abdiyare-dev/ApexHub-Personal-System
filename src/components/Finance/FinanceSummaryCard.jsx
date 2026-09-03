"use client";

import { useEffect, useState } from 'react';

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
}

export default function FinanceSummaryCard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    async function loadFinanceSummary() {
      try {
        setLoading(true);
        const [resSum, resBud] = await Promise.all([
          fetch(`/api/finance/summary?month=${monthKey}`),
          fetch(`/api/finance/budgets?month=${monthKey}`),
        ]);

        if (resSum.ok) {
          const sumJson = await resSum.json();
          setData(sumJson);
        }
        if (resBud.ok) {
          const budJson = await resBud.json();
          setBudgetData(budJson);
        }
      } catch (err) {
        console.error('Error loading finance card widget:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFinanceSummary();
  }, [monthKey]);

  const handleClick = () => {
    if (onNavigate) onNavigate('Finance Dashboard');
  };

  const totalCategories = (budgetData?.budgets || []).length;
  const onTrackCategories = budgetData?.onTrackCount || 0;
  const overBudgetCategories = budgetData?.overBudgetCount || 0;

  return (
    <div className="finance-summary-card glass-3d" onClick={handleClick}>
      <div className="card-header-row">
        <div className="header-left">
          <div className="header-icon">💰</div>
          <div>
            <h4 className="card-title">Monthly Finance & Budget</h4>
            <span className="card-sub">{monthName} Overview</span>
          </div>
        </div>

        <button className="view-link" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
          Finance →
        </button>
      </div>

      {loading ? (
        <div className="card-loading">Loading summary...</div>
      ) : (
        <div className="card-body">
          <div className="summary-line">
            <span className="month-tag">{monthName}:</span>
            <span className="income-tag">{formatCurrency(data?.totalIncome)} income</span>
            <span className="sep">·</span>
            <span className="expense-tag">{formatCurrency(data?.totalExpense)} spent</span>
            <span className="sep">·</span>
            <span className={`balance-tag ${Number(data?.balance) >= 0 ? 'pos' : 'neg'}`}>
              {formatCurrency(data?.balance)} {Number(data?.balance) >= 0 ? 'remaining' : 'deficit'}
            </span>
          </div>

          <div className="budget-status-row">
            <span className="budget-label">Budget Health:</span>
            {totalCategories === 0 ? (
              <span className="budget-track-text muted">No budgets set this month</span>
            ) : (
              <span className={`budget-track-text ${overBudgetCategories > 0 ? 'over' : 'ok'}`}>
                {onTrackCategories}/{totalCategories} categories on track
                {overBudgetCategories > 0 && ` (${overBudgetCategories} over limit)`}
              </span>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .finance-summary-card {
          padding: 16px 20px;
          border-radius: 16px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-card);
          cursor: pointer;
          transition: transform 0.25s ease, border-color 0.25s ease;
          margin-bottom: 20px;
        }
        .finance-summary-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }

        .card-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .header-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: rgba(16, 185, 129, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
        .card-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .card-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .view-link {
          background: none;
          border: none;
          color: var(--accent);
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
        }

        .card-loading {
          font-size: 0.8rem;
          color: var(--text-muted);
          padding: 6px 0;
        }

        .card-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .summary-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.86rem;
          flex-wrap: wrap;
        }
        .month-tag {
          font-weight: 800;
          color: var(--text-primary);
        }
        .income-tag {
          color: #10b981;
          font-weight: 700;
        }
        .expense-tag {
          color: #ef4444;
          font-weight: 700;
        }
        .balance-tag {
          font-weight: 800;
        }
        .balance-tag.pos { color: #10b981; }
        .balance-tag.neg { color: #ef4444; }
        .sep { color: var(--text-muted); }

        .budget-status-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          margin-top: 2px;
        }
        .budget-label {
          color: var(--text-muted);
          font-weight: 600;
        }
        .budget-track-text {
          font-weight: 800;
        }
        .budget-track-text.ok { color: #10b981; }
        .budget-track-text.over { color: #ef4444; }
        .budget-track-text.muted { color: var(--text-muted); font-weight: 600; }
      `}</style>
    </div>
  );
}
