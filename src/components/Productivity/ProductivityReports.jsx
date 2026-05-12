"use client";

import { useState } from 'react';
import { useProductivity } from '@/context/ProductivityContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function ProductivityReports() {
  const { tasks, projects, goals } = useProductivity();

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState('all');

  const fmtDate = (ds) => ds ? new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

  const filteredTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    try {
      const d = new Date(t.dueDate).toISOString().split('T')[0];
      return d >= fromDate && d <= toDate;
    } catch (e) { return false; }
  });
  const filteredProjects = projects.filter(p => {
    if (!p.startDate) return false;
    try {
      const d = new Date(p.startDate).toISOString().split('T')[0];
      return d >= fromDate && d <= toDate;
    } catch (e) { return false; }
  });
  const allGoals = goals;

  const taskProgress = (p) => {
    const ts = p.tasks || [];
    if (!ts.length) return '0%';
    return `${Math.round((ts.filter(t => t.completed).length / ts.length) * 100)}%`;
  };

  const tasksDone = filteredTasks.filter(t => t.status === 'Completed').length;
  const avgGoalProg = allGoals.length
    ? Math.round(allGoals.reduce((s, g) => s + (g.completionRate || 0), 0) / allGoals.length)
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
    doc.text('Personal Tracking System', 14, 24);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text('Productivity Report', 14, 28);

    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, pw - 14, 18, { align: 'right' });
    doc.text(`Period: ${fromDate}  →  ${toDate}`, pw - 14, 28, { align: 'right' });

    // ─ Summary boxes (4-up) ─
    let y = 50;
    const boxW = (pw - 49) / 4;
    const boxes = [
      { label: 'TASKS SCOPED', val: String(filteredTasks.length), bg: [224, 242, 254], fg: [14, 165, 233] },
      { label: 'TASKS DONE', val: String(tasksDone), bg: [219, 252, 234], fg: [16, 185, 129] },
      { label: 'PROJECTS', val: String(filteredProjects.length), bg: [237, 233, 254], fg: [139, 92, 246] },
      { label: 'AVG GOAL', val: `${avgGoalProg}%`, bg: [254, 226, 226], fg: [244, 63, 94] },
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
    if (reportType === 'all' || reportType === 'tasks') {
      doc.setFillColor(224, 242, 254);
      doc.rect(14, y, pw - 28, 10, 'F');
      doc.setTextColor(14, 165, 233);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`TASKS (${filteredTasks.length})`, 18, y + 7);
      y += 14;

      const tasksTable = autoTable(doc, {
        startY: y,
        head: [['Title', 'Status', 'Due Date', 'Period']],
        body: filteredTasks.map(t => [t.title, t.status, fmtDate(t.dueDate), t.period || '-']),
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold', fontSize: 9, cellPadding: 5 },
        bodyStyles: { fontSize: 8.5, cellPadding: 4, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            if (data.cell.raw === 'Completed') {
              data.cell.styles.textColor = [16, 185, 129];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw === 'In Progress') {
              data.cell.styles.textColor = [14, 165, 233];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [244, 63, 94];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });
      y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 12 : y + 40;
    }

    // ─ Projects section ─
    if (reportType === 'all' || reportType === 'projects') {
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
        body: filteredProjects.map(p => [
          p.name, p.projectType,
          p.isCompleted ? 'Completed' : (new Date() >= new Date(p.startDate) ? 'In Progress' : 'Incomplete'),
          fmtDate(p.startDate), fmtDate(p.dueDate), taskProgress(p)
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
    if (reportType === 'all' || reportType === 'goals') {
      if (y > 240) { doc.addPage(); y = 15; }

      doc.setFillColor(219, 252, 234);
      doc.rect(14, y, pw - 28, 10, 'F');
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`GOALS (${allGoals.length})`, 18, y + 7);
      y += 14;

      autoTable(doc, {
        startY: y,
        head: [['Goal Title', 'Type', 'Progress']],
        body: allGoals.map(g => [g.title, g.type, `${g.completionRate || 0}%`]),
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
      doc.save(`productivity_report_${fromDate}_to_${toDate}.pdf`);
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
    if (reportType === 'all' || reportType === 'tasks') {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Title', 'Status', 'Due Date', 'Period'],
        ...filteredTasks.map(t => [t.title, t.status, fmtDate(t.dueDate), t.period || '-'])
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    }
    if (reportType === 'all' || reportType === 'projects') {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Name', 'Type', 'Status', 'Start Date', 'Due Date', 'Progress'],
        ...filteredProjects.map(p => [
          p.name, p.projectType,
          p.isCompleted ? 'Completed' : (new Date() >= new Date(p.startDate) ? 'In Progress' : 'Incomplete'),
          fmtDate(p.startDate), fmtDate(p.dueDate), taskProgress(p)
        ])
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    }
    if (reportType === 'all' || reportType === 'goals') {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Goal Title', 'Type', 'Progress'],
        ...allGoals.map(g => [g.title, g.type, `${g.completionRate || 0}%`])
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Goals');
    }
    XLSX.writeFile(wb, `productivity_report_${fromDate}_to_${toDate}.xlsx`);
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
          <p className="chart-subtitle">Customize dates and report content</p>

          <div className="report-filters">
            <div className="form-group">
              <label>From Date</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="glowing-input" />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="glowing-input" />
            </div>
          </div>

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
                  onClick={() => setReportType(opt.value)}
                  className={`scope-tab ${reportType === opt.value ? 'active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="report-summary-grid">
            <div className="summary-stat blue">
              <div className="stat-value">{filteredTasks.length}</div>
              <div className="stat-label">Tasks Scoped</div>
            </div>
            <div className="summary-stat green">
              <div className="stat-value">{tasksDone}</div>
              <div className="stat-label">Tasks Done</div>
            </div>
            <div className="summary-stat purple">
              <div className="stat-value">{filteredProjects.length}</div>
              <div className="stat-label">Projects Scoped</div>
            </div>
            <div className="summary-stat coral">
              <div className="stat-value">{avgGoalProg}%</div>
              <div className="stat-label">Avg Progress</div>
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
          <h3 className="section-title chart-title">Report Preview</h3>
          <p className="chart-subtitle">Explore scoped data before generation</p>

          {(reportType === 'all' || reportType === 'tasks') && (
            <div className="preview-section">
              <div className="preview-header tasks-header">📋 Tasks ({filteredTasks.length})</div>
              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <thead><tr><th>Title</th><th>Status</th><th>Due</th></tr></thead>
                  <tbody>
                    {filteredTasks.length === 0
                      ? <tr><td colSpan="3" className="empty-row">No tasks in selected period.</td></tr>
                      : filteredTasks.slice(0, 5).map(t => (
                        <tr key={t.id}>
                          <td>{t.title}</td>
                          <td><span className={`status-pill ${t.status.toLowerCase().replace(' ','-')}`}>{t.status}</span></td>
                          <td>{fmtDate(t.dueDate)}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(reportType === 'all' || reportType === 'projects') && (
            <div className="preview-section">
              <div className="preview-header projects-header">📁 Projects ({filteredProjects.length})</div>
              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <thead><tr><th>Name</th><th>Status</th><th>Progress</th></tr></thead>
                  <tbody>
                    {filteredProjects.length === 0
                      ? <tr><td colSpan="3" className="empty-row">No projects in this period.</td></tr>
                      : filteredProjects.slice(0, 4).map(p => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
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

          {(reportType === 'all' || reportType === 'goals') && (
            <div className="preview-section">
              <div className="preview-header goals-header">🎯 Goals ({allGoals.length})</div>
              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <thead><tr><th>Title</th><th>Type</th><th>Progress</th></tr></thead>
                  <tbody>
                    {allGoals.length === 0
                      ? <tr><td colSpan="3" className="empty-row">No goals found.</td></tr>
                      : allGoals.slice(0, 4).map(g => (
                        <tr key={g.id}>
                          <td>{g.title}</td>
                          <td><span className={`type-pill ${g.type.toLowerCase()}`}>{g.type}</span></td>
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
          display: grid; grid-template-columns: 380px 1fr; gap: 24px; margin-top: 24px; align-items: start;
        }
        @media (max-width: 1100px) { .report-layout { grid-template-columns: 1fr; } }
        .report-card, .preview-card { padding: 24px; }
        .chart-title { margin-bottom: 4px; }
        .chart-subtitle { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 20px; }
        .report-filters { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .glowing-input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-low); color: var(--text-primary); transition: 0.3s; font-size: 0.9rem; }
        .glowing-input:focus { outline: none; border-color: var(--accent-start); box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.12); }
        .scope-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .scope-tab { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-low); color: var(--text-secondary); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .scope-tab.active { background: linear-gradient(135deg, var(--accent-start), #6366f1); color: #fff; border-color: transparent; box-shadow: 0 4px 12px rgba(0, 123, 255, 0.25); }
        .scope-tab:hover:not(.active) { border-color: var(--accent-start); color: var(--text-primary); }
        .report-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
        .summary-stat { padding: 14px 16px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--surface-low); transition: transform 0.3s ease; }
        .summary-stat:hover { transform: translateY(-2px); }
        .summary-stat.blue   { border-left: 3px solid #0ea5e9; }
        .summary-stat.green  { border-left: 3px solid #10b981; }
        .summary-stat.purple { border-left: 3px solid #8b5cf6; }
        .summary-stat.coral  { border-left: 3px solid #f43f5e; }
        .stat-value { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
        .stat-label { font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; text-transform: uppercase; font-weight: 600; }
        .action-buttons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .btn-export { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 10px; border: none; color: white; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .pdf-gradient { background: linear-gradient(135deg, #f43f5e, #e11d48); box-shadow: 0 4px 12px rgba(244,63,94,0.25); }
        .pdf-gradient:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(244,63,94,0.4); }
        .view-gradient { background: linear-gradient(135deg, #0ea5e9, #0284c7); box-shadow: 0 4px 12px rgba(14,165,233,0.25); }
        .view-gradient:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(14,165,233,0.4); }
        .excel-gradient { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 12px rgba(16,185,129,0.25); }
        .excel-gradient:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(16,185,129,0.4); }
        .preview-section { margin-bottom: 20px; }
        .preview-header { font-weight: 700; font-size: 0.85rem; padding: 8px 12px; border-radius: 8px; margin-bottom: 10px; }
        .tasks-header    { background: rgba(14,165,233,0.1);  color: #0ea5e9; }
        .projects-header { background: rgba(139,92,246,0.1);  color: #8b5cf6; }
        .goals-header    { background: rgba(16,185,129,0.1);  color: #10b981; }
        .preview-table-wrapper { border-radius: 10px; border: 1px solid var(--border-color); overflow: hidden; }
        .preview-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .preview-table th { background: var(--surface-low); padding: 10px 12px; text-align: left; font-weight: 700; color: var(--text-secondary); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border-color); }
        .preview-table td { padding: 10px 12px; color: var(--text-primary); border-bottom: 1px solid var(--border-color); }
        .preview-table tr:last-child td { border-bottom: none; }
        .preview-table tr:hover td { background: var(--surface-low); }
        .empty-row { text-align: center; color: var(--text-muted); font-style: italic; padding: 25px !important; }
        .status-pill { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
        .status-pill.completed   { background: rgba(16,185,129,0.12); color: #10b981; }
        .status-pill.in-progress { background: rgba(14,165,233,0.12); color: #0ea5e9; }
        .status-pill.incomplete  { background: rgba(244,63,94,0.12);  color: #f43f5e; }
        .type-pill { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
        .type-pill.yearly  { background: rgba(139,92,246,0.12); color: #a78bfa; }
        .type-pill.monthly { background: rgba(14,165,233,0.12);  color: #38bdf8; }
        .type-pill.weekly  { background: rgba(16,185,129,0.12);  color: #6ee7b7; }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
