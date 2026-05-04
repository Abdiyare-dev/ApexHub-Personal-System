"use client";

import { useProductivity } from '@/context/ProductivityContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

const STATUS_COLORS = {
  Completed: '#10b981',
  'In Progress': '#0ea5e9',
  Incomplete: '#f43f5e',
};
const GOAL_COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];

function getProjectStatus(project) {
  if (project.isCompleted) return 'Completed';
  const now = new Date();
  const start = new Date(project.startDate);
  if (now >= start) return 'In Progress';
  return 'Incomplete';
}

function getProjectProgress(project) {
  const tasks = project.tasks || [];
  if (!tasks.length) return 0;
  return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
}

// Custom Tooltip for project bar chart
const ProjectTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const { status, progress } = payload[0].payload;
    return (
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '0.85rem',
        color: 'var(--text-primary)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        <div style={{ color: STATUS_COLORS[status] || '#94a3b8' }}>Status: {status}</div>
        <div>Tasks done: {progress}%</div>
      </div>
    );
  }
  return null;
};

export default function ProductivityDashboard() {
  const { tasks, goals, projects } = useProductivity();

  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const taskCompletionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  const completedProjects = projects.filter(p => p.isCompleted).length;
  const activeProjects = projects.filter(p => !p.isCompleted).length;

  // Build chart data for projects
  const projectChartData = projects.map(p => ({
    name: p.name.length > 16 ? p.name.substring(0, 14) + '…' : p.name,
    fullName: p.name,
    progress: getProjectProgress(p),
    status: getProjectStatus(p),
  }));

  return (
    <div className="module-container fade-in">
      
      {/* HEADER SECTION */}
      <div className="hero-section">
        <h2 className="hero-greeting">Productivity Dashboard</h2>
        <p className="hero-subtitle">High-level insights into your workflow and goal progression.</p>
      </div>

      {/* KPI CARDS GRID */}
      <div className="kpi-grid">
        <div className="kpi-card glass-3d">
          <div className="kpi-header">
            <span className="kpi-title">Task Completion</span>
            <div className="kpi-icon-wrap green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
          </div>
          <div className="kpi-value">{taskCompletionRate}%</div>
          <div className="kpi-trend success">{completedTasks} of {tasks.length} Done</div>
        </div>

        <div className="kpi-card glass-3d">
          <div className="kpi-header">
            <span className="kpi-title">Active Projects</span>
            <div className="kpi-icon-wrap amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
          </div>
          <div className="kpi-value">{activeProjects}</div>
          <div className="kpi-trend text-muted">{completedProjects} Completed</div>
        </div>

        <div className="kpi-card glass-3d">
          <div className="kpi-header">
            <span className="kpi-title">Total Goals</span>
            <div className="kpi-icon-wrap blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
            </div>
          </div>
          <div className="kpi-value">{goals.length}</div>
          <div className="kpi-trend text-muted">Tracking progress</div>
        </div>
      </div>

      {/* ANALYTICS SECTION — 2 column layout */}
      <div className="analytics-grid">

        {/* PROJECT PROGRESSION CHART */}
        <div className="analytics-panel glass-3d">
          <h3 className="section-title chart-title">Project Progression</h3>
          <p className="chart-subtitle">Task completion % per project</p>
          {projectChartData.length === 0 ? (
            <div className="empty-chart">No projects yet. Create a project to see progress here.</div>
          ) : (
            <div className="relative w-full h-[280px]">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={projectChartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 50 }}
                  barSize={38}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={v => `${v}%`}
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ProjectTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="progress" radius={[8, 8, 0, 0]}>
                    {projectChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || '#8b5cf6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Status legend */}
          <div className="status-legend">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="legend-item">
                <span className="legend-dot" style={{ background: color }}></span>
                <span>{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* GOALS PROGRESSION */}
        <div className="analytics-panel glass-3d">
          <h3 className="section-title chart-title">Goals Progression</h3>
          <p className="chart-subtitle">Milestone completion per goal</p>
          <div className="progress-container">
            {goals.length === 0 ? (
               <div className="empty-chart">No goals yet. Set a goal in the Goals module.</div>
            ) : (
              <div className="multi-progress">
                {goals.map((goal, idx) => (
                  <div className="modern-progress-item" key={idx}>
                    <div className="mp-header">
                      <span className="mp-title">{goal.title}</span>
                      <span className="mp-percent">{goal.completionRate}%</span>
                    </div>
                    <div className="mp-track">
                      <div 
                        className="mp-fill fade-in-width"
                        style={{ 
                          '--target-width': `${goal.completionRate}%`,
                          background: `linear-gradient(90deg, ${GOAL_COLORS[idx % GOAL_COLORS.length]}, ${GOAL_COLORS[(idx+1) % GOAL_COLORS.length]})`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <style jsx>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .glass-3d {
          background: var(--surface);
          border: 1px solid var(--border-color);
          box-shadow: 
            0 10px 30px -10px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.1),
            inset 0 -1px 0 rgba(0,0,0,0.2);
          border-radius: 20px;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
        }
        
        .glass-3d:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 
            0 20px 40px -10px rgba(0,153,255,0.15),
            0 0 20px rgba(0,153,255,0.08),
            inset 0 1px 0 rgba(255,255,255,0.2);
          border-color: rgba(0, 153, 255, 0.35);
        }

        .kpi-trend {
          font-size: 0.85rem;
          font-weight: 600;
          margin-top: 12px;
        }
        .success { color: var(--accent-success); }
        .text-muted { color: var(--text-muted); }

        .analytics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 24px;
        }

        @media (max-width: 1100px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
          .kpi-grid {
            grid-template-columns: 1fr;
          }
        }

        .analytics-panel {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .chart-title { margin-bottom: 4px; }
        .chart-subtitle { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px; }
        
        .empty-chart {
          color: var(--text-muted);
          text-align: center;
          font-style: italic;
          background: rgba(0,0,0,0.06);
          padding: 40px;
          border-radius: 12px;
          border: 1px dashed var(--border-color);
        }

        /* Status legend */
        .status-legend {
          display: flex;
          gap: 16px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 600;
        }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Modern Progress Bars */
        .multi-progress {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .modern-progress-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mp-header {
          display: flex;
          justify-content: space-between;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .mp-title { color: var(--text-primary); }
        .mp-percent { color: var(--text-secondary); }
        
        .mp-track {
          width: 100%;
          height: 10px;
          background: var(--surface-low);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.15);
        }
        .fade-in-width {
          animation: fillWidth 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          width: 0;
        }
        .mp-fill {
          height: 100%;
          border-radius: 12px;
        }

        @keyframes fillWidth {
          from { width: 0; }
          to { width: var(--target-width); }
        }
      `}</style>
    </div>
  );
}
