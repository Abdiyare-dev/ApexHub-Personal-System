"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Settings() {
  const { user, logout } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const containerRef = useRef(null);

  // Form states — Account Settings
  const [displayName, setDisplayName] = useState(user?.displayName || 'Test User');
  const [email] = useState(user?.email || 'user@example.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Form states — Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');

  // Form states — Security
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');

  // Snackbar
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 150);
  }, []);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const showSnackbar = (message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSaveProfile = () => {
    showSnackbar('Profile updated successfully!');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      showSnackbar('Please fill all password fields.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showSnackbar('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showSnackbar('Password must be at least 8 characters.', 'error');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showSnackbar('Password changed successfully!');
  };

  const handleSavePreferences = () => {
    showSnackbar('Preferences saved!');
  };

  const handleSaveSecurity = () => {
    showSnackbar('Security settings updated!');
  };

  // Mock session data
  const sessions = [
    { device: 'Chrome — Windows 10', location: 'Mogadishu, SO', lastActive: 'Now', current: true },
    { device: 'Safari — iPhone 15', location: 'Mogadishu, SO', lastActive: '2 hours ago', current: false },
    { device: 'Firefox — macOS', location: 'Nairobi, KE', lastActive: '3 days ago', current: false },
  ];

  const chevronSvg = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className={`settings-container ${isVisible ? 'fade-in-active' : ''}`} ref={containerRef}>

      {/* HEADER */}
      <div className="hero-section hero-3d">
        <h2 className="hero-greeting">Settings</h2>
        <p className="hero-subtitle">Manage your account and preferences</p>
      </div>

      <div className="settings-list">

        {/* ======================== ACCOUNT SETTINGS ======================== */}
        <div className={`settings-card glass-3d ${expandedSection === 'account' ? 'expanded' : ''}`}>
          <div className="settings-card-header" onClick={() => toggleSection('account')}>
            <div className="settings-card-header-left">
              <div className="settings-icon account-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <h3 className="settings-title">Account Settings</h3>
                <p className="settings-desc">Email, password, and profile information</p>
              </div>
            </div>
            <span className={`chevron ${expandedSection === 'account' ? 'rotated' : ''}`}>{chevronSvg}</span>
          </div>

          <div className={`settings-content ${expandedSection === 'account' ? 'content-visible' : ''}`}>
            {/* Profile Section */}
            <div className="content-section">
              <h4 className="section-label">Profile Information</h4>
              <div className="profile-row">
                <div className="avatar-circle">
                  {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="avatar-info">
                  <span className="avatar-name">{displayName}</span>
                  <span className="avatar-email">{email}</span>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Display Name</label>
                <input
                  type="text"
                  className="settings-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>

              <div className="field-group">
                <label className="field-label">Email Address</label>
                <input
                  type="email"
                  className="settings-input disabled-input"
                  value={email}
                  readOnly
                />
                <span className="field-hint">Email cannot be changed from here. Contact support.</span>
              </div>

              <button className="btn-save" onClick={handleSaveProfile}>Save Profile</button>
            </div>

            {/* Password Section */}
            <div className="content-divider" />
            <div className="content-section">
              <h4 className="section-label">Change Password</h4>

              <div className="field-group">
                <label className="field-label">Current Password</label>
                <div className="password-wrapper">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    className="settings-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button className="pw-toggle" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                    {showCurrentPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">New Password</label>
                <div className="password-wrapper">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    className="settings-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button className="pw-toggle" onClick={() => setShowNewPw(!showNewPw)}>
                    {showNewPw ? '🙈' : '👁'}
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

              <button className="btn-save" onClick={handleChangePassword}>Update Password</button>
            </div>
          </div>
        </div>

        {/* ======================== PREFERENCES ======================== */}
        <div className={`settings-card glass-3d ${expandedSection === 'preferences' ? 'expanded' : ''}`}>
          <div className="settings-card-header" onClick={() => toggleSection('preferences')}>
            <div className="settings-card-header-left">
              <div className="settings-icon pref-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </div>
              <div>
                <h3 className="settings-title">Preferences</h3>
                <p className="settings-desc">Notifications, privacy, and display preferences</p>
              </div>
            </div>
            <span className={`chevron ${expandedSection === 'preferences' ? 'rotated' : ''}`}>{chevronSvg}</span>
          </div>

          <div className={`settings-content ${expandedSection === 'preferences' ? 'content-visible' : ''}`}>
            {/* Notifications */}
            <div className="content-section">
              <h4 className="section-label">Notifications</h4>

              <div className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-label">Email Notifications</span>
                  <span className="toggle-desc">Receive transaction alerts via email</span>
                </div>
                <button
                  className={`toggle-switch ${emailNotifications ? 'active' : ''}`}
                  onClick={() => setEmailNotifications(!emailNotifications)}
                >
                  <span className="toggle-knob" />
                </button>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-label">Push Notifications</span>
                  <span className="toggle-desc">Get real-time budget alerts on your device</span>
                </div>
                <button
                  className={`toggle-switch ${pushNotifications ? 'active' : ''}`}
                  onClick={() => setPushNotifications(!pushNotifications)}
                >
                  <span className="toggle-knob" />
                </button>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-label">Weekly Summary Report</span>
                  <span className="toggle-desc">Receive a financial overview every Monday</span>
                </div>
                <button
                  className={`toggle-switch ${weeklyReport ? 'active' : ''}`}
                  onClick={() => setWeeklyReport(!weeklyReport)}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>

            {/* Display */}
            <div className="content-divider" />
            <div className="content-section">
              <h4 className="section-label">Display & Locale</h4>

              <div className="field-group">
                <label className="field-label">Currency</label>
                <select className="settings-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="GBP">GBP — British Pound (£)</option>
                  <option value="KES">KES — Kenyan Shilling (KSh)</option>
                  <option value="SOS">SOS — Somali Shilling (Sh)</option>
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Language</label>
                <select className="settings-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="en">English</option>
                  <option value="so">Somali</option>
                  <option value="ar">Arabic</option>
                  <option value="sw">Swahili</option>
                  <option value="fr">French</option>
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Date Format</label>
                <select className="settings-select" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <button className="btn-save" onClick={handleSavePreferences}>Save Preferences</button>
            </div>
          </div>
        </div>

        {/* ======================== SECURITY ======================== */}
        <div className={`settings-card glass-3d ${expandedSection === 'security' ? 'expanded' : ''}`}>
          <div className="settings-card-header" onClick={() => toggleSection('security')}>
            <div className="settings-card-header-left">
              <div className="settings-icon security-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <h3 className="settings-title">Security</h3>
                <p className="settings-desc">Two-factor authentication and session management</p>
              </div>
            </div>
            <span className={`chevron ${expandedSection === 'security' ? 'rotated' : ''}`}>{chevronSvg}</span>
          </div>

          <div className={`settings-content ${expandedSection === 'security' ? 'content-visible' : ''}`}>
            {/* 2FA */}
            <div className="content-section">
              <h4 className="section-label">Two-Factor Authentication</h4>

              <div className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-label">Enable 2FA</span>
                  <span className="toggle-desc">Add an extra layer of security with authenticator app</span>
                </div>
                <button
                  className={`toggle-switch ${twoFactorEnabled ? 'active' : ''}`}
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                >
                  <span className="toggle-knob" />
                </button>
              </div>

              {twoFactorEnabled && (
                <div className="tfa-info-box">
                  <div className="tfa-icon">🔐</div>
                  <div>
                    <p className="tfa-text">Two-factor authentication is <strong>active</strong>.</p>
                    <p className="tfa-subtext">You'll be prompted for a verification code on each login.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Session Timeout */}
            <div className="content-divider" />
            <div className="content-section">
              <h4 className="section-label">Session Management</h4>

              <div className="field-group">
                <label className="field-label">Auto-Lock Timeout</label>
                <select className="settings-select" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)}>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="content-divider" />
            <div className="content-section">
              <h4 className="section-label">Active Sessions</h4>

              <div className="sessions-list">
                {sessions.map((s, i) => (
                  <div key={i} className="session-row">
                    <div className="session-device-icon">
                      {s.device.includes('Chrome') || s.device.includes('Firefox') ? '💻' : '📱'}
                    </div>
                    <div className="session-info">
                      <span className="session-device">{s.device}</span>
                      <span className="session-meta">{s.location} · {s.lastActive}</span>
                    </div>
                    {s.current ? (
                      <span className="session-badge current">This device</span>
                    ) : (
                      <button className="session-revoke">Revoke</button>
                    )}
                  </div>
                ))}
              </div>

              <button className="btn-save" onClick={handleSaveSecurity}>Save Security Settings</button>
            </div>
          </div>
        </div>

        {/* ======================== DANGER ZONE ======================== */}
        <div className="settings-card glass-3d danger-card">
          <div className="settings-card-header" onClick={logout}>
            <div className="settings-card-header-left">
              <div className="settings-icon danger-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <div>
                <h3 className="settings-title danger-title">Log Out</h3>
                <p className="settings-desc">Sign out of your ApexHub account</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Snackbar */}
      {snackbar.show && (
        <div className={`snackbar ${snackbar.type}`}>
          {snackbar.type === 'success' ? '✅' : '❌'} {snackbar.message}
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
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                      box-shadow 0.45s ease,
                      border-color 0.3s ease;
          cursor: pointer;
        }

        .settings-card:hover {
          transform: perspective(1200px) rotateX(1.5deg) translateY(-4px) scale(1.01);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18), 0 4px 12px var(--accent-subtle);
          border-color: var(--accent);
        }

        .settings-card.expanded {
          transform: perspective(1200px) rotateX(0deg) translateY(0) scale(1);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 2px var(--accent-subtle);
          border-color: var(--accent);
          cursor: default;
        }

        /* ---- Card Header ---- */
        .settings-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 2rem;
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
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .settings-card:hover .settings-icon {
          transform: scale(1.1) rotate(-3deg);
        }

        .account-icon {
          background: linear-gradient(135deg, #3B82F6, #60A5FA);
          color: white;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
        }
        .pref-icon {
          background: linear-gradient(135deg, #8B5CF6, #A78BFA);
          color: white;
          box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);
        }
        .security-icon {
          background: linear-gradient(135deg, #10B981, #34D399);
          color: white;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
        }
        .danger-icon {
          background: linear-gradient(135deg, #EF4444, #F87171);
          color: white;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
        }

        .settings-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .settings-desc {
          font-size: 0.875rem;
          font-weight: 400;
          color: var(--text-secondary);
        }

        /* Chevron */
        .chevron {
          color: var(--text-muted);
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
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
          transition: max-height 0.55s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.35s ease,
                      padding 0.35s ease;
          padding: 0 2rem;
        }

        .settings-content.content-visible {
          max-height: 1200px;
          opacity: 1;
          padding: 0 2rem 2rem 2rem;
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
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: var(--accent);
          margin-bottom: 1rem;
        }

        /* ---- Profile Row ---- */
        .profile-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: var(--surface-low);
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .avatar-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 1.3rem;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(0, 153, 255, 0.35);
        }

        .avatar-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .avatar-name {
          font-weight: 700;
          font-size: 1rem;
          color: var(--text-primary);
        }

        .avatar-email {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        /* ---- Form Fields ---- */
        .field-group {
          margin-bottom: 1.2rem;
        }

        .field-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
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
          border-radius: 10px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          -webkit-appearance: none;
        }

        .settings-input:focus, .settings-select:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px var(--accent-subtle);
        }

        .settings-input::placeholder {
          color: var(--text-muted);
        }

        .disabled-input {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .field-hint {
          display: block;
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 4px;
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
          font-size: 1.1rem;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
          padding: 0;
        }

        .pw-toggle:hover {
          opacity: 1;
        }

        /* ---- Toggle Switches ---- */
        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
        }

        .toggle-row:last-of-type {
          border-bottom: none;
        }

        .toggle-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .toggle-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .toggle-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .toggle-switch {
          width: 52px;
          height: 28px;
          border-radius: 14px;
          background: var(--surface-low);
          border: 2px solid var(--border-color);
          position: relative;
          cursor: pointer;
          transition: background 0.3s ease, border-color 0.3s ease;
          flex-shrink: 0;
          padding: 0;
        }

        .toggle-switch.active {
          background: var(--accent);
          border-color: var(--accent);
        }

        .toggle-knob {
          display: block;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }

        .toggle-switch.active .toggle-knob {
          transform: translateX(24px);
        }

        /* ---- 2FA Info Box ---- */
        .tfa-info-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 10px;
          margin-top: 12px;
          animation: slideDown 0.35s ease;
        }

        .tfa-icon {
          font-size: 1.4rem;
          flex-shrink: 0;
        }

        .tfa-text {
          font-size: 0.9rem;
          color: var(--success);
          font-weight: 600;
        }

        .tfa-subtext {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* ---- Sessions ---- */
        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 1.5rem;
        }

        .session-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: var(--surface-low);
          border: 1px solid var(--border);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .session-row:first-child {
          border-radius: 10px 10px 0 0;
        }

        .session-row:last-child {
          border-radius: 0 0 10px 10px;
        }

        .session-row:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .session-device-icon {
          font-size: 1.4rem;
          flex-shrink: 0;
        }

        .session-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          gap: 2px;
        }

        .session-device {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .session-meta {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .session-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          flex-shrink: 0;
        }

        .session-badge.current {
          background: var(--accent-subtle);
          color: var(--accent);
        }

        .session-revoke {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.1);
          color: var(--coral);
          border: 1px solid rgba(239, 68, 68, 0.2);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .session-revoke:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: scale(1.05);
        }

        /* ---- Save Button ---- */
        .btn-save {
          padding: 12px 28px;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: inherit;
          color: white;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          margin-top: 0.5rem;
        }

        .btn-save:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 8px 24px rgba(0, 153, 255, 0.35);
        }

        .btn-save:active {
          transform: translateY(0) scale(0.98);
        }

        /* ---- Danger Card ---- */
        .danger-card {
          border-color: rgba(239, 68, 68, 0.15);
        }

        .danger-card:hover {
          border-color: var(--coral);
          box-shadow: 0 15px 40px rgba(239, 68, 68, 0.12), 0 0 0 2px rgba(239, 68, 68, 0.15);
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
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          z-index: 9999;
          animation: snackIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
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
          from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.9); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to   { opacity: 1; max-height: 100px; }
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
        @media (max-width: 640px) {
          .settings-card-header {
            padding: 1.2rem 1.2rem;
          }
          .settings-content.content-visible {
            padding: 0 1.2rem 1.5rem 1.2rem;
          }
          .settings-icon {
            width: 38px;
            height: 38px;
          }
          .toggle-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}
