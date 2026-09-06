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

  // View state
  const [mainView, setMainView] = useState('list'); // 'list' | 'roadmap'
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [termFilter, setTermFilter] = useState('all'); // 'all' | 'short-term' | 'long-term'

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

  // Details & Performance Modal State
  const [activeDetailsProject, setActiveDetailsProject] = useState(null);
  const [detailsSubTaskFilter, setDetailsSubTaskFilter] = useState('all'); // 'all' | 'goals' | 'normal'
  const [detailsNewTaskText, setDetailsNewTaskText] = useState('');
  const [detailsNewTaskCategory, setDetailsNewTaskCategory] = useState('normal'); // 'normal' | 'goal'

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

  const handleAddDetailsTask = (e) => {
    e.preventDefault();
    if (!activeDetailsProject || !detailsNewTaskText.trim()) return;
    addProjectTask(activeDetailsProject.id, { 
      text: detailsNewTaskText.trim(), 
      category: detailsNewTaskCategory 
    });
    setDetailsNewTaskText('');
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

  // Filter projects based on Horizon / Term
  const filteredProjects = useMemo(() => {
    if (termFilter === 'all') return projects;
    return projects.filter(p => (p.term || 'short-term') === termFilter);
  }, [projects, termFilter]);

  const shortTermCount = useMemo(() => projects.filter(p => (p.term || 'short-term') === 'short-term').length, [projects]);
  const longTermCount = useMemo(() => projects.filter(p => p.term === 'long-term').length, [projects]);

  // Compute Project Roadmap Milestones
  const roadmapMilestones = useMemo(() => {
    if (selectedProjectId === 'all') {
      return filteredProjects.map((p, idx) => {
        const tasksCount = p.tasks?.length || 0;
        const doneCount = (p.tasks || []).filter(t => t.completed).length;
        const state = p.isCompleted ? 'completed' : doneCount > 0 ? 'active' : 'locked';
        return {
          id: p.id,
          text: `${p.name} (${doneCount}/${tasksCount} tasks)`,
          state,
          step: idx + 1,
          type: 'project'
        };
      });
    }

    const currentProject = projects.find(p => p.id === selectedProjectId);
    if (!currentProject) return [];

    const tasks = currentProject.tasks || [];
    if (tasks.length === 0) {
      return [
        { id: `${currentProject.id}-start`, text: `${currentProject.name} (Started)`, state: 'completed', step: 1 },
        { id: `${currentProject.id}-finish`, text: `${currentProject.name} (Delivery)`, state: currentProject.isCompleted ? 'completed' : 'active', step: 2 }
      ];
    }

    return tasks.map((t, idx) => ({
      id: t.id,
      text: `${t.category === 'goal' ? '🎯 ' : '⚡ '}${t.text}`,
      state: t.completed ? 'completed' : 'locked',
      step: idx + 1,
      type: t.category === 'goal' ? 'goal' : 'task'
    }));
  }, [filteredProjects, projects, selectedProjectId]);

  // Sync active details project with latest state
  const currentDetailsProject = useMemo(() => {
    if (!activeDetailsProject) return null;
    return projects.find(p => p.id === activeDetailsProject.id) || activeDetailsProject;
  }, [projects, activeDetailsProject]);

  return (
    <div className="module-container fade-in">
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
          {/* Project Selector Filter */}
          <div className="project-selector-bar">
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

          <div className="roadmap-wrapper-card">
            {roadmapMilestones.length > 0 ? (
              <RoadmapVisualizer 
                milestones={roadmapMilestones}
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
                        {/* Professionally Designed Executive Completion Toggle Button */}
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
                    <div className="pc-title-row" onClick={() => setActiveDetailsProject(p)}>
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

                    {/* View Details & Performance Button */}
                    <div className="pc-details-trigger-row">
                      <button 
                        className="btn-details-trigger"
                        onClick={() => setActiveDetailsProject(p)}
                      >
                        📊 View Details & Analytics
                      </button>
                    </div>

                    {/* Nested Checklist */}
                    <div className="pc-tasks-section">
                      <div className="pc-tasks-header">
                        <span className="pct-title">PROJECT CHECKLIST</span>
                        <span className="pct-counter">{completedTasks}/{totalTasks}</span>
                      </div>

                      <div className="pc-tasks-list">
                        {(p.tasks || []).map(t => (
                          <div key={t.id} className={`pc-task-item ${t.completed ? 'completed' : ''}`}>
                            <div 
                              className={`pc-task-check ${t.completed ? 'checked' : ''}`}
                              onClick={() => toggleProjectTask(p.id, t.id)}
                            >
                              {t.completed && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              )}
                            </div>
                            <div className="pc-task-text-group">
                              {t.category === 'goal' && <span className="category-micro-badge goal">🎯 Goal</span>}
                              <span className="pc-task-text">{t.text}</span>
                            </div>
                            <button onClick={() => deleteProjectTask(p.id, t.id)} className="btn-del-task">✕</button>
                          </div>
                        ))}
                      </div>

                      {/* Add Sub-Task Quick Form */}
                      <form onSubmit={(e) => handleAddInternalTask(e, p.id)} className="pc-add-task-form">
                        <select 
                          value={newTaskCategory[p.id] || 'normal'}
                          onChange={(e) => setNewTaskCategory(prev => ({ ...prev, [p.id]: e.target.value }))}
                          className="pc-cat-select"
                        >
                          <option value="normal">⚡ Task</option>
                          <option value="goal">🎯 Goal</option>
                        </select>
                        <input 
                          type="text"
                          placeholder="+ Add task step & press Enter..."
                          value={newTaskInput[p.id] || ''}
                          onChange={(e) => setNewTaskInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                          className="pc-add-task-input"
                        />
                        <button type="submit" className="pc-btn-add-task">+</button>
                      </form>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROJECT DETAILS & PERFORMANCE MODAL */}
      {/* ========================================================================= */}
      {currentDetailsProject && (
        <Modal isOpen={!!activeDetailsProject} onClose={() => setActiveDetailsProject(null)}>
          <div className="details-modal-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className={`status-badge ${getProjectStatus(currentDetailsProject).replace(' ', '-').toLowerCase()}`}>
                  {getProjectStatus(currentDetailsProject)}
                </span>
                <span className={`term-tag ${currentDetailsProject.term === 'long-term' ? 'long' : 'short'}`}>
                  {currentDetailsProject.term === 'long-term' ? '🏔️ Long-Term' : '⚡ Short-Term'}
                </span>
                {currentDetailsProject.projectType && (
                  <span className="pc-type">{currentDetailsProject.projectType}</span>
                )}
              </div>
              <h3 className="details-title">{currentDetailsProject.name}</h3>
            </div>
            <button className="close-btn" onClick={() => setActiveDetailsProject(null)}>✕</button>
          </div>

          <div className="details-modal-body">
            {currentDetailsProject.description && (
              <p className="details-desc">{currentDetailsProject.description}</p>
            )}

            {/* Performance & Analytics Section */}
            <div className="performance-card">
              <div className="perf-header">
                <h4>📊 Project Performance & Health</h4>
                <button 
                  className={`btn-complete-toggle ${currentDetailsProject.isCompleted ? 'is-done' : ''}`}
                  onClick={() => toggleProjectComplete(currentDetailsProject.id)}
                >
                  <span className="chk-bubble">{currentDetailsProject.isCompleted ? '✓' : ''}</span>
                  <span className="chk-label">{currentDetailsProject.isCompleted ? 'Completed' : 'Mark Project Done'}</span>
                </button>
              </div>

              {(() => {
                const tasks = currentDetailsProject.tasks || [];
                const total = tasks.length;
                const completed = tasks.filter(t => t.completed).length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : (currentDetailsProject.isCompleted ? 100 : 0);
                
                const goalTasks = tasks.filter(t => t.category === 'goal');
                const normalTasks = tasks.filter(t => t.category !== 'goal');
                const completedGoals = goalTasks.filter(t => t.completed).length;
                const completedNormals = normalTasks.filter(t => t.completed).length;

                // Dates calculation
                const now = new Date();
                const due = currentDetailsProject.dueDate ? new Date(currentDetailsProject.dueDate) : null;
                const daysLeft = due ? Math.ceil((due - now) / (1000 * 60 * 60 * 24)) : null;

                return (
                  <div className="perf-grid">
                    {/* Donut Progress Metric */}
                    <div className="perf-chart-box">
                      <div className="donut-chart-wrapper">
                        <svg className="donut-svg" width="110" height="110" viewBox="0 0 36 36">
                          <path
                            className="donut-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="donut-fill"
                            strokeDasharray={`${pct}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="donut-text">
                          <span className="donut-pct">{pct}%</span>
                          <span className="donut-sub">Complete</span>
                        </div>
                      </div>
                    </div>

                    {/* Key Metrics Stats */}
                    <div className="perf-stats-boxes">
                      <div className="metric-pill">
                        <span className="m-val">{completed}/{total}</span>
                        <span className="m-lbl">Total Tasks Done</span>
                      </div>
                      <div className="metric-pill">
                        <span className="m-val">🎯 {completedGoals}/{goalTasks.length}</span>
                        <span className="m-lbl">Goal Milestones</span>
                      </div>
                      <div className="metric-pill">
                        <span className="m-val">⚡ {completedNormals}/{normalTasks.length}</span>
                        <span className="m-lbl">Actionable Tasks</span>
                      </div>
                      <div className="metric-pill">
                        <span className="m-val">
                          {daysLeft === null ? 'No Date' : daysLeft < 0 ? `Overdue (${Math.abs(daysLeft)}d)` : `${daysLeft} days`}
                        </span>
                        <span className="m-lbl">Schedule Health</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Key Sub-Tasks Section with Switchers */}
            <div className="details-subtasks-section">
              <div className="subtasks-header-row">
                <h4>Key Sub-Tasks & Milestones</h4>
                
                {/* Switcher: All | Goal Milestones | Actionable Tasks */}
                <div className="subtask-segmented-control">
                  <button 
                    className={`sub-seg-btn ${detailsSubTaskFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setDetailsSubTaskFilter('all')}
                  >
                    All ({(currentDetailsProject.tasks || []).length})
                  </button>
                  <button 
                    className={`sub-seg-btn ${detailsSubTaskFilter === 'goals' ? 'active' : ''}`}
                    onClick={() => setDetailsSubTaskFilter('goals')}
                  >
                    🎯 Goals ({(currentDetailsProject.tasks || []).filter(t => t.category === 'goal').length})
                  </button>
                  <button 
                    className={`sub-seg-btn ${detailsSubTaskFilter === 'normal' ? 'active' : ''}`}
                    onClick={() => setDetailsSubTaskFilter('normal')}
                  >
                    ⚡ Tasks ({(currentDetailsProject.tasks || []).filter(t => t.category !== 'goal').length})
                  </button>
                </div>
              </div>

              {/* Add Sub-Task inside Details */}
              <form onSubmit={handleAddDetailsTask} className="details-add-task-form">
                <select 
                  value={detailsNewTaskCategory} 
                  onChange={e => setDetailsNewTaskCategory(e.target.value)}
                  className="glowing-input details-cat-select"
                >
                  <option value="normal">⚡ Actionable Task</option>
                  <option value="goal">🎯 Goal Milestone</option>
                </select>
                <input 
                  type="text" 
                  value={detailsNewTaskText} 
                  onChange={e => setDetailsNewTaskText(e.target.value)}
                  placeholder="Add a new milestone or sub-task..."
                  className="glowing-input details-task-input"
                />
                <button type="submit" className="btn-add-detail-task">+ Add</button>
              </form>

              {/* Sub-Tasks List */}
              <div className="details-task-items">
                {(() => {
                  const all = currentDetailsProject.tasks || [];
                  const list = detailsSubTaskFilter === 'goals' 
                    ? all.filter(t => t.category === 'goal')
                    : detailsSubTaskFilter === 'normal'
                    ? all.filter(t => t.category !== 'goal')
                    : all;

                  if (list.length === 0) {
                    return (
                      <p className="no-subtasks-msg">
                        No sub-tasks in this category. Add one above!
                      </p>
                    );
                  }

                  return list.map(t => (
                    <div key={t.id} className={`details-task-row ${t.completed ? 'completed' : ''}`}>
                      <div 
                        className={`pc-task-check ${t.completed ? 'checked' : ''}`}
                        onClick={() => toggleProjectTask(currentDetailsProject.id, t.id)}
                      >
                        {t.completed && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        )}
                      </div>
                      <div className="details-task-text-group">
                        <span className={`task-badge ${t.category === 'goal' ? 'goal' : 'normal'}`}>
                          {t.category === 'goal' ? '🎯 Goal Milestone' : '⚡ Task'}
                        </span>
                        <span className="details-task-title">{t.text}</span>
                      </div>
                      <button 
                        onClick={() => deleteProjectTask(currentDetailsProject.id, t.id)} 
                        className="btn-del-task" 
                        title="Delete task"
                      >
                        ✕
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </Modal>
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
          
          {/* Horizon / Term Selector in Edit */}
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
              placeholder="e.g. Mobile App Redesign"
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

          {/* Horizon / Term Selector */}
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

      <style jsx>{`
        /* Term / Horizon Filter Bar */
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
          padding: 5px 10px;
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
          background: transparent;
          border: none;
          font-size: 0.9rem;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          opacity: 0.7;
          transition: opacity 0.2s, transform 0.2s;
        }
        .btn-action-icon:hover { opacity: 1; transform: scale(1.1); }

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
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-details-trigger:hover {
          color: var(--accent-start);
          border-color: var(--accent-start);
          background: rgba(0, 229, 255, 0.08);
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
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1.5px solid var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: 0.2s;
        }
        .pc-task-check:hover { border-color: var(--accent-start); }
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

        /* Details Modal Styles */
        .details-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .details-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .details-modal-body {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .details-desc {
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
          font-size: 0.9rem;
        }

        .performance-card {
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .perf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .perf-header h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .perf-grid {
          display: grid;
          grid-template-columns: 130px 1fr;
          gap: 16px;
          align-items: center;
        }
        .donut-chart-wrapper {
          position: relative;
          width: 110px;
          height: 110px;
          margin: 0 auto;
        }
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
        .donut-pct {
          font-size: 1.2rem;
          font-weight: 900;
          color: var(--text-primary);
        }
        .donut-sub {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .perf-stats-boxes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .metric-pill {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .m-val {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .m-lbl {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        /* Sub-Tasks section inside Details Modal */
        .details-subtasks-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .subtasks-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .subtasks-header-row h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .subtask-segmented-control {
          display: flex;
          background: var(--surface-low);
          border-radius: 8px;
          padding: 3px;
          border: 1px solid var(--border-color);
        }
        .sub-seg-btn {
          padding: 4px 10px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }
        .sub-seg-btn.active {
          background: var(--surface);
          color: var(--accent-start);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .details-add-task-form {
          display: flex;
          gap: 8px;
        }
        .details-cat-select {
          width: auto;
          font-size: 0.85rem;
        }
        .details-task-input {
          flex: 1;
        }
        .btn-add-detail-task {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: var(--accent-start);
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .details-task-items {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 240px;
          overflow-y: auto;
        }
        .details-task-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
        }
        .details-task-row.completed .details-task-title {
          text-decoration: line-through;
          color: var(--text-muted);
        }
        .details-task-text-group {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .task-badge {
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 6px;
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
        .details-task-title {
          font-size: 0.9rem;
          color: var(--text-primary);
        }
        .no-subtasks-msg {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
          padding: 16px;
          margin: 0;
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
