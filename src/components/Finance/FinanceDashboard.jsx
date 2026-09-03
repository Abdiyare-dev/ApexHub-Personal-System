"use client";

import { useEffect, useState, useCallback } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/components/ui';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
}

export default function FinanceDashboard({ onNavigate }) {
  const { transactions, categories, addTransaction, refreshFinance } = useFinance();
  const { theme } = useTheme();
  const { addToast } = useToast();
  const isDark = theme === 'dark';

  const [summaryData, setSummaryData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    byCategory: [],
    monthlyTrend: [],
  });

  const [budgetOverview, setBudgetOverview] = useState({
    totalBudgeted: 0,
    totalSpentInBudgets: 0,
    onTrackCount: 0,
    overBudgetCount: 0,
    budgets: [],
  });

  const [topSavingsGoals, setTopSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Transaction Modal
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txType, setTxType] = useState('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().substring(0, 10));
  const [txSaving, setTxSaving] = useState(false);
  const [txError, setTxError] = useState('');

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch Summary
      const resSum = await fetch(`/api/finance/summary?month=${currentMonthKey}`);
      if (resSum.ok) {
        const dataSum = await resSum.json();
        setSummaryData(dataSum);
      }

      // 2. Fetch Budgets
      const resBud = await fetch(`/api/finance/budgets?month=${currentMonthKey}`);
      if (resBud.ok) {
        const dataBud = await resBud.json();
        setBudgetOverview(dataBud);
      }

      // 3. Fetch Savings
      const resSav = await fetch('/api/finance/savings');
      if (resSav.ok) {
        const dataSav = await resSav.json();
        setTopSavingsGoals((dataSav || []).filter(g => g.status === 'active').slice(0, 2));
      }
    } catch (err) {
      console.error('Error loading finance dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentMonthKey]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, transactions]);

  // Handle Add Transaction
  const handleAddTransactionSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(txAmount);
    if (isNaN(amt) || amt <= 0) {
      setTxError('Please enter a valid amount');
      return;
    }

    try {
      setTxSaving(true);
      setTxError('');

      await addTransaction({
        type: txType,
        amount: amt,
        category: txCategory,
        description: txDesc,
        date: txDate,
      });

      addToast({ type: 'success', message: `${txType === 'income' ? 'Income' : 'Expense'} recorded!` });
      setIsAddTxOpen(false);
      setTxAmount('');
      setTxDesc('');
      await loadDashboardData();
      refreshFinance();
    } catch (err) {
      setTxError(err.message || 'Failed to save transaction');
    } finally {
      setTxSaving(false);
    }
  };

  const handleOpenAdd = (type = 'expense') => {
    setTxType(type);
    const available = categories.filter(c => c.type === type);
    setTxCategory(available[0]?.name || '');
    setTxAmount('');
    setTxDesc('');
    setTxDate(new Date().toISOString().substring(0, 10));
    setTxError('');
    setIsAddTxOpen(true);
  };

  const recentTransactions = transactions.slice(0, 10);
  const availableCategories = categories.filter(c => c.type === txType);

  const pieColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#64748b'];

  return (
    <div className="module-container fade-in">
      {/* Header */}
      <div className="hero-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="hero-greeting">Finance Dashboard</h2>
          <p className="hero-subtitle">High-level financial insights, monthly trends, and budget tracking.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-action secondary" onClick={() => handleOpenAdd('income')}>
            + Cash In
          </button>
          <button className="btn-action primary" onClick={() => handleOpenAdd('expense')}>
            + Add Expense
          </button>
        </div>
      </div>

      {/* 3 Main Stat Cards */}
      <div className="finance-kpi-grid">
        {/* Total Income */}
        <div className="kpi-card glass-3d">
          <div className="kpi-top">
            <span className="kpi-label">Total Income (This Month)</span>
            <div className="kpi-icon green">💼</div>
          </div>
          <span className="kpi-number green">{formatCurrency(summaryData.totalIncome)}</span>
          <span className="kpi-meta">Cash inflows</span>
        </div>

        {/* Total Expenses */}
        <div className="kpi-card glass-3d">
          <div className="kpi-top">
            <span className="kpi-label">Total Expenses (This Month)</span>
            <div className="kpi-icon red">💸</div>
          </div>
          <span className="kpi-number red">{formatCurrency(summaryData.totalExpense)}</span>
          <span className="kpi-meta">Cash outflows</span>
        </div>

        {/* Net Balance */}
        <div className="kpi-card glass-3d">
          <div className="kpi-top">
            <span className="kpi-label">Net Balance</span>
            <div className="kpi-icon blue">⚖️</div>
          </div>
          <span className={`kpi-number ${summaryData.balance >= 0 ? 'green' : 'red'}`}>
            {formatCurrency(summaryData.balance)}
          </span>
          <span className="kpi-meta">
            {summaryData.balance >= 0 ? 'Positive cash flow' : 'Deficit'}
          </span>
        </div>
      </div>

      {/* Charts Row: 6-Month Trend & Category Breakdown */}
      <div className="finance-charts-grid">
        {/* Monthly Trend Chart */}
        <div className="chart-card glass-3d">
          <h3 className="chart-title">Income vs Expense (Last 6 Months)</h3>
          <div style={{ width: '100%', height: '280px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={summaryData.monthlyTrend || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <YAxis
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val) => formatCurrency(val)}
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut / Bar */}
        <div className="chart-card glass-3d">
          <h3 className="chart-title">Expense Breakdown by Category</h3>
          <div style={{ width: '100%', height: '280px', marginTop: '16px' }}>
            {summaryData.byCategory && summaryData.byCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={summaryData.byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="total"
                    nameKey="categoryName"
                  >
                    {summaryData.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.categoryColor || pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No expense data for this month.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Widgets Row: Budgets & Savings */}
      <div className="finance-widgets-grid">
        {/* Budget Widget */}
        <div className="widget-card glass-3d">
          <div className="widget-card-header">
            <div className="widget-header-title">
              <span className="widget-badge-icon">📊</span>
              <div>
                <h4 className="widget-title">This Month's Budgets</h4>
                <span className="widget-sub">
                  {budgetOverview.onTrackCount} on track, {budgetOverview.overBudgetCount} over budget
                </span>
              </div>
            </div>

            <button className="widget-link-btn" onClick={() => onNavigate ? onNavigate('Budget') : null}>
              Manage →
            </button>
          </div>

          <div style={{ marginTop: '12px' }}>
            <div className="widget-progress-row">
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {formatCurrency(budgetOverview.totalSpentInBudgets)} of {formatCurrency(budgetOverview.totalBudgeted)}
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: budgetOverview.totalSpentInBudgets > budgetOverview.totalBudgeted ? '#ef4444' : 'var(--text-primary)' }}>
                {budgetOverview.totalBudgeted > 0 ? Math.round((budgetOverview.totalSpentInBudgets / budgetOverview.totalBudgeted) * 100) : 0}%
              </span>
            </div>
            <div className="mini-progress-track">
              <div
                className="mini-progress-fill"
                style={{
                  width: `${Math.min(100, budgetOverview.totalBudgeted > 0 ? (budgetOverview.totalSpentInBudgets / budgetOverview.totalBudgeted) * 100 : 0)}%`,
                  background: budgetOverview.totalSpentInBudgets > budgetOverview.totalBudgeted ? '#ef4444' : '#10b981',
                }}
              />
            </div>
          </div>
        </div>

        {/* Savings Goals Widget */}
        <div className="widget-card glass-3d">
          <div className="widget-card-header">
            <div className="widget-header-title">
              <span className="widget-badge-icon">🎯</span>
              <div>
                <h4 className="widget-title">Savings Goals</h4>
                <span className="widget-sub">Active milestone tracking</span>
              </div>
            </div>

            <button className="widget-link-btn" onClick={() => onNavigate ? onNavigate('Savings') : null}>
              View All →
            </button>
          </div>

          {topSavingsGoals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '12px' }}>
              No active goals. Set a savings goal to start tracking!
            </p>
          ) : (
            <div className="savings-mini-list">
              {topSavingsGoals.map((g) => {
                const radius = 18;
                const circ = 2 * Math.PI * radius;
                const offset = circ - (Math.min(100, g.percent || 0) / 100) * circ;

                return (
                  <div key={g.id} className="savings-mini-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Mini SVG Ring */}
                      <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="22" cy="22" r={radius} stroke="var(--surface-low)" strokeWidth="4" fill="none" />
                        <circle
                          cx="22"
                          cy="22"
                          r={radius}
                          stroke="#10b981"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={circ}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div>
                        <h5 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {g.title}
                        </h5>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}
                        </span>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981' }}>
                      {g.percent}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="recent-tx-card glass-3d">
        <div className="recent-tx-header">
          <div>
            <h3 className="chart-title" style={{ margin: 0 }}>Recent Transactions</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last 10 recorded entries</span>
          </div>

          <button className="widget-link-btn" onClick={() => onNavigate ? onNavigate('Expenses') : null}>
            View All Transactions →
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
            No transactions recorded yet.
          </div>
        ) : (
          <div className="recent-tx-table-wrap">
            <table className="recent-tx-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id}>
                      <td>
                        <span className={`tx-type-pill ${isIncome ? 'income' : 'expense'}`}>
                          {isIncome ? '+ Income' : '- Expense'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {tx.category || 'General'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {tx.description || '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {tx.date}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: isIncome ? '#10b981' : '#ef4444' }}>
                        {isIncome ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {isAddTxOpen && (
        <div className="custom-modal-overlay" onClick={() => setIsAddTxOpen(false)}>
          <div className="custom-modal-box glass-3d" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{txType === 'income' ? 'Add Cash In' : 'Add Expense'}</h3>
              <button className="modal-close" onClick={() => setIsAddTxOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddTransactionSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Type</label>
                <div className="toggle-segment">
                  <button
                    type="button"
                    onClick={() => { setTxType('expense'); const exp = categories.filter(c => c.type === 'expense'); setTxCategory(exp[0]?.name || ''); }}
                    className={`segment-btn ${txType === 'expense' ? 'active' : ''}`}
                  >
                    💸 Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTxType('income'); const inc = categories.filter(c => c.type === 'income'); setTxCategory(inc[0]?.name || ''); }}
                    className={`segment-btn ${txType === 'income' ? 'active' : ''}`}
                  >
                    💼 Income
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Amount ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 75"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="form-input"
                  min="0.01"
                  step="0.01"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="form-input"
                  required
                >
                  {availableCategories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.icon || '📌'} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Grocery shopping, Client invoice"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {txError && <div className="form-error-box">{txError}</div>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsAddTxOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={txSaving}>
                  {txSaving ? 'Saving...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .module-container { padding: 0; }

        .btn-action {
          padding: 9px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: none;
        }
        .btn-action.primary {
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          color: #fff;
          box-shadow: 0 4px 14px var(--accent-glow);
        }
        .btn-action.secondary {
          background: var(--surface);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
        }
        .btn-action:hover {
          transform: translateY(-2px);
        }

        .finance-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .kpi-card {
          padding: 20px;
          border-radius: 18px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-card);
        }
        .kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .kpi-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-muted);
        }
        .kpi-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
        .kpi-icon.green { background: rgba(16, 185, 129, 0.12); }
        .kpi-icon.red { background: rgba(239, 68, 68, 0.12); }
        .kpi-icon.blue { background: rgba(0, 153, 255, 0.12); }

        .kpi-number {
          display: block;
          font-size: 1.6rem;
          font-weight: 900;
          margin-bottom: 2px;
        }
        .kpi-number.green { color: #10b981; }
        .kpi-number.red { color: #ef4444; }
        .kpi-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* Charts */
        .finance-charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        .chart-card {
          padding: 20px;
          border-radius: 18px;
          background: var(--surface);
          border: 1px solid var(--border-color);
        }
        .chart-title {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }

        /* Widgets */
        .finance-widgets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        .widget-card {
          padding: 20px;
          border-radius: 18px;
          background: var(--surface);
          border: 1px solid var(--border-color);
        }
        .widget-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .widget-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .widget-badge-icon {
          font-size: 1.3rem;
        }
        .widget-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .widget-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .widget-link-btn {
          background: none;
          border: none;
          color: var(--accent);
          font-size: 0.8rem;
          font-weight: 800;
          cursor: pointer;
        }

        .widget-progress-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .mini-progress-track {
          width: 100%;
          height: 8px;
          border-radius: 10px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          overflow: hidden;
        }
        .mini-progress-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .savings-mini-list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .savings-mini-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 12px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
        }

        /* Recent Transactions Table */
        .recent-tx-card {
          padding: 20px;
          border-radius: 18px;
          background: var(--surface);
          border: 1px solid var(--border-color);
        }
        .recent-tx-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .recent-tx-table-wrap {
          overflow-x: auto;
        }
        .recent-tx-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .recent-tx-table th {
          text-align: left;
          padding: 10px 12px;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 800;
          border-bottom: 1px solid var(--border-color);
        }
        .recent-tx-table td {
          padding: 12px;
          border-bottom: 1px solid var(--border-color);
        }
        .tx-type-pill {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .tx-type-pill.income {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }
        .tx-type-pill.expense {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }

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
        .form-group { margin-bottom: 14px; }
        .form-label {
          display: block;
          font-size: 0.82rem;
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
        }
        .segment-btn.active {
          background: var(--surface);
          color: var(--accent);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
      `}</style>
    </div>
  );
}
