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
  { label: 'Tasks', tab: 'Productivity Tasks', icon: '✓' },
  { label: 'Projects', tab: 'Productivity Projects', icon: '📁' },
  { label: 'Habits', tab: 'Productivity Habits', icon: '⚡' },
  { label: 'Goals & Roadmap', tab: 'Productivity Goals', icon: '🎯' },
  { label: 'Timetable', tab: 'Productivity Timetable', icon: '📅' },
  { label: 'Prod. Reports', tab: 'Productivity Reports', icon: '📊' },
];

// Determine which "bottom tab" a given activeTab belongs to
function getActiveBottomTab(activeTab) {
  if (activeTab === 'Summary & Analytics') return 'dashboard';
  if (activeTab.startsWith('Productivity') || activeTab === 'Tasks' || activeTab === 'Projects' || activeTab === 'Habits' || activeTab === 'Goals' || activeTab === 'Timetable') return 'productivity';
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
    <div ref={containerRef} className="bottom-nav-wrapper">
      {/* Dim Backdrop when Popover is active */}
      {openPopover && (
        <div
          className="bn-backdrop"
          onClick={() => setOpenPopover(null)}
          onTouchEnd={() => setOpenPopover(null)}
        />
      )}

      {/* Finance Popover */}
      {openPopover === 'finance' && (
        <div 
          className="bn-popover bn-popover-finance"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="bn-popover-header">
            <span>Finance Modules</span>
            <button className="bn-popover-close" onClick={() => setOpenPopover(null)}>✕</button>
          </div>
          <div className="bn-popover-links">
            {FINANCE_LINKS.map((l) => (
              <button
                key={l.tab}
                type="button"
                className={`bn-popover-link ${activeTab === l.tab ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(l.tab);
                }}
              >
                <span className="bn-link-icon">{l.icon}</span>
                <span className="bn-link-text">{l.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Productivity Popover */}
      {openPopover === 'productivity' && (
        <div 
          className="bn-popover bn-popover-productivity"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="bn-popover-header">
            <span>Productivity Modules</span>
            <button className="bn-popover-close" onClick={() => setOpenPopover(null)}>✕</button>
          </div>
          <div className="bn-popover-links">
            {PRODUCTIVITY_LINKS.map((l) => (
              <button
                key={l.tab}
                type="button"
                className={`bn-popover-link ${activeTab === l.tab ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(l.tab);
                }}
              >
                <span className="bn-link-icon">{l.icon}</span>
                <span className="bn-link-text">{l.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="bottom-nav" role="navigation" aria-label="Mobile Navigation">
        {/* 1. Dashboard / Home */}
        <button
          type="button"
          className={`bn-tab ${bottomActiveTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => navigate('Summary & Analytics')}
          aria-label="Home Dashboard"
        >
          <span className="bn-icon"><Icons.Dashboard /></span>
          <span className="bn-label">Home</span>
        </button>

        {/* 2. Productivity / Work (Has Submodules) */}
        <button
          type="button"
          className={`bn-tab ${bottomActiveTab === 'productivity' || openPopover === 'productivity' ? 'active' : ''}`}
          onClick={() => togglePopover('productivity')}
          aria-label="Productivity Modules"
        >
          <span className="bn-icon">
            <Icons.Productivity />
            {pendingTasks > 0 && <span className="bn-badge">{pendingTasks > 9 ? '9+' : pendingTasks}</span>}
          </span>
          <span className="bn-label">Work</span>
        </button>

        {/* 3. Finance (Has Submodules) */}
        <button
          type="button"
          className={`bn-tab ${bottomActiveTab === 'finance' || openPopover === 'finance' ? 'active' : ''}`}
          onClick={() => togglePopover('finance')}
          aria-label="Finance Modules"
        >
          <span className="bn-icon"><Icons.Finance /></span>
          <span className="bn-label">Finance</span>
        </button>

        {/* 4. Settings (Single Module - Directly Navigates) */}
        <button
          type="button"
          className={`bn-tab ${bottomActiveTab === 'settings' ? 'active' : ''}`}
          onClick={() => navigate('Settings')}
          aria-label="Settings"
        >
          <span className="bn-icon"><Icons.Settings /></span>
          <span className="bn-label">Settings</span>
        </button>
      </nav>

      <style jsx>{`
        .bn-popover-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.8rem;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .bn-popover-close:hover {
          color: var(--text-primary);
        }
        .bn-link-icon {
          font-size: 1rem;
          width: 22px;
          text-align: center;
          margin-right: 6px;
        }
        .bn-link-text {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
