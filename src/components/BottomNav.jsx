"use client";

import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { useProductivity } from '@/context/ProductivityContext';

// ─── SVG Icons ───────────────────────────────────────────────────────────
const Icons = {
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  Productivity: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  ),
  Finance: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  ChevronUp: () => (
    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  )
};

// ─── Module Lists ────────────────────────────────────────────────────────────
const PRODUCTIVITY_MODULES = [
  { label: 'Weekly Planner', tab: 'Productivity Planner', icon: '📅', desc: 'Schedules & plans' },
  { label: 'Daily Journal', tab: 'Productivity Journal', icon: '📖', desc: 'Reflections & logs' },
  { label: 'Action Tasks', tab: 'Productivity Tasks', icon: '✓', desc: 'Daily & weekly tasks', hasBadge: true },
  { label: 'Projects', tab: 'Productivity Projects', icon: '📁', desc: 'Portfolio & milestones' },
  { label: 'Habit Streaks', tab: 'Productivity Habits', icon: '⚡', desc: 'Mastery & cadence' },
  { label: 'Goals & Roadmap', tab: 'Productivity Goals', icon: '🎯', desc: 'Strategic objectives' },
  { label: 'Timetable', tab: 'Productivity Timetable', icon: '⏰', desc: 'Weekly master blocks' },
  { label: 'Prod. Reports', tab: 'Productivity Reports', icon: '📊', desc: 'Performance analytics' },
];

const FINANCE_MODULES = [
  { label: 'Cash In', tab: 'Finance Cash In', icon: '💰', desc: 'Income streams' },
  { label: 'Expenses', tab: 'Finance Expenses', icon: '💸', desc: 'Daily outflows' },
  { label: 'Budgeting', tab: 'Finance Budget', icon: '📊', desc: 'Monthly limits' },
  { label: 'Target Savings', tab: 'Finance Savings', icon: '🎯', desc: 'Savings goals' },
  { label: 'Finance Reports', tab: 'Finance Reports', icon: '📈', desc: 'Financial analytics' },
];

// Determine which of the 4 parent sections the activeTab belongs to
function getActiveBottomSection(tab) {
  if (!tab || tab === 'Summary & Analytics') return 'dashboard';
  if (tab.startsWith('Productivity') || tab === 'Tasks' || tab === 'Projects' || tab === 'Habits' || tab === 'Goals' || tab === 'Timetable' || tab === 'Planner' || tab === 'Journal') return 'productivity';
  if (tab.startsWith('Finance') || tab === 'Cash In' || tab === 'Expenses' || tab === 'Budget' || tab === 'Savings') return 'finance';
  if (tab === 'Settings') return 'settings';
  return 'dashboard';
}

export default function BottomNav() {
  const { activeTab, setActiveTab } = useNavigation() || {};
  const { tasks = [] } = useProductivity() || {};
  const [openDrawer, setOpenDrawer] = useState(null); // null | 'productivity' | 'finance'
  const navRef = useRef(null);

  const pendingTasks = (Array.isArray(tasks) ? tasks : []).filter(t => t && t.status !== 'Completed').length;
  const activeSection = getActiveBottomSection(activeTab);

  // Close popup drawer on outside click or Esc key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDrawer(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpenDrawer(null);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNavigate = (tab) => {
    if (setActiveTab) setActiveTab(tab);
    setOpenDrawer(null);
  };

  const handleTabClick = (sectionName, directTab = null) => {
    if (directTab) {
      // Direct navigation (Dashboard or Settings)
      handleNavigate(directTab);
    } else {
      // Toggle pop-up drawer (Productivity or Finance)
      setOpenDrawer(prev => (prev === sectionName ? null : sectionName));
    }
  };

  return (
    <div className="bottom-nav-root" ref={navRef}>
      {/* ─── Frosted Backdrop Overlay ─── */}
      {openDrawer && (
        <div 
          className="bn-backdrop" 
          onClick={() => setOpenDrawer(null)}
          aria-hidden="true"
        />
      )}

      {/* ─── Productivity Pop-up Bottom Sheet Drawer ─── */}
      {openDrawer === 'productivity' && (
        <div className="bn-popup-drawer fade-slide-up" role="dialog" aria-label="Productivity Modules">
          <div className="drawer-header">
            <div className="dh-title-group">
              <span className="dh-icon">⚡</span>
              <div>
                <h4 className="dh-title">Productivity Modules</h4>
                <p className="dh-sub">Select an activity to view</p>
              </div>
            </div>
            <button 
              type="button" 
              className="drawer-close-btn" 
              onClick={() => setOpenDrawer(null)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="drawer-grid">
            {PRODUCTIVITY_MODULES.map(mod => {
              const isSelected = activeTab === mod.tab;
              return (
                <button
                  key={mod.tab}
                  type="button"
                  className={`drawer-item ${isSelected ? 'active' : ''}`}
                  onClick={() => handleNavigate(mod.tab)}
                >
                  <span className="di-icon-box">
                    <span className="di-emoji">{mod.icon}</span>
                    {mod.hasBadge && pendingTasks > 0 && (
                      <span className="di-badge">{pendingTasks > 9 ? '9+' : pendingTasks}</span>
                    )}
                  </span>
                  <div className="di-text-group">
                    <span className="di-label">{mod.label}</span>
                    <span className="di-desc">{mod.desc}</span>
                  </div>
                  {isSelected && <span className="di-active-dot" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Finance Pop-up Bottom Sheet Drawer ─── */}
      {openDrawer === 'finance' && (
        <div className="bn-popup-drawer fade-slide-up" role="dialog" aria-label="Finance Modules">
          <div className="drawer-header">
            <div className="dh-title-group">
              <span className="dh-icon">💰</span>
              <div>
                <h4 className="dh-title">Finance Modules</h4>
                <p className="dh-sub">Manage money, budgets & savings</p>
              </div>
            </div>
            <button 
              type="button" 
              className="drawer-close-btn" 
              onClick={() => setOpenDrawer(null)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="drawer-grid">
            {FINANCE_MODULES.map(mod => {
              const isSelected = activeTab === mod.tab;
              return (
                <button
                  key={mod.tab}
                  type="button"
                  className={`drawer-item ${isSelected ? 'active' : ''}`}
                  onClick={() => handleNavigate(mod.tab)}
                >
                  <span className="di-icon-box">
                    <span className="di-emoji">{mod.icon}</span>
                  </span>
                  <div className="di-text-group">
                    <span className="di-label">{mod.label}</span>
                    <span className="di-desc">{mod.desc}</span>
                  </div>
                  {isSelected && <span className="di-active-dot" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 4-Section Fixed Bottom Navigation Bar ─── */}
      <nav className="bottom-nav" role="navigation" aria-label="Mobile Bottom Navigation">
        {/* 1. Dashboard (Direct) */}
        <button 
          type="button" 
          className={`bn-tab ${activeSection === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabClick('dashboard', 'Summary & Analytics')}
        >
          <span className="bn-icon"><Icons.Dashboard /></span>
          <span className="bn-label">Dashboard</span>
        </button>

        {/* 2. Productivity (Pop-up Drawer) */}
        <button 
          type="button" 
          className={`bn-tab ${activeSection === 'productivity' ? 'active' : ''} ${openDrawer === 'productivity' ? 'drawer-open' : ''}`}
          onClick={() => handleTabClick('productivity')}
        >
          <span className="bn-icon">
            <Icons.Productivity />
            {pendingTasks > 0 && (
              <span className="bn-badge">{pendingTasks > 9 ? '9+' : pendingTasks}</span>
            )}
            <span className="bn-chevron"><Icons.ChevronUp /></span>
          </span>
          <span className="bn-label">Productivity</span>
        </button>

        {/* 3. Finance (Pop-up Drawer) */}
        <button 
          type="button" 
          className={`bn-tab ${activeSection === 'finance' ? 'active' : ''} ${openDrawer === 'finance' ? 'drawer-open' : ''}`}
          onClick={() => handleTabClick('finance')}
        >
          <span className="bn-icon">
            <Icons.Finance />
            <span className="bn-chevron"><Icons.ChevronUp /></span>
          </span>
          <span className="bn-label">Finance</span>
        </button>

        {/* 4. Settings (Direct) */}
        <button 
          type="button" 
          className={`bn-tab ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => handleTabClick('settings', 'Settings')}
        >
          <span className="bn-icon"><Icons.Settings /></span>
          <span className="bn-label">Settings</span>
        </button>
      </nav>

      <style jsx>{`
        .bottom-nav-root {
          /* container for mobile nav */
        }

        /* Backdrop Overlay */
        .bn-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 195;
          animation: fadeIn 0.2s ease-out forwards;
        }

        /* Bottom Sheet Popup Drawer */
        .bn-popup-drawer {
          position: fixed;
          bottom: 64px;
          left: 12px;
          right: 12px;
          max-height: calc(82vh - 64px);
          overflow-y: auto;
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 16px 16px 14px;
          z-index: 198;
          box-shadow: 0 -10px 32px rgba(0, 0, 0, 0.35);
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--border-color);
        }
        .dh-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dh-icon {
          font-size: 1.3rem;
          background: var(--surface-low);
          padding: 6px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
        }
        .dh-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .dh-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin: 2px 0 0 0;
        }
        .drawer-close-btn {
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          cursor: pointer;
        }

        /* Drawer Grid */
        .drawer-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        @media (max-width: 380px) {
          .drawer-grid {
            grid-template-columns: 1fr;
          }
        }

        .drawer-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .drawer-item:hover, .drawer-item:active {
          background: var(--surface-high);
          border-color: rgba(0, 229, 255, 0.4);
          transform: translateY(-1px);
        }
        .drawer-item.active {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.12), rgba(59, 130, 246, 0.16));
          border-color: var(--accent-start);
          box-shadow: 0 0 12px rgba(0, 229, 255, 0.15);
        }

        .di-icon-box {
          position: relative;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .di-emoji {
          font-size: 1.1rem;
        }
        .di-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 0.6rem;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 9999px;
          border: 1.5px solid var(--surface);
        }

        .di-text-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        .di-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .drawer-item.active .di-label {
          color: var(--accent-start);
        }
        .di-desc {
          font-size: 0.68rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .di-active-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-start);
          box-shadow: 0 0 8px var(--accent-start);
          flex-shrink: 0;
        }

        /* 4-Section Fixed Nav Customizations */
        .bn-chevron {
          position: absolute;
          bottom: -2px;
          right: -2px;
          color: var(--text-muted);
          font-size: 0.55rem;
          opacity: 0.7;
          transition: transform 0.2s ease;
        }
        .bn-tab.drawer-open .bn-chevron {
          transform: rotate(180deg);
          color: var(--accent-start);
        }
        .bn-tab.drawer-open {
          color: var(--accent-start);
        }

        .bn-badge {
          position: absolute;
          top: -4px;
          right: -6px;
          background: #ef4444;
          color: white;
          font-size: 0.6rem;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 9999px;
          border: 2px solid var(--bg-topnav);
        }

        /* Animations */
        .fade-slide-up {
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
