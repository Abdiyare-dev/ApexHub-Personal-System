"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const { user, loginWithEmail, signUpWithEmail, loginWithGoogle, loading } = useAuth();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
        await signUpWithEmail(email, password, fullName);
      }
    } catch (error) {
      // Supabase error handling
      console.error('Auth error:', error);
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
            height: 100vh; width: 100%; display: flex; align-items: center;
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
            <div className="logo-header" style={{ flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <img src="/icon_logo.png" alt="ApexHub Logo" width="84" height="84" style={{ borderRadius: '20px', objectFit: 'cover', boxShadow: '0 8px 24px rgba(0, 160, 255, 0.45)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h1 className="hero-greeting" style={{ lineHeight: '1.05', fontSize: '2.2rem' }}>ApexHub</h1>
                <span style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.85, letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '4px', textAlign: 'center' }}>Personal Tracking System</span>
              </div>
            </div>
            
            <p className="hero-subtitle" style={{ marginBottom: '32px' }}>
              {isLoginMode ? 'Welcome back. Securely access your personal workspace.' : 'Create an account to start optimizing your productivity and finances.'}
            </p>

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

            <form onSubmit={handleSubmit} className="finance-form">
              {!isLoginMode && (
                <div className="input-group" style={{ marginBottom: '20px' }}>
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

              <div className="input-group" style={{ marginTop: '20px' }}>
                <label>Password</label>
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
                    disabled={loading}
                  />
                </div>
                {isLoginMode && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', position: 'relative', zIndex: 100 }}>
                    <a 
                      href="/forgot-password"
                      style={{ 
                        fontSize: '0.88rem', 
                        color: 'var(--accent)', 
                        textDecoration: 'none', 
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        background: 'rgba(59, 130, 246, 0.05)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        display: 'inline-block'
                      }}
                      onMouseEnter={(e) => { e.target.style.background = 'rgba(59, 130, 246, 0.15)'; e.target.style.borderColor = 'rgba(59, 130, 246, 0.4)'; }}
                      onMouseLeave={(e) => { e.target.style.background = 'rgba(59, 130, 246, 0.05)'; e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)'; }}
                    >
                      Forgot Password?
                    </a>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className={`btn-auth primary-auth-btn ${loading ? 'loading' : ''}`}
                style={{ width: '100%', marginTop: '30px' }}
                disabled={loading}
              >
                {loading ? <span className="spinner"></span> : (isLoginMode ? 'Sign In Securely' : 'Create Account')}
              </button>
            </form>

            <div className="divider">
              <div className="divider-line"></div>
              <span>OR</span>
              <div className="divider-line"></div>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleAuth}
              className="btn-auth google-auth-btn"
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <p className="auth-switch-text">
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="auth-switch-btn"
                disabled={loading}
              >
                {isLoginMode ? 'Sign Up' : 'Log In'}
              </button>
            </p>
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
          padding: 30px 40px;
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

        .logo-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
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

        .google-auth-btn {
          width: 100%;
          background: #ffffff;
          color: #3c4043;
          border: 1px solid #dadce0;
          border-radius: 20px;
        }
        
        :global([data-theme="dark"]) .google-auth-btn {
          background: #1f1f1f;
          color: #ffffff;
          border-color: #444444;
        }

        .google-auth-btn:hover:not(:disabled) {
          background: #f8f9fa;
        }
        
        :global([data-theme="dark"]) .google-auth-btn:hover:not(:disabled) {
          background: #2a2a2a;
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

        .divider {
          display: flex;
          align-items: center;
          margin: 24px 0;
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        }

        .divider span {
          padding: 0 16px;
        }

        .auth-switch-text {
          text-align: center;
          margin-top: 24px;
          font-size: 0.9rem;
          color: var(--text-secondary);
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
