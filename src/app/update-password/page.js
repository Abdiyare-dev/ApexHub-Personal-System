"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // When Supabase redirects back here with the recovery token,
  // it establishes a session. If a session exists, they are allowed to update.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setErrorMsg('Invalid or expired recovery link. Please request a new one.');
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;
      
      setSuccessMsg('Password updated successfully! Redirecting...');
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (error) {
      console.error('Password update error:', error);
      setErrorMsg(error.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Animated Background Ambience */}
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>
      <div className="ambient-orb orb-3"></div>

      <div className="login-container">
        <div className="login-form-area">
          <div className="login-card glass-3d">
            <div className="logo-header" style={{ flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <img src="/icon_logo.png" alt="ApexHub Logo" width="84" height="84" style={{ borderRadius: '20px', objectFit: 'cover', boxShadow: '0 8px 24px rgba(0, 160, 255, 0.45)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h1 className="hero-greeting" style={{ lineHeight: '1.05', fontSize: '2.2rem' }}>ApexHub</h1>
                <span style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.85, letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '4px', textAlign: 'center' }}>Update Password</span>
              </div>
            </div>
            
            <p className="hero-subtitle" style={{ marginBottom: '32px', textAlign: 'center' }}>
              Please enter your new password below.
            </p>

            {errorMsg && (
              <div className="alert-message alert-error shake-animation">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="alert-message alert-success">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="finance-form">
              <div className="input-group">
                <label>New Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                  </svg>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glowing-input custom-input"
                    placeholder="••••••••"
                    required
                    disabled={loading || successMsg}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className={`btn-auth primary-auth-btn ${loading ? 'loading' : ''}`}
                style={{ width: '100%', marginTop: '30px' }}
                disabled={loading || successMsg}
              >
                {loading ? <span className="spinner"></span> : 'Update Password'}
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Link href="/login" className="auth-switch-btn" style={{ textDecoration: 'none' }}>
                &larr; Back to Log In
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-wrapper {
          height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-main);
          position: relative;
          overflow: hidden;
          font-family: inherit;
        }

        /* Ambient Orbs */
        .ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.5;
          z-index: 0;
          animation: float 20s infinite alternate ease-in-out;
        }
        .orb-1 {
          width: 600px;
          height: 600px;
          background: rgba(59, 130, 246, 0.4);
          top: -200px;
          left: -100px;
        }
        .orb-2 {
          width: 500px;
          height: 500px;
          background: rgba(139, 92, 246, 0.3);
          bottom: -150px;
          right: -50px;
          animation-delay: -5s;
        }
        .orb-3 {
          width: 400px;
          height: 400px;
          background: rgba(16, 185, 129, 0.2);
          top: 30%;
          left: 50%;
          animation-delay: -10s;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 50px) scale(1.05); }
          100% { transform: translate(-20px, 20px) scale(0.95); }
        }

        /* Main Container */
        .login-container {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: center;
          width: 100%;
          max-width: 500px;
          gap: 20px;
          padding: 0 20px;
        }

        .login-form-area {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
        }
        
        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 40px 40px;
          border-radius: 24px;
          background: var(--bg-topnav);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-card-hover);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          transform: perspective(1000px) rotateY(2deg);
          transition: transform 0.4s ease;
        }
        
        .login-card:hover {
          transform: perspective(1000px) rotateY(0deg) translateY(-5px);
        }

        .hero-greeting {
          font-size: 1.8rem;
          font-weight: 800;
          margin: 0;
          color: var(--text-primary);
        }

        .alert-message {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .alert-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
        }

        .shake-animation {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        .input-group label {
          display: block;
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 8px;
          font-weight: 600;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          transition: color 0.3s ease;
        }

        .input-wrapper:focus-within .input-icon {
          color: var(--accent);
        }

        .custom-input {
          padding-left: 42px !important;
          height: 52px;
          font-size: 1rem;
          background: var(--bg-body) !important;
          border: 1.5px solid var(--border-color) !important;
          color: var(--text-primary) !important;
          border-radius: 10px;
          transition: all 0.2s ease;
          width: 100%;
          outline: none;
        }

        .custom-input:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 4px var(--accent-subtle) !important;
          background: var(--bg-card) !important;
        }

        .custom-input::placeholder {
          color: var(--text-muted);
        }

        .btn-auth {
          height: 48px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .primary-auth-btn {
          background: linear-gradient(135deg, var(--accent), #2563eb);
          color: white;
          border: none;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }

        .primary-auth-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(59, 130, 246, 0.4);
        }

        .primary-auth-btn:active:not(:disabled) {
          transform: translateY(1px);
        }
        
        .auth-switch-btn {
          background: none;
          border: none;
          color: var(--accent);
          cursor: pointer;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 0;
          transition: color 0.3s ease;
        }

        .auth-switch-btn:hover {
          color: #60a5fa;
          text-decoration: underline;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 992px) {
          .login-container {
            max-width: 500px;
            transform: scale(1);
          }
          .login-card {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
