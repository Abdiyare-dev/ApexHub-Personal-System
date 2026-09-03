"use client";

import { useEffect, useState, useRef } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useProductivity } from '@/context/ProductivityContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import TodayHabitsWidget from '@/components/habits/TodayHabitsWidget';
import TimetableCard from '@/components/timetable/TimetableCard';
import FinanceSummaryCard from '@/components/Finance/FinanceSummaryCard';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];

export default function SummaryAnalytics({ onNavigate }) {
  const { transactions } = useFinance();
  const { tasks, goals, projects } = useProductivity();

  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    // Component is mounted
  }, []);

  // --- Finance Data Processing ---
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expenses;

  // Process data for charts
  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    
  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

  // --- Productivity Data Processing ---
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = tasks.length - completedTasks;
  const taskCompletionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  const activeProjects = projects.filter(p => !p.is_completed && !p.isCompleted).length;

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  // Custom Pie Label to make it permanent and clean
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) + 25;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
  
    return (
      <text x={x} y={y} fill="var(--text-primary)" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12" fontWeight="600">
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div className={`summary-analytics-container ${isVisible ? 'fade-in-active' : ''}`} ref={containerRef}>
      
      {/* HEADER SECTION */}
      <div className="hero-section hero-3d">
        <h2 className="hero-greeting">Summary & Analytics</h2>
        <p className="hero-subtitle">Your entire life system—finances and productivity—analyzed in real-time.</p>
      </div>

      {/* 3D KPI CARDS GRID */}
      <div className="kpi-grid">
        {/* Finance KPIs */}
        <div className="kpi-card glass-3d" style={{animationDelay: '0.1s'}}>
          <div className="kpi-header">
            <span className="kpi-title">Total Balance</span>
            <div className="kpi-icon-wrap blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
          </div>
          <div className="kpi-value highlight-num">{formatCurrency(balance)}</div>
          <div className="kpi-trend success">Net Cashflow</div>
        </div>

        <div className="kpi-card glass-3d" style={{animationDelay: '0.2s'}}>
          <div className="kpi-header">
            <span className="kpi-title">Monthly Expenses</span>
            <div className="kpi-icon-wrap coral">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
          </div>
          <div className="kpi-value highlight-num">{formatCurrency(expenses)}</div>
          <div className="kpi-trend text-muted">Outflow recorded</div>
        </div>

        {/* Productivity KPIs */}
        <div className="kpi-card glass-3d" style={{animationDelay: '0.3s'}}>
          <div className="kpi-header">
            <span className="kpi-title">Task Completion</span>
            <div className="kpi-icon-wrap green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
          </div>
          <div className="kpi-value highlight-num">{taskCompletionRate}%</div>
          <div className="kpi-trend success">{completedTasks} of {tasks.length} Done</div>
        </div>

        <div className="kpi-card glass-3d" style={{animationDelay: '0.4s'}}>
          <div className="kpi-header">
            <span className="kpi-title">Active Projects</span>
            <div className="kpi-icon-wrap amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
          </div>
          <div className="kpi-value highlight-num">{activeProjects}</div>
          <div className="kpi-trend text-muted">In Progress</div>
        </div>
      </div>

      {/* TODAY'S HABITS & SCHEDULE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <TodayHabitsWidget onNavigate={onNavigate} />
        <TimetableCard onNavigate={onNavigate} />
      </div>

      {/* MONTHLY FINANCE & BUDGET STATUS CARD */}
      <FinanceSummaryCard onNavigate={onNavigate} />

      {/* SPLIT ANALYTICS MODULES */}
      <div className="analytics-split">
        
        {/* Left: Financial Analytics */}
        <div className="analytics-panel glass-3d">
          <h3 className="section-title chart-title">Financial Flow</h3>
          <p className="chart-subtitle">Expense distribution by category</p>
          <div className="chart-container min-h-[300px]">
            {pieData.length === 0 ? (
              <div className="empty-chart-premium">
                <div className="empty-chart-icon">📊</div>
                <p className="empty-chart-text">Awaiting Financial Data</p>
                <span className="empty-chart-sub">Your expense distribution will appear here once you log your first transaction.</span>
              </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <defs>
                      <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                        <feOffset dx="2" dy="2" result="offsetblur" />
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.3" />
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      label={renderCustomizedLabel}
                      labelLine={true}
                      stroke="var(--bg-card)"
                      strokeWidth={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          filter="url(#shadow3d)"
                          style={{ outline: 'none' }}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{backgroundColor: 'var(--surface-low)', borderColor: 'var(--border-color)', borderRadius: '12px'}} />
                  </PieChart>
                </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Productivity Analytics */}
        <div className="analytics-panel glass-3d">
          <h3 className="section-title chart-title">Goals Progression</h3>
          <p className="chart-subtitle">Direct impact of completed tasks</p>
          <div className="progress-container">
            {goals.length === 0 ? (
               <div className="empty-chart-premium">
                 <div className="empty-chart-icon">🎯</div>
                 <p className="empty-chart-text">No Active Goals</p>
                 <span className="empty-chart-sub">Define your first milestone in the Productivity section to track your progress here.</span>
               </div>
            ) : (
              <div className="multi-progress">
                {goals.slice(0, 4).map((goal, idx) => (
                  <div className="modern-progress-item" key={idx}>
                    <div className="mp-header">
                      <span className="mp-title">{goal.title}</span>
                      <span className="mp-percent">{goal.completionRate}%</span>
                    </div>
                    <div className="mp-track">
                      <div 
                        className="mp-fill"
                        style={{ 
                          width: `${isVisible ? goal.completionRate : 0}%`,
                          background: `linear-gradient(90deg, ${COLORS[idx % COLORS.length]}, ${COLORS[(idx+1) % COLORS.length]})`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .summary-analytics-container {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .hero-3d {
          position: relative;
          z-index: 10;
        }

        .highlight-num {
          color: var(--text-primary);
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* 3D Glass Morphism Cards */
        .glass-3d {
          background: var(--surface);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-card);
          border-radius: 12px;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
          position: relative;
        }
        
        .glass-3d:hover {
          transform: perspective(1000px) rotateX(2deg) translateY(-8px) scale(1.02);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2), 0 5px 15px var(--accent-glow);
          border-color: var(--accent);
          z-index: 20;
        }

        .kpi-trend {
          font-size: 0.88rem;
          font-weight: 700;
          margin-top: 12px;
        }
        .success { color: var(--success); }
        .text-muted { color: var(--text-secondary); }

        .analytics-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 24px;
        }
        @media(max-width: 1100px) {
          .analytics-split { grid-template-columns: 1fr; }
        }

        .analytics-panel {
          padding: 28px;
          display: flex;
          flex-direction: column;
        }

        .chart-title {
          margin-bottom: 4px;
        }
        .chart-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .chart-container, .progress-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 300px;
        }
        .empty-chart-premium {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
          background: var(--surface-low);
          border: 1px dashed var(--border-color);
          border-radius: 20px;
          gap: 12px;
          min-height: 260px;
          box-shadow: var(--shadow-inset);
        }
        .empty-chart-icon {
          font-size: 2.5rem;
          filter: drop-shadow(0 0 10px var(--accent-glow));
          margin-bottom: 8px;
        }
        .empty-chart-text {
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--text-primary);
          margin: 0;
        }
        .empty-chart-sub {
          font-size: 0.85rem;
          color: var(--text-muted);
          max-width: 240px;
          line-height: 1.5;
        }

        /* Modern Progress Bars */
        .multi-progress {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .modern-progress-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mp-header {
          display: flex;
          justify-content: space-between;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .mp-title { color: var(--text-primary); }
        .mp-percent { color: var(--text-secondary); }
        
        .mp-track {
          width: 100%;
          height: 12px;
          background: var(--surface-low);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
          border: 1px solid var(--border-color);
        }
        .mp-fill {
          height: 100%;
          border-radius: 20px;
          box-shadow: 0 0 12px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2);
          transition: width 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
        }
        .mp-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 50%;
          background: rgba(255,255,255,0.12);
          border-radius: 10px 10px 0 0;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media(max-width: 1200px) {
           .kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media(max-width: 600px) {
           .kpi-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
