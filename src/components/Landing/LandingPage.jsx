"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Hook: fade-in when element enters viewport
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold: 0.15, ...options });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
}

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
    ),
    title: 'Smart Finance Tracking',
    desc: 'Track income, expenses, and budgets across weekly, monthly, and yearly cycles. Visualize your cash flow with beautiful real-time charts.',
    color: '#0ea5e9',
    glow: 'rgba(14,165,233,0.2)',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    ),
    title: 'Productivity Command Center',
    desc: 'Manage tasks, goals, and projects in one unified workspace. Never miss a deadline — smart notifications keep you on track.',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.2)',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
    title: 'Unified Analytics',
    desc: 'See your entire life system at a glance. Finance and productivity metrics converge into actionable intelligence on your dashboard.',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.2)',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [heroRef, heroInView] = useInView();
  const [privacyRef, privacyInView] = useInView({ threshold: 0.2 });
  const [featRef, featInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  const isDark = theme === 'dark';

  // Random Data States for Showcase Cards
  const [randomNetWorth, setRandomNetWorth] = useState(142500);
  const [randomTrend, setRandomTrend] = useState(12.4);
  const [randomEfficiency, setRandomEfficiency] = useState(85);
  const [randomBudgetStatus, setRandomBudgetStatus] = useState('Very Healthy');

  // Generate random data on mount
  useEffect(() => {
    setRandomNetWorth(Math.floor(Math.random() * (250000 - 50000 + 1)) + 50000);
    setRandomTrend((Math.random() * (15 - 2) + 2).toFixed(1));
    setRandomEfficiency(Math.floor(Math.random() * (98 - 70 + 1)) + 70);
    
    const statuses = ['Very Healthy', 'On Track', 'Optimized', 'Excellent'];
    setRandomBudgetStatus(statuses[Math.floor(Math.random() * statuses.length)]);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const goLogin = () => router.push('/login');

  return (
    <div style={{ 
      background: isDark ? '#040D1A' : '#F4F7F9', 
      color: isDark ? '#F1F5F9' : '#0F172A', 
      fontFamily: "'Inter', -apple-system, sans-serif", 
      overflowX: 'hidden', 
      width: '100%', 
      minHeight: '100vh', 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      transition: 'background 0.4s ease, color 0.4s ease'
    }}>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '72px',
        background: scrolled ? (isDark ? 'rgba(4,13,26,0.92)' : 'rgba(255,255,255,0.9)') : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? (isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)') : '1px solid transparent',
        transition: 'all 0.4s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/icon_logo.png" alt="ApexHub" width={38} height={38} style={{ borderRadius: '10px', boxShadow: '0 0 16px rgba(0,153,255,0.5)' }} />
          <span style={{ fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(135deg,#007BFF,#00E5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ApexHub</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          
          {/* THEME TOGGLE (SAME AS SYSTEM) */}
          <button onClick={toggleTheme} style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'transparent', border: 'none',
            color: isDark ? '#94A3B8' : '#475569', cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,153,255,0.12)'; e.currentTarget.style.color = '#0099FF'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDark ? '#94A3B8' : '#475569'; }}>
            {isDark ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>

          <button onClick={goLogin} style={{ 
            padding: '10px 24px', borderRadius: '100px', 
            border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)', 
            background: 'transparent', 
            color: isDark ? '#94A3B8' : '#475569', 
            fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' 
          }}
            onMouseEnter={e => { e.target.style.color=isDark ? '#fff' : '#0F172A'; e.target.style.borderColor=isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'; }}
            onMouseLeave={e => { e.target.style.color=isDark ? '#94A3B8' : '#475569'; e.target.style.borderColor=isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'; }}>
            Sign in
          </button>
          <button onClick={goLogin} style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', background: 'linear-gradient(135deg,#007BFF,#00C6FF)', color: '#fff', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(0,153,255,0.4)' }}
            onMouseEnter={e => { e.target.style.transform='translateY(-2px)'; e.target.style.boxShadow='0 8px 28px rgba(0,153,255,0.55)'; }}
            onMouseLeave={e => { e.target.style.transform='translateY(0)'; e.target.style.boxShadow='0 4px 20px rgba(0,153,255,0.4)'; }}>
            Try ApexHub
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '140px 48px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Background orbs */}
        <div style={{ position: 'absolute', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,123,255,0.18),transparent 70%)', top: '-200px', left: '-150px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.15),transparent 70%)', bottom: '-150px', right: '-100px', pointerEvents: 'none' }} />

        <div className="hero-grid" style={{ maxWidth: '1400px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center', position: 'relative', zIndex: 10 }}>
          
          {/* Left Column: Text */}
          <div style={{ opacity: heroInView ? 1 : 0, transform: heroInView ? 'translateX(0)' : 'translateX(-40px)', transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '50px', background: 'rgba(0,153,255,0.1)', border: '1px solid rgba(0,153,255,0.25)', marginBottom: '32px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E5FF', boxShadow: '0 0 8px #00E5FF', animation: 'pulse 2s infinite', display: 'inline-block' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0ea5e9', letterSpacing: '0.5px' }}>Introducing ApexHub</span>
            </div>

            <h1 style={{ fontSize: 'clamp(3rem, 5vw, 5rem)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-1.5px', marginBottom: '24px', color: isDark ? '#FFFFFF' : '#0F172A' }}>
              Your personal system for <br />
              <span style={{ background: 'linear-gradient(135deg,#007BFF 0%,#00E5FF 50%,#8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                clarity and control.
              </span>
            </h1>

            <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', color: isDark ? '#94A3B8' : '#475569', maxWidth: '600px', marginBottom: '48px', lineHeight: 1.6, fontWeight: 400 }}>
              ApexHub unifies your finances and productivity into one intelligent system. Stop guessing, start tracking, and achieve your goals faster.
            </p>

            <button onClick={goLogin} style={{ padding: '18px 48px', borderRadius: '100px', border: 'none', background: 'linear-gradient(135deg,#007BFF,#00C6FF)', color: '#fff', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,153,255,0.4)', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.target.style.transform='translateY(-3px) scale(1.03)'; e.target.style.boxShadow='0 16px 40px rgba(0,153,255,0.55)'; }}
              onMouseLeave={e => { e.target.style.transform='translateY(0) scale(1)'; e.target.style.boxShadow='0 8px 32px rgba(0,153,255,0.4)'; }}>
              Try ApexHub
            </button>
          </div>

          {/* Right Column: Visual Dashboard Mockup */}
          <div style={{ 
            opacity: heroInView ? 1 : 0, transform: heroInView ? 'translateX(0)' : 'translateX(40px)', transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s',
            position: 'relative', width: '100%', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {/* Glowing Backdrop for Mockup */}
            <div style={{ position: 'absolute', inset: '20px', background: 'linear-gradient(135deg, rgba(0,123,255,0.2), rgba(139,92,246,0.2))', filter: 'blur(40px)', borderRadius: '30px' }}></div>
            
            <div className="showcase-content glass-3d" style={{
              width: '100%', height: '100%', minHeight: '500px', borderRadius: '32px',
              padding: '40px', background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)', 
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              position: 'relative', display: 'flex', flexDirection: 'column',
              boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 100px rgba(0,0,0,0.1)' : '0 25px 50px -12px rgba(0, 0, 0, 0.1), inset 0 0 100px rgba(255,255,255,0.6)',
              backdropFilter: 'blur(20px)'
            }}>
              <h2 style={{ fontSize: '2.5rem', lineHeight: 1.1, marginBottom: '16px', color: isDark ? '#FFF' : '#0F172A', fontWeight: 800 }}>Command Your Workflow.</h2>
              <p style={{ fontSize: '1.05rem', color: isDark ? '#94A3B8' : '#475569', maxWidth: '380px', marginBottom: '40px', lineHeight: 1.6 }}>Experience the pinnacle of personal finance and productivity management in one unified, intelligent interface.</p>
              
              <div className="floating-elements">
                <div className="floating-card c1 glass-3d">
                  <div className="card-header">
                    <div className="dot blink-blue"></div>
                    <span>Net Worth</span>
                  </div>
                  <h3 style={{ fontSize: '1.8rem', margin: '0 0 8px 0', color: isDark ? '#FFF' : '#0F172A' }}>${randomNetWorth.toLocaleString()}</h3>
                  <div className="trend positive" style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>+{randomTrend}% vs last month</div>
                </div>
                
                <div className="floating-card c2 glass-3d">
                  <div className="card-header">
                    <div className="dot blink-purple"></div>
                    <span>Tasks Completed</span>
                  </div>
                  <div className="progress-bar-mini">
                    <div className="fill" style={{ width: `${randomEfficiency}%` }}></div>
                  </div>
                  <div className="detail" style={{ fontSize: '0.8rem', color: isDark ? '#94A3B8' : '#475569', textAlign: 'right' }}>{randomEfficiency}% efficiency</div>
                </div>

                <div className="floating-card c3 glass-3d">
                  <div className="card-header">
                    <div className="dot blink-green"></div>
                    <span>Weekly Budget</span>
                  </div>
                  <div className="status-pill safe">{randomBudgetStatus}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── PRIVACY / SECURITY SECTION ──────────────────────────────── */}
      <section ref={privacyRef} style={{ padding: '120px 48px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <div style={{ opacity: privacyInView ? 1 : 0, transform: privacyInView ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 800, letterSpacing: '-1px', color: isDark ? '#FFFFFF' : '#0F172A', margin: '0 auto 24px', maxWidth: '900px', lineHeight: 1.2 }}>
            Your data is strictly yours. We engineer for absolute privacy.
          </h2>
          <p style={{ color: isDark ? '#94A3B8' : '#475569', fontSize: '1.15rem', maxWidth: '750px', margin: '0 auto 64px', lineHeight: 1.6 }}>
            As the central hub for your finances and productivity, we recognize that trust is paramount. ApexHub employs industry-leading encryption to ensure your information remains completely secure. Your data is never sold, never shared, and never used to train external models. It remains solely in your control. <span style={{color: '#0ea5e9', cursor: 'pointer'}}>Read our privacy promise</span>.
          </p>

          {/* Orbiting Animation Graphic */}
          <div style={{ position: 'relative', width: '420px', height: '420px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Concentric Circles - 3 rings */}
            <div style={{ position: 'absolute', width: '420px', height: '420px', border: '1px solid rgba(14,165,233,0.35)', borderRadius: '50%', boxShadow: '0 0 0 0 transparent, inset 0 0 20px rgba(14,165,233,0.04)' }}></div>
            <div style={{ position: 'absolute', width: '300px', height: '300px', border: '1px dashed rgba(14,165,233,0.4)', borderRadius: '50%', boxShadow: '0 0 0 0 transparent, inset 0 0 16px rgba(14,165,233,0.05)' }}></div>
            <div style={{ position: 'absolute', width: '180px', height: '180px', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '50%', boxShadow: '0 0 12px rgba(139,92,246,0.1), inset 0 0 12px rgba(139,92,246,0.05)' }}></div>
            
            {/* Center Padlock */}
            <div style={{ 
              width: '88px', height: '88px', borderRadius: '50%', 
              background: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.95)', 
              border: '2px solid rgba(14,165,233,0.4)', 
              boxShadow: '0 0 0 8px rgba(14,165,233,0.06), 0 0 50px rgba(14,165,233,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, color: '#0ea5e9',
              position: 'relative'
            }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0110 0v4"></path>
              </svg>
            </div>

            {/* ── OUTER RING (radius ~210px) — 3 icons at 0°, 120°, 240° ── */}
            {/* Finance / Chart icon */}
            <div className="orbit-item" style={{ animation: 'orbitA 18s linear infinite', background: isDark ? 'rgba(14,165,233,0.12)' : 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9', boxShadow: '0 0 16px rgba(14,165,233,0.25)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            {/* Task / Checklist icon */}
            <div className="orbit-item" style={{ animation: 'orbitB 18s linear infinite', background: isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6', boxShadow: '0 0 16px rgba(139,92,246,0.25)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            {/* Shield / Security icon */}
            <div className="orbit-item" style={{ animation: 'orbitC 18s linear infinite', background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', boxShadow: '0 0 16px rgba(16,185,129,0.25)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>

            {/* ── INNER RING (radius ~150px) — 3 icons at 60°, 180°, 300° ── */}
            {/* Calendar icon */}
            <div className="orbit-item orbit-sm" style={{ animation: 'orbitD 12s linear infinite', background: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', boxShadow: '0 0 14px rgba(245,158,11,0.25)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            {/* Wallet icon */}
            <div className="orbit-item orbit-sm" style={{ animation: 'orbitE 12s linear infinite', background: isDark ? 'rgba(14,165,233,0.12)' : 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9', boxShadow: '0 0 14px rgba(14,165,233,0.25)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
            </div>
            {/* Target / Goals icon */}
            <div className="orbit-item orbit-sm" style={{ animation: 'orbitF 12s linear infinite', background: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', boxShadow: '0 0 14px rgba(239,68,68,0.25)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section ref={featRef} style={{ padding: '120px 48px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px', opacity: featInView ? 1 : 0, transform: featInView ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s ease' }}>
          <p style={{ color: '#0ea5e9', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Features</p>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-1px', color: isDark ? '#FFFFFF' : '#0F172A', marginBottom: '24px' }}>
            Everything you need. <br /> In one place.
          </h2>
          <p style={{ color: isDark ? '#94A3B8' : '#475569', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            A meticulously designed platform to track, plan, and execute your personal and financial goals.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              opacity: featInView ? 1 : 0, transform: featInView ? 'translateY(0)' : 'translateY(40px)',
              transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 0.15}s`,
              padding: '48px 40px', 
              borderRadius: '24px',
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
              backdropFilter: 'blur(10px)',
              cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 20px 60px ${f.glow}`; e.currentTarget.style.borderColor=`${f.color}40`; e.currentTarget.style.transform='translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor=isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'; e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: '32px', border: `1px solid ${f.color}30` }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px', color: isDark ? '#F1F5F9' : '#0F172A', letterSpacing: '-0.5px' }}>{f.title}</h3>
              <p style={{ color: isDark ? '#94A3B8' : '#475569', lineHeight: 1.7, fontSize: '1.05rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA SECTION ──────────────────────────────────────────────── */}
      <section ref={ctaRef} style={{ padding: '160px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,123,255,0.12),transparent 65%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10, opacity: ctaInView ? 1 : 0, transform: ctaInView ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)' }}>
          <h2 style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1, color: isDark ? '#FFFFFF' : '#0F172A', marginBottom: '24px' }}>
            Ready to start?
          </h2>

          <p style={{ color: isDark ? '#94A3B8' : '#475569', fontSize: '1.25rem', maxWidth: '500px', margin: '0 auto 48px', lineHeight: 1.6 }}>
            Join ApexHub and experience the clarity of a unified personal tracking system.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button onClick={goLogin} style={{ padding: '18px 48px', borderRadius: '100px', border: 'none', background: 'linear-gradient(135deg,#007BFF,#00C6FF)', color: '#fff', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 8px 32px rgba(0,153,255,0.4)' }}
              onMouseEnter={e => { e.target.style.transform='translateY(-3px) scale(1.03)'; e.target.style.boxShadow='0 16px 40px rgba(0,153,255,0.55)'; }}
              onMouseLeave={e => { e.target.style.transform='translateY(0) scale(1)'; e.target.style.boxShadow='0 8px 32px rgba(0,153,255,0.4)'; }}>
              Try ApexHub
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ padding: '48px', borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/icon_logo.png" alt="ApexHub" width={24} height={24} style={{ borderRadius: '6px', filter: 'grayscale(100%) opacity(0.7)' }} />
          <span style={{ fontWeight: 600, fontSize: '1rem', color: isDark ? '#94A3B8' : '#475569', letterSpacing: '-0.5px' }}>ApexHub</span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="#" style={{ color: '#64748B', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }} onMouseEnter={e => e.target.style.color=isDark ? '#F1F5F9' : '#0F172A'} onMouseLeave={e => e.target.style.color='#64748B'}>Privacy</a>
          <a href="#" style={{ color: '#64748B', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }} onMouseEnter={e => e.target.style.color=isDark ? '#F1F5F9' : '#0F172A'} onMouseLeave={e => e.target.style.color='#64748B'}>Terms</a>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        
        .floating-elements { position: relative; flex: 1; }
        @keyframes entranceCard { 0% { opacity: 0; transform: translateY(40px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes float-c1 { 0%,100% { transform: translate(0, 0) rotate(0deg); } 33% { transform: translate(5px, -15px) rotate(2deg); } 66% { transform: translate(-5px, -5px) rotate(-1deg); } }
        @keyframes float-c2 { 0%,100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-20px, 10px) scale(1.03); } }
        @keyframes float-c3 { 0%,100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(15px, 20px) rotate(-2deg); } }

        /* Orbit Animations */
        .orbit-item { 
          position: absolute; width: 46px; height: 46px; 
          border-radius: 50%; display: flex; align-items: center; justify-content: center; 
          backdrop-filter: blur(12px); transition: transform 0.2s ease;
        }
        .orbit-item.orbit-sm { width: 38px; height: 38px; }
        .orbit-item:hover { transform: scale(1.25) !important; z-index: 20; }
        /* Outer ring — radius 210px, starting at 0°/120°/240° */
        @keyframes orbitA { 0%   { transform: rotate(0deg)   translateX(210px) rotate(0deg); }   100% { transform: rotate(360deg)  translateX(210px) rotate(-360deg); } }
        @keyframes orbitB { 0%   { transform: rotate(120deg) translateX(210px) rotate(-120deg); } 100% { transform: rotate(480deg)  translateX(210px) rotate(-480deg); } }
        @keyframes orbitC { 0%   { transform: rotate(240deg) translateX(210px) rotate(-240deg); } 100% { transform: rotate(600deg)  translateX(210px) rotate(-600deg); } }
        /* Inner ring — radius 150px, starting at 60°/180°/300°, reverse spin */
        @keyframes orbitD { 0%   { transform: rotate(60deg)  translateX(150px) rotate(-60deg); }  100% { transform: rotate(-300deg) translateX(150px) rotate(300deg); } }
        @keyframes orbitE { 0%   { transform: rotate(180deg) translateX(150px) rotate(-180deg); } 100% { transform: rotate(-180deg) translateX(150px) rotate(180deg); } }
        @keyframes orbitF { 0%   { transform: rotate(300deg) translateX(150px) rotate(-300deg); } 100% { transform: rotate(-60deg)  translateX(150px) rotate(60deg); } }

        .floating-card {
          position: absolute; padding: 20px; border-radius: 16px;
          background: ${isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.95)'}; 
          border: ${isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)'};
          box-shadow: 0 10px 30px rgba(0,0,0,0.3); opacity: 0; backdrop-filter: blur(12px);
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
          cursor: default;
        }
        .floating-card:hover {
          animation-play-state: paused !important; z-index: 10 !important;
          transform: scale(1.08) translateY(-5px) !important;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0,153,255,0.2) !important;
        }
        .card-header { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: ${isDark ? '#94A3B8' : '#475569'}; margin-bottom: 12px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .blink-blue { background: #3b82f6; box-shadow: 0 0 10px #3b82f6; }
        .blink-purple { background: #8b5cf6; box-shadow: 0 0 10px #8b5cf6; }
        .blink-green { background: #10b981; box-shadow: 0 0 10px #10b981; }

        .c1 { top: 20px; left: -20px; width: 220px; animation: entranceCard 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, float-c1 7s infinite ease-in-out; animation-delay: 0.2s, 1.0s; z-index: 3; }
        .c2 { top: 30%; right: -20px; width: 240px; animation: entranceCard 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, float-c2 8s infinite ease-in-out; animation-delay: 0.4s, 1.2s; z-index: 2; }
        .c3 { bottom: 20px; left: 40px; width: 220px; animation: entranceCard 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, float-c3 9s infinite ease-in-out; animation-delay: 0.6s, 1.4s; z-index: 4; }

        .progress-bar-mini { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 8px; overflow: hidden; }
        .progress-bar-mini .fill { height: 100%; background: #007BFF; border-radius: 3px; }
        .status-pill { display: inline-block; padding: 6px 12px; background: rgba(16, 185, 129, 0.15); color: #34d399; border-radius: 20px; font-size: 0.85rem; font-weight: 600; border: 1px solid rgba(16, 185, 129, 0.3); }

        @media(max-width:1024px) {
          .hero-grid { grid-template-columns: 1fr !important; text-align: center; }
          .hero-grid > div:first-child { display: flex; flexDirection: column; alignItems: center; }
          .c1 { left: 0px; }
          .c2 { right: 0px; }
        }

        @media(max-width:640px) {
          nav { padding: 0 24px !important; }
          section { padding-left: 24px !important; padding-right: 24px !important; }
          footer { flex-direction: column; align-items: flex-start; padding: 32px 24px !important; gap: 24px; }
        }
      `}</style>
    </div>
  );
}
