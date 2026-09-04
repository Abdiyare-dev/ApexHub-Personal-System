"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function Login() {
  const router = useRouter();
  const { user, loginWithEmail, signUpWithEmail, loginWithGoogle, loading } = useAuth();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Detect if we are returning from an OAuth redirect (URL has a code/token)
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);


  useEffect(() => {
    // Check for OAuth callback params in URL (hash or query)
    const hash = window.location.hash;
    const search = window.location.search;
    if (
      hash.includes('access_token') ||
      hash.includes('error') ||
      search.includes('code=') ||
      search.includes('error=')
    ) {
      setIsOAuthCallback(true);
      // Let Supabase process the callback — it will fire onAuthStateChange
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace('/');
        } else {
          setIsOAuthCallback(false);
        }
      });
    }
  }, [router]);

  // Redirect if logged in
  useEffect(() => {
    if (user && !loading) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg('');
    
    try {
      if (isLoginMode) {
        await loginWithEmail(email, password);
      } else {
        const data = await signUpWithEmail(email, password, fullName);
        // Supabase returns user but no session if email confirmation is required
        if (data?.user && !data?.session) {
          setSuccessMsg("Registration successful! Please check your email to confirm your account.");
        }
      }
    } catch (error) {
      // Supabase error handling
      console.warn('Auth error:', error);
      setErrorMsg(error.message || "Authentication failed. Please try again.");
    }
  };

  const handleGoogleAuth = async () => {
    if (loading) return;
    setErrorMsg('');
    try {
      await loginWithGoogle();
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
         setErrorMsg("Google sign-in failed. Please try again.");
      }
    }
  };

  // Show a full-screen loading overlay while OAuth is being processed
  // This prevents the blank-screen issue when pressing Back from Google
  if (loading || isOAuthCallback) {
    return (
      <div className="login-wrapper">
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
        <div className="oauth-loading-overlay">
          <div className="oauth-loading-card">
            <div className="oauth-spinner"></div>
            <p className="oauth-loading-text">Completing Secure Sign In...</p>
            <span className="oauth-loading-sub">Please wait while we authenticate your account.</span>
          </div>
        </div>
        <style jsx>{`
          .login-wrapper {
            height: 100vh; width: 100%; flex: 1; display: flex; align-items: center;
            justify-content: center; background: var(--bg-body);
            position: relative; overflow: hidden;
          }
          .ambient-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.5; z-index: 0; }
          .orb-1 { width: 600px; height: 600px; background: rgba(59,130,246,0.4); top: -200px; left: -100px; }
          .orb-2 { width: 500px; height: 500px; background: rgba(139,92,246,0.3); bottom: -150px; right: -50px; }
          .oauth-loading-overlay {
            position: relative; z-index: 10;
            display: flex; align-items: center; justify-content: center;
          }
          .oauth-loading-card {
            display: flex; flex-direction: column; align-items: center; gap: 16px;
            padding: 48px 56px;
            background: var(--bg-topnav);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            backdrop-filter: blur(28px);
            box-shadow: var(--shadow-card-hover);
            text-align: center;
          }
          .oauth-spinner {
            width: 48px; height: 48px;
            border: 4px solid var(--border-color);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 0.9s ease-in-out infinite;
          }
          .oauth-loading-text {
            font-size: 1.1rem; font-weight: 700;
            color: var(--text-primary); margin: 0;
          }
          .oauth-loading-sub {
            font-size: 0.88rem; color: var(--text-muted);
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      {/* Animated Background Ambience */}
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>
      <div className="ambient-orb orb-3"></div>

      <div className="login-container">
        {/* Left Side: Authentication Form */}
        <div className="login-form-area">
          <div className="login-card glass-3d">
            {/* Brand doubles as the way back to the public landing page */}
            <Link href="/" className="logo-header brand-home-link" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px', marginBottom: '24px', justifyContent: 'center', display: 'flex' }}>
              <img src="/icon_logo.png" alt="ApexHub Logo" width="56" height="56" style={{ borderRadius: '14px', objectFit: 'cover', boxShadow: '0 6px 16px rgba(0, 160, 255, 0.35)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <h1 className="hero-greeting" style={{ lineHeight: '1', fontSize: '1.8rem', margin: 0 }}>ApexHub</h1>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', opacity: 0.9, letterSpacing: '0.6px', textTransform: 'uppercase', marginTop: '4px', textAlign: 'left', color: 'var(--accent)' }}>Personal Development System</span>
              </div>
            </Link>
            
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
                {isLoginMode ? 'Welcome back. Securely access your personal workspace.' : 'Create an account to start optimizing your productivity and finances.'}
              </p>
            </div>

            {errorMsg && (
              <div className="alert-error shake-animation">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="alert-success">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="finance-form">
              {!isLoginMode && (
                <div className="input-group" style={{ marginBottom: '14px' }}>
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="glowing-input custom-input"
                      placeholder="John Doe"
                      required={!isLoginMode}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

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
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginTop: '14px' }}>
                <label>Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                  </svg>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glowing-input custom-input"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    style={{ paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.2s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {isLoginMode && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '12px', position: 'relative', zIndex: 100 }}>
                    <a 
                      href="/forgot-password"
                      style={{ 
                        fontSize: '0.88rem', 
                        color: 'var(--accent)', 
                        textDecoration: 'none', 
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        background: 'transparent',
                        display: 'inline-block'
                      }}
                      onMouseEnter={(e) => { e.target.style.background = 'rgba(59, 130, 246, 0.1)'; }}
                      onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                    >
                      Forgot Password?
                    </a>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className={`btn-auth primary-auth-btn ${loading ? 'loading' : ''}`}
                style={{ width: '100%', marginTop: '24px' }}
                disabled={loading}
              >
                {loading ? <span className="spinner"></span> : (isLoginMode ? 'Sign In Securely' : 'Create Account')}
              </button>
            </form>

            <button 
              type="button" 
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="btn-auth secondary-auth-btn"
              disabled={loading}
              style={{ width: '100%', marginTop: '12px' }}
            >
              {isLoginMode ? 'Create New Account' : 'Back to Login'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-wrapper {
          height: 100vh;
          width: 100%;
          flex: 1; /* body is display:flex — fill it rather than shrink-wrap */
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-body);
          position: relative;
          overflow: hidden; /* Standardize for no-scroll fit */
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

        /* Left Side */
        .login-form-area {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        
        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 28px 36px;
          border-radius: 24px;
          background: var(--bg-topnav);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-card-hover);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
        }

        .logo-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        /* Brand links back to the public landing page */
        .brand-home-link {
          text-decoration: none;
          color: inherit;
          border-radius: 14px;
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;
        }
        .brand-home-link:hover {
          transform: translateY(-2px);
          opacity: 0.92;
        }
        
        .logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--accent), var(--accent-hover));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }

        .hero-greeting {
          font-size: 1.8rem;
          font-weight: 800;
          margin: 0;
          color: var(--text-primary);
        }

        .alert-error {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding: 14px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .alert-success {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding: 14px 16px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 12px;
          color: #34d399;
          font-size: 0.9rem;
          font-weight: 500;
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

        .secondary-auth-btn {
          width: 100%;
          background: transparent;
          color: var(--text-primary);
          border: 1.5px solid var(--border-color);
          border-radius: 12px;
          margin-top: 16px;
        }
        
        .secondary-auth-btn:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.05);
          border-color: var(--accent);
          color: var(--accent);
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

        /* Responsive Breakpoints */
        @media (max-width: 992px) {
          .login-container {
            max-width: 500px;
            transform: scale(1); /* Reset zoom on mobile apps so text remains readable */
          }
          .login-card {
            transform: none !important;
          }
        }
      `}</style>

    </div>
  );
}
