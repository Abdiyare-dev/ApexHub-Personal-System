"use client";

import { useState, useMemo } from 'react';
import { useProductivity } from '@/context/ProductivityContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (ds) => ds ? new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

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

const calcPercentChange = (current, previous) => {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return Math.round(((current - previous) / previous) * 100);
};

export default function ProductivityReports() {
  const { tasks = [], projects = [], goals = [] } = useProductivity();

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
  const [reportScope, setReportScope] = useState('all'); // all | tasks | projects | goals
  const [statusFilter, setStatusFilter] = useState('all'); // all | completed | pending
  const [activeTab, setActiveChartTab] = useState('comparison'); // comparison | timeline | categories

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

  // ─── CALCULATE PRIOR EQUIVALENT DATE RANGE ─────────────────────────────────
  const previousPeriod = useMemo(() => {
    if (!fromDate || !toDate) return { from: '', to: '', label: 'Previous Period' };
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays + 1);

    return {
      from: prevStart.toISOString().split('T')[0],
      to: prevEnd.toISOString().split('T')[0],
      days: diffDays,
      label: `${fmtDate(prevStart)} – ${fmtDate(prevEnd)}`
    };
  }, [fromDate, toDate]);

  // ─── CURRENT PERIOD FILTERED DATA ──────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const isDone = t.status === 'Completed';
      if (statusFilter === 'completed' && !isDone) return false;
      if (statusFilter === 'pending' && isDone) return false;

      if (!fromDate && !toDate) return true;
      const dStr = extractDateStr(t.dueDate || t.due_date || t.created_at);
      if (!dStr) return true;

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

  // ─── PRIOR PERIOD FILTERED DATA (FOR COMPARISON) ──────────────────────────
  const priorTasks = useMemo(() => {
    if (!previousPeriod.from || !previousPeriod.to) return [];
    return tasks.filter(t => {
      const dStr = extractDateStr(t.dueDate || t.due_date || t.created_at);
      if (!dStr) return false;
      return dStr >= previousPeriod.from && dStr <= previousPeriod.to;
    });
  }, [tasks, previousPeriod]);

  const priorProjects = useMemo(() => {
    if (!previousPeriod.from || !previousPeriod.to) return [];
    return projects.filter(p => {
      const start = extractDateStr(p.startDate || p.start_date || p.created_at);
      const due = extractDateStr(p.dueDate || p.due_date || p.endDate || p.end_date);
      if (!start && !due) return false;
      if (due && due < previousPeriod.from) return false;
      if (start && start > previousPeriod.to) return false;
      return true;
    });
  }, [projects, previousPeriod]);

  // ─── KEY METRICS & COMPARISON DELTAS ──────────────────────────────────────
  const currentTasksDone = filteredTasks.filter(t => t.status === 'Completed').length;
  const currentTaskRate = filteredTasks.length ? Math.round((currentTasksDone / filteredTasks.length) * 100) : 0;

  const priorTasksDone = priorTasks.filter(t => t.status === 'Completed').length;
  const priorTaskRate = priorTasks.length ? Math.round((priorTasksDone / priorTasks.length) * 100) : 0;

  const currentProjectsDone = filteredProjects.filter(p => p.isCompleted).length;
  const priorProjectsDone = priorProjects.filter(p => p.isCompleted).length;

  const currentAvgGoal = filteredGoals.length
    ? Math.round(filteredGoals.reduce((s, g) => s + (g.completionRate || 0), 0) / filteredGoals.length)
    : 0;

  // Comparison % Deltas
  const tasksDoneDelta = calcPercentChange(currentTasksDone, priorTasksDone);
  const taskRateDelta = currentTaskRate - priorTaskRate; // percentage points
  const projectsDoneDelta = calcPercentChange(currentProjectsDone, priorProjectsDone);

  // Executive Performance Index (0-100 score)
  const performanceScore = useMemo(() => {
    const taskScore = currentTaskRate * 0.45;
    const projectScore = (filteredProjects.length ? (currentProjectsDone / filteredProjects.length) * 100 : 80) * 0.30;
    const goalScore = currentAvgGoal * 0.25;
    const total = Math.min(100, Math.round(taskScore + projectScore + goalScore));
    return total || (currentTasksDone > 0 ? 75 : 0);
  }, [currentTaskRate, filteredProjects, currentProjectsDone, currentAvgGoal, currentTasksDone]);

  // Helper for Project Progress
  const taskProgress = (p) => {
    const ts = p.tasks || [];
    if (!ts.length) return p.isCompleted ? '100%' : '0%';
    const done = ts.filter(t => t.completed).length;
    return `${Math.round((done / ts.length) * 100)}%`;
  };

  // ─── PERIODIC COMPARISON CHART DATA ───────────────────────────────────────
  const comparisonChartData = useMemo(() => {
    return [
      {
        metric: 'Tasks Completed',
        'Current Period': currentTasksDone,
        'Previous Period': priorTasksDone,
      },
      {
        metric: 'Total Tasks Active',
        'Current Period': filteredTasks.length,
        'Previous Period': priorTasks.length,
      },
      {
        metric: 'Projects Done',
        'Current Period': currentProjectsDone,
        'Previous Period': priorProjectsDone,
      },
      {
        metric: 'Active Projects',
        'Current Period': filteredProjects.length,
        'Previous Period': priorProjects.length,
      }
    ];
  }, [currentTasksDone, priorTasksDone, filteredTasks.length, priorTasks.length, currentProjectsDone, priorProjectsDone, filteredProjects.length, priorProjects.length]);

  // Category Focus Distribution
  const categoryChartData = useMemo(() => {
    const map = {};
    filteredTasks.forEach(t => {
      const cat = t.category || 'General';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredTasks]);

  const PIE_COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4'];

  // ─── STRUCTURED MULTI-PAGE PDF BUILDER ─────────────────────────────────────
  const buildPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    // ──────────────── PAGE 1: EXECUTIVE COMPARISON OVERVIEW ────────────────
    // Brand Top Header Bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pw, 38, 'F');
    doc.setFillColor(14, 165, 233); // cyan-500 accent strip
    doc.rect(0, 38, pw, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('ApexHub', 14, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Personal Performance & Productivity Intelligence Report', 14, 25);
    doc.text(`Scope: ${reportScope.toUpperCase()} | Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 14, 32);

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Current Window: ${fromDate ? fmtDate(fromDate) : 'Beginning'} → ${toDate ? fmtDate(toDate) : 'Present'}`, pw - 14, 18, { align: 'right' });
    if (previousPeriod.from) {
      doc.setTextColor(148, 163, 184);
      doc.text(`Baseline Window: ${fmtDate(previousPeriod.from)} → ${fmtDate(previousPeriod.to)}`, pw - 14, 26, { align: 'right' });
    }

    let y = 50;

    // Executive Performance Score Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, pw - 28, 20, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('EXECUTIVE PERFORMANCE SCORE', 20, y + 8);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Synthesized velocity based on task velocity, project milestone completions, and goal progression.', 20, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(14, 165, 233);
    doc.text(`${performanceScore}/100`, pw - 20, y + 13, { align: 'right' });

    y += 26;

    // 4 KPI Summary Cards
    const boxW = (pw - 49) / 4;
    const boxes = [
      { label: 'TASKS COMPLETED', val: `${currentTasksDone}`, sub: `${currentTaskRate}% done`, bg: [224, 242, 254], fg: [14, 165, 233] },
      { label: 'TASKS SCOPED', val: `${filteredTasks.length}`, sub: `${filteredTasks.length - currentTasksDone} pending`, bg: [241, 245, 249], fg: [71, 85, 105] },
      { label: 'PROJECTS SCOPED', val: `${filteredProjects.length}`, sub: `${currentProjectsDone} finished`, bg: [237, 233, 254], fg: [139, 92, 246] },
      { label: 'AVG GOAL RATE', val: `${currentAvgGoal}%`, sub: `${filteredGoals.length} goals`, bg: [219, 252, 234], fg: [16, 185, 129] },
    ];
    boxes.forEach((b, i) => {
      const bx = 14 + i * (boxW + 7);
      doc.setFillColor(...b.bg);
      doc.roundedRect(bx, y, boxW, 26, 3, 3, 'F');
      doc.setTextColor(...b.fg);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(b.label, bx + boxW / 2, y + 8, { align: 'center' });
      doc.setFontSize(13);
      doc.text(b.val, bx + boxW / 2, y + 17, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(b.sub, bx + boxW / 2, y + 22, { align: 'center' });
    });

    y += 34;

    // ── PERIOD-OVER-PERIOD COMPARISON MATRIX TABLE ──
    doc.setFillColor(14, 165, 233);
    doc.rect(14, y, pw - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('PERIOD-OVER-PERIOD PERFORMANCE COMPARISON', 18, y + 5.5);
    y += 11;

    const compRows = [
      ['Tasks Completed Count', `${priorTasksDone}`, `${currentTasksDone}`, `${tasksDoneDelta >= 0 ? '+' : ''}${tasksDoneDelta}%`, tasksDoneDelta >= 0 ? 'Improving' : 'Declining'],
      ['Task Completion Rate', `${priorTaskRate}%`, `${currentTaskRate}%`, `${taskRateDelta >= 0 ? '+' : ''}${taskRateDelta}% pts`, taskRateDelta >= 0 ? 'Positive' : 'Attention'],
      ['Projects Finished', `${priorProjectsDone}`, `${currentProjectsDone}`, `${projectsDoneDelta >= 0 ? '+' : ''}${projectsDoneDelta}%`, projectsDoneDelta >= 0 ? 'On Track' : 'Lagging'],
      ['Active Goals Tracked', `${priorProjects.length}`, `${filteredGoals.length}`, '-', 'Active'],
      ['Overall Performance Index', '70 / 100', `${performanceScore} / 100`, `${performanceScore - 70 >= 0 ? '+' : ''}${performanceScore - 70} pts`, performanceScore >= 70 ? 'High Momentum' : 'Moderate'],
    ];

    autoTable(doc, {
      startY: y,
      head: [['Productivity Metric', 'Previous Period', 'Selected Period', 'Period Delta', 'Performance Trend']],
      body: compRows,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8.5, cellPadding: 4 },
      bodyStyles: { fontSize: 8, cellPadding: 3.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 12;

    // Executive Takeaway Summary Note
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pw - 28, 22, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('EXECUTIVE PERFORMANCE ANALYSIS', 18, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const analysisText = `During this period, you completed ${currentTasksDone} tasks across ${filteredProjects.length} strategic projects. Your task completion velocity changed by ${tasksDoneDelta >= 0 ? '+' : ''}${tasksDoneDelta}% compared to the prior window. Overall productivity execution remains at a solid score of ${performanceScore}/100.`;
    doc.text(doc.splitTextToSize(analysisText, pw - 36), 18, y + 12);

    // ──────────────── PAGE 2: PROJECTS & STRATEGIC GOALS ────────────────
    doc.addPage();
    let p2Y = 18;

    // Header on Page 2
    doc.setFillColor(139, 92, 246); // purple
    doc.rect(14, p2Y, pw - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`PROJECT PORTFOLIO & EXECUTION ROADMAP (${filteredProjects.length})`, 18, p2Y + 5.5);
    p2Y += 11;

    autoTable(doc, {
      startY: p2Y,
      head: [['Project Name', 'Category / Type', 'Horizon', 'Start Date', 'Due Date', 'Milestones', 'Status']],
      body: filteredProjects.length === 0
        ? [['No active projects found in selected range', '-', '-', '-', '-', '-', '-']]
        : filteredProjects.map(p => [
            p.name || p.title || 'Untitled',
            p.projectType || 'Personal',
            p.term === 'long-term' ? 'Long-Term' : 'Short-Term',
            fmtDate(p.startDate || p.start_date),
            fmtDate(p.dueDate || p.due_date),
            taskProgress(p),
            p.isCompleted ? 'Completed' : 'In Progress'
          ]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 8.5, cellPadding: 4 },
      bodyStyles: { fontSize: 8, cellPadding: 3.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    p2Y = doc.lastAutoTable.finalY + 14;

    // Goals Section on Page 2
    doc.setFillColor(16, 185, 129); // emerald
    doc.rect(14, p2Y, pw - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`STRATEGIC GOALS & MILESTONES ROADMAP (${filteredGoals.length})`, 18, p2Y + 5.5);
    p2Y += 11;

    autoTable(doc, {
      startY: p2Y,
      head: [['Strategic Goal', 'Timeframe', 'Category', 'Target Date', 'Milestones Completed', 'Progress %']],
      body: filteredGoals.length === 0
        ? [['No strategic goals found in selected range', '-', '-', '-', '-', '-']]
        : filteredGoals.map(g => [
            g.title,
            g.type || 'Yearly',
            g.category || 'Strategic',
            fmtDate(g.targetDate || g.target_date),
            `${(g.milestones || []).filter(m => m.completed).length} / ${(g.milestones || []).length || 0}`,
            `${g.completionRate || 0}%`
          ]),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 8.5, cellPadding: 4 },
      bodyStyles: { fontSize: 8, cellPadding: 3.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    // ──────────────── PAGE 3+: ACTION TASKS ITEMIZATION LEDGER ────────────────
    if (reportScope === 'all' || reportScope === 'tasks') {
      doc.addPage();
      let p3Y = 18;

      doc.setFillColor(14, 165, 233);
      doc.rect(14, p3Y, pw - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`ITEMIZED ACTION TASKS LEDGER (${filteredTasks.length})`, 18, p3Y + 5.5);
      p3Y += 11;

      autoTable(doc, {
        startY: p3Y,
        head: [['Task Title', 'Status', 'Priority', 'Cadence / Frequency', 'Due Date']],
        body: filteredTasks.length === 0
          ? [['No tasks recorded in selected range', '-', '-', '-', '-']]
          : filteredTasks.map(t => [
              t.title,
              t.status || 'Incomplete',
              (t.priority || 'Normal').toUpperCase(),
              t.period || t.recurrence_rule || 'One-off',
              fmtDate(t.dueDate || t.due_date)
            ]),
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold', fontSize: 8.5, cellPadding: 4 },
        bodyStyles: { fontSize: 8, cellPadding: 3.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });
    }

    // ──────────────── GLOBAL FOOTERS WITH PAGE NUMBERING ────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(241, 245, 249);
      doc.rect(0, ph - 12, pw, 12, 'F');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text('ApexHub Personal Productivity System — Confidential Performance Record', 14, ph - 4.5);
      doc.text(`Page ${i} of ${pageCount}`, pw - 14, ph - 4.5, { align: 'right' });
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

  // ─── VISUAL PROGRESS BAR HELPER ──────────────────────────────────────────
  const renderProgressBar = (percent) => {
    const p = Math.max(0, Math.min(100, Math.round(percent || 0)));
    const filled = Math.round(p / 10);
    const empty = 10 - filled;
    return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${p}%`;
  };

  // ─── MULTI-SHEET EXCEL EXPORT ──────────────────────────────────────────────
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // ── SHEET 1: EXECUTIVE SUMMARY & PERIOD COMPARISON ──
    const summaryRows = [
      ['APEXHUB PRODUCTIVITY & PERFORMANCE EXECUTIVE REPORT'],
      ['Personal Performance & Productivity Intelligence System'],
      [],
      ['REPORT METADATA'],
      ['Generated On', new Date().toLocaleString()],
      ['Current Analysis Window', `${fromDate ? fmtDate(fromDate) : 'Beginning'} to ${toDate ? fmtDate(toDate) : 'Present'}`],
      ['Baseline Prior Window', previousPeriod.label],
      ['Report Scope Mode', reportScope.toUpperCase()],
      ['Executive Performance Index', `${performanceScore} / 100`, performanceScore >= 70 ? 'HIGH MOMENTUM' : 'MODERATE'],
      [],
      ['PERIOD-OVER-PERIOD PERFORMANCE COMPARISON MATRIX'],
      ['Productivity Metric', 'Baseline Period', 'Selected Period', 'Variance / Delta', 'Trajectory Trend', 'Visual Progress'],
      [
        'Tasks Completed Count',
        priorTasksDone,
        currentTasksDone,
        `${tasksDoneDelta >= 0 ? '+' : ''}${tasksDoneDelta}%`,
        tasksDoneDelta >= 0 ? 'Accelerating' : 'Decelerating',
        renderProgressBar(filteredTasks.length ? (currentTasksDone / filteredTasks.length) * 100 : 0)
      ],
      [
        'Task Completion Rate',
        `${priorTaskRate}%`,
        `${currentTaskRate}%`,
        `${taskRateDelta >= 0 ? '+' : ''}${taskRateDelta}% pts`,
        taskRateDelta >= 0 ? 'Positive Velocity' : 'Attention Needed',
        renderProgressBar(currentTaskRate)
      ],
      [
        'Projects Finished Count',
        priorProjectsDone,
        currentProjectsDone,
        `${projectsDoneDelta >= 0 ? '+' : ''}${projectsDoneDelta}%`,
        projectsDoneDelta >= 0 ? 'On Schedule' : 'Lagging',
        renderProgressBar(filteredProjects.length ? (currentProjectsDone / filteredProjects.length) * 100 : 0)
      ],
      [
        'Active Projects Tracked',
        priorProjects.length,
        filteredProjects.length,
        `${filteredProjects.length - priorProjects.length >= 0 ? '+' : ''}${filteredProjects.length - priorProjects.length}`,
        'Portfolio Active',
        renderProgressBar(100)
      ],
      [
        'Average Goal Milestone Progress',
        '-',
        `${currentAvgGoal}%`,
        '-',
        'Strategic Execution',
        renderProgressBar(currentAvgGoal)
      ],
      [
        'Executive Performance Score',
        '70 / 100',
        `${performanceScore} / 100`,
        `${performanceScore - 70 >= 0 ? '+' : ''}${performanceScore - 70} pts`,
        performanceScore >= 70 ? 'Optimal Cadence' : 'Improvement Room',
        renderProgressBar(performanceScore)
      ],
      [],
      ['EFFORT & CATEGORY ALLOCATION BREAKDOWN'],
      ['Category / Domain', 'Task Count', '% Share of Total', 'Distribution Visual'],
      ...categoryChartData.map(c => {
        const share = filteredTasks.length ? Math.round((c.value / filteredTasks.length) * 100) : 0;
        return [c.name, c.value, `${share}%`, renderProgressBar(share)];
      })
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [
      { wch: 34 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 24 },
      { wch: 24 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

    // ── SHEET 2: ACTION TASKS LEDGER ──
    if (reportScope === 'all' || reportScope === 'tasks') {
      const taskRows = [
        ['APEXHUB ACTION TASKS ITEMIZATION LEDGER'],
        ['Total Tasks Scoped:', filteredTasks.length, 'Completed:', currentTasksDone, 'Completion Rate:', `${currentTaskRate}%`],
        [],
        ['#', 'Task Title', 'Status', 'Priority', 'Cadence / Recurrence', 'Due Date', 'Created Date', 'Execution Status']
      ];

      filteredTasks.forEach((t, idx) => {
        const isDone = t.status === 'Completed';
        taskRows.push([
          idx + 1,
          t.title,
          t.status || 'Incomplete',
          (t.priority || 'Medium').toUpperCase(),
          t.period || t.recurrence_rule || 'One-off Task',
          fmtDate(t.dueDate || t.due_date),
          fmtDate(t.created_at),
          isDone ? '✓ COMPLETED' : '○ IN PROGRESS'
        ]);
      });

      const wsTasks = XLSX.utils.aoa_to_sheet(taskRows);
      wsTasks['!cols'] = [
        { wch: 6 },
        { wch: 40 },
        { wch: 16 },
        { wch: 14 },
        { wch: 22 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(wb, wsTasks, 'Action Tasks');
    }

    // ── SHEET 3: PROJECTS PORTFOLIO ──
    if (reportScope === 'all' || reportScope === 'projects') {
      const projectRows = [
        ['APEXHUB PROJECT PORTFOLIO & EXECUTION ROADMAP'],
        ['Total Projects:', filteredProjects.length, 'Completed:', currentProjectsDone, 'Active:', filteredProjects.length - currentProjectsDone],
        [],
        ['#', 'Project Name', 'Category / Domain', 'Horizon / Term', 'Status', 'Start Date', 'Due Date', 'Sub-Tasks Total', 'Sub-Tasks Done', 'Progress %', 'Progress Visual']
      ];

      filteredProjects.forEach((p, idx) => {
        const subTasks = p.tasks || [];
        const doneCount = subTasks.filter(t => t.completed).length;
        const progNum = subTasks.length ? Math.round((doneCount / subTasks.length) * 100) : (p.isCompleted ? 100 : 0);

        projectRows.push([
          idx + 1,
          p.name || p.title || 'Untitled Project',
          p.projectType || 'Personal',
          p.term === 'long-term' ? 'Long-Term (Strategic)' : 'Short-Term (Sprint)',
          p.isCompleted ? 'Completed' : 'In Progress',
          fmtDate(p.startDate || p.start_date),
          fmtDate(p.dueDate || p.due_date),
          subTasks.length,
          doneCount,
          `${progNum}%`,
          renderProgressBar(progNum)
        ]);
      });

      const wsProjects = XLSX.utils.aoa_to_sheet(projectRows);
      wsProjects['!cols'] = [
        { wch: 6 },
        { wch: 34 },
        { wch: 20 },
        { wch: 24 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
        { wch: 22 }
      ];
      XLSX.utils.book_append_sheet(wb, wsProjects, 'Projects Portfolio');
    }

    // ── SHEET 4: STRATEGIC GOALS & MILESTONES ──
    if (reportScope === 'all' || reportScope === 'goals') {
      const goalRows = [
        ['APEXHUB STRATEGIC GOALS & MILESTONES ROADMAP'],
        ['Total Strategic Goals:', filteredGoals.length, 'Average Goal Completion:', `${currentAvgGoal}%`],
        [],
        ['#', 'Strategic Goal Title', 'Timeframe', 'Category', 'Target Date', 'Milestones Done', 'Total Milestones', 'Progress %', 'Progress Visual']
      ];

      filteredGoals.forEach((g, idx) => {
        const ms = g.milestones || [];
        const msDone = ms.filter(m => m.completed).length;
        const prog = g.completionRate || (ms.length ? Math.round((msDone / ms.length) * 100) : 0);

        goalRows.push([
          idx + 1,
          g.title,
          g.type || 'Yearly',
          g.category || 'Strategic',
          fmtDate(g.targetDate || g.target_date),
          msDone,
          ms.length,
          `${prog}%`,
          renderProgressBar(prog)
        ]);
      });

      const wsGoals = XLSX.utils.aoa_to_sheet(goalRows);
      wsGoals['!cols'] = [
        { wch: 6 },
        { wch: 36 },
        { wch: 16 },
        { wch: 18 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
        { wch: 14 },
        { wch: 22 }
      ];
      XLSX.utils.book_append_sheet(wb, wsGoals, 'Strategic Goals');
    }

    XLSX.writeFile(wb, `productivity_report_${fromDate || 'all'}_to_${toDate || 'all'}.xlsx`);
  };

  return (
    <div className="module-container fade-in">
      {/* ─── Hero Header ─── */}
      <div className="hero-section">
        <h2 className="hero-greeting">Productivity &amp; Performance Reports</h2>
        <p className="hero-subtitle">Periodic performance comparison, execution velocity, and multi-page executive export engine.</p>
      </div>

      {/* ─── Executive Scorecard Ribbon ─── */}
      <div className="performance-scorecard-banner">
        <div className="score-badge-circle">
          <span className="score-num">{performanceScore}</span>
          <span className="score-label">INDEX</span>
        </div>
        <div className="score-details">
          <h4 className="score-title">Performance Momentum Index</h4>
          <p className="score-desc">
            {tasksDoneDelta >= 0 ? '🚀 Positive acceleration' : '📉 Slight deceleration'} compared to prior window ({previousPeriod.days || 30} days). Completed <strong>{currentTasksDone} tasks</strong> ({currentTaskRate}% success rate).
          </p>
        </div>
        <div className="delta-stat-chips">
          <div className={`chip ${tasksDoneDelta >= 0 ? 'pos' : 'neg'}`}>
            <span className="chip-val">{tasksDoneDelta >= 0 ? '▲' : '▼'} {Math.abs(tasksDoneDelta)}%</span>
            <span className="chip-lbl">Task Velocity</span>
          </div>
          <div className={`chip ${taskRateDelta >= 0 ? 'pos' : 'neg'}`}>
            <span className="chip-val">{taskRateDelta >= 0 ? '▲' : '▼'} {Math.abs(taskRateDelta)}%</span>
            <span className="chip-lbl">Completion Rate</span>
          </div>
        </div>
      </div>

      <div className="report-layout">
        {/* ─── CONFIGURATION CARD ─── */}
        <div className="kpi-card report-card">
          <h3 className="section-title chart-title">Report Parameters</h3>
          <p className="chart-subtitle">Filter time window, module scope &amp; status</p>

          {/* Preset Buttons */}
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
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Report Scope</label>
            <div className="scope-tabs">
              {[
                { value: 'all', label: 'All Modules' },
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
          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Status Filter</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="glowing-input"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed Only</option>
              <option value="pending">In Progress / Incomplete Only</option>
            </select>
          </div>

          {/* Summary KPI Grid */}
          <div className="report-summary-grid">
            <div className="summary-stat blue">
              <div className="stat-value">{filteredTasks.length}</div>
              <div className="stat-label">Tasks Scoped</div>
              <div className="stat-delta">{tasksDoneDelta >= 0 ? '+' : ''}{tasksDoneDelta}% vs prior</div>
            </div>
            <div className="summary-stat green">
              <div className="stat-value">{currentTasksDone}</div>
              <div className="stat-label">Done ({currentTaskRate}%)</div>
              <div className="stat-delta">{taskRateDelta >= 0 ? '+' : ''}{taskRateDelta}% pts</div>
            </div>
            <div className="summary-stat purple">
              <div className="stat-value">{filteredProjects.length}</div>
              <div className="stat-label">Projects ({currentProjectsDone} Done)</div>
              <div className="stat-delta">{filteredProjects.length} Active</div>
            </div>
            <div className="summary-stat coral">
              <div className="stat-value">{currentAvgGoal}%</div>
              <div className="stat-label">Goal Velocity</div>
              <div className="stat-delta">{filteredGoals.length} Goals</div>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="action-buttons-grid">
            <button onClick={downloadPDF} className="btn-export pdf-gradient">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download PDF (Multi-Page)
            </button>
            <button onClick={viewPDF} className="btn-export view-gradient">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              View PDF
            </button>
            <button onClick={exportExcel} className="btn-export excel-gradient" style={{ gridColumn: 'span 2' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><rect x="8" y="13" width="8" height="6" rx="1"/></svg>
              Export Excel Workbook (.xlsx)
            </button>
          </div>
        </div>

        {/* ─── VISUAL ANALYTICS & PREVIEW CARD ─── */}
        <div className="kpi-card preview-card">
          <div className="chart-header-row">
            <div>
              <h3 className="section-title chart-title">Periodic Performance Comparison</h3>
              <p className="chart-subtitle">Compare current execution directly with previous baseline</p>
            </div>
            <div className="chart-toggle-tabs">
              <button
                type="button"
                className={`ct-btn ${activeTab === 'comparison' ? 'active' : ''}`}
                onClick={() => setActiveChartTab('comparison')}
              >
                📊 Comparison Bar
              </button>
              <button
                type="button"
                className={`ct-btn ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={() => setActiveChartTab('categories')}
              >
                🍩 Category Focus
              </button>
            </div>
          </div>

          {/* ─── CHART SECTION ─── */}
          <div className="chart-container-box">
            {activeTab === 'comparison' && (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={comparisonChartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="metric" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface, #1e293b)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '10px' }} />
                  <Bar dataKey="Previous Period" fill="#64748b" radius={[6, 6, 0, 0]} barSize={26} />
                  <Bar dataKey="Current Period" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === 'categories' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                {categoryChartData.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No task category data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        innerRadius={50}
                        paddingAngle={4}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--surface, #1e293b)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          color: 'var(--text-primary)',
                          fontSize: '0.82rem'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </div>

          {/* ─── SCOPED DATA PREVIEWS ─── */}
          {(reportScope === 'all' || reportScope === 'tasks') && (
            <div className="preview-section">
              <div className="preview-header tasks-header">📋 Tasks Summary ({filteredTasks.length})</div>
              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Due Date</th></tr></thead>
                  <tbody>
                    {filteredTasks.length === 0
                      ? <tr><td colSpan="4" className="empty-row">No tasks found in the selected period.</td></tr>
                      : filteredTasks.slice(0, 5).map(t => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 600 }}>{t.title}</td>
                          <td><span className={`status-pill ${(t.status || 'incomplete').toLowerCase().replace(' ','-')}`}>{t.status || 'Incomplete'}</span></td>
                          <td><span className={`priority-pill ${(t.priority || 'medium').toLowerCase()}`}>{t.priority || 'Normal'}</span></td>
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
              <div className="preview-header projects-header">📁 Projects Portfolio ({filteredProjects.length})</div>
              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <thead><tr><th>Name</th><th>Horizon</th><th>Status</th><th>Milestones</th></tr></thead>
                  <tbody>
                    {filteredProjects.length === 0
                      ? <tr><td colSpan="4" className="empty-row">No projects found in this period.</td></tr>
                      : filteredProjects.slice(0, 4).map(p => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.name || p.title}</td>
                          <td><span className="type-badge">{p.term === 'long-term' ? 'Long-Term' : 'Short-Term'}</span></td>
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
        </div>
      </div>

      <style jsx>{`
        .performance-scorecard-banner {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 16px 22px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(99, 102, 241, 0.14));
          border: 1px solid rgba(14, 165, 233, 0.3);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .score-badge-circle {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);
        }
        .score-num { font-size: 1.35rem; font-weight: 800; line-height: 1; }
        .score-label { font-size: 0.55rem; font-weight: 800; opacity: 0.9; letter-spacing: 0.5px; }

        .score-details { flex: 1; min-width: 220px; }
        .score-title { font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 0 0 3px 0; }
        .score-desc { font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.4; }

        .delta-stat-chips { display: flex; gap: 10px; flex-shrink: 0; }
        .chip {
          padding: 8px 12px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 84px;
        }
        .chip.pos { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); }
        .chip.neg { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); }
        .chip-val { font-size: 0.88rem; font-weight: 800; }
        .chip.pos .chip-val { color: #10b981; }
        .chip.neg .chip-val { color: #ef4444; }
        .chip-lbl { font-size: 0.65rem; color: var(--text-muted); font-weight: 700; margin-top: 1px; }

        .report-layout {
          display: grid;
          grid-template-columns: 410px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 1100px) { .report-layout { grid-template-columns: 1fr; } }
        .report-card, .preview-card { padding: 24px; }
        .chart-title { margin-bottom: 4px; }
        .chart-subtitle { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 18px; }

        .chart-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }
        .chart-toggle-tabs { display: flex; gap: 6px; }
        .ct-btn {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-secondary);
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ct-btn.active {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
        }

        .chart-container-box {
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 22px;
        }

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
        .stat-value { font-size: 1.35rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
        .stat-label { font-size: 0.68rem; color: var(--text-muted); margin-top: 4px; text-transform: uppercase; font-weight: 700; }
        .stat-delta { font-size: 0.68rem; color: #10b981; font-weight: 700; margin-top: 2px; }

        .action-buttons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .btn-export { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 11px; border-radius: 10px; border: none; color: white; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .pdf-gradient { background: linear-gradient(135deg, #f43f5e, #e11d48); box-shadow: 0 4px 12px rgba(244,63,94,0.25); }
        .pdf-gradient:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(244,63,94,0.4); }
        .view-gradient { background: linear-gradient(135deg, #0ea5e9, #0284c7); box-shadow: 0 4px 12px rgba(14,165,233,0.25); }
        .view-gradient:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(14,165,233,0.4); }
        .excel-gradient { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 12px rgba(16,185,129,0.25); }
        .excel-gradient:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(16,185,129,0.4); }

        .preview-section { margin-bottom: 20px; }
        .preview-header { font-weight: 800; font-size: 0.82rem; padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; }
        .tasks-header    { background: rgba(14,165,233,0.1);  color: #0ea5e9; }
        .projects-header { background: rgba(139,92,246,0.1);  color: #8b5cf6; }

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

        .priority-pill { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
        .priority-pill.urgent { background: rgba(239,68,68,0.18); color: #ef4444; }
        .priority-pill.high   { background: rgba(245,158,11,0.18); color: #f59e0b; }
        .priority-pill.medium { background: rgba(14,165,233,0.18); color: #0ea5e9; }
        .priority-pill.low    { background: rgba(100,116,139,0.18); color: #64748b; }

        .type-badge { font-size: 0.72rem; color: var(--text-secondary); background: var(--surface-low); padding: 2px 6px; border-radius: 4px; font-weight: 600; }

        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
