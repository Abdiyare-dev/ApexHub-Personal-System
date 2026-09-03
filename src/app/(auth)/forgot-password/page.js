"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

export default function ForgotPassword() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');

  const generateCaptcha = () => {
    const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setUserCaptcha('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (userCaptcha.toLowerCase() !== captchaCode.toLowerCase()) {
      setErrorMsg('Security code does not match. Please try again.');
      generateCaptcha();
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      
      setSuccessMsg('Check your email for the password reset link.');
    } catch (error) {
      console.error('Password reset error:', error);
      setErrorMsg(error.message || 'Failed to send reset link. Please try again.');
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
            <div className="logo-header" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', marginBottom: '24px', justifyContent: 'center' }}>
              <img src="/icon_logo.png" alt="ApexHub Logo" width="56" height="56" style={{ borderRadius: '14px', objectFit: 'cover', boxShadow: '0 6px 16px rgba(0, 160, 255, 0.35)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <h1 className="hero-greeting" style={{ lineHeight: '1', fontSize: '1.8rem', margin: 0 }}>ApexHub</h1>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', opacity: 0.9, letterSpacing: '0.6px', textTransform: 'uppercase', marginTop: '4px', textAlign: 'left', color: 'var(--accent)' }}>Password Recovery</span>
              </div>
            </div>
            
            <div className="hero-subtitle-container" style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{ 
                width: '28px', height: '28px', 
                borderRadius: '8px', 
                background: 'rgba(59, 130, 246, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <p className="hero-subtitle" style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.4', color: 'var(--text-secondary)', textAlign: 'left' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

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
                <label>Email Address</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glowing-input custom-input"
                    placeholder="name@example.com"
                    required
                    disabled={loading || successMsg}
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginTop: '14px' }}>
                <label>Security Verification</label>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{
                    background: isDark ? 'rgba(255,255,255,0.95)' : '#f9fafb',
                    border: isDark ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid #d1d5db',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '1.8rem',
                    fontWeight: '900',
                    letterSpacing: '5px',
                    color: '#1e293b',
                    userSelect: 'none',
                    minWidth: '120px',
                    textAlign: 'center',
                    fontFamily: '"Times New Roman", serif',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isDark ? '0 0 15px rgba(255,255,255,0.1)' : 'inset 0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ 
                      position: 'relative', 
                      zIndex: 2, 
                      transform: 'rotate(-2deg) skew(2deg)',
                      textShadow: '1px 1px 0px rgba(255,255,255,0.8)'
                    }}>
                      {captchaCode}
                    </div>
                    {/* Multi-layered Security Lines */}
                    <div style={{ position: 'absolute', top: '15%', left: '-10%', width: '120%', height: '1.5px', background: '#334155', transform: 'rotate(8deg)', opacity: 0.3, zIndex: 1 }}></div>
                    <div style={{ position: 'absolute', top: '65%', left: '-10%', width: '120%', height: '1.5px', background: '#334155', transform: 'rotate(-12deg)', opacity: 0.3, zIndex: 1 }}></div>
                    <div style={{ position: 'absolute', top: '40%', left: '-20%', width: '140%', height: '1px', background: '#000', transform: 'rotate(3deg)', opacity: 0.2, zIndex: 1 }}></div>
                    <div style={{ position: 'absolute', top: '25%', left: '0', width: '100%', height: '1px', background: '#000', transform: 'rotate(-5deg)', opacity: 0.1, zIndex: 1 }}></div>
                    <div style={{ position: 'absolute', top: '75%', left: '0', width: '100%', height: '1px', background: '#000', transform: 'rotate(7deg)', opacity: 0.1, zIndex: 1 }}></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button 
                      type="button" 
                      onClick={generateCaptcha} 
                      className="ms-icon-btn" 
                      style={{ color: isDark ? '#60a5fa' : '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                      <span style={{ textDecoration: 'underline' }}>Reload</span>
                    </button>
                  </div>
                </div>
                
                <input 
                  type="text" 
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value)}
                  className="glowing-input custom-input"
                  placeholder="Type the Captcha"
                  style={{ paddingLeft: '16px', marginTop: '10px' }}
                  required
                  disabled={loading || successMsg}
                />
              </div>

              <button 
                type="submit" 
                className={`btn-auth primary-auth-btn ${loading ? 'loading' : ''}`}
                style={{ width: '100%', marginTop: '24px' }}
                disabled={loading || successMsg}
              >
                {loading ? <span className="spinner"></span> : 'Send Reset Link'}
              </button>
            </form>

            <div style={{ 
              marginTop: '24px', 
              padding: '12px 16px', 
              borderRadius: '16px', 
              background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(59, 130, 246, 0.05)', 
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(59, 130, 246, 0.1)', 
              boxShadow: isDark ? 'inset 0 2px 10px rgba(255,255,255,0.02)' : 'none',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Security Verification</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: isDark ? 'var(--text-secondary)' : '#475569', lineHeight: '1.6', margin: 0 }}>
                To protect your workspace, recovery links are exclusively dispatched to verified accounts. Ensure your email matches your registration.
              </p>
            </div>

            <div style={{ marginTop: '32px', textAlign: 'center', position: 'relative', zIndex: 5 }}>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <div className={isDark ? "btn-3d-back dark" : "btn-3d-back"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                  Back to Log In
                </div>
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
          background: var(--bg-body);
          position: relative;
          overflow: hidden;
          font-family: inherit;
          transition: background 0.4s ease;
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
          background: ${isDark ? 'rgba(30, 64, 175, 0.4)' : 'rgba(59, 130, 246, 0.3)'};
          top: -200px;
          left: -100px;
        }
        .orb-2 {
          width: 500px;
          height: 500px;
          background: ${isDark ? 'rgba(88, 28, 135, 0.3)' : 'rgba(139, 92, 246, 0.2)'};
          bottom: -150px;
          right: -50px;
          animation-delay: -5s;
        }
        .orb-3 {
          width: 400px;
          height: 400px;
          background: ${isDark ? 'rgba(15, 118, 110, 0.2)' : 'rgba(16, 185, 129, 0.2)'};
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
          padding: 28px 36px;
          border-radius: 28px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-card);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          transform: perspective(1200px) rotateY(3deg) rotateX(1deg);
          transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        
        .login-card:hover {
          transform: perspective(1200px) rotateY(0deg) rotateX(0deg) translateY(-8px);
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.3), 
            0 12px 24px rgba(0, 160, 255, 0.15),
            inset 0 1px 15px rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 160, 255, 0.3);
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
          padding-left: 40px !important;
          height: 44px;
          font-size: 0.95rem;
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
          height: 44px;
          border-radius: 10px;
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

        .btn-3d-back {
          display: inline-flex;
          align-items: center;
          padding: 12px 24px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 14px;
          color: #2563eb;
          font-weight: 700;
          font-size: 0.95rem;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          cursor: pointer;
          position: relative;
          box-shadow: 
            0 4px 10px rgba(59, 130, 246, 0.1),
            inset 0 1px 1px rgba(255,255,255,0.8);
          overflow: hidden;
        }

        .btn-3d-back.dark {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.15);
          color: #e2e8f0;
          box-shadow: 
            0 4px 15px rgba(0,0,0,0.5),
            inset 0 1px 1px rgba(255,255,255,0.05);
        }

        .btn-3d-back:hover {
          color: white;
          background: #2563eb;
          border-color: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 
            0 8px 25px rgba(59, 130, 246, 0.3),
            inset 0 1px 1px rgba(255,255,255,0.4);
        }

        .btn-3d-back.dark:hover {
          background: rgba(96, 165, 250, 0.2);
          border-color: rgba(96, 165, 250, 0.5);
          box-shadow: 
            0 10px 25px rgba(0,0,0,0.6),
            0 0 20px rgba(96, 165, 250, 0.3),
            inset 0 1px 1px rgba(255,255,255,0.1);
        }

        .btn-3d-back:active {
          transform: translateY(1px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .btn-3d-back::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.08),
            transparent
          );
          transition: 0.5s;
        }

        .btn-3d-back:hover::before {
          left: 100%;
        }
      `}</style>
    </div>
  );
}
