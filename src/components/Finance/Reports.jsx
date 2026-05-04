"use client";

import { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Reports() {
  const { transactions } = useFinance();
  
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState('all');

  const filteredTx = transactions.filter(t => {
    const txDate = new Date(t.date).toISOString().split('T')[0];
    const dateMatch = txDate >= fromDate && txDate <= toDate;
    if (!dateMatch) return false;
    if (reportType === 'all') return true;
    return t.type === reportType;
  });

  const totalIncome = filteredTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const getReportData = () => filteredTx.map(t => [
    new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    t.type.charAt(0).toUpperCase() + t.type.slice(1),
    t.category,
    t.description,
    `$${t.amount.toFixed(2)}`
  ]);

  // ── Professional PDF Builder ──
  const buildPDF = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    // ─ Header bar ─
    doc.setFillColor(0, 123, 255);
    doc.rect(0, 0, pw, 36, 'F');
    doc.setFillColor(99, 102, 241);
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
    doc.text('Finance Report', 14, 28);

    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, pw - 14, 18, { align: 'right' });
    doc.text(`Period: ${fromDate}  →  ${toDate}`, pw - 14, 28, { align: 'right' });

    // ─ Summary boxes ─
    let y = 50;
    const boxW = (pw - 42) / 3;

    // Income box
    doc.setFillColor(219, 252, 234);
    doc.roundedRect(14, y, boxW, 28, 3, 3, 'F');
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL INCOME', 14 + boxW/2, y + 10, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`$${totalIncome.toLocaleString()}`, 14 + boxW/2, y + 22, { align: 'center' });

    // Expense box
    const x2 = 14 + boxW + 7;
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(x2, y, boxW, 28, 3, 3, 'F');
    doc.setTextColor(239, 68, 68);
    doc.setFontSize(8);
    doc.text('TOTAL EXPENSES', x2 + boxW/2, y + 10, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`$${totalExpense.toLocaleString()}`, x2 + boxW/2, y + 22, { align: 'center' });

    // Balance box
    const x3 = x2 + boxW + 7;
    doc.setFillColor(224, 231, 255);
    doc.roundedRect(x3, y, boxW, 28, 3, 3, 'F');
    doc.setTextColor(79, 70, 229);
    doc.setFontSize(8);
    doc.text('NET BALANCE', x3 + boxW/2, y + 10, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`$${balance.toLocaleString()}`, x3 + boxW/2, y + 22, { align: 'center' });

    y += 40;

    // ─ Section heading ─
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pw - 28, 10, 'F');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`TRANSACTIONS (${filteredTx.length})`, 18, y + 7);
    y += 14;

    // ─ Table ─
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Category', 'Description', 'Amount']],
      body: getReportData(),
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 5,
      },
      bodyStyles: {
        fontSize: 8.5,
        cellPadding: 4,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 22 },
        4: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          if (data.cell.raw === 'Income') {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

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
      doc.text('ApexHub Finance Report — Confidential', 14, pgH - 5);
      doc.text(`Page ${i} of ${pageCount}`, pw - 14, pgH - 5, { align: 'right' });
    }

    return doc;
  };

  const downloadPDF = () => {
    try {
      const doc = buildPDF();
      doc.save(`finance_report_${fromDate}_to_${toDate}.pdf`);
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
    const ws = XLSX.utils.aoa_to_sheet([
      ['Date', 'Type', 'Category', 'Description', 'Amount'],
      ...getReportData()
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Finance Report');
    XLSX.writeFile(wb, `finance_report_${fromDate}_to_${toDate}.xlsx`);
  };

  return (
    <div className="module-container fade-in">
      <div className="hero-section">
        <h2 className="hero-greeting">Finance Reports</h2>
        <p className="hero-subtitle">Comprehensive financial oversight with robust export and viewing options.</p>
      </div>

      <div className="report-layout">
        {/* CONFIG CARD */}
        <div className="kpi-card report-card">
          <h3 className="section-title chart-title">Report Configuration</h3>
          <p className="chart-subtitle">Customize dates and filter options</p>

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
            <label>Transaction Type</label>
            <div className="scope-tabs">
              {[
                { value: 'all', label: 'All' },
                { value: 'income', label: 'Income' },
                { value: 'expense', label: 'Expenses' },
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
              <div className="stat-value">${totalIncome.toLocaleString()}</div>
              <div className="stat-label">Total Income</div>
            </div>
            <div className="summary-stat coral">
              <div className="stat-value">${totalExpense.toLocaleString()}</div>
              <div className="stat-label">Total Expenses</div>
            </div>
            <div className="summary-stat green" style={{ gridColumn: 'span 2' }}>
              <div className="stat-value">${balance.toLocaleString()}</div>
              <div className="stat-label">Net Balance</div>
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
          <h3 className="section-title chart-title">Transaction Preview</h3>
          <p className="chart-subtitle">{filteredTx.length} transaction{filteredTx.length !== 1 ? 's' : ''} found</p>
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
                  filteredTx.slice(0, 8).map(t => (
                    <tr key={t.id}>
                      <td>{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td><span className={`type-badge ${t.type}`}>{t.type}</span></td>
                      <td>{t.category}</td>
                      <td>{t.description}</td>
                      <td className={t.type === 'income' ? 'amount-in' : 'amount-out'}>
                        {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredTx.length > 8 && <p className="more-rows">+{filteredTx.length - 8} more transactions in full report</p>}
          </div>
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
        .summary-stat.blue  { border-left: 3px solid #0ea5e9; }
        .summary-stat.coral { border-left: 3px solid #f43f5e; }
        .summary-stat.green { border-left: 3px solid #10b981; }
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
        .preview-table-wrapper { border-radius: 10px; border: 1px solid var(--border-color); overflow: hidden; }
        .preview-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .preview-table th { background: var(--surface-low); padding: 10px 12px; text-align: left; font-weight: 700; color: var(--text-secondary); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border-color); }
        .preview-table td { padding: 10px 12px; color: var(--text-primary); border-bottom: 1px solid var(--border-color); }
        .preview-table tr:last-child td { border-bottom: none; }
        .preview-table tr:hover td { background: var(--surface-low); }
        .empty-row { text-align: center; color: var(--text-muted); font-style: italic; padding: 30px !important; }
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
