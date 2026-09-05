"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useProductivity } from '@/context/ProductivityContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { formatError } from '@/lib/formatError';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import TodayHabitsWidget from '@/components/habits/TodayHabitsWidget';
import TimetableCard from '@/components/timetable/TimetableCard';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

const PALETTE = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#ec4899', '#64748b'];

const STATUS_COLORS = {
  Completed: '#10b981',
  'In Progress': '#0ea5e9',
  Planned: '#94a3b8',
};

function projectStatus(project) {
  if (project.isCompleted) return 'Completed';
  if (project.startDate && new Date() < new Date(project.startDate)) return 'Planned';
  return 'In Progress';
}

function projectProgress(project) {
  const tasks = project.tasks || [];
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function SummaryAnalytics({ onNavigate }) {
  const { transactions = [] } = useFinance() || {};
  const { tasks = [], goals = [], projects = [] } = useProductivity() || {};
  const { user } = useAuth() || {};
  const { theme } = useTheme() || {};
  const isDark = theme === 'dark';

  const firstName = (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there').split(' ')[0];

  const monthKey = useMemo(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [summary, setSummary] = useState({
    totalIncome: 0, totalExpense: 0, balance: 0, byCategory: [], monthlyTrend: [],
  });
  const [budget, setBudget] = useState({
    onTrackCount: 0, overBudgetCount: 0, warningCount: 0,
    totalBudgeted: 0, totalSpentInBudgets: 0, budgets: [],
  });
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFinance = useCallback(async () => {
    try {
      setLoading(true);
      const [rSum, rBud, rSav] = await Promise.all([
        fetch(`/api/finance/summary?month=${monthKey}`),
        fetch(`/api/finance/budgets?month=${monthKey}`),
        fetch('/api/finance/savings'),
      ]);
      if (rSum.ok) setSummary(await rSum.json());
      if (rBud.ok) setBudget(await rBud.json());
      if (rSav.ok) {
        const data = await rSav.json();
        setSavings((Array.isArray(data) ? data : []).filter((g) => g.status === 'active').slice(0, 3));
      }
    } catch (err) {
      console.warn('[dashboard] could not load finance overview:', formatError(err));
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => { loadFinance(); }, [loadFinance, transactions]);

  // ── Derived productivity metrics ──
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeGoals = Array.isArray(goals) ? goals : [];

  const completedTasks = safeTasks.filter((t) => t && t.status === 'Completed').length;
  const taskRate = safeTasks.length ? Math.round((completedTasks / safeTasks.length) * 100) : 0;
  const openTasks = safeTasks.length - completedTasks;
  const activeProjects = safeProjects.filter((p) => p && !p.isCompleted);

  const projectChart = useMemo(() => (
    activeProjects.slice(0, 6).map((p) => ({
      name: (p.name || 'Untitled').length > 14 ? `${(p.name || '').slice(0, 13)}…` : (p.name || 'Untitled'),
      progress: projectProgress(p),
      status: projectStatus(p),
    }))
  ), [activeProjects]);

  const topGoals = useMemo(
    () => [...safeGoals].sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0)).slice(0, 4),
    [safeGoals]
  );

  const trendData = summary.monthlyTrend || [];
  const hasTrend = trendData.some((m) => m.income > 0 || m.expense > 0);
  const categoryData = (summary.byCategory || []).slice(0, 6);
  const budgetTotal = budget.budgets?.length || 0;

  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderColor: isDark ? '#334155' : '#e2e8f0',
    borderRadius: '12px',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: '0.85rem',
  };

  const go = (tab) => onNavigate && onNavigate(tab);

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="dash">
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="dash-head">
        <div>
          <h1 className="dash-greeting">{greeting()}, {firstName}</h1>
          <p className="dash-date">{todayLabel}</p>
        </div>
        <div className="dash-actions">
          <button className="dash-btn ghost" onClick={() => go('Finance Cash In')}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            Cash In
          </button>
          <button className="dash-btn primary" onClick={() => go('Finance Expenses')}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            Add Expense
          </button>
        </div>
      </header>

      {/* ── KPI ROW ────────────────────────────────────────────── */}
      <section className="dash-kpis">
        <button className="kpi" onClick={() => go('Finance Reports')}>
          <div className="kpi-top">
            <span className="kpi-label">Net Balance</span>
            <span className="kpi-chip blue">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
            </span>
          </div>
          <div className={`kpi-num ${summary.balance >= 0 ? 'pos' : 'neg'}`}>
            {loading ? <span className="skeleton w-28" /> : formatCurrency(summary.balance)}
          </div>
          <span className="kpi-foot">{summary.balance >= 0 ? 'Positive cash flow' : 'Running a deficit'}</span>
        </button>

        <button className="kpi" onClick={() => go('Finance Cash In')}>
          <div className="kpi-top">
            <span className="kpi-label">Income</span>
            <span className="kpi-chip green">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            </span>
          </div>
          <div className="kpi-num">
            {loading ? <span className="skeleton w-24" /> : formatCurrency(summary.totalIncome)}
          </div>
          <span className="kpi-foot">This month</span>
        </button>

        <button className="kpi" onClick={() => go('Finance Expenses')}>
          <div className="kpi-top">
            <span className="kpi-label">Expenses</span>
            <span className="kpi-chip coral">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
            </span>
          </div>
          <div className="kpi-num">
            {loading ? <span className="skeleton w-24" /> : formatCurrency(summary.totalExpense)}
          </div>
          <span className="kpi-foot">This month</span>
        </button>

        <button className="kpi" onClick={() => go('Productivity Tasks')}>
          <div className="kpi-top">
            <span className="kpi-label">Tasks Done</span>
            <span className="kpi-chip violet">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
          </div>
          <div className="kpi-num">{taskRate}%</div>
          <div className="kpi-bar"><span style={{ width: `${taskRate}%` }} /></div>
          <span className="kpi-foot">{openTasks} still open</span>
        </button>
      </section>

      {/* ── MONEY ──────────────────────────────────────────────── */}
      <section className="dash-section">
        <div className="sec-head">
          <h2 className="sec-title">Money</h2>
          <button className="sec-link" onClick={() => go('Finance Reports')}>Finance reports →</button>
        </div>
        <div className="grid-2-1">
          <article className="panel">
            <div className="panel-head">
              <h3 className="panel-title">Income vs Expense</h3>
              <span className="panel-sub">Last 6 months</span>
            </div>
            {!hasTrend ? (
              <Empty icon="📈" title="No transactions yet"
                text="Log income or an expense and your six-month trend appears here."
                cta="Add a transaction" onCta={() => go('Finance Expenses')} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)} />
                  <RechartsTooltip formatter={(v, n) => [formatCurrency(v), n === 'income' ? 'Income' : 'Expense']} contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fill="url(#gIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <div className="legend">
              <span><i style={{ background: '#10b981' }} /> Income</span>
              <span><i style={{ background: '#f43f5e' }} /> Expense</span>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3 className="panel-title">Where it goes</h3>
              <span className="panel-sub">Top categories</span>
            </div>
            {categoryData.length === 0 ? (
              <Empty icon="🧾" title="Nothing categorized"
                text="Spending by category shows up once you record expenses." />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="total" nameKey="categoryName"
                      cx="50%" cy="50%" innerRadius={54} outerRadius={82} paddingAngle={3}
                      stroke={isDark ? '#1A2236' : '#ffffff'} strokeWidth={2}>
                      {categoryData.map((c, i) => (
                        <Cell key={c.categoryId || i} fill={c.categoryColor || PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="cat-list">
                  {categoryData.slice(0, 4).map((c, i) => (
                    <li key={c.categoryId || i}>
                      <i style={{ background: c.categoryColor || PALETTE[i % PALETTE.length] }} />
                      <span className="cat-name">{c.categoryIcon} {c.categoryName}</span>
                      <span className="cat-val">{formatCurrency(c.total)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </article>
        </div>
      </section>

      {/* ── TODAY ──────────────────────────────────────────────── */}
      <section className="dash-section">
        <div className="sec-head">
          <h2 className="sec-title">Today</h2>
          <button className="sec-link" onClick={() => go('Productivity Timetable')}>Full timetable →</button>
        </div>
        <div className="grid-1-1">
          <TodayHabitsWidget onNavigate={onNavigate} />
          <TimetableCard onNavigate={onNavigate} />
        </div>
      </section>

      {/* ── EXECUTION ──────────────────────────────────────────── */}
      <section className="dash-section">
        <div className="sec-head">
          <h2 className="sec-title">Execution</h2>
          <button className="sec-link" onClick={() => go('Productivity Goals')}>Goals &amp; roadmap →</button>
        </div>
        <div className="grid-2-1">
          <article className="panel">
            <div className="panel-head">
              <h3 className="panel-title">Project progression</h3>
              <span className="panel-sub">Task completion per active project</span>
            </div>
            {projectChart.length === 0 ? (
              <Empty icon="📁" title="No active projects"
                text="Create a project to track how its tasks are moving."
                cta="New project" onCta={() => go('Productivity Projects')} />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={projectChart} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <RechartsTooltip cursor={{ fill: gridColor }} formatter={(v) => [`${v}%`, 'Complete']} contentStyle={tooltipStyle} />
                  <Bar dataKey="progress" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {projectChart.map((p, i) => (
                      <Cell key={i} fill={STATUS_COLORS[p.status] || '#0ea5e9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="legend">
              {Object.entries(STATUS_COLORS).map(([s, c]) => (
                <span key={s}><i style={{ background: c }} /> {s}</span>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3 className="panel-title">Goals</h3>
              <span className="panel-sub">Milestone completion</span>
            </div>
            {topGoals.length === 0 ? (
              <Empty icon="🎯" title="No goals set"
                text="Define a goal and its milestones to track progress here."
                cta="Set a goal" onCta={() => go('Productivity Goals')} />
            ) : (
              <ul className="goal-list">
                {topGoals.map((g, i) => (
                  <li key={g.id || i}>
                    <div className="goal-row">
                      <span className="goal-title">{g.title}</span>
                      <span className="goal-pct">{g.completionRate || 0}%</span>
                    </div>
                    <div className="goal-track">
                      <span style={{
                        width: `${g.completionRate || 0}%`,
                        background: `linear-gradient(90deg, ${PALETTE[i % PALETTE.length]}, ${PALETTE[(i + 2) % PALETTE.length]})`,
                      }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>

      {/* ── BUDGET & SAVINGS ───────────────────────────────────── */}
      <section className="dash-section">
        <div className="sec-head">
          <h2 className="sec-title">Budget &amp; Savings</h2>
          <button className="sec-link" onClick={() => go('Finance Budget')}>Manage budgets →</button>
        </div>
        <div className="grid-1-1">
          <article className="panel">
            <div className="panel-head">
              <h3 className="panel-title">Budget health</h3>
              <span className="panel-sub">This month</span>
            </div>
            {budgetTotal === 0 ? (
              <Empty icon="🧮" title="No budgets set"
                text="Set category limits to see how your spending tracks against them."
                cta="Create a budget" onCta={() => go('Finance Budget')} />
            ) : (
              <>
                <div className="bud-stats">
                  <div><strong className="ok">{budget.onTrackCount}</strong><span>On track</span></div>
                  <div><strong className="warn">{budget.warningCount}</strong><span>Near limit</span></div>
                  <div><strong className="bad">{budget.overBudgetCount}</strong><span>Over</span></div>
                </div>
                <div className="bud-total">
                  <div className="bud-total-row">
                    <span>{formatCurrency(budget.totalSpentInBudgets)} of {formatCurrency(budget.totalBudgeted)}</span>
                    <span className="bud-pct">
                      {budget.totalBudgeted > 0 ? Math.round((budget.totalSpentInBudgets / budget.totalBudgeted) * 100) : 0}%
                    </span>
                  </div>
                  <div className="goal-track">
                    <span style={{
                      width: `${budget.totalBudgeted > 0 ? Math.min(100, (budget.totalSpentInBudgets / budget.totalBudgeted) * 100) : 0}%`,
                      background: budget.overBudgetCount > 0
                        ? 'linear-gradient(90deg,#f59e0b,#f43f5e)'
                        : 'linear-gradient(90deg,#0ea5e9,#10b981)',
                    }} />
                  </div>
                </div>
              </>
            )}
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3 className="panel-title">Savings goals</h3>
              <span className="panel-sub">Active</span>
            </div>
            {savings.length === 0 ? (
              <Empty icon="🏦" title="No active savings goals"
                text="Start a goal and track contributions toward it."
                cta="Add a goal" onCta={() => go('Finance Savings')} />
            ) : (
              <ul className="goal-list">
                {savings.map((s, i) => (
                  <li key={s.id || i}>
                    <div className="goal-row">
                      <span className="goal-title">{s.name || s.title || 'Savings goal'}</span>
                      <span className="goal-pct">{s.percent || 0}%</span>
                    </div>
                    <div className="goal-track">
                      <span style={{ width: `${s.percent || 0}%`, background: 'linear-gradient(90deg,#6366f1,#06b6d4)' }} />
                    </div>
                    <div className="goal-meta">
                      {formatCurrency(s.current_amount)} of {formatCurrency(s.target_amount)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>

      <style jsx>{`
        .dash { display: flex; flex-direction: column; gap: 30px; padding-bottom: 24px; }

        /* ── Header ── */
        .dash-head {
          display: flex; align-items: flex-end; justify-content: space-between;
          flex-wrap: wrap; gap: 16px; padding-top: 18px;
        }
        .dash-greeting {
          font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 800; letter-spacing: -0.7px; margin: 0;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .dash-date { margin: 4px 0 0; font-size: 0.9rem; color: var(--text-secondary); }
        .dash-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .dash-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 100px;
          font-size: 0.88rem; font-weight: 700; transition: var(--transition-fast);
        }
        .dash-btn.primary {
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          color: #fff; border: none; box-shadow: 0 4px 16px var(--accent-glow);
        }
        .dash-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 8px 22px var(--accent-glow); }
        .dash-btn.ghost { background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); }
        .dash-btn.ghost:hover { border-color: var(--accent); color: var(--accent); }

        /* ── KPIs ── */
        .dash-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .kpi {
          display: flex; flex-direction: column; gap: 8px;
          padding: 18px; border-radius: 16px; text-align: left;
          background: var(--bg-card); border: 1px solid var(--border-card);
          box-shadow: var(--shadow-card);
          transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .kpi:hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: var(--shadow-card-hover); }
        .kpi-top { display: flex; align-items: center; justify-content: space-between; }
        .kpi-label {
          font-size: 0.74rem; font-weight: 800; letter-spacing: 0.7px;
          text-transform: uppercase; color: var(--text-muted);
        }
        .kpi-chip {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 9px;
        }
        .kpi-chip.blue { background: rgba(14,165,233,0.14); color: #0ea5e9; }
        .kpi-chip.green { background: rgba(16,185,129,0.14); color: #10b981; }
        .kpi-chip.coral { background: rgba(244,63,94,0.14); color: #f43f5e; }
        .kpi-chip.violet { background: rgba(139,92,246,0.14); color: #8b5cf6; }
        .kpi-num { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.6px; line-height: 1.15; color: var(--text-primary); }
        .kpi-num.pos { color: #10b981; }
        .kpi-num.neg { color: #f43f5e; }
        .kpi-foot { font-size: 0.76rem; color: var(--text-muted); font-weight: 600; }
        .kpi-bar { height: 5px; border-radius: 3px; background: var(--progress-track); overflow: hidden; }
        .kpi-bar span {
          display: block; height: 100%; border-radius: 3px;
          background: linear-gradient(90deg, var(--accent-start), var(--accent-end));
          transition: width 0.9s cubic-bezier(0.16,1,0.3,1);
        }

        /* ── Sections ── */
        .dash-section { display: flex; flex-direction: column; gap: 14px; }
        .sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
        .sec-title { font-size: 1.05rem; font-weight: 800; letter-spacing: -0.3px; margin: 0; }
        .sec-link {
          font-size: 0.82rem; font-weight: 700; color: var(--accent);
          background: none; border: none; padding: 0; transition: opacity 0.2s ease;
        }
        .sec-link:hover { opacity: 0.75; }

        .grid-2-1 { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; }
        .grid-1-1 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .panel {
          display: flex; flex-direction: column;
          padding: 20px; border-radius: 16px;
          background: var(--bg-card); border: 1px solid var(--border-card);
          box-shadow: var(--shadow-card);
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .panel:hover { border-color: var(--accent); box-shadow: var(--shadow-card-hover); }
        .panel-head { margin-bottom: 16px; }
        .panel-title { font-size: 0.98rem; font-weight: 700; margin: 0; }
        .panel-sub { font-size: 0.78rem; color: var(--text-muted); }

        .legend { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 12px; }
        .legend span { display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text-secondary); font-weight: 600; }
        .legend i { width: 9px; height: 9px; border-radius: 50%; }

        .cat-list { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
        .cat-list li { display: flex; align-items: center; gap: 9px; font-size: 0.84rem; }
        .cat-list i { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .cat-name { flex: 1; color: var(--text-secondary); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cat-val { font-weight: 700; color: var(--text-primary); }

        .goal-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
        .goal-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 7px; }
        .goal-title { font-size: 0.88rem; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .goal-pct { font-size: 0.84rem; font-weight: 800; color: var(--accent); flex-shrink: 0; }
        .goal-track { height: 8px; border-radius: 5px; background: var(--progress-track); overflow: hidden; }
        .goal-track span { display: block; height: 100%; border-radius: 5px; transition: width 1s cubic-bezier(0.16,1,0.3,1); }
        .goal-meta { margin-top: 6px; font-size: 0.76rem; color: var(--text-muted); }

        .bud-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
        .bud-stats div {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          padding: 14px 8px; border-radius: 12px; background: var(--surface-low); border: 1px solid var(--border);
        }
        .bud-stats strong { font-size: 1.4rem; font-weight: 800; line-height: 1; }
        .bud-stats span { font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
        .bud-stats .ok { color: #10b981; }
        .bud-stats .warn { color: #f59e0b; }
        .bud-stats .bad { color: #f43f5e; }
        .bud-total-row { display: flex; justify-content: space-between; font-size: 0.84rem; color: var(--text-secondary); font-weight: 600; margin-bottom: 8px; }
        .bud-pct { font-weight: 800; color: var(--text-primary); }

        .skeleton {
          display: inline-block; height: 1.5rem; border-radius: 7px;
          background: linear-gradient(90deg, var(--surface-low) 25%, var(--border-card) 50%, var(--surface-low) 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }
        .w-24 { width: 96px; } .w-28 { width: 118px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        @media (max-width: 1100px) {
          .dash-kpis { grid-template-columns: repeat(2, 1fr); }
          .grid-2-1, .grid-1-1 { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .dash { gap: 24px; }
          .dash-kpis { grid-template-columns: 1fr; }
          .dash-actions { width: 100%; }
          .dash-btn { flex: 1; justify-content: center; }
        }
      `}</style>
    </div>
  );
}

// ── Shared empty state ────────────────────────────────────────────
function Empty({ icon, title, text, cta, onCta }) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon}</span>
      <p className="empty-title">{title}</p>
      <span className="empty-text">{text}</span>
      {cta && <button className="empty-cta" onClick={onCta}>{cta}</button>}
      <style jsx>{`
        .empty {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; gap: 7px; padding: 36px 18px; min-height: 190px;
        }
        .empty-icon { font-size: 1.9rem; opacity: 0.75; }
        .empty-title { margin: 0; font-size: 0.94rem; font-weight: 700; color: var(--text-primary); }
        .empty-text { font-size: 0.82rem; color: var(--text-muted); max-width: 260px; line-height: 1.5; }
        .empty-cta {
          margin-top: 8px; padding: 8px 18px; border-radius: 100px;
          border: 1px solid var(--accent); background: var(--accent-subtle);
          color: var(--accent); font-size: 0.82rem; font-weight: 700;
          transition: var(--transition-fast);
        }
        .empty-cta:hover { background: var(--accent); color: #fff; }
      `}</style>
    </div>
  );
}
