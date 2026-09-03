"use client";

import { useState, useEffect, useCallback } from 'react';
import { getCurrentStreak, getBestStreak, formatDate } from '@/lib/streaks';

export function useHabits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/habits');
      if (!res.ok) {
        throw new Error('Failed to fetch habits');
      }
      const data = await res.json();
      
      // Calculate streaks for each habit
      const habitsWithStreaks = (data || []).map((habit) => {
        const logs = habit.habit_logs || [];
        const currentStreak = getCurrentStreak(logs, habit.frequency, habit.target_days);
        const bestStreak = getBestStreak(logs, habit.frequency, habit.target_days);
        return {
          ...habit,
          currentStreak,
          bestStreak,
        };
      });

      setHabits(habitsWithStreaks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // Optimistic Toggle Log
  const toggleLog = async (habitId, targetDate = formatDate(new Date())) => {
    const formattedDate = targetDate.split('T')[0];

    // Optimistically update local state
    setHabits((prevHabits) =>
      prevHabits.map((habit) => {
        if (habit.id !== habitId) return habit;

        const currentLogs = habit.habit_logs || [];
        const existingLogIndex = currentLogs.findIndex(
          (l) => (l.log_date?.split('T')[0] || l.log_date) === formattedDate
        );

        let newLogs;
        if (existingLogIndex >= 0) {
          // Remove log
          newLogs = currentLogs.filter((_, idx) => idx !== existingLogIndex);
        } else {
          // Add log
          newLogs = [...currentLogs, { log_date: formattedDate, completed: true }];
        }

        const newCurrentStreak = getCurrentStreak(newLogs, habit.frequency, habit.target_days);
        const newBestStreak = Math.max(habit.bestStreak || 0, newCurrentStreak);

        return {
          ...habit,
          habit_logs: newLogs,
          currentStreak: newCurrentStreak,
          bestStreak: newBestStreak,
        };
      })
    );

    try {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: formattedDate }),
      });

      if (!res.ok) {
        // Revert on error
        await fetchHabits();
        throw new Error('Failed to toggle habit log');
      }

      const result = await res.json();
      return result;
    } catch (err) {
      console.error('Error toggling habit log:', err);
      // Revert
      await fetchHabits();
      throw err;
    }
  };

  const createHabit = async ({ title, frequency, target_days }) => {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, frequency, target_days }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to create habit');
    }

    await fetchHabits();
  };

  const updateHabit = async (id, fields) => {
    const res = await fetch(`/api/habits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update habit');
    }

    await fetchHabits();
  };

  const deleteHabit = async (id) => {
    // Optimistic delete
    setHabits((prev) => prev.filter((h) => h.id !== id));

    const res = await fetch(`/api/habits/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      await fetchHabits();
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to delete habit');
    }
  };

  return {
    habits,
    loading,
    error,
    refreshHabits: fetchHabits,
    toggleLog,
    createHabit,
    updateHabit,
    deleteHabit,
  };
}
