"use client";

import { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import Modal from '@/components/Common/Modal';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const COLORS = ['#f43f5e', '#38bdf8', '#a78bfa', '#fbbf24', '#34d399', '#f472b6', '#fb923c', '#818cf8'];

export default function Expenses() {
  const { transactions, expenseCategories, addTransaction, addExpenseCategory, deleteExpenseCategory, deleteTransaction } = useFinance();
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(expenseCategories[0] || '');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));

  const [newCategory, setNewCategory] = useState('');
  const [showNewCatInput, setShowNewCatInput] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const expenseTx = transactions.filter(t => t.type === 'expense').sort((a,b) => new Date(b.date) - new Date(a.date));

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !description || !category || !date) return;
    setSubmitError('');
    
    try {
      await addTransaction({
        type: 'expense',
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
      console.error('Failed to save expense:', err);
      setSubmitError(err.message || 'Failed to save. Please try again.');
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory) return;
    addExpenseCategory(newCategory);
    setCategory(newCategory);
    setNewCategory('');
    setShowNewCatInput(false);
  };

  const handleDeleteCategory = () => {
    if (expenseCategories.length > 1) {
      deleteExpenseCategory(category);
      setCategory(expenseCategories.filter(c => c !== category)[0]);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Chart Data Processing
  const categoryData = expenseCategories.map(cat => ({
    name: cat,
    value: expenseTx.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0)
  })).filter(d => d.value > 0);

  const timeDataMap = {};
  expenseTx.forEach(t => {
    const dateKey = new Date(t.date).toISOString().split('T')[0];
    timeDataMap[dateKey] = (timeDataMap[dateKey] || 0) + t.amount;
  });
  
  // Sort dates chronologically for the line chart
  const timeData = Object.keys(timeDataMap).sort((a, b) => new Date(a) - new Date(b)).map(key => {
    const d = new Date(key);
    return {
      date: `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`,
      amount: timeDataMap[key]
    };
  });

  // Custom persistent label for PieChart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="var(--text-primary)" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="module-container fade-in">
      <div className="hero-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="hero-greeting">Expense Management</h2>
          <p className="hero-subtitle">Track and manage all your expenses</p>
        </div>
        <button className="create-btn" onClick={() => setIsModalOpen(true)}>
          + Record New Expense
        </button>
      </div>

      {/* Analytics Charts Row */}
      {expenseTx.length > 0 && (
        <div className="charts-row">
          <div className="chart-card">
            <h3 className="chart-title">Expense Distribution</h3>
            <div className="chart-wrapper min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="shadow3dExpense" x="-20%" y="-20%" width="140%" height="140%">
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
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    stroke="var(--bg-card)"
                    strokeWidth={2}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        filter="url(#shadow3dExpense)"
                        style={{ outline: 'none' }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="chart-card">
            <h3 className="chart-title">Expenses Over Time</h3>
            <div className="chart-wrapper min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <filter id="shadow3dLine" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#3b82f6" floodOpacity={0.5} />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" opacity={0.5} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ r: 5, strokeWidth: 2, fill: "#fff", stroke: "#3b82f6" }}
                    activeDot={{ r: 7, fill: "#3b82f6", stroke: "#fff" }}
                    filter="url(#shadow3dLine)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Recent Expenses List Full Width */}
      <div className="kpi-card list-container">
        <h3 className="kpi-title" style={{ marginBottom: '20px' }}>Recent Expenses</h3>
        <div className="transaction-list">
          {expenseTx.length === 0 ? (
            <p className="empty-state">No expense records found.</p>
          ) : (
            expenseTx.map(tx => (
              <div key={tx.id} className="transaction-item group">
                <div className="tx-details">
                  <span className="tx-desc">{tx.description}</span>
                  <span className="tx-cat">{tx.category} • {formatDate(tx.date)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="tx-amount coral" style={{ textShadow: '0 0 10px rgba(244, 63, 94, 0.4)' }}>
                    -{formatCurrency(tx.amount)}
                  </div>
                  <button className="delete-tx-btn" onClick={() => deleteTransaction(tx.id)}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE EXPENSE MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="modal-header">
          <h3>ADD EXPENSE</h3>
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
              placeholder="e.g. 1500"
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
              placeholder="e.g. Monthly Rent"
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
                    className="glowing-input select-styled"
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="cat-action-btns">
                     <button type="button" onClick={() => setShowNewCatInput(true)} className="btn-small blue-btn">+ New</button>
                     {expenseCategories.length > 1 && (
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
          <button type="submit" className="btn-submit red-gradient">Record Expense</button>
        </form>
      </Modal>

      <style jsx>{`
        .create-btn {
          background: linear-gradient(135deg, #f43f5e, #e11d48);
          color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700;
          font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 15px rgba(244, 63, 94, 0.3); transition: transform 0.2s, box-shadow 0.2s;
        }
        .create-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(244, 63, 94, 0.5); }

        /* Modal uses global .modal-overlay / .modal-content from globals.css */
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-header h3 { margin: 0; color: var(--text-primary); font-size: 1rem; font-weight: 800; letter-spacing: 0.5px; }
        .close-btn { background: transparent; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; transition: 0.2s; }
        .close-btn:hover { color: var(--accent-danger); }

        .charts-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
          margin-top: 24px;
        }
        @media (max-width: 1024px) {
          .charts-row {
            grid-template-columns: 1fr;
          }
        }
        .chart-card {
          background: var(--surface);
          border-radius: 12px;
          padding: 24px;
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
          position: relative;
        }
        .chart-card:hover {
          transform: perspective(1000px) rotateX(2deg) translateY(-8px) scale(1.02);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2), 0 5px 15px var(--accent-glow);
          border-color: var(--accent);
          z-index: 20;
        }
        .chart-title {
          font-size: 1.1rem;
          color: var(--text-primary);
          margin-bottom: 20px;
          font-weight: 600;
        }
        .chart-wrapper {
          height: 250px;
          width: 100%;
        }
        
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
        .red-gradient {
           background: #e11d48;
           box-shadow: 0 4px 10px rgba(225, 29, 72, 0.3);
        }
        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(225, 29, 72, 0.4);
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
          border-color: var(--accent-danger);
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
