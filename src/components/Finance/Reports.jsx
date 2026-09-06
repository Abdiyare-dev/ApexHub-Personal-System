"use client";

import { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val || 0);

const fmtDate = (ds) => (ds ? new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-');

const calcPercentChange = (current, previous) => {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
};

export default function FinanceReports() {
  const { transactions = [] } = useFinance();

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
  const [reportType, setReportType] = useState('all'); // all | income | expense
  const [chartTab, setChartTab] = useState('comparison'); // comparison | categories

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

  // ─── CALCULATE PRIOR EQUIVALENT PERIOD ─────────────────────────────────────
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

  // ─── FILTERED TRANSACTIONS (CURRENT PERIOD) ────────────────────────────────
  const filteredTx = useMemo(() => {
    return transactions.filter(t => {
      const txDate = t.date ? new Date(t.date).toISOString().split('T')[0] : null;
      if (!txDate) return true;
      if (fromDate && txDate < fromDate) return false;
      if (toDate && txDate > toDate) return false;
      if (reportType === 'all') return true;
      return t.type === reportType;
    });
  }, [transactions, fromDate, toDate, reportType]);

  // ─── FILTERED TRANSACTIONS (PRIOR PERIOD) ──────────────────────────────────
  const priorTx = useMemo(() => {
    if (!previousPeriod.from || !previousPeriod.to) return [];
    return transactions.filter(t => {
      const txDate = t.date ? new Date(t.date).toISOString().split('T')[0] : null;
      if (!txDate) return false;
      return txDate >= previousPeriod.from && txDate <= previousPeriod.to;
    });
  }, [transactions, previousPeriod]);

  // Current Metrics
  const totalIncome = useMemo(() => filteredTx.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0), [filteredTx]);
  const totalExpense = useMemo(() => filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0), [filteredTx]);
  const netCashFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

  // Prior Metrics
  const priorIncome = useMemo(() => priorTx.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0), [priorTx]);
  const priorExpense = useMemo(() => priorTx.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0), [priorTx]);
  const priorNetCashFlow = priorIncome - priorExpense;
  const priorSavingsRate = priorIncome > 0 ? Math.max(0, Math.round(((priorIncome - priorExpense) / priorIncome) * 100)) : 0;

  // Deltas
  const incomeDelta = calcPercentChange(totalIncome, priorIncome);
  const expenseDelta = calcPercentChange(totalExpense, priorExpense);
  const netCashFlowDelta = calcPercentChange(netCashFlow, priorNetCashFlow);
  const savingsRateDelta = savingsRate - priorSavingsRate;

  // Category Distribution
  const categoryData = useMemo(() => {
    const map = {};
    filteredTx.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'Uncategorized';
      map[cat] = (map[cat] || 0) + (Number(t.amount) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value);
  }, [filteredTx]);

  const PIE_COLORS = ['#f43f5e', '#f59e0b', '#0ea5e9', '#8b5cf6', '#10b981', '#06b6d4', '#ec4899'];

  // Comparison Chart Data
  const comparisonChartData = useMemo(() => {
    return [
      {
        metric: 'Total Income',
        'Current Period': totalIncome,
        'Previous Period': priorIncome,
      },
      {
        metric: 'Total Expenses',
        'Current Period': totalExpense,
        'Previous Period': priorExpense,
      },
      {
        metric: 'Net Savings',
        'Current Period': Math.max(0, netCashFlow),
        'Previous Period': Math.max(0, priorNetCashFlow),
      }
    ];
  }, [totalIncome, priorIncome, totalExpense, priorExpense, netCashFlow, priorNetCashFlow]);

  const getReportData = () => filteredTx.map(t => [
    fmtDate(t.date),
    (t.type || 'expense').charAt(0).toUpperCase() + (t.type || 'expense').slice(1),
    t.category || 'General',
    t.description || '-',
    `${t.type === 'income' ? '+' : '-'}${fmtCurrency(t.amount)}`
  ]);

  // ─── STRUCTURED MULTI-PAGE PDF BUILDER ─────────────────────────────────────
  const buildPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    // ──────────────── PAGE 1: EXECUTIVE FINANCIAL OVERVIEW ────────────────
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pw, 38, 'F');
    doc.setFillColor(16, 185, 129); // emerald-500 accent strip
    doc.rect(0, 38, pw, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('ApexHub', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Executive Financial Intelligence & Cash Flow Audit', 14, 25);
    doc.text(`Scope: ${reportType.toUpperCase()} | Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 14, 32);

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Current Window: ${fromDate ? fmtDate(fromDate) : 'Beginning'} → ${toDate ? fmtDate(toDate) : 'Present'}`, pw - 14, 18, { align: 'right' });
    if (previousPeriod.from) {
      doc.setTextColor(148, 163, 184);
      doc.text(`Baseline Window: ${fmtDate(previousPeriod.from)} → ${fmtDate(previousPeriod.to)}`, pw - 14, 26, { align: 'right' });
    }

    let y = 50;

    // Financial Health Summary Banner
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, pw - 28, 20, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('EXECUTIVE FINANCIAL HEALTH SCORECARD', 20, y + 8);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Net liquidity is ${netCashFlow >= 0 ? 'positive' : 'negative'} with an effective savings rate of ${savingsRate}%.`, 20, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(netCashFlow >= 0 ? 16 : 239, netCashFlow >= 0 ? 185 : 68, netCashFlow >= 0 ? 129 : 68);
    doc.text(fmtCurrency(netCashFlow), pw - 20, y + 13, { align: 'right' });

    y += 26;

    // 4 KPI Summary Boxes
    const boxW = (pw - 49) / 4;
    const boxes = [
      { label: 'TOTAL INFLOW', val: fmtCurrency(totalIncome), sub: `${incomeDelta >= 0 ? '+' : ''}${incomeDelta}% vs prior`, bg: [219, 252, 234], fg: [16, 185, 129] },
      { label: 'TOTAL OUTFLOW', val: fmtCurrency(totalExpense), sub: `${expenseDelta >= 0 ? '+' : ''}${expenseDelta}% vs prior`, bg: [254, 226, 226], fg: [239, 68, 68] },
      { label: 'NET CASH FLOW', val: fmtCurrency(netCashFlow), sub: `${netCashFlowDelta >= 0 ? '+' : ''}${netCashFlowDelta}% vs prior`, bg: [224, 242, 254], fg: [14, 165, 233] },
      { label: 'SAVINGS RATE', val: `${savingsRate}%`, sub: `${savingsRateDelta >= 0 ? '+' : ''}${savingsRateDelta}% pts`, bg: [237, 233, 254], fg: [139, 92, 246] },
    ];
    boxes.forEach((b, i) => {
      const bx = 14 + i * (boxW + 7);
      doc.setFillColor(...b.bg);
      doc.roundedRect(bx, y, boxW, 26, 3, 3, 'F');
      doc.setTextColor(...b.fg);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(b.label, bx + boxW / 2, y + 8, { align: 'center' });
      doc.setFontSize(11.5);
      doc.text(b.val, bx + boxW / 2, y + 17, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(b.sub, bx + boxW / 2, y + 22, { align: 'center' });
    });

    y += 34;

    // Period Comparison Matrix Table
    doc.setFillColor(16, 185, 129);
    doc.rect(14, y, pw - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('PERIOD-OVER-PERIOD FINANCIAL COMPARISON', 18, y + 5.5);
    y += 11;

    const compRows = [
      ['Total Cash Inflow', fmtCurrency(priorIncome), fmtCurrency(totalIncome), `${incomeDelta >= 0 ? '+' : ''}${incomeDelta}%`, incomeDelta >= 0 ? 'Expansion' : 'Contraction'],
      ['Total Expenses Outflow', fmtCurrency(priorExpense), fmtCurrency(totalExpense), `${expenseDelta >= 0 ? '+' : ''}${expenseDelta}%`, expenseDelta <= 0 ? 'Optimized' : 'Increased Spend'],
      ['Net Capital Savings', fmtCurrency(priorNetCashFlow), fmtCurrency(netCashFlow), `${netCashFlowDelta >= 0 ? '+' : ''}${netCashFlowDelta}%`, netCashFlow >= 0 ? 'Surplus' : 'Deficit'],
      ['Capital Savings Rate', `${priorSavingsRate}%`, `${savingsRate}%`, `${savingsRateDelta >= 0 ? '+' : ''}${savingsRateDelta}% pts`, savingsRate >= 20 ? 'Strong' : 'Moderate'],
      ['Total Recorded Transactions', `${priorTx.length}`, `${filteredTx.length}`, `${filteredTx.length - priorTx.length >= 0 ? '+' : ''}${filteredTx.length - priorTx.length}`, 'Active Ledger'],
    ];

    autoTable(doc, {
      startY: y,
      head: [['Financial Metric', 'Previous Period', 'Selected Period', 'Period Delta', 'Trajectory']],
      body: compRows,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8.5, cellPadding: 4 },
      bodyStyles: { fontSize: 8, cellPadding: 3.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 12;

    // Top Expense Category Breakdown Table
    if (categoryData.length > 0) {
      doc.setFillColor(244, 63, 94);
      doc.rect(14, y, pw - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('EXPENDITURE ALLOCATION BY CATEGORY', 18, y + 5.5);
      y += 11;

      const catRows = categoryData.slice(0, 5).map(c => [
        c.name,
        fmtCurrency(c.value),
        `${totalExpense > 0 ? ((c.value / totalExpense) * 100).toFixed(1) : 0}%`,
        c.value > totalExpense * 0.35 ? 'Primary Outflow' : 'Normal'
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Category', 'Total Spent', '% of Outflow', 'Allocation Profile']],
        body: catRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8.5, cellPadding: 4 },
        bodyStyles: { fontSize: 8, cellPadding: 3.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });
    }

    // ──────────────── PAGE 2+: ITEMIZED TRANSACTIONS LEDGER ────────────────
    doc.addPage();
    let p2Y = 18;

    doc.setFillColor(15, 23, 42);
    doc.rect(14, p2Y, pw - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`ITEMIZED FINANCIAL TRANSACTIONS LEDGER (${filteredTx.length})`, 18, p2Y + 5.5);
    p2Y += 11;

    autoTable(doc, {
      startY: p2Y,
      head: [['Date', 'Type', 'Category', 'Description', 'Amount']],
      body: getReportData(),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8.5, cellPadding: 4 },
      bodyStyles: { fontSize: 8, cellPadding: 3.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 24 },
        4: { halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw && data.cell.raw.startsWith('+')) {
            data.cell.styles.textColor = [16, 185, 129];
          } else {
            data.cell.styles.textColor = [239, 68, 68];
          }
        }
      },
      margin: { left: 14, right: 14 },
    });

    // ──────────────── GLOBAL FOOTERS ────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(241, 245, 249);
      doc.rect(0, ph - 12, pw, 12, 'F');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text('ApexHub Personal Financial System — Confidential Record', 14, ph - 4.5);
      doc.text(`Page ${i} of ${pageCount}`, pw - 14, ph - 4.5, { align: 'right' });
    }

    return doc;
  };

  const downloadPDF = () => {
    try {
      const doc = buildPDF();
      doc.save(`finance_report_${fromDate || 'all'}_to_${toDate || 'all'}.pdf`);
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

  // ─── MULTI-SHEET EXCEL EXPORT ──────────────────────────────────────────────
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Executive Overview
    const summaryRows = [
      ['ApexHub Financial Executive Report'],
      ['Generated On', new Date().toLocaleString()],
      ['Current Period', `${fromDate || 'Beginning'} to ${toDate || 'Present'}`],
      ['Baseline Period', previousPeriod.label],
      [],
      ['Metric', 'Prior Period', 'Selected Period', 'Change %'],
      ['Total Inflow', priorIncome, totalIncome, `${incomeDelta}%`],
      ['Total Outflow', priorExpense, totalExpense, `${expenseDelta}%`],
      ['Net Capital Savings', priorNetCashFlow, netCashFlow, `${netCashFlowDelta}%`],
      ['Savings Rate', `${priorSavingsRate}%`, `${savingsRate}%`, `${savingsRateDelta}% pts`],
      ['Total Transactions', priorTx.length, filteredTx.length, '']
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

    // Sheet 2: Category Breakdown
    const catRows = [
      ['Category Name', 'Total Outflow ($)', 'Share of Spending %'],
      ...categoryData.map(c => [c.name, c.value, totalExpense > 0 ? `${((c.value / totalExpense) * 100).toFixed(1)}%` : '0%'])
    ];
    const wsCat = XLSX.utils.aoa_to_sheet(catRows);
    XLSX.utils.book_append_sheet(wb, wsCat, 'Category Breakdown');

    // Sheet 3: Transactions
    const wsTx = XLSX.utils.aoa_to_sheet([
      ['Date', 'Type', 'Category', 'Description', 'Amount'],
      ...getReportData()
    ]);
    XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions Ledger');

    XLSX.writeFile(wb, `finance_report_${fromDate || 'all'}_to_${toDate || 'all'}.xlsx`);
  };

  return (
    <div className="module-container fade-in">
      {/* ─── Header ─── */}
      <div className="hero-section">
        <h2 className="hero-greeting">Finance Reports</h2>
        <p className="hero-subtitle">Comprehensive periodic financial comparison, cashflow analytics, and multi-page executive export engine.</p>
      </div>

      {/* ─── Financial Health Scorecard Ribbon ─── */}
      <div className="financial-scorecard-banner">
        <div className="score-badge-circle">
          <span className="score-num">{savingsRate}%</span>
          <span className="score-label">SAVINGS</span>
        </div>
        <div className="score-details">
          <h4 className="score-title">Executive Cash Flow &amp; Savings Health</h4>
          <p className="score-desc">
            {netCashFlow >= 0 ? '📈 Capital surplus generated' : '⚠️ Deficit warning during this period'}. Total net cashflow is <strong>{fmtCurrency(netCashFlow)}</strong> with an effective savings rate of <strong>{savingsRate}%</strong>.
          </p>
        </div>
        <div className="delta-stat-chips">
          <div className={`chip ${incomeDelta >= 0 ? 'pos' : 'neg'}`}>
            <span className="chip-val">{incomeDelta >= 0 ? '▲' : '▼'} {Math.abs(incomeDelta)}%</span>
            <span className="chip-lbl">Inflow Delta</span>
          </div>
          <div className={`chip ${expenseDelta <= 0 ? 'pos' : 'neg'}`}>
            <span className="chip-val">{expenseDelta <= 0 ? '▼' : '▲'} {Math.abs(expenseDelta)}%</span>
            <span className="chip-lbl">Outflow Delta</span>
          </div>
        </div>
      </div>

      <div className="report-layout">
        {/* ─── CONFIGURATION CARD ─── */}
        <div className="kpi-card report-card">
          <h3 className="section-title chart-title">Report Parameters</h3>
          <p className="chart-subtitle">Customize dates, transaction type, and presets</p>

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
              <input type="date" value={fromDate} onChange={e => handleDateChange('from', e.target.value)} className="glowing-input" />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <input type="date" value={toDate} onChange={e => handleDateChange('to', e.target.value)} className="glowing-input" />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Transaction Type</label>
            <div className="scope-tabs">
              {[
                { value: 'all', label: 'All Cashflows' },
                { value: 'income', label: 'Income Only' },
                { value: 'expense', label: 'Expenses Only' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReportType(opt.value)}
                  className={`scope-tab ${reportType === opt.value ? 'active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary KPI Grid */}
          <div className="report-summary-grid">
            <div className="summary-stat green">
              <div className="stat-value">{fmtCurrency(totalIncome)}</div>
              <div className="stat-label">Total Inflow</div>
              <div className="stat-delta">{incomeDelta >= 0 ? '+' : ''}{incomeDelta}% vs prior</div>
            </div>
            <div className="summary-stat coral">
              <div className="stat-value">{fmtCurrency(totalExpense)}</div>
              <div className="stat-label">Total Outflow</div>
              <div className="stat-delta">{expenseDelta >= 0 ? '+' : ''}{expenseDelta}% vs prior</div>
            </div>
            <div className="summary-stat blue" style={{ gridColumn: 'span 2' }}>
              <div className="stat-value">{fmtCurrency(netCashFlow)}</div>
              <div className="stat-label">Net Surplus / Cash Flow</div>
              <div className="stat-delta">{netCashFlowDelta >= 0 ? '+' : ''}{netCashFlowDelta}% vs prior window</div>
            </div>
          </div>

          {/* Action Export Buttons */}
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

        {/* ─── VISUAL COMPARISON & PREVIEW CARD ─── */}
        <div className="kpi-card preview-card">
          <div className="chart-header-row">
            <div>
              <h3 className="section-title chart-title">Periodic Financial Analytics</h3>
              <p className="chart-subtitle">Compare current inflow/outflow with previous baseline period</p>
            </div>
            <div className="chart-toggle-tabs">
              <button
                type="button"
                className={`ct-btn ${chartTab === 'comparison' ? 'active' : ''}`}
                onClick={() => setChartTab('comparison')}
              >
                📊 Comparison Bar
              </button>
              <button
                type="button"
                className={`ct-btn ${chartTab === 'categories' ? 'active' : ''}`}
                onClick={() => setChartTab('categories')}
              >
                🍩 Category Spend
              </button>
            </div>
          </div>

          {/* ─── CHART SECTION ─── */}
          <div className="chart-container-box">
            {chartTab === 'comparison' && (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={comparisonChartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="metric" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value) => fmtCurrency(value)}
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
                  <Bar dataKey="Current Period" fill="#10b981" radius={[6, 6, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartTab === 'categories' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                {categoryData.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No expense category data recorded.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
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
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => fmtCurrency(value)}
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

          {/* ─── TRANSACTION LEDGER PREVIEW ─── */}
          <div className="preview-section">
            <div className="preview-header tx-header">💳 Transactions Ledger Preview ({filteredTx.length})</div>
            <div className="preview-table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.length === 0 ? (
                    <tr><td colSpan="5" className="empty-row">No transactions found for this period.</td></tr>
                  ) : (
                    filteredTx.slice(0, 6).map(t => (
                      <tr key={t.id}>
                        <td>{fmtDate(t.date)}</td>
                        <td><span className={`type-badge ${t.type}`}>{t.type}</span></td>
                        <td>{t.category || 'General'}</td>
                        <td>{t.description || '-'}</td>
                        <td className={t.type === 'income' ? 'amount-in' : 'amount-out'}>
                          {t.type === 'income' ? '+' : '-'}{fmtCurrency(t.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {filteredTx.length > 6 && <p className="more-rows">+{filteredTx.length - 6} more transactions in full PDF &amp; Excel report</p>}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .financial-scorecard-banner {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 16px 22px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(14, 165, 233, 0.14));
          border: 1px solid rgba(16, 185, 129, 0.3);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .score-badge-circle {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #0ea5e9);
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
        }
        .score-num { font-size: 1.2rem; font-weight: 800; line-height: 1; }
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
        .tx-header { background: rgba(16,185,129,0.1); color: #10b981; }

        .preview-table-wrapper { border-radius: 10px; border: 1px solid var(--border-color); overflow: hidden; }
        .preview-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .preview-table th { background: var(--surface-low); padding: 9px 12px; text-align: left; font-weight: 700; color: var(--text-secondary); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border-color); }
        .preview-table td { padding: 9px 12px; color: var(--text-primary); border-bottom: 1px solid var(--border-color); }
        .preview-table tr:last-child td { border-bottom: none; }
        .preview-table tr:hover td { background: var(--surface-low); }
        .empty-row { text-align: center; color: var(--text-muted); font-style: italic; padding: 20px !important; }
        .more-rows { font-size: 0.72rem; color: var(--text-muted); padding: 8px 12px; background: var(--surface-low); border-top: 1px solid var(--border-color); text-align: right; }

        .type-badge { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
        .type-badge.income { background: rgba(16,185,129,0.12); color: #10b981; }
        .type-badge.expense { background: rgba(244,63,94,0.12); color: #f43f5e; }
        .amount-in { color: #10b981; font-weight: 700; }
        .amount-out { color: #f43f5e; font-weight: 700; }

        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
