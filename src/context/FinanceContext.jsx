"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { seedDefaultCategories } from '@/lib/seedCategories';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const { user } = useAuth();
  const supabase = createClient();

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derived categories arrays for backwards compatibility with existing UI
  const incomeCategories = categories
    .filter((c) => c.type === 'income')
    .map((c) => c.name);

  const expenseCategories = categories
    .filter((c) => c.type === 'expense')
    .map((c) => c.name);

  const fetchFinanceData = useCallback(async (userId) => {
    if (!userId) return;
    try {
      setLoading(true);

      // Seed default categories if none exist
      const loadedCategories = await seedDefaultCategories(userId);
      setCategories(loadedCategories);

      // 1. Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (!txError && txData) {
        setTransactions(txData);
      }

      // 2. Fetch budgets for current month
      const now = new Date();
      const currentMonthFirstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonthFirstDay);

      if (budgetData) setBudgets(budgetData);

      // 3. Fetch savings goals
      const { data: savingsData } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (savingsData) setSavingsGoals(savingsData);
    } catch (err) {
      console.error('Error fetching finance data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setCategories([]);
      setBudgets([]);
      setSavingsGoals([]);
      setLoading(false);
      return;
    }

    fetchFinanceData(user.id);

    // Setup Realtime subscriptions
    const channel = supabase
      .channel(`finance-live-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        async () => {
          const { data } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
          if (data) setTransactions(data);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` },
        async () => {
          const { data } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id);
          if (data) setCategories(data);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'savings_goals', filter: `user_id=eq.${user.id}` },
        async () => {
          const { data } = await supabase
            .from('savings_goals')
            .select('*')
            .eq('user_id', user.id);
          if (data) setSavingsGoals(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchFinanceData, supabase]);

  // ── TRANSACTIONS CRUD ────────────────────────────────────────────────────
  const addTransaction = async (t) => {
    if (!user) return;
    const dateFormatted = t.date ? t.date.substring(0, 10) : new Date().toISOString().substring(0, 10);
    const amount = Number(t.amount);

    // Find category ID if category name was passed
    let categoryId = t.category_id || null;
    if (!categoryId && t.category) {
      const match = categories.find((c) => c.name.toLowerCase() === t.category.toLowerCase());
      if (match) categoryId = match.id;
    }

    const newRow = {
      user_id: user.id,
      amount,
      type: t.type || 'expense',
      category_id: categoryId,
      description: t.description || '',
      date: dateFormatted,
      is_recurring: Boolean(t.is_recurring),
    };

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    setTransactions((prev) => [{ ...newRow, id: tempId, created_at: new Date().toISOString() }, ...prev]);

    const { data, error } = await supabase
      .from('transactions')
      .insert([newRow])
      .select()
      .single();

    if (error) {
      console.error('Error adding transaction:', error);
      // Revert optimistic update
      setTransactions((prev) => prev.filter((item) => item.id !== tempId));
      throw error;
    }

    // Replace temp item with real data
    if (data) {
      setTransactions((prev) => prev.map((item) => (item.id === tempId ? data : item)));
    }
    return data;
  };

  const updateTransaction = async (id, updates) => {
    if (!user) return;
    const { error } = await supabase
      .from('transactions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTransaction = async (id) => {
    if (!user) return;
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting transaction:', error);
      fetchFinanceData(user.id);
      throw error;
    }
  };

  // ── CATEGORIES ───────────────────────────────────────────────────────────
  const addCategory = async ({ name, type, icon = '📌', color = '#3B82F6' }) => {
    if (!user || !name) return;
    const { data, error } = await supabase
      .from('categories')
      .insert([{ user_id: user.id, name, type, icon, color }])
      .select()
      .single();

    if (error) {
      console.error('Error adding category:', error);
      throw error;
    }
    if (data) {
      setCategories((prev) => [...prev, data]);
    }
    return data;
  };

  const addIncomeCategory = (name) => addCategory({ name, type: 'income' });
  const addExpenseCategory = (name) => addCategory({ name, type: 'expense' });

  const deleteCategory = async (id) => {
    if (!user) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting category:', error);
      fetchFinanceData(user.id);
    }
  };

  const deleteIncomeCategory = (name) => {
    const cat = categories.find((c) => c.name === name && c.type === 'income');
    if (cat) deleteCategory(cat.id);
  };

  const deleteExpenseCategory = (name) => {
    const cat = categories.find((c) => c.name === name && c.type === 'expense');
    if (cat) deleteCategory(cat.id);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        incomeCategories,
        expenseCategories,
        budgets,
        savingsGoals,
        loading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        addIncomeCategory,
        addExpenseCategory,
        deleteCategory,
        deleteIncomeCategory,
        deleteExpenseCategory,
        refreshFinance: () => user && fetchFinanceData(user.id),
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}
