"use client";

import { useState } from 'react';
import { useProductivity } from '@/context/ProductivityContext';
import Modal from '@/components/Common/Modal';

export default function Projects() {
  const { 
    projects, addProject, deleteProject, toggleProjectComplete, 
    addProjectTask, toggleProjectTask, deleteProjectTask,
    projectTypes, addProjectType, deleteProjectType
  } = useProductivity();

  // Project Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(''); // Kept if needed, but not heavily highlighted
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState(projectTypes[0] || 'Personal');
  
  // Custom Project Type
  const [newType, setNewType] = useState('');
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);

  // Dynamic specific goals state
  const [specificGoals, setSpecificGoals] = useState([]);
  const [currentGoalDesc, setCurrentGoalDesc] = useState('');
  const [currentGoalType, setCurrentGoalType] = useState('Short-term');

  // New nested task state
  const [newTaskInput, setNewTaskInput] = useState({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddSpecificGoal = (e) => {
    e.preventDefault();
    if (!currentGoalDesc) return;
    setSpecificGoals(prev => [...prev, { desc: currentGoalDesc, type: currentGoalType }]);
    setCurrentGoalDesc('');
  };

  const removeSpecificGoal = (index) => {
    setSpecificGoals(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProjectType = (e) => {
    e.preventDefault();
    if (!newType) return;
    addProjectType(newType);
    setType(newType);
    setNewType('');
    setShowNewTypeInput(false);
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!name || !startDate || !dueDate) return;

    addProject({
      name,
      description,
      startDate,
      endDate,
      dueDate,
      projectType: type,
      specificGoals
    });

    // Reset
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setDueDate('');
    setType(projectTypes[0]);
    setSpecificGoals([]);
    setIsModalOpen(false); // Close Modal on success
  };

  const handleAddInternalTask = (e, projectId) => {
    e.preventDefault();
    const text = newTaskInput[projectId];
    if (!text) return;
    addProjectTask(projectId, text);
    setNewTaskInput(prev => ({ ...prev, [projectId]: '' }));
  };

  const getProjectStatus = (project) => {
    if (project.isCompleted) return 'Completed';
    const now = new Date();
    const start = new Date(project.startDate);
    if (now >= start) return 'In Progress';
    return 'Incomplete';
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const hasTime = dateStr.includes('T') && dateStr.length > 11;
    return `${d.toLocaleDateString()} ${hasTime ? d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}`;
  };

  return (
    <div className="module-container fade-in">
      <div className="hero-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="hero-greeting">Project Manager</h2>
          <p className="hero-subtitle">Comprehensive tracking for complex, multi-stage assignments.</p>
        </div>
        <button className="create-project-btn" onClick={() => setIsModalOpen(true)}>
           + Create Project
        </button>
      </div>

      {/* Project List Full Width */}
      <div className="projects-list-container">
        <div className="projects-grid">
          {projects.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No projects active right now. Click '+ Create Project' to start one.</p>
          ) : (
            projects.map(p => {
              const status = getProjectStatus(p);
              return (
                <div key={p.id} className={`project-card ${p.isCompleted ? 'completed-card' : ''}`}>
                  <div className="pc-header">
                    <div className="pc-header-left">
                      <span className={`status-badge ${status.replace(' ', '-').toLowerCase()}`}>{status}</span>
                      <span className="pc-type">{p.projectType}</span>
                    </div>
                    <div className="pc-header-right">
                      <label className="project-complete-box">
                        <input 
                          type="checkbox" 
                          checked={p.isCompleted} 
                          onChange={() => toggleProjectComplete(p.id)} 
                          title="Mark project as complete"
                        />
                      </label>
                      <button onClick={() => deleteProject(p.id)} className="btn-delete">🗑️</button>
                    </div>
                  </div>
                  
                  <h4 className="pc-title" style={{ textDecoration: p.isCompleted ? 'line-through' : 'none' }}>{p.name}</h4>
                  {p.description && <p className="pc-desc">{p.description}</p>}
                  
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
                    <span className="pct-header">Project Tasks</span>
                    <div className="pct-list">
                      {(p.tasks || []).map(t => (
                        <div key={t.id} className="pct-item">
                          <div 
                            className={`ms-circle-check ${t.completed ? 'checked' : ''}`} 
                            onClick={() => toggleProjectTask(p.id, t.id)}
                          >
                            {t.completed && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            )}
                          </div>
                          <span className="pct-text" style={{ 
                            textDecoration: t.completed ? 'line-through' : 'none',
                            color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                          }}>
                            {t.text}
                          </span>
                          <button onClick={() => deleteProjectTask(p.id, t.id)} className="pct-del">✕</button>
                        </div>
                      ))}
                    </div>
                    
                    {!p.isCompleted && (
                      <form onSubmit={(e) => handleAddInternalTask(e, p.id)} className="pct-add-form">
                        <input 
                          type="text" 
                          placeholder="Add task..." 
                          value={newTaskInput[p.id] || ''}
                          onChange={e => setNewTaskInput({...newTaskInput, [p.id]: e.target.value})}
                          className="glowing-input mini pct-input"
                        />
                        <button type="submit" className="btn-small project-btn">+</button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CREATE PROJECT MODAL */}
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
              placeholder="e.g. Q4 Website Redesign"
              className="glowing-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Details..."
              className="glowing-input textarea"
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>Start Date & Time</label>
            <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="glowing-input" required />
          </div>
          <div className="form-group">
            <label>Due Date & Time</label>
            <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className="glowing-input" required />
          </div>

          <div className="form-group">
            <label>Project Type</label>
            <div className="type-select-wrapper">
              {showNewTypeInput ? (
                <div className="new-type-input" style={{ display: 'flex', gap: '5px' }}>
                  <input 
                    type="text" 
                    value={newType} 
                    onChange={e => setNewType(e.target.value)} 
                    placeholder="New Type"
                    className="glowing-input"
                    autoFocus
                  />
                  <button type="button" onClick={handleAddProjectType} className="btn-small success">✓</button>
                  <button type="button" onClick={() => setShowNewTypeInput(false)} className="btn-small danger">✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select value={type} onChange={e => setType(e.target.value)} className="glowing-input">
                    {projectTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowNewTypeInput(true)} className="btn-small primary">+</button>
                  {projectTypes.length > 1 && (
                    <button type="button" onClick={() => {
                      if (projectTypes.length > 1) {
                        deleteProjectType(type);
                        setType(projectTypes.filter(t => t !== type)[0]);
                      }
                    }} className="btn-small danger" title="Delete type">✕</button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="specific-goals-section">
            <label className="section-label">Project Goals</label>
            <div className="add-goal-mini-form">
              <input 
                type="text" 
                value={currentGoalDesc}
                onChange={e => setCurrentGoalDesc(e.target.value)}
                placeholder="Goal description..."
                className="glowing-input mini"
              />
              <select 
                value={currentGoalType} 
                onChange={e => setCurrentGoalType(e.target.value)}
                className="glowing-input mini"
              >
                <option value="Short-term">Short-term</option>
                <option value="Long-term">Long-term</option>
              </select>
              <button type="button" onClick={handleAddSpecificGoal} className="btn-add-goal">Add</button>
            </div>
            
            {specificGoals.length > 0 && (
              <ul className="specific-goals-list">
                {specificGoals.map((g, idx) => (
                  <li key={idx} className="sg-item">
                    <span className={`sg-badge ${g.type === 'Short-term' ? 'short' : 'long'}`}>{g.type}</span>
                    <span className="sg-desc">{g.desc}</span>
                    <button type="button" onClick={() => removeSpecificGoal(idx)} className="sg-remove">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" className="btn-submit project-gradient">Launch Project</button>
        </form>
      </Modal>

      <style jsx>{`
        .create-project-btn {
          background: linear-gradient(135deg, var(--accent-start), #0284c7);
          color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700;
          font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3); transition: transform 0.2s, box-shadow 0.2s;
        }
        .create-project-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 229, 255, 0.5); }

        /* Modal uses global .modal-overlay / .modal-content from globals.css */
        
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-header h3 { margin: 0; color: var(--text-primary); }
        .close-btn { background: transparent; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; transition: 0.2s; }
        .close-btn:hover { color: var(--accent-danger); }

        .projects-list-container {
          margin-top: 24px;
        }
        .productivity-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 0.85rem; color: var(--text-primary); font-weight: 700; }
        .glowing-input {
          width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color);
          background: var(--surface-low); color: var(--text-primary); font-size: 0.9rem; transition: 0.3s;
        }
        .glowing-input.mini { padding: 8px 10px; font-size: 0.85rem; }
        .glowing-input:focus { outline: none; border-color: #0ea5e9; box-shadow: 0 0 15px rgba(14, 165, 233, 0.2); }
        .textarea { resize: vertical; }
        
        .btn-small { padding: 0 12px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; }
        .btn-small.primary { background: var(--accent-start); color: #fff; box-shadow: 0 0 10px rgba(0,229,255,0.3); }
        .btn-small.success { background: var(--accent-success); color: #fff; }
        .btn-small.danger { background: var(--accent-danger); color: #fff; }
        .project-btn { background: rgba(14, 165, 233, 0.2); color: #0ea5e9; height: 36px;}
        .project-btn:hover { background: #0ea5e9; color: #fff; }
        
        .specific-goals-section {
          background: rgba(0,0,0,0.1); padding: 16px; border-radius: 8px; border: 1px dashed var(--border-color);
          display: flex; flex-direction: column; gap: 10px;
        }
        .add-goal-mini-form { display: flex; gap: 8px; }
        .btn-add-goal { background: var(--surface); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 6px; padding: 0 12px; cursor: pointer; transition: 0.2s; }
        .btn-add-goal:hover { background: var(--surface-high); border-color: #0ea5e9; }
        
        .specific-goals-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
        .sg-item { display: flex; align-items: center; gap: 10px; background: var(--surface); padding: 6px 10px; border-radius: 6px; font-size: 0.85rem; }
        .sg-badge { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
        .sg-badge.short { background: rgba(14, 165, 233, 0.2); color: #38bdf8; }
        .sg-badge.long { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
        .sg-desc { flex: 1; color: var(--text-primary); }
        .sg-remove { background: none; border: none; color: var(--text-muted); cursor: pointer; }
        .sg-remove:hover { color: var(--accent-danger); }

        .btn-submit { padding: 12px; border-radius: 8px; border: none; color: white; font-weight: 600; cursor: pointer; transition: 0.2s; margin-top: 10px; }
        .project-gradient { background: linear-gradient(135deg, var(--accent-start), #0284c7); box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3); }
        .btn-submit:hover { transform: translateY(-2px); filter: brightness(1.1); }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
        }
        .project-card {
          background: var(--surface); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color);
          transition: 0.3s; display: flex; flex-direction: column; gap: 12px;
        }
        .project-card:hover { border-color: #0ea5e9; box-shadow: 0 8px 25px rgba(0,0,0,0.2); transform: translateY(-4px); }
        .completed-card { opacity: 0.65; }
        .completed-card:hover { border-color: var(--accent-success); }
        
        .pc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .pc-header-left, .pc-header-right { display: flex; align-items: center; gap: 10px; }
        .project-complete-box input { width: 18px; height: 18px; cursor: pointer; accent-color: var(--accent-success); }
        .status-badge { font-size: 0.7rem; padding: 4px 8px; border-radius: 6px; font-weight: 700; text-transform: uppercase; }
        .status-badge.incomplete { background: rgba(244, 63, 94, 0.15); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.3); }
        .status-badge.in-progress { background: rgba(0, 229, 255, 0.15); color: var(--accent-start); border: 1px solid rgba(0, 229, 255, 0.3); }
        .status-badge.completed { background: rgba(16, 185, 129, 0.15); color: var(--accent-success); border: 1px solid rgba(16, 185, 129, 0.3); }
        .pc-type { font-size: 0.75rem; color: #38bdf8; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
        .pc-title { font-size: 1.25rem; color: var(--text-primary); margin: 0; }
        .pc-desc { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4; margin: 0; }
        
        .pc-dates { display: flex; gap: 12px; margin-top: 4px; }
        .pc-date-box { flex: 1; background: var(--surface-low); padding: 10px; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; border: 1px solid var(--border-color); }
        .pc-date-box.highlighted { border-color: rgba(244, 63, 94, 0.4); background: rgba(244, 63, 94, 0.05); }
        .pcd-label { font-size: 0.65rem; color: var(--text-muted); font-weight: 600; }
        .pcd-val { font-size: 0.8rem; color: var(--text-primary); font-weight: 500; }
        .btn-delete { background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; transition: 0.2s; }
        .btn-delete:hover { transform: scale(1.1); filter: brightness(1.2); }
        
        .pc-tasks-section { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px; }
        .pct-header { font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; }
        .pct-list { display: flex; flex-direction: column; gap: 6px; }
        .pct-item { display: flex; align-items: center; gap: 12px; font-size: 0.85rem; color: var(--text-primary); background: var(--surface-low); padding: 10px 14px; border-radius: 6px; border: 1px solid transparent; }
        .pct-item:hover { border-color: var(--border-color); }
        
        .ms-circle-check { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--text-muted); display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; background: transparent; color: white; flex-shrink: 0; }
        .ms-circle-check:hover { border-color: var(--accent-start); }
        .ms-circle-check.checked { background: var(--accent-start); border-color: var(--accent-start); }
        .pct-text { flex: 1; line-height: 1.4; }
        .pct-del { background: none; border: none; color: var(--text-muted); cursor: pointer; opacity: 0.5; }
        .pct-item:hover .pct-del { opacity: 1; color: var(--accent-danger); }
        
        .pct-add-form { display: flex; gap: 8px; margin-top: 4px; }
        .pct-input { flex: 1; }

        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
