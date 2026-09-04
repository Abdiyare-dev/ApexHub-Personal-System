"use client";

import { useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { useAuth } from '@/context/AuthContext';
import { useProductivity } from '@/context/ProductivityContext';
import { useFinance } from '@/context/FinanceContext';

// ─── Icon components ────────────────────────────────────────────────────────
const Icon = {
  Grid: () => (
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
  Projects: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  ),
  Habits: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  Goals: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Timetable: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  Finance: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/>
    </svg>
  ),
  CashIn: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7"/>
    </svg>
  ),
  Expenses: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12l7 7 7-7"/>
    </svg>
  ),
  Budget: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  Savings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.8 2-2.1 2-3.5A5.5 5.5 0 0019 5z"/>
      <path d="M2 9v1a2 2 0 002 2h1"/>
    </svg>
  ),
  Reports: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  FinanceDash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 16h7M14 19h5"/>
    </svg>
  ),
  ProdDash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  ),
};

// ─── Nav Item ────────────────────────────────────────────────────────────────
function NavItem({ icon: IconComp, label, tabKey, activeTab, onClick, badge, collapsed }) {
  const isActive = activeTab === tabKey;
  return (
    <button
      className={`sb-nav-item ${isActive ? 'active' : ''}`}
      onClick={(e) => onClick(tabKey, e)}
      title={collapsed ? label : undefined}
      aria-label={label}
    >
      <span className="sb-nav-icon">
        <IconComp />
      </span>
      <span className="sb-nav-label">{label}</span>
      {badge > 0 && <span className="sb-badge">{badge > 99 ? '99+' : badge}</span>}
    </button>
  );
}

// ─── Section icons (mini, inline) ───────────────────────────────────
const SectionIcons = {
  overview: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  productivity: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  finance: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/>
    </svg>
  ),
  system: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
};

// ─── Section Header ─────────────────────────────────────────────────────
function SectionHeader({ label, colorClass, isFirst, collapsed }) {
  if (collapsed) return isFirst ? null : <div className="sb-section-divider" />;
  return (
    <div className={`sb-section-group-label ${colorClass || ''} ${isFirst ? 'first' : ''}`}>
      <span className="sb-section-dot" />
      <span className="sb-section-text">{label}</span>
    </div>
  );
}

// ─── Main Sidebar ────────────────────────────────────────────────────────────
export default function Sidebar() {
  const {
    activeTab,
    setActiveTab,
    isSidebarOpen,
    closeMobileSidebar,
    isSidebarCollapsed,
    toggleSidebarCollapse,
  } = useNavigation();

  const { logout, user } = useAuth();
  const { tasks, projects } = useProductivity();
  const { transactions } = useFinance();

  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      closeMobileSidebar();
    } else {
      toggleSidebarCollapse();
    }
  };

  const handleTabClick = (tabName, e) => {
    e.preventDefault();
    setActiveTab(tabName);
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      closeMobileSidebar();
    }
  };

  const collapsed = isSidebarCollapsed;
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarLetter = userName.charAt(0).toUpperCase();

  // Live badges
  const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;
  const activeProjects = projects.filter(p => !p.is_completed && !p.isCompleted).length;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={closeMobileSidebar}
      />

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isSidebarOpen ? 'mobile-open' : ''}`}>
        {/* ── Header ── */}
        <div className="sb-header">
          <div className="sb-brand">
            <div className="sb-logo-wrap">
              <img
                src="/icon_logo.png"
                alt="ApexHub"
                width="36"
                height="36"
                className="sb-logo-img"
              />
              <span className="sb-logo-pulse" />
            </div>
            <div className="sb-brand-text">
              <span className="sb-brand-name">ApexHub</span>
              <span className="sb-brand-sub">Personal System</span>
            </div>
          </div>
          <button
            className="sb-toggle"
            onClick={handleToggle}
            aria-label="Toggle sidebar"
          >
            <span className="sb-toggle-icon">
              <Icon.ChevronLeft />
            </span>
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="sb-nav" role="navigation" aria-label="Main Navigation">

          <NavItem icon={Icon.Grid} label="Dashboard" tabKey="Summary & Analytics"
            activeTab={activeTab} onClick={handleTabClick} collapsed={collapsed} />

          {/* PRODUCTIVITY */}
          <SectionHeader label="Productivity" colorClass="productivity" isFirst collapsed={collapsed} />
          <NavItem icon={Icon.Tasks} label="Tasks" tabKey="Productivity Tasks"
            activeTab={activeTab} onClick={handleTabClick} badge={pendingTasks} collapsed={collapsed} />
          <NavItem icon={Icon.Projects} label="Projects" tabKey="Productivity Projects"
            activeTab={activeTab} onClick={handleTabClick} badge={activeProjects} collapsed={collapsed} />
          <NavItem icon={Icon.Habits} label="Habits" tabKey="Productivity Habits"
            activeTab={activeTab} onClick={handleTabClick} collapsed={collapsed} />
          <NavItem icon={Icon.Goals} label="Goals & Roadmap" tabKey="Productivity Goals"
            activeTab={activeTab} onClick={handleTabClick} collapsed={collapsed} />
          <NavItem icon={Icon.Timetable} label="Timetable" tabKey="Productivity Timetable"
            activeTab={activeTab} onClick={handleTabClick} collapsed={collapsed} />
          <NavItem icon={Icon.Reports} label="Prod. Reports" tabKey="Productivity Reports"
            activeTab={activeTab} onClick={handleTabClick} collapsed={collapsed} />

          {/* FINANCE */}
          <SectionHeader label="Finance" colorClass="finance" collapsed={collapsed} />
          <NavItem icon={Icon.CashIn} label="Cash In" tabKey="Finance Cash In"
            activeTab={activeTab} onClick={handleTabClick} collapsed={collapsed} />
          <NavItem icon={Icon.Expenses} label="Expenses" tabKey="Finance Expenses"
            activeTab={activeTab} onClick={handleTabClick} collapsed={collapsed} />
          <NavItem icon={Icon.Budget} label="Budget" tabKey="Finance Budget"
            activeTab={activeTab} onClick={handleTabClick} collapsed={collapsed} />
          <NavItem icon={Icon.Savings} label="Savings" tabKey="Finance Savings"
            activeTab={activeTab} onClick={handleTabClick} collapsed={collapsed} />
          <NavItem icon={Icon.Reports} label="Finance Reports" tabKey="Finance Reports"
            activeTab={activeTab} onClick={handleTabClick} collapsed={collapsed} />

          {/* SYSTEM */}
          <SectionHeader label="System" colorClass="system" collapsed={collapsed} />
          <NavItem icon={Icon.Settings} label="Settings" tabKey="Settings"
            activeTab={activeTab} onClick={handleTabClick} collapsed={collapsed} />

        </nav>

        {/* ── User / Footer ── */}
        <div className="sb-footer">
          <div className="sb-user-card">
            <div className="sb-user-avatar">
              {avatarLetter}
              <span className="sb-user-status-dot" />
            </div>
            <div className="sb-user-info">
              <span className="sb-user-name">{userName}</span>
              <span className="sb-user-role">Personal Hub</span>
            </div>
            <button
              className="sb-logout-btn"
              onClick={logout}
              title="Log Out"
              aria-label="Log Out"
            >
              <Icon.Logout />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
