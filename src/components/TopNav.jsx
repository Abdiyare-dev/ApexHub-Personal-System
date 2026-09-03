"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useNavigation } from '@/context/NavigationContext';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { useProductivity } from '@/context/ProductivityContext';

export default function TopNav() {
  const { theme, toggleTheme } = useTheme();
  const { openMobileSidebar } = useNavigation();
  const { user, logout } = useAuth();
  const { transactions, budgets } = useFinance();
  const { tasks, projects } = useProductivity();

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  const avatarLetter = userName.charAt(0).toUpperCase();

  // Outside click detection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute Notifications
  const notifications = useMemo(() => {
    const list = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Overdue Tasks
    tasks.filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now && !t.dueDate.startsWith(todayStr)).forEach(t => {
      list.push({
        id: `overdue-task-${t.id}`,
        type: 'overdue',
        title: 'Overdue Task',
        desc: `"${t.title || t.text}" was due on ${new Date(t.dueDate).toLocaleDateString()}`,
        time: t.dueDate,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        )
      });
    });

    // 2. Tasks Due Soon (Next 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    tasks.filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) > now && new Date(t.dueDate) <= threeDaysFromNow && !t.dueDate.startsWith(todayStr)).forEach(t => {
      list.push({
        id: `soon-task-${t.id}`,
        type: 'soon',
        title: 'Task Due Soon',
        desc: `"${t.title || t.text}" is due on ${new Date(t.dueDate).toLocaleDateString()}`,
        time: 'Upcoming',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        )
      });
    });

    // 3. Due Today
    tasks.filter(t => t.status !== 'Completed' && t.dueDate && t.dueDate.startsWith(todayStr)).forEach(t => {
      list.push({
        id: `today-task-${t.id}`,
        type: 'today',
        title: 'Due Today',
        desc: `Don't forget: "${t.title || t.text}"`,
        time: 'Today',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        )
      });
    });

    // 4. Projects Overdue
    projects.filter(p => !p.is_completed && p.dueDate && new Date(p.dueDate) < now && !p.dueDate.startsWith(todayStr)).forEach(p => {
      list.push({
        id: `overdue-project-${p.id}`,
        type: 'overdue',
        title: 'Overdue Project',
        desc: `Project "${p.name}" passed its deadline!`,
        time: p.dueDate,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="15"></line><line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        )
      });
    });

    // 5. Projects Due Soon
    projects.filter(p => !p.is_completed && p.dueDate && new Date(p.dueDate) > now && new Date(p.dueDate) <= threeDaysFromNow && !p.dueDate.startsWith(todayStr)).forEach(p => {
      list.push({
        id: `soon-project-${p.id}`,
        type: 'soon',
        title: 'Project Due Soon',
        desc: `"${p.name}" is due on ${new Date(p.dueDate).toLocaleDateString()}`,
        time: 'Upcoming',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><circle cx="12" cy="12" r="3"></circle>
          </svg>
        )
      });
    });

    // 6. Budget Alert
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + t.amount, 0);

    const planned = Array.isArray(budgets) 
      ? budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0) 
      : 0;

    if (planned > 0 && monthlyExpenses > planned * 0.9) {
      list.push({
        id: 'budget-alert',
        type: 'budget',
        title: monthlyExpenses > planned ? 'Budget Exceeded' : 'Budget Warning',
        desc: monthlyExpenses > planned 
          ? `You are over budget by $${(monthlyExpenses - planned).toLocaleString()}!` 
          : `You've used ${Math.round((monthlyExpenses / planned) * 100)}% of your $${planned.toLocaleString()} monthly limit.`,
        time: 'System',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        )
      });
    }

    return list;
  }, [tasks, projects, transactions, budgets]);

  return (
    <header className="topnav" id="topnav">
      {/* Mobile Hamburger */}
      <button className="hamburger" aria-label="Open menu" onClick={openMobileSidebar}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Search Bar */}
      <div className={`search-bar ${searchFocused ? 'focused' : ''}`}>
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          placeholder="Search projects, tasks..." 
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          autoComplete="off" 
        />
      </div>

      {/* Right Actions */}
      <div className="topnav-actions">
        {/* Theme Toggle */}
        <button className="action-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? (
            <svg className="icon-sun" style={{ display: 'block' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg className="icon-moon" style={{ display: 'block' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
            </svg>
          )}
        </button>

        {/* Notification Bell */}
        <div className="notification-wrapper" ref={notificationRef} style={{ position: 'relative' }}>
          <button 
            className="action-btn notification-btn" 
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 01-3.46 0"></path>
            </svg>
            {notifications.length > 0 && (
              <span className="notification-dot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', padding: '0' }}>
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notify-header">
                <span className="notify-title">NOTIFICATIONS</span>
                <span className="user-badge" style={{ fontSize: '0.7rem' }}>{notifications.length} PENDING</span>
              </div>
              <div className="notify-list">
                {notifications.length === 0 ? (
                  <div className="notify-empty">
                    <div className="notify-icon-wrap" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', marginBottom: '12px' }}>
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>You're all caught up!</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>No reminders at the moment.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`notify-item notify-${n.type}`}>
                      <div className="notify-icon-wrap">
                        {n.icon}
                      </div>
                      <div className="notify-content">
                        <span className="notify-item-title">{n.title}</span>
                        <span className="notify-item-desc">{n.desc}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="topnav-user">
          <span className="topnav-user-name">{userName}</span>
          <div className="topnav-avatar" onClick={logout} title="Click to logout">
            <span>{avatarLetter}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
