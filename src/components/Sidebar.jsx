"use client";

import { useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const { 
    activeTab, 
    setActiveTab, 
    isSidebarOpen, 
    closeMobileSidebar, 
    isSidebarCollapsed, 
    toggleSidebarCollapse 
  } = useNavigation();

  const { logout } = useAuth();

  const [openAccordion, setOpenAccordion] = useState(null);

  // On mobile, the toggle button closes the sidebar instead of collapsing it
  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      closeMobileSidebar();
    } else {
      toggleSidebarCollapse();
    }
  };

  const toggleAccordion = (accordionName) => {
    setOpenAccordion(openAccordion === accordionName ? null : accordionName);
  };

  const handleTabClick = (tabName, e) => {
    e.preventDefault();
    setActiveTab(tabName);
    if (window.innerWidth <= 768) {
      closeMobileSidebar();
    }
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={closeMobileSidebar}
      ></div>

      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header" style={{ padding: '24px 20px 20px', alignItems: 'center', flexDirection: 'column' }}>
          <div className="sidebar-brand" style={{ flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
            <img src="/icon_logo.png" alt="ApexHub Logo" width="66" height="66" style={{ borderRadius: '16px', minWidth: '66px', objectFit: 'cover', boxShadow: '0 6px 20px rgba(0, 160, 255, 0.4)' }} />
            <div className="sidebar-brand-text" style={{ alignItems: 'center' }}>
              <h1 className="sidebar-logo" style={{ lineHeight: '1.1', fontSize: '1.75rem', marginBottom: '2px' }}>ApexHub</h1>
              <span className="sidebar-subtitle" style={{ fontSize: '0.7rem', fontWeight: '800', opacity: 0.85, textAlign: 'center' }}>Personal Tracking System</span>
            </div>
          </div>
          <button className="sidebar-toggle" onClick={handleToggle} aria-label="Toggle sidebar" style={{ marginTop: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {/* Summary Button */}
          <button 
            className={`nav-summary ${activeTab === 'Summary & Analytics' ? 'active' : ''}`}
            onClick={(e) => handleTabClick('Summary & Analytics', e)}
          >
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1"></rect>
            </svg>
            <span className="nav-label">Summary & Analytics</span>
          </button>

          {/* Personal Finance Accordion */}
          <div className="nav-accordion">
            <button 
              className={`nav-accordion-trigger ${openAccordion === 'finance' ? 'open' : ''}`} 
              onClick={() => toggleAccordion('finance')}
            >
              <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="M2 10h20"></path>
              </svg>
              <span className="nav-label">Personal Finance</span>
              <svg className="nav-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div 
              className={`nav-accordion-panel ${openAccordion === 'finance' ? 'open' : ''}`}
              style={{ maxHeight: openAccordion === 'finance' ? '300px' : null }}
            >
              {['Dashboard', 'Expenses', 'Cash In', 'Budget', 'Reports'].map((item) => (
                <a 
                  key={`finance-${item}`}
                  href="#" 
                  className={`nav-sub-item ${activeTab === `Finance ${item}` ? 'active' : ''}`}
                  onClick={(e) => handleTabClick(`Finance ${item}`, e)}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Personal Productivity Accordion */}
          <div className="nav-accordion">
            <button 
              className={`nav-accordion-trigger ${openAccordion === 'productivity' ? 'open' : ''}`} 
              onClick={() => toggleAccordion('productivity')}
            >
              <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
              </svg>
              <span className="nav-label">Personal Productivity</span>
              <svg className="nav-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div 
              className={`nav-accordion-panel ${openAccordion === 'productivity' ? 'open' : ''}`}
              style={{ maxHeight: openAccordion === 'productivity' ? '250px' : null }}
            >
              {['Dashboard', 'Tasks', 'Goals', 'Projects', 'Reports'].map((item) => (
                <a 
                  key={`prod-${item}`}
                  href="#" 
                  className={`nav-sub-item ${activeTab === `Productivity ${item}` ? 'active' : ''}`}
                  onClick={(e) => handleTabClick(`Productivity ${item}`, e)}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Standalone Links */}
          <a href="#" className={`nav-link ${activeTab === 'Settings' ? 'active' : ''}`} onClick={(e) => handleTabClick('Settings', e)}>
            <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"></path>
            </svg>
            <span className="nav-label">Settings</span>
          </a>
        </nav>

        <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
          <button 
            className="nav-link" 
            onClick={logout}
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', width: '100%', cursor: 'pointer', color: 'var(--coral)', padding: '10px 0' }}
          >
            <svg style={{ marginRight: '16px', minWidth: '20px' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span className="nav-label" style={{ fontWeight: '600' }}>Log Out</span>
          </button>
        </div>

      </aside>
    </>
  );
}
