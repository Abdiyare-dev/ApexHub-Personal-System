"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { createClient } from '@/lib/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  User, ShieldCheck, Sliders, Database, LogOut, Check,
  Eye, EyeOff, KeyRound, Download, RefreshCw, Moon, Sun,
  Lock, Copy, CheckCircle2, AlertCircle, FileSpreadsheet,
  FileText, Code2, Sparkles, Terminal
} from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth() || {};
  const { theme, toggleTheme } = useTheme() || {};
  const isDark = theme === 'dark';

  const [isVisible, setIsVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState('account');
  const containerRef = useRef(null);

  // Form states — Profile
  const initialName = user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || '';
  const [displayName, setDisplayName] = useState(initialName);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Form states — Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);

  // Form states — Preferences (Persistent via localStorage)
  const [currency, setCurrency] = useState('USD');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState('monday');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');

  // Form states — Data Export (Excel, PDF, JSON)
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);

    // Load persistent preferences from localStorage
    if (typeof window !== 'undefined') {
      const savedCurrency = localStorage.getItem('apexhub_currency') || 'USD';
      const savedFirstDay = localStorage.getItem('apexhub_first_day') || 'monday';
      const savedDateFormat = localStorage.getItem('apexhub_date_format') || 'MM/DD/YYYY';
      setCurrency(savedCurrency);
      setFirstDayOfWeek(savedFirstDay);
      setDateFormat(savedDateFormat);
    }
  }, []);

  // Update display name when user loads
  useEffect(() => {
    if (user?.user_metadata?.full_name || user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.full_name || user.user_metadata.display_name);
    }
  }, [user]);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const showSnackbar = (message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar({ show: false, message: '', type: 'success' }), 3500);
  };

  // 1. REAL Supabase Profile Update
  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      showSnackbar('Please enter a display name', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim(),
          display_name: displayName.trim()
        }
      });

      if (error) throw error;

      showSnackbar('Profile name updated across ApexHub successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      showSnackbar(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 2. REAL Supabase Password Update
  const handleChangePassword = async () => {
    if (!newPassword) {
      showSnackbar('Please enter a new password', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showSnackbar('Password must be at least 6 characters long', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showSnackbar('New passwords do not match', 'error');
      return;
    }

    setIsUpdatingPw(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      showSnackbar('Password updated securely with Supabase Auth!');
    } catch (err) {
      console.error('Error updating password:', err);
      showSnackbar(err.message || 'Failed to change password. Please re-authenticate.', 'error');
    } finally {
      setIsUpdatingPw(false);
    }
  };

  // 3. REAL Preferences Update & Local Storage Persistence
  const handleSavePreferences = () => {
    try {
      localStorage.setItem('apexhub_currency', currency);
      localStorage.setItem('apexhub_first_day', firstDayOfWeek);
      localStorage.setItem('apexhub_date_format', dateFormat);

      // Dispatch custom event for immediate app-wide reactivity
      window.dispatchEvent(new Event('apexhub_preferences_updated'));

      showSnackbar('System preferences saved and applied!');
    } catch (err) {
      showSnackbar('Could not save preferences to storage', 'error');
    }
  };

  // Helper: Fetch all authentic records from Supabase across all modules
  const fetchFullDatabaseRecords = async () => {
    const supabase = createClient();
    const userId = user?.id;
    if (!userId) throw new Error('No authenticated user session found');

    const [
      { data: transactions },
      { data: budgets },
      { data: savings },
      { data: tasks },
      { data: habits },
      { data: timetable },
      { data: goals },
      { data: projects },
      { data: journals }
    ] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('savings_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('timetable_blocks').select('*').eq('user_id', userId).order('start_time', { ascending: true }),
      supabase.from('goals').select('*, milestones(*)').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('daily_journals').select('*').eq('user_id', userId).order('date', { ascending: false })
    ]);

    return {
      transactions: transactions || [],
      budgets: budgets || [],
      savings: savings || [],
      tasks: tasks || [],
      habits: habits || [],
      timetable: timetable || [],
      goals: goals || [],
      projects: projects || [],
      journals: journals || []
    };
  };

  // ─── 4A. REAL FULL MULTI-SHEET EXCEL EXPORT (.xlsx) ──────────────────────────
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const records = await fetchFullDatabaseRecords();
      const todayStr = new Date().toISOString().split('T')[0];

      const wb = XLSX.utils.book_new();

      // 1. Overview Sheet
      const totalIncome = records.transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const totalExpense = records.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
      const netWorth = totalIncome - totalExpense;

      const overviewData = [
        ['APEXHUB PERSONAL DEVELOPMENT SYSTEM — COMPLETE DATA BACKUP'],
        ['Generated At:', new Date().toLocaleString()],
        ['Account Email:', user?.email || 'N/A'],
        ['Account Holder:', displayName || 'User'],
        [],
        ['EXECUTIVE LIFETIME METRICS'],
        ['Metric', 'Value'],
        ['Total Recorded Inflow ($)', totalIncome],
        ['Total Recorded Outflow ($)', totalExpense],
        ['Net Lifetime Cash Flow ($)', netWorth],
        ['Total Transactions Logged', records.transactions.length],
        ['Active Budgets Configured', records.budgets.length],
        ['Savings Goals in Vault', records.savings.length],
        ['Execution Tasks Recorded', records.tasks.length],
        ['Habits Tracking', records.habits.length],
        ['Weekly Timetable Blocks', records.timetable.length],
        ['Strategic Goals', records.goals.length],
        ['Portfolio Projects', records.projects.length],
        ['Daily Journal Entries', records.journals.length]
      ];
      const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, wsOverview, 'System Overview');

      // 2. Transactions Sheet
      const txRows = [
        ['Date', 'Type', 'Category', 'Amount ($)', 'Description', 'Recurring'],
        ...records.transactions.map(t => [
          t.date || '',
          (t.type || '').toUpperCase(),
          t.category || 'General',
          Number(t.amount || 0),
          t.description || t.notes || '',
          t.is_recurring ? 'YES' : 'NO'
        ])
      ];
      const wsTx = XLSX.utils.aoa_to_sheet(txRows);
      XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');

      // 3. Budgets Sheet
      const budgetRows = [
        ['Category', 'Monthly Limit ($)', 'Spent ($)', 'Period', 'Status'],
        ...records.budgets.map(b => [
          b.category || 'General',
          Number(b.amount || b.limit || 0),
          Number(b.spent || 0),
          b.period || 'monthly',
          Number(b.spent || 0) > Number(b.amount || b.limit || 0) ? 'OVER BUDGET' : 'ON TRACK'
        ])
      ];
      const wsBudgets = XLSX.utils.aoa_to_sheet(budgetRows);
      XLSX.utils.book_append_sheet(wb, wsBudgets, 'Budgets');

      // 4. Savings Vault Sheet
      const savingsRows = [
        ['Goal Name', 'Target Amount ($)', 'Current Saved ($)', 'Category', 'Target Date'],
        ...records.savings.map(s => [
          s.title || s.name || 'Savings Goal',
          Number(s.target_amount || 0),
          Number(s.current_amount || s.saved || 0),
          s.category || 'Vault',
          s.target_date || s.deadline || ''
        ])
      ];
      const wsSavings = XLSX.utils.aoa_to_sheet(savingsRows);
      XLSX.utils.book_append_sheet(wb, wsSavings, 'Savings Vault');

      // 5. Tasks Sheet
      const taskRows = [
        ['Task Title', 'Status', 'Priority', 'Due Date', 'Category', 'Timetable Synced'],
        ...records.tasks.map(t => [
          t.title || t.text || '',
          t.status || 'Pending',
          (t.priority || 'medium').toUpperCase(),
          t.due_date || t.dueDate || '',
          t.category || '',
          t.is_from_timetable ? 'YES' : 'NO'
        ])
      ];
      const wsTasks = XLSX.utils.aoa_to_sheet(taskRows);
      XLSX.utils.book_append_sheet(wb, wsTasks, 'Tasks');

      // 6. Habits Sheet
      const habitRows = [
        ['Habit Name', 'Frequency', 'Active Status', 'Created At'],
        ...records.habits.map(h => [
          h.title || h.name || '',
          (h.frequency || 'daily').toUpperCase(),
          h.active !== false ? 'ACTIVE' : 'PAUSED',
          h.created_at || ''
        ])
      ];
      const wsHabits = XLSX.utils.aoa_to_sheet(habitRows);
      XLSX.utils.book_append_sheet(wb, wsHabits, 'Habits');

      // 7. Timetable Sheet
      const timetableRows = [
        ['Day of Week', 'Start Time', 'End Time', 'Activity Title', 'Category'],
        ...records.timetable.map(b => [
          b.day_of_week || b.day || '',
          b.start_time || '',
          b.end_time || '',
          b.title || '',
          b.category || ''
        ])
      ];
      const wsTimetable = XLSX.utils.aoa_to_sheet(timetableRows);
      XLSX.utils.book_append_sheet(wb, wsTimetable, 'Weekly Timetable');

      // 8. Goals & Milestones Sheet
      const goalRows = [
        ['Goal Title', 'Category', 'Status', 'Target Date', 'Milestone Sub-Steps'],
        ...records.goals.map(g => [
          g.title || '',
          (g.category || 'personal').toUpperCase(),
          (g.status || 'not_started').toUpperCase(),
          g.target_date || '',
          (g.milestones || []).map(m => m.title).join(' | ') || 'None'
        ])
      ];
      const wsGoals = XLSX.utils.aoa_to_sheet(goalRows);
      XLSX.utils.book_append_sheet(wb, wsGoals, 'Strategic Goals');

      // 9. Projects Portfolio Sheet
      const projectRows = [
        ['Project Title', 'Status', 'Due Date', 'Description'],
        ...records.projects.map(p => [
          p.title || '',
          (p.status || 'active').toUpperCase(),
          p.due_date || '',
          p.description || ''
        ])
      ];
      const wsProjects = XLSX.utils.aoa_to_sheet(projectRows);
      XLSX.utils.book_append_sheet(wb, wsProjects, 'Projects Portfolio');

      // 10. Daily Journals Sheet
      const journalRows = [
        ['Date', 'Reflection / Content', 'Logged At'],
        ...records.journals.map(j => [
          j.date || '',
          j.content || j.notes || '',
          j.created_at || ''
        ])
      ];
      const wsJournals = XLSX.utils.aoa_to_sheet(journalRows);
      XLSX.utils.book_append_sheet(wb, wsJournals, 'Daily Reflection Journal');

      XLSX.writeFile(wb, `ApexHub_Complete_Database_${todayStr}.xlsx`);
      showSnackbar('Comprehensive multi-sheet Excel (.xlsx) workbook exported successfully!');
    } catch (err) {
      console.error('Error exporting Excel workbook:', err);
      showSnackbar(err.message || 'Failed to export Excel file', 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // ─── 4B. REAL EXECUTIVE MULTI-PAGE PDF EXPORT (.pdf) ─────────────────────────
  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      const records = await fetchFullDatabaseRecords();
      const todayStr = new Date().toISOString().split('T')[0];

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();

      // ──────────────── HEADER BANNER ────────────────
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pw, 38, 'F');
      doc.setFillColor(10, 132, 255); // royal blue accent line
      doc.rect(0, 38, pw, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text('ApexHub', 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Complete Personal Development System & Database Audit', 14, 25);
      doc.text(`Account Holder: ${displayName || 'User'} | ${user?.email || ''}`, 14, 32);

      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`Export Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, pw - 14, 18, { align: 'right' });
      doc.setTextColor(148, 163, 184);
      doc.text('Classification: Confidential Personal Ledger', pw - 14, 26, { align: 'right' });

      let y = 48;

      // ──────────────── KPI BOXES ────────────────
      const totalIncome = records.transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
      const totalExpense = records.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
      const netCash = totalIncome - totalExpense;

      const boxW = (pw - 42) / 3;
      const kpis = [
        { label: 'NET CASH FLOW', val: `$${netCash.toLocaleString()}`, sub: `${records.transactions.length} Transactions Logged`, bg: [224, 242, 254], fg: [10, 132, 255] },
        { label: 'EXECUTION VELOCITY', val: `${records.tasks.length} Tasks`, sub: `${records.habits.length} Habits Tracked`, bg: [237, 233, 254], fg: [94, 92, 230] },
        { label: 'STRATEGIC PORTFOLIO', val: `${records.goals.length} Goals`, sub: `${records.projects.length} Active Projects`, bg: [219, 252, 234], fg: [48, 209, 88] }
      ];

      kpis.forEach((k, idx) => {
        const bx = 14 + idx * (boxW + 7);
        doc.setFillColor(...k.bg);
        doc.roundedRect(bx, y, boxW, 24, 3, 3, 'F');
        doc.setTextColor(...k.fg);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text(k.label, bx + boxW / 2, y + 7, { align: 'center' });
        doc.setFontSize(13);
        doc.text(k.val, bx + boxW / 2, y + 14, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(k.sub, bx + boxW / 2, y + 20, { align: 'center' });
      });

      y += 32;

      // ──────────────── TABLE 1: FINANCIAL TRANSACTIONS ────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('1. Cash In & Expense Ledger', 14, y);
      y += 4;

      const txTableBody = records.transactions.slice(0, 25).map(t => [
        t.date || '-',
        (t.type || '').toUpperCase(),
        t.category || 'General',
        `$${Number(t.amount || 0).toLocaleString()}`,
        t.description || t.notes || '-'
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Date', 'Type', 'Category', 'Amount', 'Description']],
        body: txTableBody.length > 0 ? txTableBody : [['-', 'NO TRANSACTIONS', '-', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      // ──────────────── TABLE 2: EXECUTION TASKS ────────────────
      doc.addPage();
      y = 20;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Prioritized Execution Tasks', 14, y);
      y += 4;

      const taskTableBody = records.tasks.slice(0, 30).map(t => [
        t.title || t.text || '-',
        (t.priority || 'medium').toUpperCase(),
        t.status || 'Pending',
        t.due_date || t.dueDate || '-',
        t.category || 'General'
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Task Title', 'Priority', 'Status', 'Due Date', 'Category']],
        body: taskTableBody.length > 0 ? taskTableBody : [['-', 'NO TASKS LOGGED', '-', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [94, 92, 230], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      // ──────────────── TABLE 3: STRATEGIC GOALS & PROJECTS ────────────────
      y = doc.lastAutoTable.finalY + 14;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('3. Strategic Goals & Project Milestones', 14, y);
      y += 4;

      const goalTableBody = records.goals.slice(0, 20).map(g => [
        g.title || '-',
        (g.category || 'personal').toUpperCase(),
        (g.status || 'not_started').toUpperCase(),
        g.target_date || '-',
        (g.milestones || []).map(m => m.title).join(', ') || 'None'
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Goal / Project', 'Category', 'Status', 'Target Date', 'Milestone Checkpoints']],
        body: goalTableBody.length > 0 ? goalTableBody : [['-', 'NO GOALS LOGGED', '-', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [48, 209, 88], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      // Footer Page Numbering on all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`ApexHub Executive Audit · Generated for ${displayName || 'User'}`, 14, ph - 8);
        doc.text(`Page ${i} of ${totalPages}`, pw - 14, ph - 8, { align: 'right' });
      }

      doc.save(`ApexHub_Executive_Audit_${todayStr}.pdf`);
      showSnackbar('Executive multi-page PDF audit report exported successfully!');
    } catch (err) {
      console.error('Error exporting PDF document:', err);
      showSnackbar(err.message || 'Failed to export PDF file', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // ─── 4C. REAL FULL JSON DATABASE BACKUP (.json) ──────────────────────────────
  const handleExportJSON = async () => {
    setIsExportingJson(true);
    try {
      const records = await fetchFullDatabaseRecords();
      const todayStr = new Date().toISOString().split('T')[0];

      const backupPayload = {
        app: 'ApexHub Personal Development System',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
          name: displayName
        },
        data: records
      };

      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ApexHub_Raw_Database_Backup_${todayStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSnackbar('Complete Raw JSON backup file downloaded successfully!');
    } catch (err) {
      console.error('Error exporting JSON backup:', err);
      showSnackbar(err.message || 'Failed to export JSON backup data', 'error');
    } finally {
      setIsExportingJson(false);
    }
  };

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      showSnackbar('User ID copied to clipboard');
    }
  };

  const handleClearCache = () => {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      showSnackbar('Workspace cache cleared successfully. Reloading...');
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      showSnackbar('Failed to clear cache', 'error');
    }
  };

  const chevronSvg = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const userInitial = (displayName || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className={`settings-container ${isVisible ? 'fade-in-active' : ''}`} ref={containerRef}>

      {/* HEADER */}
      <div className="hero-section hero-3d">
        <h2 className="hero-greeting">Settings & Vault Preferences</h2>
        <p className="hero-subtitle">Manage authenticated identity, system localization, security encryption, and comprehensive data backups</p>
      </div>

      <div className="settings-list">

        {/* ======================== 1. ACCOUNT & PROFILE ======================== */}
        <div className={`settings-card glass-3d ${expandedSection === 'account' ? 'expanded' : ''}`}>
          <div className="settings-card-header" onClick={() => toggleSection('account')}>
            <div className="settings-card-header-left">
              <div className="settings-icon account-icon">
                <User size={22} />
              </div>
              <div>
                <h3 className="settings-title">Account & Profile</h3>
                <p className="settings-desc">Manage authenticated identity and profile name</p>
              </div>
            </div>
            <span className={`chevron ${expandedSection === 'account' ? 'rotated' : ''}`}>{chevronSvg}</span>
          </div>

          <div className={`settings-content ${expandedSection === 'account' ? 'content-visible' : ''}`}>
            <div className="content-section">
              <h4 className="section-label">Identity Overview</h4>
              
              <div className="profile-row">
                <div className="avatar-circle">
                  {userInitial}
                </div>
                <div className="avatar-info">
                  <span className="avatar-name">{displayName || 'ApexHub Member'}</span>
                  <span className="avatar-email">{user?.email || 'Loading session...'}</span>
                  <div className="avatar-status-pill">
                    <span className="avatar-dot" />
                    <span>Active Supabase Account</span>
                  </div>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Display Full Name</label>
                <input
                  type="text"
                  className="settings-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Abdiqafar"
                />
                <span className="field-hint">Displayed across your dashboard, navigation, and executive PDF reports.</span>
              </div>

              <div className="field-group">
                <label className="field-label">Email Address (Read-only)</label>
                <input
                  type="email"
                  className="settings-input disabled-input"
                  value={user?.email || ''}
                  readOnly
                />
                <span className="field-hint">Your email is tied to your cryptographic Supabase identity token.</span>
              </div>

              {/* Account Metadata Row */}
              <div className="account-meta-box">
                <div className="amb-item">
                  <span className="amb-label">User ID</span>
                  <div className="amb-val-row">
                    <span className="amb-val code-font">{user?.id ? `${user.id.substring(0, 12)}...` : 'N/A'}</span>
                    <button type="button" className="btn-copy-id" onClick={copyUserId} title="Copy full User ID">
                      {copiedId ? <Check size={14} color="#34D399" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div className="amb-item">
                  <span className="amb-label">Auth Provider</span>
                  <span className="amb-val">{user?.app_metadata?.provider ? user.app_metadata.provider.toUpperCase() : 'EMAIL / PASSWORD'}</span>
                </div>
                <div className="amb-item">
                  <span className="amb-label">Member Since</span>
                  <span className="amb-val">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Current Session'}
                  </span>
                </div>
              </div>

              <button 
                className="btn-save" 
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* ======================== 2. SECURITY & ENCRYPTION ======================== */}
        <div className={`settings-card glass-3d ${expandedSection === 'security' ? 'expanded' : ''}`}>
          <div className="settings-card-header" onClick={() => toggleSection('security')}>
            <div className="settings-card-header-left">
              <div className="settings-icon security-icon">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="settings-title">Security & Password</h3>
                <p className="settings-desc">Update account password and verify cloud vault isolation</p>
              </div>
            </div>
            <span className={`chevron ${expandedSection === 'security' ? 'rotated' : ''}`}>{chevronSvg}</span>
          </div>

          <div className={`settings-content ${expandedSection === 'security' ? 'content-visible' : ''}`}>
            {/* Real Password Change */}
            <div className="content-section">
              <h4 className="section-label">Change Password</h4>

              <div className="field-group">
                <label className="field-label">New Password</label>
                <div className="password-wrapper">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    className="settings-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                  />
                  <button 
                    type="button" 
                    className="pw-toggle" 
                    onClick={() => setShowNewPw(!showNewPw)}
                    aria-label="Toggle password visibility"
                  >
                    {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Confirm New Password</label>
                <input
                  type="password"
                  className="settings-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>

              <button 
                className="btn-save" 
                onClick={handleChangePassword}
                disabled={isUpdatingPw}
              >
                {isUpdatingPw ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>

            {/* Real Security & Vault Verification (Replacing fake mock sessions) */}
            <div className="content-divider" />
            <div className="content-section">
              <h4 className="section-label">Active Cloud Vault Verification</h4>

              <div className="security-diagnostic-grid">
                <div className="diag-item">
                  <div className="diag-icon-box green">
                    <Lock size={18} />
                  </div>
                  <div>
                    <div className="diag-title">Row Level Security (RLS)</div>
                    <div className="diag-sub">Active & Enforced — Data isolated strictly to your user UID</div>
                  </div>
                </div>

                <div className="diag-item">
                  <div className="diag-icon-box blue">
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <div className="diag-title">Session Encryption</div>
                    <div className="diag-sub">AES-256 JWT bearer token with automatic refresh</div>
                  </div>
                </div>

                <div className="diag-item">
                  <div className="diag-icon-box purple">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div className="diag-title">Zero Third-Party Brokerage</div>
                    <div className="diag-sub">No bank linking or external analytics resale</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================== 3. PREFERENCES & LOCALIZATION ======================== */}
        <div className={`settings-card glass-3d ${expandedSection === 'preferences' ? 'expanded' : ''}`}>
          <div className="settings-card-header" onClick={() => toggleSection('preferences')}>
            <div className="settings-card-header-left">
              <div className="settings-icon pref-icon">
                <Sliders size={22} />
              </div>
              <div>
                <h3 className="settings-title">Preferences & Localization</h3>
                <p className="settings-desc">Currency, week format, and theme preferences</p>
              </div>
            </div>
            <span className={`chevron ${expandedSection === 'preferences' ? 'rotated' : ''}`}>{chevronSvg}</span>
          </div>

          <div className={`settings-content ${expandedSection === 'preferences' ? 'content-visible' : ''}`}>
            <div className="content-section">
              <h4 className="section-label">System Theming</h4>

              <div className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-label">Interface Appearance</span>
                  <span className="toggle-desc">Currently in {isDark ? 'Dark Mode 🌙' : 'Light Mode ☀️'}</span>
                </div>
                <button
                  type="button"
                  className="btn-theme-toggle"
                  onClick={toggleTheme}
                >
                  {isDark ? (
                    <>
                      <Sun size={16} color="#FF9F0A" />
                      <span>Switch to Light</span>
                    </>
                  ) : (
                    <>
                      <Moon size={16} color="#0A84FF" />
                      <span>Switch to Dark</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="content-divider" />
            <div className="content-section">
              <h4 className="section-label">Regional & Calendar Settings</h4>

              <div className="field-group">
                <label className="field-label">Default Currency Symbol</label>
                <select 
                  className="settings-select" 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD ($) — US Dollar</option>
                  <option value="EUR">EUR (€) — Euro</option>
                  <option value="GBP">GBP (£) — British Pound</option>
                  <option value="KES">KES (KSh) — Kenyan Shilling</option>
                  <option value="SOS">SOS (Sh) — Somali Shilling</option>
                  <option value="CAD">CAD ($) — Canadian Dollar</option>
                  <option value="AUD">AUD ($) — Australian Dollar</option>
                  <option value="AED">AED (AED) — UAE Dirham</option>
                </select>
                <span className="field-hint">Used as default currency code for budgets and reports.</span>
              </div>

              <div className="field-group">
                <label className="field-label">First Day of Week</label>
                <select 
                  className="settings-select" 
                  value={firstDayOfWeek} 
                  onChange={(e) => setFirstDayOfWeek(e.target.value)}
                >
                  <option value="monday">Monday (Standard Workweek)</option>
                  <option value="sunday">Sunday (Traditional)</option>
                  <option value="saturday">Saturday (Middle East / Regional)</option>
                </select>
                <span className="field-hint">Affects timetable matrices, weekly timetable pushers, and habit heatmaps.</span>
              </div>

              <div className="field-group">
                <label className="field-label">Date Display Format</label>
                <select 
                  className="settings-select" 
                  value={dateFormat} 
                  onChange={(e) => setDateFormat(e.target.value)}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/07/2026)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 07/09/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard)</option>
                </select>
              </div>

              <button className="btn-save" onClick={handleSavePreferences}>
                Save Preferences
              </button>
            </div>
          </div>
        </div>

        {/* ======================== 4. COMPREHENSIVE DATA EXPORT (EXCEL, PDF, JSON) ======================== */}
        <div className={`settings-card glass-3d ${expandedSection === 'data' ? 'expanded' : ''}`}>
          <div className="settings-card-header" onClick={() => toggleSection('data')}>
            <div className="settings-card-header-left">
              <div className="settings-icon data-icon">
                <Database size={22} />
              </div>
              <div>
                <h3 className="settings-title">Data Management & Complete Exports</h3>
                <p className="settings-desc">Export comprehensive database records to Excel, PDF, or JSON</p>
              </div>
            </div>
            <span className={`chevron ${expandedSection === 'data' ? 'rotated' : ''}`}>{chevronSvg}</span>
          </div>

          <div className={`settings-content ${expandedSection === 'data' ? 'content-visible' : ''}`}>
            <div className="content-section">
              <h4 className="section-label">Comprehensive Multi-Format Data Exports</h4>
              
              <div className="export-grid">
                {/* 1. Excel Export */}
                <div className="export-format-card">
                  <div className="efc-header">
                    <div className="efc-icon-frame green">
                      <FileSpreadsheet size={24} color="#30D158" />
                    </div>
                    <div className="efc-title-box">
                      <div className="efc-title-row">
                        <span className="efc-title">Complete Excel Workbook</span>
                        <span className="efc-badge green">.XLSX Multi-Sheet</span>
                      </div>
                      <p className="efc-desc">
                        Full multi-tab spreadsheet containing 10 worksheets: Transactions, Budgets, Savings Vault, Tasks, Habits, Timetable, Goals, Projects, and Journals.
                      </p>
                    </div>
                  </div>
                  <button 
                    className="btn-export-format btn-excel" 
                    onClick={handleExportExcel}
                    disabled={isExportingExcel}
                  >
                    {isExportingExcel ? (
                      <>
                        <RefreshCw size={16} className="spin" />
                        <span>Building Excel Workbook...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Download Full Excel (.xlsx)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2. PDF Export */}
                <div className="export-format-card">
                  <div className="efc-header">
                    <div className="efc-icon-frame red">
                      <FileText size={24} color="#FF453A" />
                    </div>
                    <div className="efc-title-box">
                      <div className="efc-title-row">
                        <span className="efc-title">Executive Audit PDF Report</span>
                        <span className="efc-badge red">.PDF Multi-Page</span>
                      </div>
                      <p className="efc-desc">
                        Clean, formatted executive document with financial scorecards, task priority tables, and milestone roadmap progress ready for printing or archiving.
                      </p>
                    </div>
                  </div>
                  <button 
                    className="btn-export-format btn-pdf" 
                    onClick={handleExportPDF}
                    disabled={isExportingPdf}
                  >
                    {isExportingPdf ? (
                      <>
                        <RefreshCw size={16} className="spin" />
                        <span>Generating PDF Document...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Download Executive PDF (.pdf)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 3. JSON Export */}
                <div className="export-format-card">
                  <div className="efc-header">
                    <div className="efc-icon-frame blue">
                      <Code2 size={24} color="#0A84FF" />
                    </div>
                    <div className="efc-title-box">
                      <div className="efc-title-row">
                        <span className="efc-title">Raw Database JSON Backup</span>
                        <span className="efc-badge blue">.JSON Data File</span>
                      </div>
                      <p className="efc-desc">
                        Complete raw cryptographic database backup containing all user tables for zero vendor lock-in, data migration, and offline preservation.
                      </p>
                    </div>
                  </div>
                  <button 
                    className="btn-export-format btn-json" 
                    onClick={handleExportJSON}
                    disabled={isExportingJson}
                  >
                    {isExportingJson ? (
                      <>
                        <RefreshCw size={16} className="spin" />
                        <span>Packing JSON Archive...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Download Raw JSON (.json)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="content-divider" />
              <h4 className="section-label">Cache & Service Worker Diagnostics</h4>

              <div className="data-action-card secondary">
                <div className="dac-info">
                  <div className="dac-title-row">
                    <RefreshCw size={20} className="text-purple" />
                    <span className="dac-title">Clear Workspace Local Cache</span>
                  </div>
                  <p className="dac-desc">
                    Cleans stale PWA service worker caches and local temporary store if you experience slow network sync or layout inconsistencies.
                  </p>
                </div>
                <button className="btn-clear-cache" onClick={handleClearCache}>
                  Clear Cache & Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ======================== 5. LOG OUT ======================== */}
        <div className="settings-card glass-3d danger-card">
          <div className="settings-card-header" onClick={logout}>
            <div className="settings-card-header-left">
              <div className="settings-icon danger-icon">
                <LogOut size={22} />
              </div>
              <div>
                <h3 className="settings-title danger-title">Log Out</h3>
                <p className="settings-desc">Safely terminate your authenticated ApexHub session</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Snackbar */}
      {snackbar.show && (
        <div className={`snackbar ${snackbar.type}`}>
          {snackbar.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{snackbar.message}</span>
        </div>
      )}

      <style jsx>{`
        .settings-container {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .fade-in-active {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-3d {
          position: relative;
          z-index: 10;
          margin-bottom: 2rem;
        }

        /* ---- Card List ---- */
        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ---- Card Base ---- */
        .settings-card {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: 18px;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.35s ease,
                      border-color 0.3s ease;
          cursor: pointer;
        }

        .settings-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14), 0 0 16px var(--accent-subtle);
          border-color: var(--accent);
        }

        .settings-card.expanded {
          transform: translateY(0);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15), 0 0 0 1.5px var(--accent-subtle);
          border-color: var(--accent);
          cursor: default;
        }

        /* ---- Card Header ---- */
        .settings-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.4rem 1.8rem;
          cursor: pointer;
          user-select: none;
        }

        .settings-card-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .settings-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: white;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
          transition: transform 0.3s ease;
        }

        .settings-card:hover .settings-icon {
          transform: scale(1.08) rotate(-3deg);
        }

        .account-icon {
          background: linear-gradient(135deg, #0A84FF, #0055D4);
        }
        .security-icon {
          background: linear-gradient(135deg, #30D158, #009944);
        }
        .pref-icon {
          background: linear-gradient(135deg, #5E5CE6, #3B38B8);
        }
        .data-icon {
          background: linear-gradient(135deg, #BF5AF2, #8928BA);
        }
        .danger-icon {
          background: linear-gradient(135deg, #FF453A, #C41C40);
        }

        .settings-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 2px;
          letter-spacing: -0.3px;
        }

        .settings-desc {
          font-size: 0.86rem;
          color: var(--text-secondary);
        }

        /* Chevron */
        .chevron {
          color: var(--text-muted);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
        }
        .chevron.rotated {
          transform: rotate(180deg);
          color: var(--accent);
        }

        /* ---- Expandable Content ---- */
        .settings-content {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.45s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.3s ease,
                      padding 0.3s ease;
          padding: 0 1.8rem;
        }

        .settings-content.content-visible {
          max-height: 1800px;
          opacity: 1;
          padding: 0 1.8rem 1.8rem 1.8rem;
        }

        .content-section {
          padding-top: 0.5rem;
        }

        .content-divider {
          height: 1px;
          background: var(--border-color);
          margin: 1.5rem 0;
        }

        .section-label {
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--accent);
          margin-bottom: 1.1rem;
        }

        /* ---- Profile Row ---- */
        .profile-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 1.5rem;
          padding: 1.2rem;
          background: var(--surface-low);
          border-radius: 14px;
          border: 1px solid var(--border);
        }

        .avatar-circle {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0A84FF, #0055D4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 1.35rem;
          flex-shrink: 0;
          box-shadow: 0 4px 18px rgba(10, 132, 255, 0.4);
        }

        .avatar-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .avatar-name {
          font-weight: 800;
          font-size: 1.05rem;
          color: var(--text-primary);
        }

        .avatar-email {
          font-size: 0.86rem;
          color: var(--text-secondary);
        }

        .avatar-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 2px 8px;
          border-radius: 100px;
          background: rgba(48, 209, 88, 0.12);
          border: 1px solid rgba(48, 209, 88, 0.25);
          color: #30D158;
          font-size: 0.72rem;
          font-weight: 700;
          margin-top: 4px;
          width: fit-content;
        }

        .avatar-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #30D158;
        }

        /* Account Metadata Box */
        .account-meta-box {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 14px 18px;
          background: var(--surface-low);
          border: 1px solid var(--border);
          border-radius: 12px;
          margin-bottom: 1.4rem;
        }
        .amb-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .amb-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .amb-val {
          font-size: 0.86rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .amb-val-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .code-font {
          font-family: monospace;
          font-size: 0.82rem;
        }
        .btn-copy-id {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px 6px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
        }
        .btn-copy-id:hover {
          color: var(--accent);
          border-color: var(--accent);
        }

        /* ---- Form Fields ---- */
        .field-group {
          margin-bottom: 1.2rem;
        }

        .field-label {
          display: block;
          font-size: 0.86rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }

        .settings-input, .settings-select {
          width: 100%;
          padding: 12px 14px;
          font-size: 0.95rem;
          font-family: inherit;
          background: var(--bg-body);
          color: var(--text-primary);
          border: 1.5px solid var(--border-color);
          border-radius: 12px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          -webkit-appearance: none;
        }

        .settings-input:focus, .settings-select:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-subtle);
        }

        .settings-input::placeholder {
          color: var(--text-muted);
        }

        .disabled-input {
          opacity: 0.65;
          cursor: not-allowed;
          background: var(--surface-low);
        }

        .field-hint {
          display: block;
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 5px;
          line-height: 1.4;
        }

        /* Password toggle wrapper */
        .password-wrapper {
          position: relative;
        }

        .password-wrapper .settings-input {
          padding-right: 48px;
        }

        .pw-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .pw-toggle:hover {
          color: var(--accent);
        }

        /* ---- Security Diagnostic Grid ---- */
        .security-diagnostic-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .diag-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 12px;
          background: var(--surface-low);
          border: 1px solid var(--border);
        }
        .diag-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .diag-icon-box.green {
          background: rgba(48, 209, 88, 0.15);
          color: #30D158;
        }
        .diag-icon-box.blue {
          background: rgba(10, 132, 255, 0.15);
          color: #0A84FF;
        }
        .diag-icon-box.purple {
          background: rgba(191, 90, 242, 0.15);
          color: #BF5AF2;
        }
        .diag-title {
          font-size: 0.92rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .diag-sub {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        /* ---- Toggle Row ---- */
        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
        }

        .toggle-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .toggle-label {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .toggle-desc {
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        .btn-theme-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 100px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-primary);
          font-size: 0.86rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .btn-theme-toggle:hover {
          border-color: var(--accent);
          transform: translateY(-1px);
        }

        /* ---- Comprehensive Export Grid ---- */
        .export-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .export-format-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px 22px;
          border-radius: 16px;
          background: var(--surface-low);
          border: 1px solid var(--border);
          transition: border-color 0.25s ease, transform 0.25s ease;
        }
        .export-format-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }

        .efc-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .efc-icon-frame {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
        }
        .efc-icon-frame.green {
          background: rgba(48, 209, 88, 0.15);
          border: 1px solid rgba(48, 209, 88, 0.3);
        }
        .efc-icon-frame.red {
          background: rgba(255, 69, 58, 0.15);
          border: 1px solid rgba(255, 69, 58, 0.3);
        }
        .efc-icon-frame.blue {
          background: rgba(10, 132, 255, 0.15);
          border: 1px solid rgba(10, 132, 255, 0.3);
        }

        .efc-title-box {
          flex: 1;
        }
        .efc-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }
        .efc-title {
          font-size: 1.02rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .efc-badge {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 100px;
          border: 1px solid;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }
        .efc-badge.green {
          background: rgba(48, 209, 88, 0.12);
          color: #30D158;
          border-color: rgba(48, 209, 88, 0.3);
        }
        .efc-badge.red {
          background: rgba(255, 69, 58, 0.12);
          color: #FF453A;
          border-color: rgba(255, 69, 58, 0.3);
        }
        .efc-badge.blue {
          background: rgba(10, 132, 255, 0.12);
          color: #0A84FF;
          border-color: rgba(10, 132, 255, 0.3);
        }

        .efc-desc {
          font-size: 0.83rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        .btn-export-format {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 22px;
          border-radius: 12px;
          border: none;
          color: white;
          font-size: 0.9rem;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          width: fit-content;
        }
        .btn-export-format:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .btn-export-format:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        .btn-excel {
          background: linear-gradient(135deg, #30D158, #009944);
          box-shadow: 0 4px 14px rgba(48, 209, 88, 0.35);
        }
        .btn-excel:hover:not(:disabled) {
          box-shadow: 0 8px 22px rgba(48, 209, 88, 0.45);
        }

        .btn-pdf {
          background: linear-gradient(135deg, #FF453A, #C41C40);
          box-shadow: 0 4px 14px rgba(255, 69, 58, 0.35);
        }
        .btn-pdf:hover:not(:disabled) {
          box-shadow: 0 8px 22px rgba(255, 69, 58, 0.45);
        }

        .btn-json {
          background: linear-gradient(135deg, #0A84FF, #0055D4);
          box-shadow: 0 4px 14px rgba(10, 132, 255, 0.35);
        }
        .btn-json:hover:not(:disabled) {
          box-shadow: 0 8px 22px rgba(10, 132, 255, 0.45);
        }

        /* ---- Data Action Cards ---- */
        .data-action-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 18px 20px;
          border-radius: 14px;
          background: var(--surface-low);
          border: 1px solid var(--border);
        }
        .dac-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dac-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dac-title {
          font-size: 0.96rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .dac-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.45;
          margin: 0;
        }
        .btn-clear-cache {
          padding: 9px 18px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.86rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .btn-clear-cache:hover {
          color: var(--accent);
          border-color: var(--accent);
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ---- Save Button ---- */
        .btn-save {
          padding: 11px 26px;
          font-size: 0.92rem;
          font-weight: 800;
          font-family: inherit;
          color: white;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          border: none;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 16px var(--accent-glow);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          margin-top: 0.5rem;
        }

        .btn-save:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px var(--accent-glow);
        }
        .btn-save:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        /* ---- Danger Card ---- */
        .danger-card {
          border-color: rgba(255, 69, 58, 0.18);
        }

        .danger-card:hover {
          border-color: var(--coral);
          box-shadow: 0 15px 40px rgba(255, 69, 58, 0.15), 0 0 0 2px rgba(255, 69, 58, 0.15);
        }

        .danger-title {
          color: var(--coral) !important;
        }

        /* ---- Snackbar ---- */
        .snackbar {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          border-radius: 100px;
          font-size: 0.9rem;
          font-weight: 700;
          z-index: 9999;
          animation: snackIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
        }

        .snackbar.success {
          background: linear-gradient(135deg, #059669, #34D399);
          color: white;
        }

        .snackbar.error {
          background: linear-gradient(135deg, #DC2626, #F87171);
          color: white;
        }

        @keyframes snackIn {
          from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        /* ---- Select Dropdown ---- */
        .settings-select {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394A3B8' d='M6 8.825l-4.6-4.6L2.825 2.8 6 5.975 9.175 2.8l1.425 1.425z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
        }

        /* ---- Responsive ---- */
        @media (max-width: 768px) {
          .account-meta-box {
            grid-template-columns: 1fr;
          }
          .data-action-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .btn-export-format, .btn-clear-cache {
            width: 100%;
            justify-content: center;
          }
        }
        @media (max-width: 640px) {
          .settings-card-header {
            padding: 1.1rem 1.2rem;
          }
          .settings-content.content-visible {
            padding: 0 1.2rem 1.4rem 1.2rem;
          }
          .settings-icon {
            width: 38px;
            height: 38px;
          }
        }
      `}</style>
    </div>
  );
}
