"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Wallet, ListChecks, BarChart3, ShieldCheck, ArrowRight, Moon, Sun } from 'lucide-react';

// Fade a section in the first time it scrolls into view.
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
    icon: Wallet,
    title: 'Finance, tracked precisely',
    desc: 'Income, expenses, budgets, and savings goals — reconciled across weekly, monthly, and yearly views so you always know where you stand.',
    dark: '#0ea5e9', light: '#0072e5',
  },
  {
    icon: ListChecks,
    title: 'Productivity, organized',
    desc: 'Tasks, habits, goals, and your timetable in one workspace, with milestones and reminders that keep every commitment visible.',
    dark: '#a78bfa', light: '#7c3aed',
  },
  {
    icon: BarChart3,
    title: 'One system, one picture',
    desc: 'Finance and productivity metrics converge into a single dashboard, so daily decisions are made with the full picture in view.',
    dark: '#34d399', light: '#059669',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [heroRef, heroInView] = useInView();
  const [featRef, featInView] = useInView();
  const [privacyRef, privacyInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Illustrative figures for the preview panel — regenerated per visit,
  // not tied to any real account data.
  const [netWorth, setNetWorth] = useState(142500);
  const [efficiency, setEfficiency] = useState(85);

  useEffect(() => {
    setNetWorth(Math.floor(Math.random() * (250000 - 50000 + 1)) + 50000);
    setEfficiency(Math.floor(Math.random() * (98 - 70 + 1)) + 70);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const goLogin = () => router.push('/login');

  return (
    <div className="landing-root">
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-brand">
          <img src="/icon_logo.png" alt="ApexHub" width={32} height={32} className="landing-brand-icon" />
          <span className="landing-brand-name">ApexHub</span>
        </div>
        <div className="landing-nav-actions">
          <button
            onClick={toggleTheme}
            className="landing-icon-btn"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={goLogin} className="landing-btn-ghost">Sign in</button>
          <button onClick={goLogin} className="landing-btn-primary">
            Try ApexHub
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="landing-hero">
        <div className={`landing-hero-inner ${heroInView ? 'in-view' : ''}`}>
          <span className="landing-eyebrow">Personal Development System</span>
          <h1 className="landing-h1">
            One quiet place for<br />your money and your time.
          </h1>
          <p className="landing-sub">
            ApexHub brings finance and productivity together in a single, calm
            system — so you can plan with real numbers instead of guesswork.
          </p>
          <div className="landing-hero-actions">
            <button onClick={goLogin} className="landing-btn-primary landing-btn-lg">
              Try ApexHub <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Product preview — built from the app's real dashboard styling */}
        <div className={`landing-preview-wrap ${heroInView ? 'in-view' : ''}`}>
          <div className="landing-preview glass-3d">
            <div className="landing-preview-chrome">
              <span className="lp-dot red" />
              <span className="lp-dot amber" />
              <span className="lp-dot green" />
              <span className="lp-url">apexhub.app</span>
            </div>
            <div className="landing-preview-body">
              <div className="kpi-grid landing-kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Net Worth</span>
                    <div className="kpi-icon-wrap blue"><Wallet size={16} /></div>
                  </div>
                  <div className="kpi-value">${netWorth.toLocaleString()}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Task Efficiency</span>
                    <div className="kpi-icon-wrap green"><ListChecks size={16} /></div>
                  </div>
                  <div className="kpi-value">{efficiency}%</div>
                </div>
              </div>
              <div className="stats-card landing-stats-card">
                <div className="stats-card-title">Monthly Budget</div>
                <div className="progress-rows">
                  <div>
                    <div className="progress-header">
                      <span className="progress-label">Essentials</span>
                      <span className="progress-percent">62%</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: '62%' }} /></div>
                  </div>
                  <div>
                    <div className="progress-header">
                      <span className="progress-label">Savings goal</span>
                      <span className="progress-percent">40%</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: '40%' }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section ref={featRef} className="landing-section">
        <div className={`landing-section-head ${featInView ? 'in-view' : ''}`}>
          <p className="landing-eyebrow center">What it does</p>
          <h2 className="landing-h2">Everything you track, in one place.</h2>
        </div>
        <div className="landing-feature-grid">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            const color = isDark ? f.dark : f.light;
            return (
              <div
                key={f.title}
                className={`landing-feature-card ${featInView ? 'in-view' : ''}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="landing-feature-icon" style={{ color, background: `${color}18`, borderColor: `${color}40` }}>
                  <Icon size={22} />
                </div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── PRIVACY ─────────────────────────────────────────────────── */}
      <section ref={privacyRef} className="landing-section landing-privacy">
        <div className={`landing-privacy-inner ${privacyInView ? 'in-view' : ''}`}>
          <div className="landing-privacy-icon">
            <ShieldCheck size={26} />
          </div>
          <h2 className="landing-h2">Your data stays yours.</h2>
          <p className="landing-sub center">
            ApexHub is built to be the private ledger of your own life — your
            information is never sold, never shared, and never used to train
            external models.
          </p>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section ref={ctaRef} className="landing-cta-band">
        <div className={`landing-cta-inner ${ctaInView ? 'in-view' : ''}`}>
          <h2 className="landing-h2">Ready when you are.</h2>
          <p className="landing-sub center">Set up your workspace in a couple of minutes.</p>
          <button onClick={goLogin} className="landing-btn-primary landing-btn-lg">
            Try ApexHub <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-brand">
          <img src="/icon_logo.png" alt="ApexHub" width={22} height={22} className="landing-brand-icon muted" />
          <span className="landing-footer-name">ApexHub</span>
        </div>
        <span className="landing-footer-copy">© {new Date().getFullYear()} ApexHub. All rights reserved.</span>
      </footer>

      <style jsx>{`
        .landing-root {
          width: 100%;
          min-height: 100vh;
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--bg-body);
          color: var(--text-primary);
          overflow-x: hidden;
        }

        /* ── Nav ── */
        .landing-nav {
          position: sticky;
          top: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 40px;
          background: transparent;
          border-bottom: 1px solid transparent;
          transition: background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease;
        }
        .landing-nav.scrolled {
          background: var(--bg-topnav);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom-color: var(--border);
        }
        .landing-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .landing-brand-icon {
          border-radius: 8px;
          box-shadow: 0 0 12px var(--accent-glow);
        }
        .landing-brand-icon.muted {
          box-shadow: none;
          filter: grayscale(100%) opacity(0.7);
        }
        .landing-brand-name {
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.4px;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .landing-nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .landing-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          color: var(--text-secondary);
          transition: var(--transition-fast);
        }
        .landing-icon-btn:hover {
          background: var(--accent-subtle);
          color: var(--accent);
        }
        .landing-btn-ghost {
          padding: 9px 18px;
          border-radius: 100px;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .landing-btn-ghost:hover {
          color: var(--text-primary);
          border-color: var(--accent);
        }
        .landing-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 20px;
          border-radius: 100px;
          border: none;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          color: #fff;
          font-size: 0.9rem;
          font-weight: 700;
          box-shadow: 0 4px 18px var(--accent-glow);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;
        }
        .landing-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 26px var(--accent-glow);
        }
        .landing-btn-lg {
          padding: 15px 32px;
          font-size: 1rem;
        }

        /* ── Hero ── */
        .landing-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 96px 24px 60px;
          text-align: center;
        }
        .landing-hero-inner {
          max-width: 720px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .landing-hero-inner.in-view {
          opacity: 1;
          transform: translateY(0);
        }
        .landing-eyebrow {
          display: inline-flex;
          align-items: center;
          padding: 6px 16px;
          border-radius: 100px;
          background: var(--accent-subtle);
          border: 1px solid var(--accent-glow);
          color: var(--accent);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          margin-bottom: 28px;
        }
        .landing-eyebrow.center { margin-bottom: 16px; }
        .landing-h1 {
          font-size: clamp(2.4rem, 5vw, 3.6rem);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -1.2px;
          margin-bottom: 20px;
        }
        .landing-h2 {
          font-size: clamp(1.8rem, 3.5vw, 2.5rem);
          font-weight: 800;
          letter-spacing: -0.8px;
          margin-bottom: 16px;
        }
        .landing-sub {
          font-size: 1.1rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 560px;
          margin: 0 auto 32px;
        }
        .landing-sub.center { margin-left: auto; margin-right: auto; }
        .landing-hero-actions {
          display: flex;
          justify-content: center;
        }

        /* ── Preview panel ── */
        .landing-preview-wrap {
          width: 100%;
          max-width: 920px;
          margin-top: 64px;
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
        }
        .landing-preview-wrap.in-view {
          opacity: 1;
          transform: translateY(0);
        }
        .landing-preview {
          border-radius: 20px;
          border: 1px solid var(--border-card);
          background: var(--bg-card);
          box-shadow: 0 30px 70px -20px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
          overflow: hidden;
          text-align: left;
        }
        .landing-preview-chrome {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-topnav);
        }
        .lp-dot { width: 10px; height: 10px; border-radius: 50%; }
        .lp-dot.red { background: #f43f5e; }
        .lp-dot.amber { background: #fbbf24; }
        .lp-dot.green { background: #34d399; }
        .lp-url {
          margin-left: 12px;
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .landing-preview-body {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .landing-kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-bottom: 0;
        }
        .landing-stats-card { margin-bottom: 0; }

        /* ── Sections ── */
        .landing-section {
          padding: 100px 24px;
          max-width: 1160px;
          margin: 0 auto;
          width: 100%;
        }
        .landing-section-head {
          text-align: center;
          max-width: 640px;
          margin: 0 auto 56px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .landing-section-head.in-view {
          opacity: 1;
          transform: translateY(0);
        }

        .landing-feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }
        .landing-feature-card {
          padding: 32px 28px;
          border-radius: 18px;
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          box-shadow: var(--shadow-card);
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .landing-feature-card.in-view {
          opacity: 1;
          transform: translateY(0);
        }
        .landing-feature-card:hover {
          box-shadow: var(--shadow-card-hover);
          border-color: var(--accent);
        }
        .landing-feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          border: 1px solid;
          margin-bottom: 20px;
        }
        .landing-feature-title {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 10px;
          letter-spacing: -0.2px;
        }
        .landing-feature-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.65;
        }

        /* ── Privacy ── */
        .landing-privacy {
          text-align: center;
        }
        .landing-privacy-inner {
          max-width: 620px;
          margin: 0 auto;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .landing-privacy-inner.in-view {
          opacity: 1;
          transform: translateY(0);
        }
        .landing-privacy-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: var(--accent-subtle);
          border: 1px solid var(--accent-glow);
          color: var(--accent);
          margin-bottom: 24px;
        }

        /* ── CTA band ── */
        .landing-cta-band {
          margin: 0 24px 100px;
          padding: 72px 24px;
          border-radius: 28px;
          text-align: center;
          background: linear-gradient(135deg, var(--accent-subtle), transparent 60%), var(--bg-card);
          border: 1px solid var(--border-card);
        }
        .landing-cta-inner {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .landing-cta-inner.in-view {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Footer ── */
        .landing-footer {
          padding: 32px 40px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .landing-footer-name {
          font-weight: 600;
          font-size: 0.92rem;
          color: var(--text-secondary);
        }
        .landing-footer-copy {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .landing-nav { padding: 14px 20px; }
          .landing-hero { padding: 76px 18px 40px; }
          .landing-section { padding: 72px 18px; }
          .landing-cta-band { margin: 0 16px 72px; padding: 56px 20px; }
          .landing-kpi-grid { grid-template-columns: 1fr; }
          .landing-footer { padding: 24px 20px; justify-content: center; text-align: center; }
        }
      `}</style>
    </div>
  );
}
