"use client";

import { useEffect, useState } from 'react';
import { mockData } from '@/data/mockData';
import { useProductivity } from '@/context/ProductivityContext';
import { useFinance } from '@/context/FinanceContext';

const KPI_CONFIG = [
  {
    id: 'kpiActiveProjects',
    title: 'Active Projects',
    valueKey: 'activeProjects',
    colorClass: 'blue',
    isCurrency: false,
    isPercent: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"></path>
      </svg>
    )
  },
  {
    id: 'kpiPendingTasks',
    title: 'Pending Tasks',
    valueKey: 'pendingTasks',
    colorClass: 'amber',
    isCurrency: false,
    isPercent: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    )
  },
  {
    id: 'kpiRecentExpenses',
    title: 'Recent Expenses',
    valueKey: 'recentExpenses',
    colorClass: 'coral',
    isCurrency: true,
    isPercent: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path>
      </svg>
    )
  },
  {
    id: 'kpiGoalsProgress',
    title: 'Goals Progress',
    valueKey: 'overallGoalProgress',
    colorClass: 'green',
    isCurrency: false,
    isPercent: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
      </svg>
    )
  }
];

// Helper to format values
const formatValue = (val, isCurrency, isPercent) => {
  if (isCurrency) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  }
  if (isPercent) {
    return `${Math.round(val)}%`;
  }
  return Math.round(val);
};

// Animated Number Component
function AnimatedNumber({ value, isCurrency, isPercent }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 1200; // ms
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out cubic
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

  return <>{formatValue(displayValue, isCurrency, isPercent)}</>;
}

export default function Hero() {
  const { tasks = [], projects = [], goals = [] } = useProductivity() || {};
  const { transactions = [] } = useFinance() || {};
  
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeTx = Array.isArray(transactions) ? transactions : [];
  const safeGoals = Array.isArray(goals) ? goals : [];

  // Calculate real metrics
  const activeProjects = safeProjects.filter(p => p && !p.isCompleted).length;
  const pendingTasks = safeTasks.filter(t => t && t.status !== 'Completed').length;
  
  // Calculate recent expenses (last 30 days roughly, or just total expenses for simplicity)
  const recentExpenses = safeTx
    .filter(t => t && t.type === 'expense')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  // Calculate average goal progress
  const overallGoalProgress = safeGoals.length > 0 
    ? Math.round(safeGoals.reduce((acc, g) => acc + (Number(g.completionRate) || 0), 0) / safeGoals.length)
    : 0;

  // Real data store to map keys
  const realData = {
    activeProjects,
    pendingTasks,
    recentExpenses,
    overallGoalProgress
  };

  return (
    <>
      <section className="hero-section">
        <h2 className="hero-greeting">Welcome back</h2>
        <p className="hero-subtitle">Here's what's happening with your projects today</p>
      </section>

      <section className="kpi-grid" id="kpiGrid">
        {KPI_CONFIG.map((config, idx) => {
          let val = realData[config.valueKey] || 0;
          
          return (
            <div key={config.id} className="kpi-card" id={config.id} style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="kpi-header">
                <span className="kpi-title">{config.title}</span>
                <div className={`kpi-icon-wrap ${config.colorClass}`}>
                  {config.icon}
                </div>
              </div>
              <span className="kpi-value">
                <AnimatedNumber 
                  value={val} 
                  isCurrency={config.isCurrency} 
                  isPercent={config.isPercent} 
                />
              </span>
            </div>
          );
        })}
      </section>
    </>
  );
}
