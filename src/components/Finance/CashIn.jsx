"use client";

import { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import Modal from '@/components/Common/Modal';

export default function CashIn() {
  const { transactions, incomeCategories, addTransaction, addIncomeCategory, deleteIncomeCategory, deleteTransaction } = useFinance();
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(incomeCategories[0] || '');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));

  const [newCategory, setNewCategory] = useState('');
  const [showNewCatInput, setShowNewCatInput] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const incomeTx = transactions.filter(t => t.type === 'income').sort((a,b) => new Date(b.date) - new Date(a.date));

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !description || !category || !date) return;
    setSubmitError('');
    
    try {
      await addTransaction({
        type: 'income',
        amount: parseFloat(amount),
        description,
        category,
        date
      });
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().substring(0, 10));
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save income:', err);
      setSubmitError(err.message || 'Failed to save. Please try again.');
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory) return;
    addIncomeCategory(newCategory);
    setCategory(newCategory);
    setNewCategory('');
    setShowNewCatInput(false);
  };

  const handleDeleteCategory = () => {
    if (incomeCategories.length > 1) {
      deleteIncomeCategory(category);
      setCategory(incomeCategories.filter(c => c !== category)[0]);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="module-container fade-in">
      <div className="hero-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="hero-greeting">Record Cash In</h2>
          <p className="hero-subtitle">Log new income to track against your budgets.</p>
        </div>
        <button className="create-btn" onClick={() => setIsModalOpen(true)}>
          + Record New Income
        </button>
      </div>

      {/* Recent Income List Full Width */}
      <div className="kpi-card list-container" style={{ marginTop: '24px' }}>
        <h3 className="kpi-title" style={{ marginBottom: '20px' }}>Recent Cash In</h3>
        <div className="transaction-list">
          {incomeTx.length === 0 ? (
            <p className="empty-state">No income records found.</p>
          ) : (
            incomeTx.map(tx => (
              <div key={tx.id} className="transaction-item group">
                <div className="tx-details">
                  <span className="tx-desc">{tx.description}</span>
                  <span className="tx-cat">{tx.category} • {formatDate(tx.date)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="tx-amount success" style={{ textShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}>
                    +{formatCurrency(tx.amount)}
                  </div>
                  <button className="delete-tx-btn" onClick={() => deleteTransaction(tx.id)}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE CASH IN MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="modal-header">
          <h3>ADD INCOME</h3>
          <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
        </div>
        
        <form onSubmit={handleAddTransaction} className="finance-form">
          <div className="form-group">
            <label>Amount ($)</label>
            <input 
              type="number" 
              step="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="e.g. 5000"
              className="glowing-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input 
              type="date"
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="glowing-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="e.g. November Salary"
              className="glowing-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <div className="category-select-wrapper">
              {showNewCatInput ? (
                <div className="new-category-input">
                  <input 
                    type="text" 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value)} 
                    placeholder="New Category Name"
                    className="glowing-input"
                    autoFocus
                  />
                  <button type="button" onClick={handleAddCategory} className="btn-small success">Add</button>
                  <button type="button" onClick={() => setShowNewCatInput(false)} className="btn-small danger">Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="glowing-input"
                  >
                    {incomeCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="cat-action-btns">
                     <button type="button" onClick={() => setShowNewCatInput(true)} className="btn-small blue-btn">+ New</button>
                     {incomeCategories.length > 1 && (
                       <button type="button" onClick={handleDeleteCategory} className="btn-small danger" title="Delete current category">✕</button>
                     )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {submitError && (
            <p style={{ color: '#f43f5e', fontSize: '0.85rem', margin: '-8px 0 0', padding: '8px 12px', background: 'rgba(244,63,94,0.1)', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.3)' }}>
              ⚠️ {submitError}
            </p>
          )}
          <button type="submit" className="btn-submit primary-gradient">Record Cash In</button>
        </form>
      </Modal>

      <style jsx>{`
        .create-btn {
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700;
          font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3); transition: transform 0.2s, box-shadow 0.2s;
        }
        .create-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 229, 255, 0.5); }

        /* Modal uses global .modal-overlay / .modal-content from globals.css */
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-header h3 { margin: 0; color: var(--text-primary); font-size: 1rem; font-weight: 800; letter-spacing: 0.5px; }
        .close-btn { background: transparent; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; transition: 0.2s; }
        .close-btn:hover { color: var(--accent-danger); }

        .finance-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.85rem;
          color: var(--text-primary);
          font-weight: 700;
        }
        .glowing-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-primary);
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .glowing-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        
        .cat-action-btns {
           display: flex;
           gap: 6px;
        }
        
        .new-category-input {
          display: flex;
          gap: 8px;
        }
        .btn-small {
          padding: 0 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .blue-btn { background: #3b82f6; color: #fff; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3); }
        .blue-btn:hover { background: #2563eb; }
        .btn-small.success { background: var(--accent-success); color: #fff; }
        .btn-small.danger { background: var(--surface-high); color: var(--text-muted); border: 1px solid var(--border-color); }
        .btn-small.danger:hover { background: var(--accent-danger); color: white; border-color: var(--accent-danger); }
        
        .btn-submit {
          padding: 14px;
          border-radius: 6px;
          border: none;
          color: white;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 10px;
        }
        .primary-gradient {
           background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
           box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3);
        }
        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 229, 255, 0.5);
        }

        .transaction-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 16px;
        }
        .transaction-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: var(--surface-low);
          border-radius: 10px;
          border: 1px solid var(--border-color);
          transition: 0.2s;
        }
        .transaction-item:hover {
          border-color: var(--accent-start);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        .tx-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tx-desc {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 1rem;
        }
        .tx-cat {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .tx-amount {
          font-weight: 800;
          font-size: 1.15rem;
        }
        .empty-state {
          color: var(--text-muted);
          padding: 20px 0;
        }
        .delete-tx-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.1rem;
          cursor: pointer;
          opacity: 0;
          transition: 0.2s;
        }
        .transaction-item:hover .delete-tx-btn {
          opacity: 1;
        }
        .delete-tx-btn:hover {
          color: var(--accent-danger);
        }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
