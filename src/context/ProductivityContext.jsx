"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const ProductivityContext = createContext();

const DEFAULT_PROJECT_TYPES = ['Web Development', 'Marketing Campaign', 'Research', 'Personal'];

const LS_KEYS = {
  tasks: 'mock_productivity_tasks',
  goals: 'mock_productivity_goals',
  projects: 'mock_productivity_projects',
  projectTypes: 'mock_productivity_project_types',
};

// ── FIELD NORMALIZERS ─────────────────────────────────────────────────
// Supabase returns snake_case; frontend uses camelCase. Normalize on read.
const normalizeTask = (t) => ({
  ...t,
  dueDate: t.dueDate ?? t.deadline ?? null,
  goalId: t.goalId ?? t.goal_id ?? null,
});

const normalizeProject = (p) => ({
  ...p,
  projectType: p.projectType ?? p.type ?? null,
  startDate: p.startDate ?? p.start_date ?? null,
  dueDate: p.dueDate ?? p.due_date ?? null,
  is_completed: p.is_completed ?? p.isCompleted ?? false,
  isCompleted: p.is_completed ?? p.isCompleted ?? false,
});

export function ProductivityProvider({ children }) {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectTypes, setProjectTypes] = useState(DEFAULT_PROJECT_TYPES);
  const [mounted, setMounted] = useState(false);

  const isMockUser = user?.id === 'mock-local-user-123';
  const getUserId = () => user?.id || null;

  // ── MOCK MODE: localStorage helpers ─────────────────────────────────────
  const loadFromLocalStorage = () => {
    try {
      const t = localStorage.getItem(LS_KEYS.tasks);
      const g = localStorage.getItem(LS_KEYS.goals);
      const p = localStorage.getItem(LS_KEYS.projects);
      const pt = localStorage.getItem(LS_KEYS.projectTypes);
      if (t) setTasks(JSON.parse(t));
      if (g) setGoals(JSON.parse(g));
      if (p) setProjects(JSON.parse(p));
      if (pt) setProjectTypes(JSON.parse(pt));
    } catch (e) { console.error('Error loading productivity from localStorage:', e); }
  };

  const saveLS = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  // ── SUPABASE MODE ────────────────────────────────────────────────────────
  const fetchFromSupabase = async (userId) => {
    const [{ data: tData }, { data: gData }, { data: pData }, { data: mData }] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('productivity_meta').select('*').eq('user_id', userId).single(),
    ]);
    if (tData) setTasks(tData.map(normalizeTask));
    if (gData) setGoals(gData);
    if (pData) setProjects(pData.map(normalizeProject));
    if (mData?.project_types) setProjectTypes(mData.project_types);
  };

  const syncMeta = async (newMeta) => {
    if (!user || isMockUser) return;
    const { error } = await supabase
      .from('productivity_meta')
      .upsert({ user_id: getUserId(), ...newMeta }, { onConflict: 'user_id' });
    if (error) console.error('Error syncing productivity meta:', error);
  };

  // ── EFFECT ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    if (!user) {
      setTasks([]); setGoals([]); setProjects([]);
      setProjectTypes(DEFAULT_PROJECT_TYPES);
      return;
    }

    if (isMockUser) {
      loadFromLocalStorage();
      return;
    }

    const userId = getUserId();
    if (!userId) return;

    fetchFromSupabase(userId);

    const makeRefetchHandler = (setter, table, normalizer) => async () => {
      const { data } = await supabase.from(table).select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (data) setter(normalizer ? data.map(normalizer) : data);
    };

    const tasksChannel = supabase.channel(`tasks-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` }, makeRefetchHandler(setTasks, 'tasks', normalizeTask))
      .subscribe();

    const goalsChannel = supabase.channel(`goals-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${userId}` }, makeRefetchHandler(setGoals, 'goals', null))
      .subscribe();

    const projectsChannel = supabase.channel(`projects-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${userId}` }, makeRefetchHandler(setProjects, 'projects', normalizeProject))
      .subscribe();

    const metaChannel = supabase.channel(`prod-meta-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productivity_meta', filter: `user_id=eq.${userId}` },
        (payload) => { if (payload.new?.project_types) setProjectTypes(payload.new.project_types); })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(goalsChannel);
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(metaChannel);
    };
  }, [user]);

  // ── TASK ACTIONS ─────────────────────────────────────────────────────────
  const addTask = async (t) => {
    if (!user) return;
    const newTask = { ...t, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
    if (isMockUser) {
      const updated = [newTask, ...tasks];
      setTasks(updated); saveLS(LS_KEYS.tasks, updated); return;
    }
    
    const dbTask = { ...t, user_id: getUserId(), created_at: new Date().toISOString() };
    if (dbTask.dueDate !== undefined) { dbTask.due_date = dbTask.dueDate; delete dbTask.dueDate; }
    if (dbTask.goalId !== undefined) { dbTask.goal_id = dbTask.goalId; delete dbTask.goalId; }
    
    const { error } = await supabase.from('tasks').insert(dbTask);
    if (error) { console.error('Error adding task:', error); throw error; }
  };

  const updateTaskStatus = async (id, newStatus) => {
    if (!user) return;
    if (isMockUser) {
      const updated = tasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
      setTasks(updated); saveLS(LS_KEYS.tasks, updated); return;
    }
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
  };

  const updateTask = async (id, updatedTask) => {
    if (!user) return;
    if (isMockUser) {
      const updated = tasks.map(t => t.id === id ? { ...t, ...updatedTask } : t);
      setTasks(updated); saveLS(LS_KEYS.tasks, updated); return;
    }
    
    const dbTask = { ...updatedTask };
    if (dbTask.dueDate !== undefined) { dbTask.due_date = dbTask.dueDate; delete dbTask.dueDate; }
    if (dbTask.goalId !== undefined) { dbTask.goal_id = dbTask.goalId; delete dbTask.goalId; }
    
    await supabase.from('tasks').update(dbTask).eq('id', id);
  };

  const deleteTask = async (id) => {
    if (!user) return;
    if (isMockUser) {
      const updated = tasks.filter(t => t.id !== id);
      setTasks(updated); saveLS(LS_KEYS.tasks, updated); return;
    }
    await supabase.from('tasks').delete().eq('id', id);
  };

  // ── GOAL ACTIONS ──────────────────────────────────────────────────────────
  const addGoal = async (g) => {
    if (!user) return;
    const newGoal = { ...g, milestones: [], id: `local-${Date.now()}`, created_at: new Date().toISOString() };
    if (isMockUser) {
      const updated = [newGoal, ...goals];
      setGoals(updated); saveLS(LS_KEYS.goals, updated); return;
    }
    
    const dbGoal = { ...g, milestones: [], user_id: getUserId(), created_at: new Date().toISOString() };
    if (dbGoal.targetDate !== undefined) { dbGoal.target_date = dbGoal.targetDate; delete dbGoal.targetDate; }
    if (dbGoal.targetAmount !== undefined) { dbGoal.target_amount = dbGoal.targetAmount; delete dbGoal.targetAmount; }
    if (dbGoal.currentAmount !== undefined) { dbGoal.current_amount = dbGoal.currentAmount; delete dbGoal.currentAmount; }
    
    const { error } = await supabase.from('goals').insert(dbGoal);
    if (error) { console.error('Error adding goal:', error); throw error; }
  };

  const deleteGoal = async (id) => {
    if (!user) return;
    if (isMockUser) {
      const updated = goals.filter(g => g.id !== id);
      setGoals(updated); saveLS(LS_KEYS.goals, updated); return;
    }
    await supabase.from('goals').delete().eq('id', id);
  };

  const addGoalMilestone = async (goalId, text) => {
    if (!user) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const updatedMilestones = [...(goal.milestones || []), { id: Date.now().toString(), text, completed: false }];
    if (isMockUser) {
      const updated = goals.map(g => g.id === goalId ? { ...g, milestones: updatedMilestones } : g);
      setGoals(updated); saveLS(LS_KEYS.goals, updated); return;
    }
    await supabase.from('goals').update({ milestones: updatedMilestones }).eq('id', goalId);
  };

  const toggleGoalMilestone = async (goalId, milestoneId) => {
    if (!user) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const updatedMilestones = goal.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
    if (isMockUser) {
      const updated = goals.map(g => g.id === goalId ? { ...g, milestones: updatedMilestones } : g);
      setGoals(updated); saveLS(LS_KEYS.goals, updated); return;
    }
    await supabase.from('goals').update({ milestones: updatedMilestones }).eq('id', goalId);
  };

  const deleteGoalMilestone = async (goalId, milestoneId) => {
    if (!user) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const updatedMilestones = goal.milestones.filter(m => m.id !== milestoneId);
    if (isMockUser) {
      const updated = goals.map(g => g.id === goalId ? { ...g, milestones: updatedMilestones } : g);
      setGoals(updated); saveLS(LS_KEYS.goals, updated); return;
    }
    await supabase.from('goals').update({ milestones: updatedMilestones }).eq('id', goalId);
  };

  const computedGoals = goals.map(g => {
    const total = g.milestones ? g.milestones.length : 0;
    const completed = g.milestones ? g.milestones.filter(m => m.completed).length : 0;
    return { ...g, completionRate: total === 0 ? 0 : Math.round((completed / total) * 100) };
  });

  // ── PROJECT ACTIONS ───────────────────────────────────────────────────────
  const addProject = async (p) => {
    if (!user) return;
    const newProject = { ...p, tasks: [], is_completed: false, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
    if (isMockUser) {
      const updated = [newProject, ...projects];
      setProjects(updated); saveLS(LS_KEYS.projects, updated); return;
    }
    
    const dbProject = { ...p, tasks: [], is_completed: false, user_id: getUserId(), created_at: new Date().toISOString() };
    if (dbProject.projectType !== undefined) { dbProject.project_type = dbProject.projectType; delete dbProject.projectType; }
    if (dbProject.startDate !== undefined) { dbProject.start_date = dbProject.startDate; delete dbProject.startDate; }
    if (dbProject.dueDate !== undefined) { dbProject.due_date = dbProject.dueDate; delete dbProject.dueDate; }
    
    const { error } = await supabase.from('projects').insert(dbProject);
    if (error) { console.error('Error adding project:', error); throw error; }
  };

  const addProjectType = async (type) => {
    if (!projectTypes.includes(type)) {
      const updated = [...projectTypes, type];
      setProjectTypes(updated);
      if (isMockUser) { saveLS(LS_KEYS.projectTypes, updated); return; }
      await syncMeta({ project_types: updated });
    }
  };

  const deleteProjectType = async (type) => {
    const updated = projectTypes.filter(t => t !== type);
    setProjectTypes(updated);
    if (isMockUser) { saveLS(LS_KEYS.projectTypes, updated); return; }
    await syncMeta({ project_types: updated });
  };

  const deleteProject = async (id) => {
    if (!user) return;
    if (isMockUser) {
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated); saveLS(LS_KEYS.projects, updated); return;
    }
    await supabase.from('projects').delete().eq('id', id);
  };

  const toggleProjectComplete = async (id) => {
    if (!user) return;
    const project = projects.find(p => p.id === id);
    if (!project) return;
    if (isMockUser) {
      const updated = projects.map(p => p.id === id ? { ...p, is_completed: !p.is_completed } : p);
      setProjects(updated); saveLS(LS_KEYS.projects, updated); return;
    }
    await supabase.from('projects').update({ is_completed: !project.is_completed }).eq('id', id);
  };

  const addProjectTask = async (projectId, text) => {
    if (!user) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const updatedTasks = [...(project.tasks || []), { id: Date.now().toString(), text, completed: false }];
    if (isMockUser) {
      const updated = projects.map(p => p.id === projectId ? { ...p, tasks: updatedTasks } : p);
      setProjects(updated); saveLS(LS_KEYS.projects, updated); return;
    }
    await supabase.from('projects').update({ tasks: updatedTasks }).eq('id', projectId);
  };

  const toggleProjectTask = async (projectId, taskId) => {
    if (!user) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const updatedTasks = project.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    if (isMockUser) {
      const updated = projects.map(p => p.id === projectId ? { ...p, tasks: updatedTasks } : p);
      setProjects(updated); saveLS(LS_KEYS.projects, updated); return;
    }
    await supabase.from('projects').update({ tasks: updatedTasks }).eq('id', projectId);
  };

  const deleteProjectTask = async (projectId, taskId) => {
    if (!user) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const updatedTasks = project.tasks.filter(t => t.id !== taskId);
    if (isMockUser) {
      const updated = projects.map(p => p.id === projectId ? { ...p, tasks: updatedTasks } : p);
      setProjects(updated); saveLS(LS_KEYS.projects, updated); return;
    }
    await supabase.from('projects').update({ tasks: updatedTasks }).eq('id', projectId);
  };

  return (
    <ProductivityContext.Provider value={{
      tasks, addTask, updateTaskStatus, updateTask, deleteTask,
      goals: computedGoals, addGoal, deleteGoal, addGoalMilestone, toggleGoalMilestone, deleteGoalMilestone,
      projects, projectTypes, addProject, addProjectType, deleteProjectType, deleteProject,
      toggleProjectComplete, addProjectTask, toggleProjectTask, deleteProjectTask
    }}>
      {children}
    </ProductivityContext.Provider>
  );
}

export function useProductivity() {
  return useContext(ProductivityContext);
}
