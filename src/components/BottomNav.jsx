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
  Tasks: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
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
  { label: 'Finance Dashboard', tab: 'Finance Dashboard' },
  { label: 'Cash In', tab: 'Finance Cash In' },
  { label: 'Expenses', tab: 'Finance Expenses' },
  { label: 'Budget', tab: 'Finance Budget' },
  { label: 'Savings', tab: 'Finance Savings' },
  { label: 'Reports', tab: 'Finance Reports' },
];

const PRODUCTIVITY_LINKS = [
  { label: 'Prod. Dashboard', tab: 'Productivity Dashboard' },
  { label: 'Tasks', tab: 'Productivity Tasks' },
  { label: 'Projects', tab: 'Productivity Projects' },
  { label: 'Habits', tab: 'Productivity Habits' },
  { label: 'Goals & Roadmap', tab: 'Productivity Goals' },
  { label: 'Timetable', tab: 'Productivity Timetable' },
  { label: 'Prod. Reports', tab: 'Productivity Reports' },
];

const SETTINGS_LINKS = [
  { label: 'Settings', tab: 'Settings' },
];

// Determine which "bottom tab" a given activeTab belongs to
function getActiveBottomTab(activeTab) {
  if (activeTab === 'Summary & Analytics') return 'dashboard';
  if (activeTab.startsWith('Productivity')) return 'productivity';
  if (activeTab.startsWith('Finance')) return 'finance';
  if (activeTab === 'Settings') return 'settings';
  return null;
}

export default function BottomNav() {
  const { activeTab, setActiveTab } = useNavigation();
  const { tasks } = useProductivity();
  const [openPopover, setOpenPopover] = useState(null);
  const navRef = useRef(null);
  const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;

  // Close popover on outside click
  useEffect(() => {
    const handle = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenPopover(null);
      }
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, []);

  const navigate = (tab) => {
    setActiveTab(tab);
    setOpenPopover(null);
  };

  const togglePopover = (name) => {
    setOpenPopover(openPopover === name ? null : name);
  };

  const bottomActiveTab = getActiveBottomTab(activeTab);

  const PopoverLinks = ({ links }) => (
    <div className="bn-popover-links">
      {links.map((l) => (
        <button
          key={l.tab}
          className={`bn-popover-link ${activeTab === l.tab ? 'active' : ''}`}
          onClick={() => navigate(l.tab)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      {openPopover && (
        <div
          className="bn-backdrop"
          onClick={() => setOpenPopover(null)}
        />
      )}

      {/* Finance Popover */}
      {openPopover === 'finance' && (
        <div className="bn-popover bn-popover-finance">
          <div className="bn-popover-header">Finance</div>
          <PopoverLinks links={FINANCE_LINKS} />
        </div>
      )}

      {/* Productivity Popover */}
      {openPopover === 'productivity' && (
        <div className="bn-popover bn-popover-productivity">
          <div className="bn-popover-header">Productivity</div>
          <PopoverLinks links={PRODUCTIVITY_LINKS} />
        </div>
      )}

      {/* Settings Popover */}
      {openPopover === 'settings' && (
        <div className="bn-popover bn-popover-settings">
          <div className="bn-popover-header">System</div>
          <PopoverLinks links={SETTINGS_LINKS} />
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav ref={navRef} className="bottom-nav" role="navigation" aria-label="Mobile Navigation">

        {/* Dashboard */}
        <button
          className={`bn-tab ${bottomActiveTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => navigate('Summary & Analytics')}
          aria-label="Dashboard"
        >
          <span className="bn-icon"><Icons.Dashboard /></span>
          <span className="bn-label">Home</span>
        </button>

        {/* Productivity */}
        <button
          className={`bn-tab ${bottomActiveTab === 'productivity' || openPopover === 'productivity' ? 'active' : ''}`}
          onClick={() => togglePopover('productivity')}
          aria-label="Productivity"
        >
          <span className="bn-icon">
            <Icons.Productivity />
            {pendingTasks > 0 && <span className="bn-badge">{pendingTasks > 9 ? '9+' : pendingTasks}</span>}
          </span>
          <span className="bn-label">Work</span>
        </button>

        {/* Finance */}
        <button
          className={`bn-tab ${bottomActiveTab === 'finance' || openPopover === 'finance' ? 'active' : ''}`}
          onClick={() => togglePopover('finance')}
          aria-label="Finance"
        >
          <span className="bn-icon"><Icons.Finance /></span>
          <span className="bn-label">Finance</span>
        </button>

        {/* Settings */}
        <button
          className={`bn-tab ${bottomActiveTab === 'settings' || openPopover === 'settings' ? 'active' : ''}`}
          onClick={() => togglePopover('settings')}
          aria-label="Settings"
        >
          <span className="bn-icon"><Icons.Settings /></span>
          <span className="bn-label">Settings</span>
        </button>

      </nav>
    </>
  );
}
