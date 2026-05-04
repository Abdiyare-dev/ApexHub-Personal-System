"use client";

import { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';

export default function Budget() {
  const { budgets, updateBudget } = useFinance();
  const [activeTab, setActiveTab] = useState('monthly');
  const [editValue, setEditValue] = useState('');

  const currentBudget = budgets[activeTab];

  const handleSaveBudget = (e) => {
    e.preventDefault();
    if (editValue) {
      updateBudget(activeTab, parseFloat(editValue));
      setEditValue('');
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="module-container fade-in">
      <div className="hero-section">
        <h2 className="hero-greeting">Budget Configuration</h2>
        <p className="hero-subtitle">Set your spending goals to track exactly how much you can afford.</p>
      </div>

      <div className="budget-wrapper kpi-card">
        {/* Tab Selection */}
        <div className="budget-tabs">
          {['yearly', 'monthly', 'weekly'].map(tab => (
            <button 
              key={tab} 
              className={`budget-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Current Budget Display */}
        <div className="budget-display">
          <span className="budget-label">Planned {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Budget</span>
          <h3 className="budget-amount primary">{formatCurrency(currentBudget.planned)}</h3>
        </div>

        {/* Edit Budget Form */}
        <form onSubmit={handleSaveBudget} className="budget-form">
          <div className="form-group">
            <label>Update Planned Amount ($)</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="number" 
                step="1" 
                value={editValue} 
                onChange={(e) => setEditValue(e.target.value)} 
                placeholder={`e.g. ${currentBudget.planned}`}
                className="glowing-input"
              />
              <button type="submit" className="btn-save primary-gradient">Save Goal</button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .budget-wrapper {
          max-width: 600px;
          margin: 24px auto;
          display: flex;
          flex-direction: column;
          gap: 30px;
          padding: 30px;
        }
        .budget-tabs {
          display: flex;
          background: var(--surface);
          border-radius: 12px;
          padding: 6px;
          border: 1px solid var(--border-color);
        }
        .budget-tab {
          flex: 1;
          background: transparent;
          border: none;
          padding: 10px;
          color: var(--text-secondary);
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.3s;
        }
        .budget-tab.active {
          background: var(--surface-low);
          color: var(--text-primary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .budget-display {
          text-align: center;
          padding: 20px;
          background: rgba(0, 229, 255, 0.05);
          border-radius: 16px;
          border: 1px dashed var(--accent-start);
        }
        .budget-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .budget-amount {
          font-size: 3rem;
          margin-top: 10px;
          text-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
        }
        .budget-form {
          margin-top: 10px;
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
          margin-bottom: 8px;
          display: block;
        }
        .glowing-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-primary);
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .glowing-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 15px rgba(0, 229, 255, 0.2);
        }
        .btn-save {
          padding: 0 24px;
          border-radius: 8px;
          border: none;
          color: white;
          font-weight: 600;
          cursor: pointer;
          background: linear-gradient(135deg, var(--accent-start), #3b82f6);
          box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-save:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 229, 255, 0.5);
        }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
