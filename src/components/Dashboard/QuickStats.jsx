"use client";

import { useEffect, useState, useRef } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useProductivity } from '@/context/ProductivityContext';

// Helper to format currency
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export default function QuickStats() {
  const { transactions } = useFinance();
  const { tasks, goals, projects } = useProductivity();
  
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Add a small delay so the component animation renders first
          setTimeout(() => setIsVisible(true), 300);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Compute Live Finance
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expenses;

  // Calculate Live Productivity
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const totalTasks = tasks.length || 1;
  const completionRate = Math.round((completedTasks / totalTasks) * 100);

  // Active Goals
  // Our goals logic tracks { title, type, completionRate }
  const activeGoals = goals.slice(0, 3);

  return (
    <section className="quick-stats-section" ref={sectionRef}>
      <h3 className="section-title">Quick Stats</h3>
      <div className="stats-grid" id="statsGrid">
        
        {/* Finance Overview */}
        <div className="stats-card" id="statsFinance" style={{ animationDelay: '0.25s' }}>
          <h4 className="stats-card-title">Finance Overview</h4>
          <div className="stats-rows">
            <div className="stats-row">
              <span className="stats-label">Income</span>
              <span className="stats-value success">{formatCurrency(income)}</span>
            </div>
            <div className="stats-row">
              <span className="stats-label">Expenses</span>
              <span className="stats-value coral">{formatCurrency(expenses)}</span>
            </div>
            <div className="stats-row">
              <span className="stats-label">Balance</span>
              <span className="stats-value primary">{formatCurrency(balance)}</span>
            </div>
          </div>
        </div>

        {/* Productivity Stats */}
        <div className="stats-card" id="statsProductivity" style={{ animationDelay: '0.3s' }}>
          <h4 className="stats-card-title">Productivity Stats</h4>
          <div className="stats-rows">
            <div className="stats-row">
              <span className="stats-label">Active Projects</span>
              <span className="stats-value">{projects.length}</span>
            </div>
            <div className="stats-row">
              <span className="stats-label">Tasks Done</span>
              <span className="stats-value">{completedTasks}</span>
            </div>
            <div className="stats-row">
              <span className="stats-label">Completion Rate</span>
              <span className="stats-value">{completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Live Goals Progress */}
        <div className="stats-card" id="statsGoals" style={{ animationDelay: '0.35s' }}>
          <h4 className="stats-card-title">Goals Progress</h4>
          <div className="progress-rows">
            {activeGoals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active goals.</p>
            ) : (
              activeGoals.map((item, idx) => (
                <div className="progress-item" key={`goal-${idx}`}>
                  <div className="progress-header">
                    <span className="progress-label">{item.title}</span>
                    <span className="progress-percent">{item.completionRate}%</span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className="progress-fill" 
                      style={{ width: isVisible ? `${item.completionRate}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
