"use client";

import { useEffect, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

function AnimatedNumber({ value, isCurrency = true }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 1200; // ms
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(easeProgress * value);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);

  if (isCurrency) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(displayValue);
  }
  return displayValue.toFixed(0);
}

export default function FinanceDashboard() {
  const { transactions, budgets, expenseCategories } = useFinance();
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  
  // Compute totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);

  // Group Expenses by Category to pluck specific ones
  const expenseCategoryTotals = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});

  const getExpenseFor = (cat) => expenseCategoryTotals[cat] || 0;

  // Group Income by Category for charts
  const incomeCategoryTotals = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});

  const pieData = Object.keys(incomeCategoryTotals).map(key => ({
    name: key,
    value: incomeCategoryTotals[key]
  }));

  const COLORS = ['#00e5ff', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];

  // Icons array for dynamic category mapping
  const DYNAMIC_ICONS = [
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 12a4 4 0 0 0-8 0"></path><line x1="12" y1="8" x2="12" y2="12"></line></svg>,
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>,
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
  ];
  const DYNAMIC_COLORS = ['blue', 'amber', 'green', 'coral', 'purple'];

  // Budget vs Actual
  const budgetData = [
    { name: 'Income', actual: totalIncome, planned: budgets.monthly.planned },
    { name: 'Expenses', actual: totalExpense, planned: budgets.monthly.planned * 0.8 } // Example planned expense is 80% of income
  ];

  const formatCurrency = (value) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  // Custom SVG defs for 3D effect
  const renderDefs = () => (
    <defs>
      <linearGradient id="barGradientPrimary" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#00e5ff" stopOpacity={1}/>
        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
      </linearGradient>
      <linearGradient id="barGradientSecondary" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
        <stop offset="100%" stopColor="#ec4899" stopOpacity={0.8}/>
      </linearGradient>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor={isDark ? "#00e5ff" : "#3b82f6"} floodOpacity={0.4} />
      </filter>
    </defs>
  );

  const KpiCard = ({ title, value, icon, delay, colorClass = "blue" }) => (
    <div className="kpi-card" style={{ animationDelay: `${delay}s` }}>
      <div className="kpi-header">
        <span className="kpi-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{title}</span>
        <div className={`kpi-icon-wrap ${colorClass}`}>
          {icon}
        </div>
      </div>
      <span className="kpi-value"><AnimatedNumber value={value} /></span>
    </div>
  );

  return (
    <div className="module-container fade-in">
      <div className="hero-section">
        <h2 className="hero-greeting">Finance Dashboard</h2>
        <p className="hero-subtitle">Interactive visualization of your cash flow and top expenses.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {expenseCategories.slice(0, 4).map((cat, idx) => (
          <KpiCard 
            key={cat}
            title={cat}
            value={getExpenseFor(cat)}
            delay={0.05 + (idx * 0.05)}
            colorClass={DYNAMIC_COLORS[idx % DYNAMIC_COLORS.length]}
            icon={DYNAMIC_ICONS[idx % DYNAMIC_ICONS.length]}
          />
        ))}
        
        <KpiCard 
          title="Total Cash In" 
          value={totalIncome} 
          delay={0.25} 
          colorClass="green"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
        />
        <KpiCard 
          title="Target Budget" 
          value={budgets.monthly.planned} 
          delay={0.3} 
          colorClass="blue"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>}
        />
        <KpiCard 
          title="Total Expenses" 
          value={totalExpense} 
          delay={0.35} 
          colorClass="coral"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>}
        />
      </div>

      <div className="chart-grid">
        {/* Budget vs Actual 3D Bar Chart */}
        <div className="kpi-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="kpi-title" style={{ marginBottom: '20px' }}>Budget vs Actual (Monthly)</h3>
          <div className="relative w-full h-[320px]">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={budgetData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                {renderDefs()}
                <XAxis dataKey="name" stroke={isDark ? "#94a3b8" : "#475569"} tick={{ fill: isDark ? "#94a3b8" : "#475569" }} />
                <YAxis stroke={isDark ? "#94a3b8" : "#475569"} tick={{ fill: isDark ? "#94a3b8" : "#475569" }} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} 
                  contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '12px' }}
                  itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                />
                <Bar dataKey="planned" fill="url(#barGradientSecondary)" radius={[8, 8, 0, 0]} barSize={40} filter="url(#shadow)" />
                <Bar dataKey="actual" fill="url(#barGradientPrimary)" radius={[8, 8, 0, 0]} barSize={40} filter="url(#shadow)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income Distribution Doughnut */}
        <div className="kpi-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="kpi-title" style={{ marginBottom: '20px' }}>Income Breakdown</h3>
          <div className="flex-1 w-full h-[320px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  {renderDefs()}
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    filter="url(#shadow)"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '12px', color: isDark ? '#f8fafc' : '#0f172a' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                No income record found.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .chart-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
          margin-top: 24px;
        }
        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
