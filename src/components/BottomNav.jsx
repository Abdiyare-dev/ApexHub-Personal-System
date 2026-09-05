"use client";

import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { useProductivity } from '@/context/ProductivityContext';

// ─── Mini SVG Icons ───────────────────────────────────────────────────────────
const Icons = {
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  Finance: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/>
    </svg>
  ),
  Productivity: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
};

const FINANCE_LINKS = [
  { label: 'Cash In', tab: 'Finance Cash In', icon: '💰' },
  { label: 'Expenses', tab: 'Finance Expenses', icon: '💸' },
  { label: 'Budget', tab: 'Finance Budget', icon: '📊' },
  { label: 'Savings', tab: 'Finance Savings', icon: '🎯' },
  { label: 'Reports', tab: 'Finance Reports', icon: '📈' },
];

const PRODUCTIVITY_LINKS = [
  { label: 'Weekly Planner', tab: 'Productivity Planner', icon: '📅' },
  { label: 'Journal', tab: 'Productivity Journal', icon: '📖' },
  { label: 'Tasks', tab: 'Productivity Tasks', icon: '✓' },
  { label: 'Projects', tab: 'Productivity Projects', icon: '📁' },
  { label: 'Habits', tab: 'Productivity Habits', icon: '⚡' },
  { label: 'Goals & Roadmap', tab: 'Productivity Goals', icon: '🎯' },
  { label: 'Timetable', tab: 'Productivity Timetable', icon: '⏰' },
  { label: 'Prod. Reports', tab: 'Productivity Reports', icon: '📊' },
];

// Determine which "bottom tab" a given activeTab belongs to
function getActiveBottomTab(activeTab) {
  if (activeTab === 'Summary & Analytics') return 'dashboard';
  if (activeTab.startsWith('Productivity') || activeTab === 'Tasks' || activeTab === 'Projects' || activeTab === 'Habits' || activeTab === 'Goals' || activeTab === 'Timetable' || activeTab === 'Planner' || activeTab === 'Journal') return 'productivity';
  if (activeTab.startsWith('Finance') || activeTab === 'Cash In' || activeTab === 'Expenses' || activeTab === 'Budget' || activeTab === 'Savings') return 'finance';
  if (activeTab === 'Settings') return 'settings';
  return null;
}

export default function BottomNav() {
  const { activeTab, setActiveTab } = useNavigation();
  const { tasks } = useProductivity();
  const [openPopover, setOpenPopover] = useState(null);
  const containerRef = useRef(null);
  const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;

  // Close popover on outside click/tap
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenPopover(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  const navigate = (tab) => {
    setActiveTab(tab);
    setOpenPopover(null);
  };

  const togglePopover = (name) => {
    setOpenPopover(prev => (prev === name ? null : name));
  };

  const bottomActiveTab = getActiveBottomTab(activeTab);

  return (
    <div className="bottom-nav-wrapper">
      <nav className="bottom-nav scrollable-bottom-nav" role="navigation" aria-label="Mobile Navigation">
        {/* Core Modules List without pop-ups */}
        <button type="button" className={`bn-tab ${activeTab === 'Summary & Analytics' ? 'active' : ''}`} onClick={() => navigate('Summary & Analytics')}>
          <span className="bn-icon"><Icons.Dashboard /></span>
          <span className="bn-label">Home</span>
        </button>
        <button type="button" className={`bn-tab ${activeTab === 'Productivity Planner' ? 'active' : ''}`} onClick={() => navigate('Productivity Planner')}>
          <span className="bn-icon">📅</span>
          <span className="bn-label">Planner</span>
        </button>
        <button type="button" className={`bn-tab ${activeTab === 'Productivity Tasks' ? 'active' : ''}`} onClick={() => navigate('Productivity Tasks')}>
          <span className="bn-icon">
            ✓
            {pendingTasks > 0 && <span className="bn-badge">{pendingTasks > 9 ? '9+' : pendingTasks}</span>}
          </span>
          <span className="bn-label">Tasks</span>
        </button>
        <button type="button" className={`bn-tab ${activeTab === 'Productivity Timetable' ? 'active' : ''}`} onClick={() => navigate('Productivity Timetable')}>
          <span className="bn-icon">⏰</span>
          <span className="bn-label">Timetable</span>
        </button>
        <button type="button" className={`bn-tab ${activeTab === 'Productivity Projects' ? 'active' : ''}`} onClick={() => navigate('Productivity Projects')}>
          <span className="bn-icon">📁</span>
          <span className="bn-label">Projects</span>
        </button>
        <button type="button" className={`bn-tab ${activeTab === 'Productivity Journal' ? 'active' : ''}`} onClick={() => navigate('Productivity Journal')}>
          <span className="bn-icon">📖</span>
          <span className="bn-label">Journal</span>
        </button>
        <button type="button" className={`bn-tab ${activeTab === 'Finance Cash In' || activeTab === 'Finance Expenses' ? 'active' : ''}`} onClick={() => navigate('Finance Cash In')}>
          <span className="bn-icon"><Icons.Finance /></span>
          <span className="bn-label">Finance</span>
        </button>
        <button type="button" className={`bn-tab ${activeTab === 'Settings' ? 'active' : ''}`} onClick={() => navigate('Settings')}>
          <span className="bn-icon"><Icons.Settings /></span>
          <span className="bn-label">Settings</span>
        </button>
      </nav>

      <style jsx>{`
        .scrollable-bottom-nav {
          display: flex;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 8px 16px;
          gap: 16px;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
          justify-content: flex-start;
          scrollbar-width: none; /* Firefox */
        }
        .scrollable-bottom-nav::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
        .bn-tab {
          flex: 0 0 auto;
          min-width: 60px;
        }
        .bn-badge {
          position: absolute;
          top: -4px;
          right: -8px;
          background: #ef4444;
          color: white;
          font-size: 0.6rem;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 10px;
          border: 2px solid var(--bg-card);
        }
      `}</style>
    </div>
  );
}
