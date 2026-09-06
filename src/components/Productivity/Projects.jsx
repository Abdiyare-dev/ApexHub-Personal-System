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

  // Create Project Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState(projectTypes[0] || 'Personal');
  
  // Custom Project Type
  const [newType, setNewType] = useState('');
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);

  // Edit Modal State
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  // New nested task state
  const [newTaskInput, setNewTaskInput] = useState({});

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
        tasks: []
      });
      setName('');
      setDescription('');
      setStartDate('');
      setDueDate('');
      setType(projectTypes[0] || 'Personal');
      setIsModalOpen(false);
    } catch (err) {
      setSaveError(err?.message || 'Could not save this project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setEditName(project.name || '');
    setEditDesc(project.description || '');
    setEditType(project.projectType || projectTypes[0] || 'Personal');
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
    addProjectTask(projectId, text.trim());
    setNewTaskInput(prev => ({ ...prev, [projectId]: '' }));
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

  // Compute Project Roadmap Milestones
  const roadmapMilestones = useMemo(() => {
    if (selectedProjectId === 'all') {
      return projects.map((p, idx) => {
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
      text: t.text,
      state: t.completed ? 'completed' : 'locked',
      step: idx + 1,
      type: 'task'
    }));
  }, [projects, selectedProjectId]);

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

          {mainView === 'list' && (
            <button className="create-project-btn" onClick={() => setIsModalOpen(true)}>
              + Create Project
            </button>
          )}
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
                All Projects ({projects.length})
              </button>
              {projects.map(p => (
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
            {projects.length === 0 ? (
              <EmptyState
                icon="📁"
                title="No projects yet"
                text="Group related work into a project and track its tasks in one place."
                actionLabel="Create project"
                onAction={() => setIsModalOpen(true)}
              />
            ) : (
              projects.map(p => {
                const status = getProjectStatus(p);
                const totalTasks = p.tasks?.length || 0;
                const completedTasks = (p.tasks || []).filter(t => t.completed).length;
                const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (p.isCompleted ? 100 : 0);

                return (
                  <div key={p.id} className={`project-card ${p.isCompleted ? 'completed-card' : ''}`}>
                    <div className="pc-header">
                      <div className="pc-header-left">
                        <span className={`status-badge ${status.replace(' ', '-').toLowerCase()}`}>{status}</span>
                        <span className="pc-type">{p.projectType}</span>
                      </div>
                      <div className="pc-header-right">
                        <button onClick={() => handleOpenEdit(p)} className="btn-edit" title="Edit Project">✏️</button>
                        <button onClick={() => deleteProject(p.id)} className="btn-delete" title="Delete Project">🗑️</button>
                      </div>
                    </div>
                    
                    <h4 className="pc-title" style={{ textDecoration: p.isCompleted ? 'line-through' : 'none' }}>{p.name}</h4>
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

                    {/* Internal Project Tasks */}
                    <div className="pc-tasks-section">
                      <div className="pct-header-row">
                        <span className="pct-header">Project Checklist</span>
                        <label className="project-complete-toggle">
                          <input 
                            type="checkbox" 
                            checked={p.isCompleted} 
                            onChange={() => toggleProjectComplete(p.id)} 
                          />
                          <span className="toggle-label">{p.isCompleted ? 'Completed' : 'Mark Project Done'}</span>
                        </label>
                      </div>

                      <div className="pct-list">
                        {(p.tasks || []).map(t => (
                          <div key={t.id} className="pct-item">
                            <button
                              type="button"
                              className={`pct-check ${t.completed ? 'checked' : ''}`}
                              onClick={() => toggleProjectTask(p.id, t.id)}
                            >
                              {t.completed ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : null}
                            </button>
                            <span className={`pct-text ${t.completed ? 'completed' : ''}`}>
                              {t.text}
                            </span>
                            <button onClick={() => deleteProjectTask(p.id, t.id)} className="pct-del" title="Delete task">✕</button>
                          </div>
                        ))}
                      </div>
                      
                      {!p.isCompleted && (
                        <form onSubmit={(e) => handleAddInternalTask(e, p.id)} className="pct-add-form">
                          <input 
                            type="text" 
                            placeholder="+ Add task step & press Enter..." 
                            value={newTaskInput[p.id] || ''}
                            onChange={(e) => setNewTaskInput({ ...newTaskInput, [p.id]: e.target.value })}
                            className="pct-input"
                          />
                          <button type="submit" className="pct-btn">+</button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="modal-header">
          <h3>Create New Project</h3>
          <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
        </div>
        
        <form onSubmit={handleCreateProject} className="projects-form">
          <div className="form-group">
            <label>Project Title *</label>
            <input 
              type="text" 
              placeholder="e.g. Website Rebranding" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              placeholder="Key deliverables and objectives..." 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Due Date *</label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Project Type</label>
            <div className="type-select-row">
              <select value={type} onChange={e => setType(e.target.value)}>
                {projectTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button 
                type="button" 
                className="btn-add-type" 
                onClick={() => setShowNewTypeInput(!showNewTypeInput)}
              >
                + New Type
              </button>
            </div>
          </div>

          {showNewTypeInput && (
            <div className="new-type-row">
              <input 
                type="text" 
                placeholder="New type name..." 
                value={newType} 
                onChange={e => setNewType(e.target.value)} 
              />
              <button type="button" onClick={handleAddProjectType} className="btn-save-type">Add</button>
            </div>
          )}

          {saveError && <p className="form-error-msg">{saveError}</p>}

          <div className="modal-actions">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT PROJECT MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="modal-header">
          <h3>Edit Project</h3>
          <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>✕</button>
        </div>
        
        <form onSubmit={handleSaveEdit} className="projects-form">
          <div className="form-group">
            <label>Project Title *</label>
            <input 
              type="text" 
              value={editName} 
              onChange={e => setEditName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={editDesc} 
              onChange={e => setEditDesc(e.target.value)} 
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input 
                type="date" 
                value={editStartDate} 
                onChange={e => setEditStartDate(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input 
                type="date" 
                value={editDueDate} 
                onChange={e => setEditDueDate(e.target.value)} 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Project Type</label>
            <select value={editType} onChange={e => setEditType(e.target.value)}>
              {projectTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <style jsx>{`
        .create-project-btn {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: #fff;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: 0.2s;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
        }
        .create-project-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .project-roadmap-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .project-selector-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          padding: 12px 16px;
          border-radius: 12px;
          flex-wrap: wrap;
        }
        .selector-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .project-filter-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-pill {
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }
        .filter-pill:hover {
          color: var(--text-primary);
          border-color: #0ea5e9;
        }
        .filter-pill.active {
          background: #0ea5e9;
          color: white;
          border-color: #0ea5e9;
          box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
        }

        .roadmap-wrapper-card {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 12px;
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
        }

        .project-card {
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .project-card:hover {
          border-color: rgba(14, 165, 233, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }
        .project-card.completed-card {
          opacity: 0.85;
          border-color: rgba(16, 185, 129, 0.3);
        }

        .pc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pc-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-badge {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .status-badge.completed { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .status-badge.in-progress { background: rgba(14, 165, 233, 0.15); color: #0ea5e9; }
        .status-badge.planned { background: var(--surface-low); color: var(--text-muted); }
        .pc-type {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .pc-header-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-edit, .btn-delete {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.95rem;
          padding: 4px 6px;
          border-radius: 6px;
          transition: 0.15s;
        }
        .btn-edit:hover { background: rgba(14, 165, 233, 0.1); }
        .btn-delete:hover { background: rgba(239, 68, 68, 0.1); }

        .pc-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.3;
        }
        .pc-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.4;
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
          font-size: 0.78rem;
        }
        .pc-task-count { color: var(--text-secondary); }
        .pc-pct { font-weight: 700; color: #0ea5e9; }
        .pc-bar-bg {
          width: 100%;
          height: 6px;
          background: var(--surface-low);
          border-radius: 999px;
          overflow: hidden;
        }
        .pc-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #0ea5e9, #10b981);
          border-radius: 999px;
          transition: width 0.3s;
        }

        .pc-dates {
          display: flex;
          gap: 10px;
        }
        .pc-date-box {
          flex: 1;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          padding: 8px 10px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pc-date-box.highlighted {
          border-color: rgba(14, 165, 233, 0.3);
        }
        .pcd-label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); }
        .pcd-val { font-size: 0.78rem; font-weight: 600; color: var(--text-primary); }

        /* Tasks section */
        .pc-tasks-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px solid var(--border-color);
          padding-top: 12px;
        }
        .pct-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pct-header {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .project-complete-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
          cursor: pointer;
        }
        .pct-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 160px;
          overflow-y: auto;
        }
        .pct-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-low);
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 0.82rem;
        }
        .pct-check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid var(--border-color);
          background: transparent;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: 0.15s;
        }
        .pct-check.checked {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }
        .pct-text {
          flex: 1;
          color: var(--text-primary);
          word-break: break-word;
        }
        .pct-text.completed {
          text-decoration: line-through;
          color: var(--text-muted);
        }
        .pct-del {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.75rem;
          opacity: 0.5;
        }
        .pct-del:hover { opacity: 1; color: #ef4444; }

        .pct-add-form {
          display: flex;
          gap: 6px;
          margin-top: 4px;
        }
        .pct-input {
          flex: 1;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 0.78rem;
          color: var(--text-primary);
          outline: none;
        }
        .pct-input:focus { border-color: #0ea5e9; }
        .pct-btn {
          background: rgba(14, 165, 233, 0.15);
          color: #0ea5e9;
          border: none;
          border-radius: 6px;
          padding: 0 10px;
          font-weight: 700;
          cursor: pointer;
        }

        /* Modal styling */
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.2rem;
          cursor: pointer;
        }
        .projects-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .form-group input, .form-group textarea, .form-group select {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 8px 12px;
          color: var(--text-primary);
          font-size: 0.85rem;
          outline: none;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .type-select-row {
          display: flex;
          gap: 8px;
        }
        .type-select-row select { flex: 1; }
        .btn-add-type {
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .new-type-row {
          display: flex;
          gap: 8px;
        }
        .new-type-row input { flex: 1; }
        .btn-save-type {
          background: #0ea5e9;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0 12px;
          cursor: pointer;
          font-weight: 700;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
        }
        .btn-cancel {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn-submit {
          background: #0ea5e9;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
