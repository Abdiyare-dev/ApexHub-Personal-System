"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const FinanceContext = createContext();

const DEFAULT_INCOME_CATS = ['Investment income', 'Regular job income', 'Freelance', 'Other'];
const DEFAULT_EXPENSE_CATS = ['Transportation', 'Miscellaneous', 'Food & Cafeteria', 'Tax / VAT', 'Rent/Mortgage', 'Utilities', 'Entertainment', 'Other'];
const DEFAULT_BUDGETS = { yearly: { planned: 60000 }, monthly: { planned: 5000 }, weekly: { planned: 1250 } };

const LS_KEYS = {
  transactions: 'mock_finance_transactions',
  incomeCategories: 'mock_finance_income_cats',
  expenseCategories: 'mock_finance_expense_cats',
  budgets: 'mock_finance_budgets',
};

export function FinanceProvider({ children }) {
  const { user } = useAuth();
  
  const [transactions, setTransactions] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState(DEFAULT_INCOME_CATS);
  const [expenseCategories, setExpenseCategories] = useState(DEFAULT_EXPENSE_CATS);
  const [budgets, setBudgets] = useState(DEFAULT_BUDGETS);
  const [mounted, setMounted] = useState(false);

  // Determine if using mock/test account
  const isMockUser = user?.id === 'mock-local-user-123';
  const getUserId = () => user?.id || null;

  // ── MOCK MODE: localStorage ──────────────────────────────────────────────
  const loadFromLocalStorage = () => {
    try {
      const tx = localStorage.getItem(LS_KEYS.transactions);
      const ic = localStorage.getItem(LS_KEYS.incomeCategories);
      const ec = localStorage.getItem(LS_KEYS.expenseCategories);
      const bud = localStorage.getItem(LS_KEYS.budgets);
      if (tx) setTransactions(JSON.parse(tx));
      if (ic) setIncomeCategories(JSON.parse(ic));
      if (ec) setExpenseCategories(JSON.parse(ec));
      if (bud) setBudgets(JSON.parse(bud));
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  const saveTransactionsLS = (data) => {
    setTransactions(data);
    localStorage.setItem(LS_KEYS.transactions, JSON.stringify(data));
  };

  const saveMetaLS = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  // ── SUPABASE MODE ────────────────────────────────────────────────────────
  const fetchFromSupabase = async (userId) => {
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (txData) setTransactions(txData);

    const { data: metaData } = await supabase
      .from('finance_meta')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (metaData) {
      if (metaData.income_categories) setIncomeCategories(metaData.income_categories);
      if (metaData.expense_categories) setExpenseCategories(metaData.expense_categories);
      if (metaData.budgets) setBudgets(metaData.budgets);
    }
  };

  const syncMeta = async (newMeta) => {
    if (!user || isMockUser) return;
    const userId = getUserId();
    const { error } = await supabase
      .from('finance_meta')
      .upsert({ user_id: userId, ...newMeta }, { onConflict: 'user_id' });
    if (error) console.error('Error syncing finance meta:', error);
  };

  // ── EFFECT: Load data based on user type ────────────────────────────────
  useEffect(() => {
    setMounted(true);
    if (!user) {
      setTransactions([]);
      setIncomeCategories(DEFAULT_INCOME_CATS);
      setExpenseCategories(DEFAULT_EXPENSE_CATS);
      setBudgets(DEFAULT_BUDGETS);
      return;
    }

    if (isMockUser) {
      loadFromLocalStorage();
      return;
    }

    const userId = getUserId();
    if (!userId) return;

    fetchFromSupabase(userId);

    // Real-time subscriptions for real users
    const txChannel = supabase
      .channel(`transactions-changes-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        async () => {
          const { data } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
          if (data) setTransactions(data);
        }
      ).subscribe();

    const metaChannel = supabase
      .channel(`finance-meta-changes-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_meta', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.new) {
            if (payload.new.income_categories) setIncomeCategories(payload.new.income_categories);
            if (payload.new.expense_categories) setExpenseCategories(payload.new.expense_categories);
            if (payload.new.budgets) setBudgets(payload.new.budgets);
          }
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(txChannel);
      supabase.removeChannel(metaChannel);
    };
  }, [user]);

  // ── ACTIONS ──────────────────────────────────────────────────────────────
  const addTransaction = async (t) => {
    if (!user) return;
    const dateFormatted = t.date ? t.date.substring(0, 10) : new Date().toISOString().substring(0, 10);

    if (isMockUser) {
      const newTx = { ...t, date: dateFormatted, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
      const updated = [newTx, ...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
      saveTransactionsLS(updated);
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .insert({ ...t, date: dateFormatted, user_id: getUserId(), created_at: new Date().toISOString() });
    if (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    if (!user) return;

    if (isMockUser) {
      const updated = transactions.filter(t => t.id !== id);
      saveTransactionsLS(updated);
      return;
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) console.error('Error deleting transaction:', error);
  };

  const addIncomeCategory = async (cat) => {
    if (!incomeCategories.includes(cat)) {
      const updated = [...incomeCategories, cat];
      setIncomeCategories(updated);
      if (isMockUser) { saveMetaLS(LS_KEYS.incomeCategories, updated); return; }
      await syncMeta({ income_categories: updated });
    }
  };

  const addExpenseCategory = async (cat) => {
    if (!expenseCategories.includes(cat)) {
      const updated = [...expenseCategories, cat];
      setExpenseCategories(updated);
      if (isMockUser) { saveMetaLS(LS_KEYS.expenseCategories, updated); return; }
      await syncMeta({ expense_categories: updated });
    }
  };

  const deleteIncomeCategory = async (cat) => {
    const updated = incomeCategories.filter(c => c !== cat);
    setIncomeCategories(updated);
    if (isMockUser) { saveMetaLS(LS_KEYS.incomeCategories, updated); return; }
    await syncMeta({ income_categories: updated });
  };

  const deleteExpenseCategory = async (cat) => {
    const updated = expenseCategories.filter(c => c !== cat);
    setExpenseCategories(updated);
    if (isMockUser) { saveMetaLS(LS_KEYS.expenseCategories, updated); return; }
    await syncMeta({ expense_categories: updated });
  };

  const updateBudget = async (period, planned) => {
    const updatedBudgets = { ...budgets, [period]: { ...budgets[period], planned } };
    setBudgets(updatedBudgets);
    if (isMockUser) { saveMetaLS(LS_KEYS.budgets, updatedBudgets); return; }
    await syncMeta({ budgets: updatedBudgets });
  };

  return (
    <FinanceContext.Provider value={{
      transactions, addTransaction, deleteTransaction,
      incomeCategories, addIncomeCategory, deleteIncomeCategory,
      expenseCategories, addExpenseCategory, deleteExpenseCategory,
      budgets, updateBudget
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}
