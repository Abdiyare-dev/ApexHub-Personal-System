"use client";

import { useState, useMemo } from 'react';
import { useProductivity } from '@/context/ProductivityContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function ProductivityReports() {
  const { tasks, projects, goals } = useProductivity();

  // Quick Preset Helper
  const getPresetDates = (preset) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().split('T')[0], to: todayStr };
    }
    if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return { from: d.toISOString().split('T')[0], to: todayStr };
    }
    if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: firstDay.toISOString().split('T')[0], to: todayStr };
    }
    if (preset === 'year') {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      return { from: firstDayOfYear.toISOString().split('T')[0], to: todayStr };
    }
    if (preset === 'all') {
      return { from: '', to: '' };
    }
    return { from: '', to: '' };
  };

  const initial30 = getPresetDates('30days');
  const [fromDate, setFromDate] = useState(initial30.from);
  const [toDate, setToDate] = useState(initial30.to);
  const [activePreset, setActivePreset] = useState('30days');
  const [reportScope, setReportScope] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, completed, pending

  const handleApplyPreset = (presetKey) => {
    setActivePreset(presetKey);
    const { from, to } = getPresetDates(presetKey);
    setFromDate(from);
    setToDate(to);
  };

  const handleDateChange = (type, val) => {
    setActivePreset('custom');
    if (type === 'from') setFromDate(val);
    if (type === 'to') setToDate(val);
  };

  const fmtDate = (ds) => ds ? new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

  // Helper to extract YYYY-MM-DD from any date field
  const extractDateStr = (dateVal) => {
    if (!dateVal) return null;
    try {
      if (typeof dateVal === 'string') {
        const trimmed = dateVal.trim();
        if (!trimmed) return null;
        if (trimmed.includes('T')) return trimmed.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      }
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  // ── FILTERED DATA ──
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Status filter
      const isDone = t.status === 'Completed';
      if (statusFilter === 'completed' && !isDone) return false;
      if (statusFilter === 'pending' && isDone) return false;

      // If no date range specified (All time), include all
      if (!fromDate && !toDate) return true;

      // Extract best candidate date: dueDate -> created_at
      const dStr = extractDateStr(t.dueDate || t.due_date || t.created_at);
      if (!dStr) return true; // Keep task if it has no date attached

      if (fromDate && dStr < fromDate) return false;
      if (toDate && dStr > toDate) return false;
      return true;
    });
  }, [tasks, fromDate, toDate, statusFilter]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const isDone = p.isCompleted;
      if (statusFilter === 'completed' && !isDone) return false;
      if (statusFilter === 'pending' && isDone) return false;

      if (!fromDate && !toDate) return true;

      const start = extractDateStr(p.startDate || p.start_date || p.created_at);
      const due = extractDateStr(p.dueDate || p.due_date || p.endDate || p.end_date);

      // If project has dates, check overlap with selected window
      if (start || due) {
        if (fromDate && due && due < fromDate) return false;
        if (toDate && start && start > toDate) return false;
      }
      return true;
    });
  }, [projects, fromDate, toDate, statusFilter]);

  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      if (!fromDate && !toDate) return true;
      const target = extractDateStr(g.targetDate || g.target_date || g.created_at);
      if (!target) return true;
      if (fromDate && target < fromDate) return false;
      if (toDate && target > toDate) return false;
      return true;
    });
  }, [goals, fromDate, toDate]);

  const taskProgress = (p) => {
    const ts = p.tasks || [];
    if (!ts.length) return p.isCompleted ? '100%' : '0%';
    const done = ts.filter(t => t.completed).length;
    return `${Math.round((done / ts.length) * 100)}%`;
  };

  const tasksDone = filteredTasks.filter(t => t.status === 'Completed').length;
  const tasksPending = filteredTasks.length - tasksDone;
  const taskCompletionRate = filteredTasks.length ? Math.round((tasksDone / filteredTasks.length) * 100) : 0;

  const projectsDone = filteredProjects.filter(p => p.isCompleted).length;
  const avgGoalProg = filteredGoals.length
    ? Math.round(filteredGoals.reduce((s, g) => s + (g.completionRate || 0), 0) / filteredGoals.length)
    : 0;

  // ── Professional PDF Builder ──
  const buildPDF = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    // ─ Header bar ─
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pw, 36, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 36, pw, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('ApexHub', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text('Personal Development System', 14, 24);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(`Productivity Report — Scope: ${reportScope.toUpperCase()}`, 14, 29);

    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, pw - 14, 18, { align: 'right' });
    doc.text(`Period: ${fromDate || 'Beginning'} → ${toDate || 'Present'}`, pw - 14, 28, { align: 'right' });

    // ─ Summary boxes (4-up) ─
    let y = 50;
    const boxW = (pw - 49) / 4;
    const boxes = [
      { label: 'TASKS SCOPED', val: String(filteredTasks.length), bg: [224, 242, 254], fg: [14, 165, 233] },
      { label: 'TASKS DONE', val: String(tasksDone), bg: [219, 252, 234], fg: [16, 185, 129] },
      { label: 'PROJECTS', val: String(filteredProjects.length), bg: [237, 233, 254], fg: [139, 92, 246] },
      { label: 'AVG GOALS', val: `${avgGoalProg}%`, bg: [254, 226, 226], fg: [244, 63, 94] },
    ];
    boxes.forEach((b, i) => {
      const bx = 14 + i * (boxW + 7);
      doc.setFillColor(...b.bg);
      doc.roundedRect(bx, y, boxW, 26, 3, 3, 'F');
      doc.setTextColor(...b.fg);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(b.label, bx + boxW/2, y + 9, { align: 'center' });
      doc.setFontSize(13);
      doc.text(b.val, bx + boxW/2, y + 20, { align: 'center' });
    });

    y += 36;

    // ─ Tasks section ─
    if (reportScope === 'all' || reportScope === 'tasks') {
      doc.setFillColor(224, 242, 254);
      doc.rect(14, y, pw - 28, 10, 'F');
      doc.setTextColor(14, 165, 233);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`TASKS (${filteredTasks.length})`, 18, y + 7);
      y += 14;

      autoTable(doc, {
        startY: y,
        head: [['Title', 'Status', 'Due Date', 'Frequency']],
        body: filteredTasks.length === 0 ? [['No tasks found in selected range', '-', '-', '-']] : filteredTasks.map(t => [t.title, t.status || 'Incomplete', fmtDate(t.dueDate || t.due_date), t.period || 'None']),
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold', fontSize: 9, cellPadding: 5 },
        bodyStyles: { fontSize: 8.5, cellPadding: 4, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 12 : y + 40;
    }

    // ─ Projects section ─
    if (reportScope === 'all' || reportScope === 'projects') {
      if (y > 240) { doc.addPage(); y = 15; }

      doc.setFillColor(237, 233, 254);
      doc.rect(14, y, pw - 28, 10, 'F');
      doc.setTextColor(139, 92, 246);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`PROJECTS (${filteredProjects.length})`, 18, y + 7);
      y += 14;

      autoTable(doc, {
        startY: y,
        head: [['Name', 'Type', 'Status', 'Start', 'Due', 'Progress']],
        body: filteredProjects.length === 0 ? [['No projects in selected range', '-', '-', '-', '-', '-']] : filteredProjects.map(p => [
          p.name, p.projectType || 'Standard',
          p.isCompleted ? 'Completed' : 'In Progress',
          fmtDate(p.startDate || p.start_date), fmtDate(p.dueDate || p.due_date), taskProgress(p)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 9, cellPadding: 5 },
        bodyStyles: { fontSize: 8.5, cellPadding: 4, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 12 : y + 40;
    }

    // ─ Goals section ─
    if (reportScope === 'all' || reportScope === 'goals') {
      if (y > 240) { doc.addPage(); y = 15; }

      doc.setFillColor(219, 252, 234);
      doc.rect(14, y, pw - 28, 10, 'F');
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`GOALS (${filteredGoals.length})`, 18, y + 7);
      y += 14;

      autoTable(doc, {
        startY: y,
        head: [['Goal Title', 'Type', 'Target Date', 'Progress']],
        body: filteredGoals.length === 0 ? [['No goals found in selected range', '-', '-', '-']] : filteredGoals.map(g => [g.title, g.type || 'Yearly', fmtDate(g.targetDate || g.target_date), `${g.completionRate || 0}%`]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9, cellPadding: 5 },
        bodyStyles: { fontSize: 8.5, cellPadding: 4, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });
    }

    // ─ Footer ─
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pgH = doc.internal.pageSize.getHeight();
      doc.setFillColor(241, 245, 249);
      doc.rect(0, pgH - 14, pw, 14, 'F');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text('ApexHub Productivity Report — Confidential', 14, pgH - 5);
      doc.text(`Page ${i} of ${pageCount}`, pw - 14, pgH - 5, { align: 'right' });
    }

    return doc;
  };

  const downloadPDF = () => {
    try {
      const doc = buildPDF();
      doc.save(`productivity_report_${fromDate || 'all'}_to_${toDate || 'all'}.pdf`);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const viewPDF = () => {
    try {
      const doc = buildPDF();
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('PDF view error:', err);
      alert('Failed to open PDF. Please try downloading instead.');
    }
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    if (reportScope === 'all' || reportScope === 'tasks') {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Title', 'Status', 'Due Date', 'Frequency'],
        ...filteredTasks.map(t => [t.title, t.status || 'Incomplete', fmtDate(t.dueDate || t.due_date), t.period || '-'])
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    }
    if (reportScope === 'all' || reportScope === 'projects') {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Name', 'Type', 'Status', 'Start Date', 'Due Date', 'Progress'],
        ...filteredProjects.map(p => [
          p.name, p.projectType || 'Standard',
          p.isCompleted ? 'Completed' : 'In Progress',
          fmtDate(p.startDate || p.start_date), fmtDate(p.dueDate || p.due_date), taskProgress(p)
        ])
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    }
    if (reportScope === 'all' || reportScope === 'goals') {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Goal Title', 'Type', 'Target Date', 'Progress'],
        ...filteredGoals.map(g => [g.title, g.type || 'Yearly', fmtDate(g.targetDate || g.target_date), `${g.completionRate || 0}%`])
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Goals');
    }
    XLSX.writeFile(wb, `productivity_report_${fromDate || 'all'}_to_${toDate || 'all'}.xlsx`);
  };

  return (
    <div className="module-container fade-in">
      <div className="hero-section">
        <h2 className="hero-greeting">Productivity Reports</h2>
        <p className="hero-subtitle">Export detailed reports of your tasks, projects &amp; goals in PDF or Excel.</p>
      </div>

      <div className="report-layout">
        {/* CONFIG CARD */}
        <div className="kpi-card report-card">
          <h3 className="section-title chart-title">Report Configuration</h3>
          <p className="chart-subtitle">Customize dates, scope, and filters</p>

          {/* Quick Presets */}
          <div className="preset-tabs">
            {[
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p.id)}
                className={`preset-btn ${activePreset === p.id ? 'active' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="report-filters">
            <div className="form-group">
              <label>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => handleDateChange('from', e.target.value)}
                className="glowing-input"
              />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={e => handleDateChange('to', e.target.value)}
                className="glowing-input"
              />
            </div>
          </div>

          {/* Scope selection */}
          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Report Scope</label>
            <div className="scope-tabs">
              {[
                { value: 'all', label: 'All' },
                { value: 'tasks', label: 'Tasks' },
                { value: 'projects', label: 'Projects' },
                { value: 'goals', label: 'Goals' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReportScope(opt.value)}
                  className={`scope-tab ${reportScope === opt.value ? 'active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Status Filter</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="glowing-input"
            >
              <option value="all">All Statuses</option>
              <option value="pending">In Progress / Incomplete Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>

          {/* Summary KPI Grid */}
          <div className="report-summary-grid">
            <div className="summary-stat blue">
              <div className="stat-value">{filteredTasks.length}</div>
              <div className="stat-label">Tasks Scoped</div>
            </div>
            <div className="summary-stat green">
              <div className="stat-value">{tasksDone}</div>
              <div className="stat-label">Tasks Done ({taskCompletionRate}%)</div>
            </div>
            <div className="summary-stat purple">
              <div className="stat-value">{filteredProjects.length}</div>
              <div className="stat-label">Projects Scoped ({projectsDone} Done)</div>
            </div>
            <div className="summary-stat coral">
              <div className="stat-value">{avgGoalProg}%</div>
              <div className="stat-label">Avg Goals Prog ({filteredGoals.length})</div>
            </div>
          </div>

          <div className="action-buttons-grid">
            <button onClick={downloadPDF} className="btn-export pdf-gradient">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download PDF
            </button>
            <button onClick={viewPDF} className="btn-export view-gradient">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              View PDF
            </button>
            <button onClick={exportExcel} className="btn-export excel-gradient" style={{ gridColumn: 'span 2' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><rect x="8" y="13" width="8" height="6" rx="1"/></svg>
              Excel Report (.xlsx)
            </button>
          </div>
        </div>

        {/* PREVIEW CARD */}
        <div className="kpi-card preview-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h3 className="section-title chart-title">Report Preview</h3>
            <span className="period-badge">
              {fromDate && toDate ? `${fmtDate(fromDate)} – ${fmtDate(toDate)}` : (fromDate ? `From ${fmtDate(fromDate)}` : 'All Recorded Time')}
            </span>
          </div>
          <p className="chart-subtitle">Explore scoped data before generation</p>

          {(reportScope === 'all' || reportScope === 'tasks') && (
            <div className="preview-section">
              <div className="preview-header tasks-header">📋 Tasks ({filteredTasks.length})</div>
              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <thead><tr><th>Title</th><th>Status</th><th>Due Date</th></tr></thead>
                  <tbody>
                    {filteredTasks.length === 0
                      ? <tr><td colSpan="3" className="empty-row">No tasks found in the selected period.</td></tr>
                      : filteredTasks.slice(0, 6).map(t => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 600 }}>{t.title}</td>
                          <td><span className={`status-pill ${(t.status || 'incomplete').toLowerCase().replace(' ','-')}`}>{t.status || 'Incomplete'}</span></td>
                          <td>{fmtDate(t.dueDate || t.due_date)}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(reportScope === 'all' || reportScope === 'projects') && (
            <div className="preview-section">
              <div className="preview-header projects-header">📁 Projects ({filteredProjects.length})</div>
              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Progress</th></tr></thead>
                  <tbody>
                    {filteredProjects.length === 0
                      ? <tr><td colSpan="4" className="empty-row">No projects found in this period.</td></tr>
                      : filteredProjects.slice(0, 5).map(p => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td><span className="type-badge">{p.projectType || 'Personal'}</span></td>
                          <td><span className={`status-pill ${p.isCompleted ? 'completed' : 'in-progress'}`}>{p.isCompleted ? 'Completed' : 'In Progress'}</span></td>
                          <td>{taskProgress(p)}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(reportScope === 'all' || reportScope === 'goals') && (
            <div className="preview-section">
              <div className="preview-header goals-header">🎯 Goals ({filteredGoals.length})</div>
              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <thead><tr><th>Title</th><th>Type</th><th>Target</th><th>Progress</th></tr></thead>
                  <tbody>
                    {filteredGoals.length === 0
                      ? <tr><td colSpan="4" className="empty-row">No goals found.</td></tr>
                      : filteredGoals.slice(0, 5).map(g => (
                        <tr key={g.id}>
                          <td style={{ fontWeight: 600 }}>{g.title}</td>
                          <td><span className={`type-pill ${(g.type || 'yearly').toLowerCase()}`}>{g.type || 'Yearly'}</span></td>
                          <td>{fmtDate(g.targetDate || g.target_date)}</td>
                          <td>{g.completionRate || 0}%</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .report-layout {
          display: grid; grid-template-columns: 400px 1fr; gap: 24px; margin-top: 24px; align-items: start;
        }
        @media (max-width: 1100px) { .report-layout { grid-template-columns: 1fr; } }
        .report-card, .preview-card { padding: 24px; }
        .chart-title { margin-bottom: 4px; }
        .chart-subtitle { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 18px; }
        
        .preset-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .preset-btn {
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-secondary);
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .preset-btn.active {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
          box-shadow: 0 2px 10px var(--accent-glow);
        }
        .preset-btn:hover:not(.active) {
          border-color: var(--accent);
          color: var(--text-primary);
        }

        .report-filters { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 0.76rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .glowing-input { width: 100%; padding: 9px 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--surface-low); color: var(--text-primary); transition: 0.3s; font-size: 0.88rem; }
        .glowing-input:focus { outline: none; border-color: var(--accent-start); box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.12); }
        .scope-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .scope-tab { padding: 7px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--surface-low); color: var(--text-secondary); font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .scope-tab.active { background: linear-gradient(135deg, var(--accent-start), #6366f1); color: #fff; border-color: transparent; box-shadow: 0 4px 12px rgba(0, 123, 255, 0.25); }
        .scope-tab:hover:not(.active) { border-color: var(--accent-start); color: var(--text-primary); }
        
        .report-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 18px 0; }
        .summary-stat { padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--surface-low); transition: transform 0.2s ease; }
        .summary-stat:hover { transform: translateY(-2px); }
        .summary-stat.blue   { border-left: 3.5px solid #0ea5e9; }
        .summary-stat.green  { border-left: 3.5px solid #10b981; }
        .summary-stat.purple { border-left: 3.5px solid #8b5cf6; }
        .summary-stat.coral  { border-left: 3.5px solid #f43f5e; }
        .stat-value { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
        .stat-label { font-size: 0.68rem; color: var(--text-muted); margin-top: 4px; text-transform: uppercase; font-weight: 700; }
        
        .action-buttons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .btn-export { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 11px; border-radius: 10px; border: none; color: white; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .pdf-gradient { background: linear-gradient(135deg, #f43f5e, #e11d48); box-shadow: 0 4px 12px rgba(244,63,94,0.25); }
        .pdf-gradient:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(244,63,94,0.4); }
        .view-gradient { background: linear-gradient(135deg, #0ea5e9, #0284c7); box-shadow: 0 4px 12px rgba(14,165,233,0.25); }
        .view-gradient:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(14,165,233,0.4); }
        .excel-gradient { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 12px rgba(16,185,129,0.25); }
        .excel-gradient:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(16,185,129,0.4); }
        
        .period-badge { font-size: 0.75rem; font-weight: 700; color: var(--accent); background: rgba(0,153,255,0.08); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(0,153,255,0.2); }
        
        .preview-section { margin-bottom: 20px; }
        .preview-header { font-weight: 800; font-size: 0.82rem; padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; }
        .tasks-header    { background: rgba(14,165,233,0.1);  color: #0ea5e9; }
        .projects-header { background: rgba(139,92,246,0.1);  color: #8b5cf6; }
        .goals-header    { background: rgba(16,185,129,0.1);  color: #10b981; }
        
        .preview-table-wrapper { border-radius: 10px; border: 1px solid var(--border-color); overflow: hidden; }
        .preview-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .preview-table th { background: var(--surface-low); padding: 9px 12px; text-align: left; font-weight: 700; color: var(--text-secondary); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border-color); }
        .preview-table td { padding: 9px 12px; color: var(--text-primary); border-bottom: 1px solid var(--border-color); }
        .preview-table tr:last-child td { border-bottom: none; }
        .preview-table tr:hover td { background: var(--surface-low); }
        .empty-row { text-align: center; color: var(--text-muted); font-style: italic; padding: 20px !important; }
        
        .status-pill { font-size: 0.65rem; padding: 2px 7px; border-radius: 4px; font-weight: 700; text-transform: uppercase; display: inline-block; }
        .status-pill.completed   { background: rgba(16,185,129,0.14); color: #10b981; }
        .status-pill.in-progress { background: rgba(14,165,233,0.14); color: #0ea5e9; }
        .status-pill.incomplete  { background: rgba(244,63,94,0.14);  color: #f43f5e; }
        
        .type-badge { font-size: 0.72rem; color: var(--text-secondary); background: var(--surface-low); padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        
        .type-pill { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
        .type-pill.yearly  { background: rgba(139,92,246,0.14); color: #a78bfa; }
        .type-pill.monthly { background: rgba(14,165,233,0.14);  color: #38bdf8; }
        .type-pill.weekly  { background: rgba(16,185,129,0.14);  color: #6ee7b7; }
        
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
