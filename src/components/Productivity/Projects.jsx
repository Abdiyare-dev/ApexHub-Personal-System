"use client";

import { useState, useMemo } from 'react';
import { useProductivity } from '@/context/ProductivityContext';
import Modal from '@/components/Common/Modal';
import EmptyState from '@/components/ui/EmptyState';
import RoadmapVisualizer from '@/components/goals/RoadmapVisualizer';

export default function Projects() {
  const { 
    projects = [], addProject, updateProject, deleteProject, toggleProjectComplete, 
    addProjectTask, toggleProjectTask, deleteProjectTask,
    projectTypes = [], addProjectType
  } = useProductivity();

  // Portfolio View State
  const [mainView, setMainView] = useState('list'); // 'list' | 'roadmap'
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [termFilter, setTermFilter] = useState('all'); // 'all' | 'short-term' | 'long-term'
  const [portfolioRoadmapFilter, setPortfolioRoadmapFilter] = useState('goals'); // 'goals' | 'all'

  // Dedicated Project Detail View State
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [detailTab, setDetailTab] = useState('roadmap'); // 'roadmap' | 'performance' | 'tasks'
  const [detailRoadmapFilter, setDetailRoadmapFilter] = useState('goals'); // 'goals' | 'all'
  const [detailTaskFilter, setDetailTaskFilter] = useState('all'); // 'all' | 'goals' | 'normal'
  const [detailNewTaskText, setDetailNewTaskText] = useState('');
  const [detailNewTaskCategory, setDetailNewTaskCategory] = useState('goal'); // 'goal' | 'normal'

  // Create Project Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState(projectTypes[0] || 'Personal');
  const [term, setTerm] = useState('short-term'); // 'short-term' | 'long-term'
  
  // Custom Project Type
  const [newType, setNewType] = useState('');
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);

  // Edit Modal State
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState('');
  const [editTerm, setEditTerm] = useState('short-term');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  // Card Quick Task State
  const [newTaskInput, setNewTaskInput] = useState({});
  const [newTaskCategory, setNewTaskCategory] = useState({});

  const handleAddProjectType = (e) => {
    e.preventDefault();
    if (!newType) return;
    addProjectType(newType);
    setType(newType);
    setNewType('');
    setShowNewTypeInput(false);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name || !startDate || !dueDate || saving) return;
    setSaveError('');
    setSaving(true);
    try {
      await addProject({
        name,
        description,
        startDate,
        dueDate,
        projectType: type,
        term,
        tasks: []
      });
      setName('');
      setDescription('');
      setStartDate('');
      setDueDate('');
      setTerm('short-term');
      setType(projectTypes[0] || 'Personal');
      setIsModalOpen(false);
    } catch (err) {
      setSaveError(err?.message || 'Could not save this project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (project, e) => {
    if (e) e.stopPropagation();
    setEditingProject(project);
    setEditName(project.name || '');
    setEditDesc(project.description || '');
    setEditType(project.projectType || projectTypes[0] || 'Personal');
    setEditTerm(project.term || 'short-term');
    setEditStartDate(project.startDate ? project.startDate.split('T')[0] : '');
    setEditDueDate(project.dueDate ? project.dueDate.split('T')[0] : '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingProject || !editName || saving) return;
    setSaving(true);
    try {
      await updateProject(editingProject.id, {
        name: editName,
        description: editDesc,
        projectType: editType,
        term: editTerm,
        startDate: editStartDate,
        dueDate: editDueDate
      });
      setIsEditModalOpen(false);
      setEditingProject(null);
    } catch (err) {
      console.error('Failed to update project:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddInternalTask = (e, projectId) => {
    e.preventDefault();
    const text = newTaskInput[projectId];
    if (!text?.trim()) return;
    const cat = newTaskCategory[projectId] || 'normal';
    addProjectTask(projectId, { text: text.trim(), category: cat });
    setNewTaskInput(prev => ({ ...prev, [projectId]: '' }));
  };

  const handleAddDetailTask = (e, projectId) => {
    e.preventDefault();
    if (!detailNewTaskText.trim()) return;
    addProjectTask(projectId, {
      text: detailNewTaskText.trim(),
      category: detailNewTaskCategory
    });
    setDetailNewTaskText('');
  };

  const getProjectStatus = (project) => {
    if (project.isCompleted) return 'Completed';
    const now = new Date();
    const start = project.startDate ? new Date(project.startDate) : null;
    if (start && now >= start) return 'In Progress';
    return 'Planned';
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter projects by Horizon
  const filteredProjects = useMemo(() => {
    if (termFilter === 'all') return projects;
    return projects.filter(p => (p.term || 'short-term') === termFilter);
  }, [projects, termFilter]);

  const shortTermCount = useMemo(() => projects.filter(p => (p.term || 'short-term') === 'short-term').length, [projects]);
  const longTermCount = useMemo(() => projects.filter(p => p.term === 'long-term').length, [projects]);

  // Active Project for Detail View
  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    return projects.find(p => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  // Compute Active Project Specific Roadmap Steps (Milestones)
  const activeProjectRoadmapSteps = useMemo(() => {
    if (!activeProject) return [];
    const allTasks = activeProject.tasks || [];
    
    // Filter tasks based on detail roadmap filter (Goals only vs All)
    const filtered = detailRoadmapFilter === 'goals' 
      ? allTasks.filter(t => t.category === 'goal')
      : allTasks;

    // Strict project completion requirement: ALL tasks and goals across the project must be 100% completed
    const hasTasks = allTasks.length > 0;
    const allProjectTasksCompleted = hasTasks && allTasks.every(t => t.completed);
    const isProjectFullyDone = Boolean(activeProject.isCompleted || allProjectTasksCompleted);

    const steps = filtered.map((t, idx) => ({
      id: t.id,
      text: `${t.category === 'goal' ? '🎯 ' : '⚡ '}${t.text}`,
      completed: !!t.completed,
      state: t.completed ? 'completed' : 'locked',
      step: idx + 1,
      type: t.category === 'goal' ? 'goal' : 'task'
    }));

    // Final terminal checkpoint of the project
    // It should NOT reach completion until ALL goals and tasks in the project are 100% completed!
    steps.push({
      id: `${activeProject.id}-terminal-delivery`,
      text: `🏆 Final Delivery: ${activeProject.name}`,
      completed: isProjectFullyDone,
      state: isProjectFullyDone ? 'completed' : 'locked',
      step: steps.length + 1,
      type: 'delivery'
    });

    return steps;
  }, [activeProject, detailRoadmapFilter]);

  // General Portfolio Roadmap Milestones
  const portfolioRoadmapMilestones = useMemo(() => {
    // 1. If a specific project is selected:
    if (selectedProjectId !== 'all') {
      const curr = projects.find(p => p.id === selectedProjectId);
      if (!curr) return [];
      const allTasks = curr.tasks || [];
      const filtered = portfolioRoadmapFilter === 'goals'
        ? allTasks.filter(t => t.category === 'goal')
        : allTasks;

      const hasTasks = allTasks.length > 0;
      const allProjectTasksCompleted = hasTasks && allTasks.every(t => t.completed);
      const isProjectFullyDone = Boolean(curr.isCompleted || allProjectTasksCompleted);

      const steps = filtered.map((t, idx) => ({
        id: t.id,
        text: `${t.category === 'goal' ? '🎯 ' : '⚡ '}${t.text}`,
        completed: Boolean(t.completed),
        state: t.completed ? 'completed' : 'locked',
        step: idx + 1,
        type: t.category === 'goal' ? 'goal' : 'task'
      }));

      steps.push({
        id: `${curr.id}-terminal-delivery`,
        text: `🏆 Final Delivery: ${curr.name}`,
        completed: isProjectFullyDone,
        state: isProjectFullyDone ? 'completed' : 'locked',
        step: steps.length + 1,
        type: 'delivery'
      });

      return steps;
    }

    // 2. If 'all' projects is selected:
    // When only 1 project is present, show its full multi-stage journey directly:
    if (filteredProjects.length === 1) {
      const p = filteredProjects[0];
      const allTasks = p.tasks || [];
      const filtered = portfolioRoadmapFilter === 'goals'
        ? allTasks.filter(t => t.category === 'goal')
        : allTasks;

      const hasTasks = allTasks.length > 0;
      const allProjectTasksCompleted = hasTasks && allTasks.every(t => t.completed);
      const isProjectFullyDone = Boolean(p.isCompleted || allProjectTasksCompleted);

      const steps = filtered.map((t, idx) => ({
        id: t.id,
        text: `${t.category === 'goal' ? '🎯 ' : '⚡ '}${t.text}`,
        completed: Boolean(t.completed),
        state: t.completed ? 'completed' : 'locked',
        step: idx + 1,
        type: t.category === 'goal' ? 'goal' : 'task'
      }));

      steps.push({
        id: `${p.id}-terminal-delivery`,
        text: `🏆 Final Delivery: ${p.name}`,
        completed: isProjectFullyDone,
        state: isProjectFullyDone ? 'completed' : 'locked',
        step: steps.length + 1,
        type: 'delivery'
      });

      return steps;
    }

    // When multiple projects exist, aggregate their goal milestones & delivery stages sequentially:
    const aggregatedSteps = [];
    let stepNumber = 1;

    filteredProjects.forEach(p => {
      const allTasks = p.tasks || [];
      const filtered = portfolioRoadmapFilter === 'goals'
        ? allTasks.filter(t => t.category === 'goal')
        : allTasks;

      const hasTasks = allTasks.length > 0;
      const allProjectTasksCompleted = hasTasks && allTasks.every(t => t.completed);
      const isProjectFullyDone = Boolean(p.isCompleted || allProjectTasksCompleted);

      filtered.forEach(t => {
        aggregatedSteps.push({
          id: `${p.id}-${t.id}`,
          text: `[${p.name}] ${t.category === 'goal' ? '🎯 ' : '⚡ '}${t.text}`,
          completed: Boolean(t.completed),
          state: t.completed ? 'completed' : 'locked',
          step: stepNumber++,
          type: t.category === 'goal' ? 'goal' : 'task',
          projectId: p.id
        });
      });

      aggregatedSteps.push({
        id: `${p.id}-terminal-delivery`,
        text: `🏆 Final Delivery: ${p.name}`,
        completed: isProjectFullyDone,
        state: isProjectFullyDone ? 'completed' : 'locked',
        step: stepNumber++,
        type: 'delivery',
        projectId: p.id
      });
    });

    return aggregatedSteps;
  }, [filteredProjects, projects, selectedProjectId, portfolioRoadmapFilter]);

  return (
    <div className="module-container fade-in">
      {/* ========================================================================= */}
      {/* VIEW A: DEDICATED PROJECT DETAILS VIEW */}
      {/* ========================================================================= */}
      {activeProject ? (() => {
        const status = getProjectStatus(activeProject);
        const totalTasks = (activeProject.tasks || []).length;
        const completedTasks = (activeProject.tasks || []).filter(t => t.completed).length;
        const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (activeProject.isCompleted ? 100 : 0);
        const isLongTerm = activeProject.term === 'long-term';
        
        const goalTasks = (activeProject.tasks || []).filter(t => t.category === 'goal');
        const normalTasks = (activeProject.tasks || []).filter(t => t.category !== 'goal');
        const completedGoals = goalTasks.filter(t => t.completed).length;
        const completedNormals = normalTasks.filter(t => t.completed).length;

        const now = new Date();
        const due = activeProject.dueDate ? new Date(activeProject.dueDate) : null;
        const daysLeft = due ? Math.ceil((due - now) / (1000 * 60 * 60 * 24)) : null;

        return (
          <div className="project-detail-container fade-in">
            {/* Back Navigation Bar */}
            <div className="detail-top-nav">
              <button 
                onClick={() => setActiveProjectId(null)} 
                className="btn-back"
              >
                ← Back to Projects Portfolio
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  type="button"
                  className={`btn-complete-toggle ${activeProject.isCompleted ? 'is-done' : ''}`}
                  onClick={() => toggleProjectComplete(activeProject.id)}
                >
                  <span className="chk-bubble">{activeProject.isCompleted ? '✓' : ''}</span>
                  <span className="chk-label">{activeProject.isCompleted ? 'Project Completed' : 'Mark Project Done'}</span>
                </button>

                <button onClick={(e) => handleOpenEdit(activeProject, e)} className="btn-action-icon edit" title="Edit Project">✏️</button>
                <button onClick={() => { deleteProject(activeProject.id); setActiveProjectId(null); }} className="btn-action-icon delete" title="Delete Project">🗑️</button>
              </div>
            </div>

            {/* Project Header Hero Card */}
            <div className="project-detail-hero">
              <div className="hero-left">
                <div className="tag-group">
                  <span className={`status-badge ${status.replace(' ', '-').toLowerCase()}`}>{status}</span>
                  <span className={`term-tag ${isLongTerm ? 'long' : 'short'}`}>
                    {isLongTerm ? '🏔️ Long-Term' : '⚡ Short-Term'}
                  </span>
                  {activeProject.projectType && <span className="pc-type">{activeProject.projectType}</span>}
                </div>
                <h1 className="project-detail-title">{activeProject.name}</h1>
                {activeProject.description && (
                  <p className="project-detail-desc">{activeProject.description}</p>
                )}
              </div>

              <div className="hero-right">
                <div className="detail-date-card">
                  <div className="ddc-item">
                    <span className="ddc-lbl">START DATE</span>
                    <span className="ddc-val">📅 {formatDateTime(activeProject.startDate)}</span>
                  </div>
                  <div className="ddc-item highlight">
                    <span className="ddc-lbl">DEADLINE</span>
                    <span className="ddc-val">📅 {formatDateTime(activeProject.dueDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Switchers for Project Details */}
            <div className="detail-tabs-bar">
              <div className="segmented-control main-tabs">
                <button 
                  className={`seg-btn ${detailTab === 'roadmap' ? 'active' : ''}`}
                  onClick={() => setDetailTab('roadmap')}
                >
                  🛣️ Project Roadmap ({activeProjectRoadmapSteps.length} Steps)
                </button>
                <button 
                  className={`seg-btn ${detailTab === 'performance' ? 'active' : ''}`}
                  onClick={() => setDetailTab('performance')}
                >
                  📊 Performance & Charts
                </button>
                <button 
                  className={`seg-btn ${detailTab === 'tasks' ? 'active' : ''}`}
                  onClick={() => setDetailTab('tasks')}
                >
                  📋 Goals & Tasks ({totalTasks})
                </button>
              </div>
            </div>

            {/* TAB 1: PROJECT ROADMAP (Goals as sequential steps) */}
            {detailTab === 'roadmap' && (
              <div className="detail-tab-content fade-in">
                <div className="roadmap-controls-card">
                  <div className="rc-left">
                    <span className="rc-title">Roadmap Filter:</span>
                    <div className="segmented-control small">
                      <button 
                        className={`seg-btn ${detailRoadmapFilter === 'goals' ? 'active' : ''}`}
                        onClick={() => setDetailRoadmapFilter('goals')}
                      >
                        🎯 Goal Milestones ({goalTasks.length})
                      </button>
                      <button 
                        className={`seg-btn ${detailRoadmapFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setDetailRoadmapFilter('all')}
                      >
                        ⚡ All Steps ({totalTasks})
                      </button>
                    </div>
                  </div>

                  {/* Quick Goal Adder directly on Roadmap */}
                  <form onSubmit={(e) => handleAddDetailTask(e, activeProject.id)} className="quick-goal-form">
                    <input 
                      type="text" 
                      value={detailNewTaskText} 
                      onChange={e => setDetailNewTaskText(e.target.value)}
                      placeholder="+ Add new project goal milestone..."
                      className="quick-goal-input"
                    />
                    <button 
                      type="submit" 
                      className="btn-add-step"
                      onClick={() => setDetailNewTaskCategory('goal')}
                    >
                      + Add Goal Step
                    </button>
                  </form>
                </div>

                <div className="roadmap-wrapper-card">
                  <RoadmapVisualizer 
                    milestones={activeProjectRoadmapSteps}
                    goalTitle={`${activeProject.name} — Execution Roadmap`}
                    goalColor="#3b82f6"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: PERFORMANCE & CHARTS */}
            {detailTab === 'performance' && (
              <div className="detail-tab-content fade-in">
                <div className="performance-detail-grid">
                  {/* Donut Chart & Overall Health */}
                  <div className="perf-main-card">
                    <h3 className="section-title">📊 Execution Progress</h3>
                    <div className="donut-chart-container">
                      <div className="donut-chart-wrapper large">
                        <svg className="donut-svg" width="160" height="160" viewBox="0 0 36 36">
                          <path
                            className="donut-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="donut-fill"
                            strokeDasharray={`${progressPct}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="donut-text">
                          <span className="donut-pct large">{progressPct}%</span>
                          <span className="donut-sub">Completed</span>
                        </div>
                      </div>
                    </div>

                    <div className="progress-bar-detail">
                      <div className="pbd-labels">
                        <span>Tasks Velocity</span>
                        <span>{completedTasks} of {totalTasks} finished</span>
                      </div>
                      <div className="pbd-track">
                        <div className="pbd-fill" style={{ width: `${progressPct}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* KPI Analytics Cards */}
                  <div className="perf-metrics-container">
                    <div className="metric-box">
                      <span className="metric-icon">🎯</span>
                      <div className="metric-data">
                        <span className="metric-num">{completedGoals} / {goalTasks.length}</span>
                        <span className="metric-label">Goal Milestones Achieved</span>
                      </div>
                    </div>

                    <div className="metric-box">
                      <span className="metric-icon">⚡</span>
                      <div className="metric-data">
                        <span className="metric-num">{completedNormals} / {normalTasks.length}</span>
                        <span className="metric-label">Actionable Tasks Done</span>
                      </div>
                    </div>

                    <div className="metric-box">
                      <span className="metric-icon">⏳</span>
                      <div className="metric-data">
                        <span className="metric-num">
                          {daysLeft === null ? 'Flexible' : daysLeft < 0 ? `${Math.abs(daysLeft)}d Overdue` : `${daysLeft} Days Left`}
                        </span>
                        <span className="metric-label">
                          {daysLeft !== null && daysLeft < 0 ? '🔴 Overdue Status' : '🟢 Schedule Health'}
                        </span>
                      </div>
                    </div>

                    <div className="metric-box">
                      <span className="metric-icon">🏆</span>
                      <div className="metric-data">
                        <span className="metric-num">{activeProject.isCompleted ? 'Delivered' : 'Active Sprint'}</span>
                        <span className="metric-label">Project Status</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GOALS & TASKS SUB-TASKS WITH SWITCHER */}
            {detailTab === 'tasks' && (
              <div className="detail-tab-content fade-in">
                <div className="tasks-management-panel">
                  <div className="panel-header">
                    <div>
                      <h3 className="section-title">Project Sub-Tasks & Milestones</h3>
                      <p className="section-sub">Add goal milestones (which map into the roadmap) or standard tasks.</p>
                    </div>

                    {/* Sub-Task Filter Switcher */}
                    <div className="segmented-control small">
                      <button 
                        className={`seg-btn ${detailTaskFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setDetailTaskFilter('all')}
                      >
                        All ({totalTasks})
                      </button>
                      <button 
                        className={`seg-btn ${detailTaskFilter === 'goals' ? 'active' : ''}`}
                        onClick={() => setDetailTaskFilter('goals')}
                      >
                        🎯 Goal Milestones ({goalTasks.length})
                      </button>
                      <button 
                        className={`seg-btn ${detailTaskFilter === 'normal' ? 'active' : ''}`}
                        onClick={() => setDetailTaskFilter('normal')}
                      >
                        ⚡ Actionable Tasks ({normalTasks.length})
                      </button>
                    </div>
                  </div>

                  {/* Task Adder Form */}
                  <form onSubmit={(e) => handleAddDetailTask(e, activeProject.id)} className="detail-task-form">
                    <select 
                      value={detailNewTaskCategory}
                      onChange={e => setDetailNewTaskCategory(e.target.value)}
                      className="detail-cat-picker"
                    >
                      <option value="goal">🎯 Project Goal Milestone (Roadmap Node)</option>
                      <option value="normal">⚡ Actionable Task</option>
                    </select>
                    <input 
                      type="text" 
                      value={detailNewTaskText} 
                      onChange={e => setDetailNewTaskText(e.target.value)}
                      placeholder="Enter milestone or actionable step..."
                      className="detail-task-input"
                      required
                    />
                    <button type="submit" className="btn-add-primary">+ Add Step</button>
                  </form>

                  {/* Tasks List */}
                  <div className="detail-tasks-list">
                    {(() => {
                      const all = activeProject.tasks || [];
                      const list = detailTaskFilter === 'goals'
                        ? all.filter(t => t.category === 'goal')
                        : detailTaskFilter === 'normal'
                        ? all.filter(t => t.category !== 'goal')
                        : all;

                      if (list.length === 0) {
                        return (
                          <EmptyState 
                            icon="🎯"
                            title="No tasks in this category"
                            text="Add goal milestones or tasks above to build this project's execution plan."
                          />
                        );
                      }

                      return list.map(t => (
                        <div key={t.id} className={`detail-task-card ${t.completed ? 'completed' : ''}`}>
                          <div 
                            className={`pc-task-check ${t.completed ? 'checked' : ''}`}
                            onClick={() => toggleProjectTask(activeProject.id, t.id)}
                          >
                            {t.completed && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            )}
                          </div>
                          <div className="task-content">
                            <span className={`task-badge ${t.category === 'goal' ? 'goal' : 'normal'}`}>
                              {t.category === 'goal' ? '🎯 GOAL MILESTONE' : '⚡ TASK'}
                            </span>
                            <span className="task-title-text">{t.text}</span>
                          </div>
                          <button 
                            onClick={() => deleteProjectTask(activeProject.id, t.id)} 
                            className="btn-del-task"
                            title="Delete step"
                          >
                            🗑️
                          </button>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })() : (
        /* ========================================================================= */
        /* VIEW B: MAIN PROJECTS PORTFOLIO (GRID & ROADMAP) */
        /* ========================================================================= */
        <div>
          {/* Header & Main View Switcher */}
          <div className="hero-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="hero-greeting">Project Portfolio</h2>
              <p className="hero-subtitle">Comprehensive tracking for complex, multi-stage assignments.</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div className="segmented-control">
                <button 
                  className={`seg-btn ${mainView === 'list' ? 'active' : ''}`}
                  onClick={() => setMainView('list')}
                >
                  Projects Grid
                </button>
                <button 
                  className={`seg-btn ${mainView === 'roadmap' ? 'active' : ''}`}
                  onClick={() => setMainView('roadmap')}
                >
                  Projects Roadmap
                </button>
              </div>

              <button className="create-project-btn" onClick={() => setIsModalOpen(true)}>
                + Create Project
              </button>
            </div>
          </div>

          {/* Horizon / Term Filter Bar */}
          <div className="term-filter-bar">
            <div className="term-pills">
              <button 
                className={`term-pill ${termFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTermFilter('all')}
              >
                📁 All Projects ({projects.length})
              </button>
              <button 
                className={`term-pill ${termFilter === 'short-term' ? 'active' : ''}`}
                onClick={() => setTermFilter('short-term')}
              >
                ⚡ Short-Term ({shortTermCount})
              </button>
              <button 
                className={`term-pill ${termFilter === 'long-term' ? 'active' : ''}`}
                onClick={() => setTermFilter('long-term')}
              >
                🏔️ Long-Term ({longTermCount})
              </button>
            </div>
          </div>

          {mainView === 'roadmap' ? (
            <div className="project-roadmap-view">
              {/* Project Selector Filter & Step Type Filter */}
              <div className="project-selector-bar" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span className="selector-label">🗺️ View Roadmap For:</span>
                  <div className="project-filter-pills">
                    <button 
                      className={`filter-pill ${selectedProjectId === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedProjectId('all')}
                    >
                      All Projects ({filteredProjects.length})
                    </button>
                    {filteredProjects.map(p => (
                      <button 
                        key={`pill-${p.id}`}
                        className={`filter-pill ${selectedProjectId === p.id ? 'active' : ''}`}
                        onClick={() => setSelectedProjectId(p.id)}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Switcher for Steps: Goal Milestones vs All Steps */}
                <div className="segmented-control small">
                  <button 
                    className={`seg-btn ${portfolioRoadmapFilter === 'goals' ? 'active' : ''}`}
                    onClick={() => setPortfolioRoadmapFilter('goals')}
                  >
                    🎯 Goal Milestones
                  </button>
                  <button 
                    className={`seg-btn ${portfolioRoadmapFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setPortfolioRoadmapFilter('all')}
                  >
                    ⚡ All Steps
                  </button>
                </div>
              </div>

              <div className="roadmap-wrapper-card">
                {portfolioRoadmapMilestones.length > 0 ? (
                  <RoadmapVisualizer 
                    milestones={portfolioRoadmapMilestones}
                    goalTitle={selectedProjectId === 'all' ? 'All Projects Roadmap' : (projects.find(p => p.id === selectedProjectId)?.name || 'Project Roadmap')}
                    goalColor="#3b82f6"
                  />
                ) : (
                  <EmptyState 
                    icon="📁" 
                    title="No project milestones" 
                    text="Create a project with internal tasks to see its live roadmap journey." 
                    actionLabel="Create Project"
                    onAction={() => setIsModalOpen(true)}
                  />
                )}
              </div>
            </div>
          ) : (
            /* Project Cards Grid */
            <div className="projects-list-container">
              <div className="projects-grid">
                {filteredProjects.length === 0 ? (
                  <EmptyState
                    icon="📁"
                    title="No projects in this view"
                    text="Create a project or switch the horizon filter to view your projects."
                    actionLabel="Create Project"
                    onAction={() => setIsModalOpen(true)}
                  />
                ) : (
                  filteredProjects.map(p => {
                    const status = getProjectStatus(p);
                    const totalTasks = p.tasks?.length || 0;
                    const completedTasks = (p.tasks || []).filter(t => t.completed).length;
                    const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (p.isCompleted ? 100 : 0);
                    const isLongTerm = p.term === 'long-term';

                    return (
                      <div key={p.id} className={`project-card ${p.isCompleted ? 'completed-card' : ''}`}>
                        {/* Top Header with Status, Term, Completion Toggle & Actions */}
                        <div className="pc-header">
                          <div className="pc-header-left">
                            <span className={`status-badge ${status.replace(' ', '-').toLowerCase()}`}>{status}</span>
                            <span className={`term-tag ${isLongTerm ? 'long' : 'short'}`}>
                              {isLongTerm ? '🏔️ Long-Term' : '⚡ Short-Term'}
                            </span>
                            {p.projectType && <span className="pc-type">{p.projectType}</span>}
                          </div>
                          
                          <div className="pc-header-right">
                            {/* Executive Completion Toggle Button */}
                            <button 
                              type="button"
                              className={`btn-complete-toggle ${p.isCompleted ? 'is-done' : ''}`}
                              onClick={(e) => { e.stopPropagation(); toggleProjectComplete(p.id); }}
                              title={p.isCompleted ? "Mark as in progress" : "Mark project completed"}
                            >
                              <span className="chk-bubble">{p.isCompleted ? '✓' : ''}</span>
                              <span className="chk-label">{p.isCompleted ? 'Done' : 'Mark Done'}</span>
                            </button>

                            <button onClick={(e) => handleOpenEdit(p, e)} className="btn-action-icon edit" title="Edit Project">✏️</button>
                            <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="btn-action-icon delete" title="Delete Project">🗑️</button>
                          </div>
                        </div>
                        
                        {/* Project Title & Description */}
                        <div className="pc-title-row" onClick={() => setActiveProjectId(p.id)}>
                          <h4 className="pc-title" style={{ textDecoration: p.isCompleted ? 'line-through' : 'none' }}>
                            {p.name}
                          </h4>
                        </div>
                        {p.description && <p className="pc-desc">{p.description}</p>}
                        
                        {/* Progress Bar */}
                        <div className="pc-progress-section">
                          <div className="pc-progress-labels">
                            <span className="pc-task-count"><strong>{completedTasks}</strong> of {totalTasks} tasks done</span>
                            <span className="pc-pct">{progressPct}%</span>
                          </div>
                          <div className="pc-bar-bg">
                            <div className="pc-bar-fill" style={{ width: `${progressPct}%` }}></div>
                          </div>
                        </div>

                        {/* Project Dates */}
                        <div className="pc-dates">
                          <div className="pc-date-box">
                            <span className="pcd-label">STARTED</span>
                            <span className="pcd-val">📅 {formatDateTime(p.startDate)}</span>
                          </div>
                          <div className="pc-date-box highlighted">
                            <span className="pcd-label">DUE</span>
                            <span className="pcd-val">📅 {formatDateTime(p.dueDate)}</span>
                          </div>
                        </div>

                        {/* Open Details & Roadmap Button */}
                        <div className="pc-details-trigger-row">
                          <button 
                            className="btn-details-trigger"
                            onClick={() => setActiveProjectId(p.id)}
                          >
                            📊 Open Details & Roadmap →
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT PROJECT MODAL */}
      {/* ========================================================================= */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="modal-header">
          <h3>Edit Project</h3>
          <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>✕</button>
        </div>
        <form onSubmit={handleSaveEdit} className="productivity-form">
          <div className="form-group">
            <label>Project Name</label>
            <input 
              type="text" 
              value={editName} 
              onChange={e => setEditName(e.target.value)} 
              className="glowing-input" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={editDesc} 
              onChange={e => setEditDesc(e.target.value)} 
              className="glowing-input textarea" 
              rows="2" 
            />
          </div>
          
          <div className="form-group">
            <label>Project Horizon / Term</label>
            <div className="term-toggle-group">
              <button 
                type="button"
                className={`term-toggle-btn ${editTerm === 'short-term' ? 'active' : ''}`}
                onClick={() => setEditTerm('short-term')}
              >
                ⚡ Short-Term (&lt; 1 Month / Sprint)
              </button>
              <button 
                type="button"
                className={`term-toggle-btn ${editTerm === 'long-term' ? 'active' : ''}`}
                onClick={() => setEditTerm('long-term')}
              >
                🏔️ Long-Term (Multi-Month / Strategic)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Project Category / Type</label>
            <select value={editType} onChange={e => setEditType(e.target.value)} className="glowing-input">
              {projectTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Start Date</label>
              <input 
                type="date" 
                value={editStartDate} 
                onChange={e => setEditStartDate(e.target.value)} 
                className="glowing-input" 
                required 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Due Date</label>
              <input 
                type="date" 
                value={editDueDate} 
                onChange={e => setEditDueDate(e.target.value)} 
                className="glowing-input" 
                required 
              />
            </div>
          </div>
          <button type="submit" className="btn-submit primary-gradient" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* CREATE PROJECT MODAL */}
      {/* ========================================================================= */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="modal-header">
          <h3>Create New Project</h3>
          <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
        </div>
        <form onSubmit={handleCreateProject} className="productivity-form">
          <div className="form-group">
            <label>Project Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. School Management System"
              className="glowing-input"
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Strategic goals and execution plan..."
              className="glowing-input textarea"
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>Project Horizon / Term</label>
            <div className="term-toggle-group">
              <button 
                type="button"
                className={`term-toggle-btn ${term === 'short-term' ? 'active' : ''}`}
                onClick={() => setTerm('short-term')}
              >
                ⚡ Short-Term (&lt; 1 Month / Sprint)
              </button>
              <button 
                type="button"
                className={`term-toggle-btn ${term === 'long-term' ? 'active' : ''}`}
                onClick={() => setTerm('long-term')}
              >
                🏔️ Long-Term (Multi-Month / Strategic)
              </button>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Project Category</label>
              <button 
                type="button" 
                className="btn-text-link"
                onClick={() => setShowNewTypeInput(!showNewTypeInput)}
              >
                {showNewTypeInput ? 'Cancel' : '+ New Category'}
              </button>
            </div>
            {showNewTypeInput ? (
              <div className="new-type-row">
                <input 
                  type="text" 
                  placeholder="e.g. Product Launch" 
                  value={newType} 
                  onChange={e => setNewType(e.target.value)}
                  className="glowing-input"
                />
                <button type="button" onClick={handleAddProjectType} className="btn-small-add">Add</button>
              </div>
            ) : (
              <select value={type} onChange={e => setType(e.target.value)} className="glowing-input">
                {projectTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Start Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="glowing-input"
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Due Date</label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)} 
                className="glowing-input"
                required
              />
            </div>
          </div>
          {saveError && <p className="form-error">{saveError}</p>}
          <button type="submit" className="btn-submit primary-gradient" style={{marginTop: '10px'}} disabled={saving}>
            {saving ? 'Saving…' : 'Create Project'}
          </button>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* UNIVERSAL CSS STYLES (APPLIES TO BOTH MAIN AND DETAIL VIEWS) */}
      {/* ========================================================================= */}
      <style jsx>{`
        /* Segmented Controls */
        .segmented-control {
          display: inline-flex;
          background: var(--surface-low);
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
          border: 1px solid var(--border-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .segmented-control.small {
          border-radius: 8px;
          padding: 3px;
          gap: 3px;
        }
        .segmented-control.main-tabs {
          border-radius: 14px;
          padding: 5px;
          gap: 6px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
        }
        .seg-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .segmented-control.small .seg-btn {
          padding: 5px 12px;
          font-size: 0.78rem;
          border-radius: 6px;
        }
        .segmented-control.main-tabs .seg-btn {
          padding: 10px 20px;
          font-size: 0.9rem;
          border-radius: 10px;
        }
        .seg-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.04);
        }
        .seg-btn.active {
          background: var(--surface-low);
          color: var(--accent-start);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 229, 255, 0.3);
        }
        .segmented-control.main-tabs .seg-btn.active {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.12), rgba(59, 130, 246, 0.16));
          border-color: var(--accent-start);
        }

        /* Detail View Layout */
        .project-detail-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .detail-top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn-back {
          background: var(--surface);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        .btn-back:hover {
          color: var(--accent-start);
          border-color: var(--accent-start);
          transform: translateX(-3px);
        }

        .project-detail-hero {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 24px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          flex-wrap: wrap;
        }
        .hero-left {
          flex: 1;
          min-width: 280px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tag-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .project-detail-title {
          font-size: 1.65rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.3;
        }
        .project-detail-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .detail-date-card {
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 12px 18px;
          display: flex;
          gap: 20px;
        }
        .ddc-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ddc-lbl {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }
        .ddc-val {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .ddc-item.highlight .ddc-val {
          color: var(--accent-start);
        }

        /* Detail Tabs Switcher */
        .detail-tabs-bar {
          display: flex;
          justify-content: flex-start;
          margin-top: 4px;
        }

        /* Roadmap Tab Controls */
        .roadmap-controls-card {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 14px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .rc-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .rc-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .quick-goal-form {
          display: flex;
          gap: 8px;
          flex: 1;
          max-width: 480px;
        }
        .quick-goal-input {
          flex: 1;
          padding: 9px 14px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-primary);
          font-size: 0.85rem;
        }
        .quick-goal-input:focus {
          outline: none;
          border-color: var(--accent-start);
          box-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
        }
        .btn-add-step {
          padding: 9px 18px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, var(--accent-start), #0284c7);
          color: #fff;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.2s;
        }
        .btn-add-step:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }

        /* Performance Grid */
        .performance-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 800px) {
          .performance-detail-grid { grid-template-columns: 1fr; }
        }
        .perf-main-card {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        .section-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .section-sub {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: 4px 0 0 0;
        }
        .donut-chart-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 10px 0;
        }
        .donut-chart-wrapper.large {
          width: 160px;
          height: 160px;
          position: relative;
        }
        .donut-pct.large {
          font-size: 1.8rem;
          font-weight: 900;
          color: var(--text-primary);
        }
        .progress-bar-detail {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pbd-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 600;
        }
        .pbd-track {
          height: 10px;
          background: var(--surface-low);
          border-radius: 9999px;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }
        .pbd-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-start), #0284c7);
          border-radius: 9999px;
          transition: width 0.5s ease;
        }

        .perf-metrics-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .metric-box {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
        }
        .metric-icon {
          font-size: 1.8rem;
          background: var(--surface-low);
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }
        .metric-data {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .metric-num {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .metric-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        /* Tasks Tab */
        .tasks-management-panel {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .detail-task-form {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .detail-cat-picker {
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 600;
        }
        .detail-task-input {
          flex: 1;
          min-width: 260px;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-primary);
          font-size: 0.9rem;
        }
        .detail-task-input:focus {
          outline: none;
          border-color: var(--accent-start);
        }
        .btn-add-primary {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, var(--accent-start), #0284c7);
          color: #fff;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .detail-tasks-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .detail-task-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          transition: all 0.2s ease;
        }
        .detail-task-card.completed {
          opacity: 0.65;
        }
        .detail-task-card.completed .task-title-text {
          text-decoration: line-through;
        }
        .task-content {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .task-title-text {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        /* Horizon / Term Filter Bar */
        .term-filter-bar {
          margin: 18px 0 24px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .term-pills {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .term-pill {
          padding: 8px 16px;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .term-pill:hover {
          color: var(--text-primary);
          border-color: rgba(0, 229, 255, 0.4);
          transform: translateY(-1px);
        }
        .term-pill.active {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(59, 130, 246, 0.2));
          color: var(--accent-start);
          border-color: var(--accent-start);
          box-shadow: 0 0 12px rgba(0, 229, 255, 0.2);
        }

        /* Projects Grid */
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 24px;
        }
        .project-card {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .project-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
          border-color: rgba(0, 229, 255, 0.3);
        }
        .project-card.completed-card {
          border-color: rgba(16, 185, 129, 0.4);
          background: linear-gradient(180deg, var(--surface), rgba(16, 185, 129, 0.03));
        }

        /* Card Header & Completion Toggle */
        .pc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pc-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pc-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-badge {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .status-badge.in-progress { background: rgba(0, 229, 255, 0.15); color: var(--accent-start); }
        .status-badge.completed { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .status-badge.planned { background: rgba(148, 163, 184, 0.15); color: var(--text-muted); }

        .term-tag {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .term-tag.short {
          background: rgba(245, 158, 11, 0.12);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.25);
        }
        .term-tag.long {
          background: rgba(139, 92, 246, 0.12);
          color: #a78bfa;
          border: 1px solid rgba(139, 92, 246, 0.25);
        }

        .pc-type {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        /* Executive Completion Toggle Button */
        .btn-complete-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-secondary);
        }
        .btn-complete-toggle:hover {
          border-color: #10b981;
          color: #10b981;
          transform: scale(1.02);
        }
        .btn-complete-toggle.is-done {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border-color: #10b981;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
        }
        .chk-bubble {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 1.5px solid currentColor;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 900;
        }

        .btn-action-icon {
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          font-size: 0.9rem;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .btn-action-icon:hover { transform: scale(1.08); border-color: var(--accent-start); }

        .pc-title-row { cursor: pointer; }
        .pc-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.4;
        }
        .pc-title:hover { color: var(--accent-start); }
        .pc-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        /* Progress Bar */
        .pc-progress-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pc-progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
        }
        .pc-task-count { color: var(--text-muted); }
        .pc-pct { font-weight: 700; color: var(--accent-start); }
        .pc-bar-bg {
          height: 8px;
          background: var(--surface-low);
          border-radius: 9999px;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }
        .pc-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-start), #0284c7);
          border-radius: 9999px;
          transition: width 0.4s ease;
        }

        /* Dates */
        .pc-dates {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .pc-date-box {
          background: var(--surface-low);
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pc-date-box.highlighted {
          border-color: rgba(0, 229, 255, 0.25);
        }
        .pcd-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }
        .pcd-val {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        /* Details & Performance Button */
        .pc-details-trigger-row {
          margin-top: 2px;
        }
        .btn-details-trigger {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid rgba(0, 229, 255, 0.3);
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.08), rgba(59, 130, 246, 0.08));
          color: var(--accent-start);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-details-trigger:hover {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.18), rgba(59, 130, 246, 0.18));
          border-color: var(--accent-start);
          transform: translateY(-1px);
        }

        /* Checklist */
        .pc-tasks-section {
          border-top: 1px dashed var(--border-color);
          padding-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pc-tasks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pct-title {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }
        .pct-counter {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-start);
        }

        .pc-tasks-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 180px;
          overflow-y: auto;
        }
        .pc-task-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 8px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          font-size: 0.85rem;
        }
        .pc-task-item.completed .pc-task-text {
          text-decoration: line-through;
          color: var(--text-muted);
        }
        .pc-task-check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: 0.2s;
        }
        .pc-task-check:hover { border-color: var(--accent-start); transform: scale(1.05); }
        .pc-task-check.checked { background: var(--accent-start); border-color: var(--accent-start); color: #fff; }
        
        .pc-task-text-group {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .category-micro-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 4px;
        }
        .category-micro-badge.goal {
          background: rgba(0, 229, 255, 0.15);
          color: var(--accent-start);
        }
        .pc-task-text { color: var(--text-primary); line-height: 1.4; }
        .btn-del-task {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.8rem;
          padding: 2px 4px;
        }
        .btn-del-task:hover { color: var(--accent-danger); }

        .pc-add-task-form {
          display: flex;
          gap: 6px;
          margin-top: 4px;
        }
        .pc-cat-select {
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 0.75rem;
          padding: 4px 6px;
        }
        .pc-add-task-input {
          flex: 1;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-primary);
          font-size: 0.8rem;
        }
        .pc-add-task-input:focus { outline: none; border-color: var(--accent-start); }
        .pc-btn-add-task {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          background: rgba(0, 229, 255, 0.15);
          color: var(--accent-start);
          font-weight: 700;
          cursor: pointer;
        }
        .pc-btn-add-task:hover { background: var(--accent-start); color: #fff; }

        /* Roadmap View Elements */
        .project-roadmap-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .project-selector-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 12px 16px;
          background: var(--surface);
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }
        .selector-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .project-filter-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-pill {
          padding: 6px 12px;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-pill:hover {
          color: var(--text-primary);
          border-color: rgba(0, 229, 255, 0.4);
        }
        .filter-pill.active {
          background: var(--accent-start);
          color: #fff;
          border-color: var(--accent-start);
          box-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
        }
        .roadmap-wrapper-card {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
        }

        /* Donut SVG Common */
        .donut-svg {
          transform: rotate(-90deg);
        }
        .donut-bg {
          fill: none;
          stroke: rgba(255, 255, 255, 0.08);
          stroke-width: 3.8;
        }
        .donut-fill {
          fill: none;
          stroke: var(--accent-start);
          stroke-width: 3.8;
          stroke-linecap: round;
          transition: stroke-dasharray 0.5s ease;
        }
        .donut-text {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .donut-sub {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .task-badge {
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .task-badge.goal {
          background: rgba(0, 229, 255, 0.15);
          color: var(--accent-start);
        }
        .task-badge.normal {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
        }

        /* Form styling */
        .term-toggle-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .term-toggle-btn {
          padding: 10px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        .term-toggle-btn:hover {
          border-color: rgba(0, 229, 255, 0.4);
          color: var(--text-primary);
        }
        .term-toggle-btn.active {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(59, 130, 246, 0.2));
          border-color: var(--accent-start);
          color: var(--accent-start);
          box-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
        }

        .create-project-btn {
          background: linear-gradient(135deg, var(--accent-start), #0284c7);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .create-project-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 229, 255, 0.5);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-header h3 { margin: 0; color: var(--text-primary); }
        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.2rem;
          cursor: pointer;
        }
        .close-btn:hover { color: var(--accent-danger); }

        .productivity-form { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-row { display: flex; gap: 16px; }
        .form-group label { font-size: 0.8rem; color: var(--text-primary); font-weight: 700; }
        .glowing-input {
          width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color);
          background: var(--surface-low); color: var(--text-primary); font-size: 0.9rem; transition: 0.3s;
        }
        .glowing-input:focus { border-color: var(--accent-start); box-shadow: 0 0 10px rgba(0,229,255,0.15); outline: none; }
        .textarea { resize: vertical; }

        .btn-text-link {
          background: transparent; border: none; color: var(--accent-start); font-size: 0.8rem; font-weight: 700; cursor: pointer;
        }
        .new-type-row { display: flex; gap: 8px; }
        .btn-small-add {
          padding: 8px 16px; border-radius: 8px; border: none; background: var(--accent-start); color: #fff; font-weight: 700; cursor: pointer;
        }
        .form-error {
          margin: 10px 0 0; padding: 10px 14px; border-radius: 10px; background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.35); color: #fda4af; font-size: 0.85rem;
        }
        .btn-submit {
          padding: 12px; border-radius: 8px; border: none; color: white; font-weight: 600; cursor: pointer;
          background: linear-gradient(135deg, var(--accent-start), #0284c7); transition: 0.2s;
        }
        .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,229,255,0.3); }

        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
