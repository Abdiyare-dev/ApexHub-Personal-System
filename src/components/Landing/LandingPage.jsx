"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import {
  Wallet, ListChecks, BarChart3, ShieldCheck, ArrowRight, Moon, Sun,
  Target, Calendar, PiggyBank, FileText, Smartphone, TrendingUp,
  ChevronDown, Check, Repeat, Layers, Receipt, Sparkles,
} from 'lucide-react';

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

// A glass card that tilts toward the cursor in real 3D. The ambient float
// keyframe lives on the outer element and the pointer tilt on the inner one,
// so the two never fight over `transform`.
function TiltCard({ className, children }) {
  const cardRef = useRef(null);

  const handleMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(700px) rotateX(${relY * -14}deg) rotateY(${relX * 14}deg) scale3d(1.05, 1.05, 1.05)`;
  };

  const resetTilt = () => {
    if (cardRef.current) cardRef.current.style.transform = '';
  };

  return (
    <div className={`landing-float-outer ${className || ''}`}>
      <div
        ref={cardRef}
        className="landing-float-card"
        onMouseMove={handleMove}
        onMouseLeave={resetTilt}
      >
        {children}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Wallet,
    title: 'Finance, tracked precisely',
    desc: 'Income, expenses, budgets, and savings goals — reconciled across weekly, monthly, and yearly cycles so you always know where you stand.',
    dark: '#0ea5e9', light: '#0072e5',
  },
  {
    icon: ListChecks,
    title: 'Productivity, organized',
    desc: 'Tasks, habits, goals, and your timetable in one workspace, with milestones that keep every commitment visible.',
    dark: '#a78bfa', light: '#7c3aed',
  },
  {
    icon: BarChart3,
    title: 'One system, one picture',
    desc: 'Finance and productivity metrics converge into a single dashboard, so daily decisions are made with the full picture in view.',
    dark: '#34d399', light: '#059669',
  },
];

const MODULE_CATEGORIES = [
  { id: 'all', label: 'All Modules', icon: '✦', count: 12 },
  { id: 'productivity', label: 'Productivity Suite', icon: '⚡', count: 5 },
  { id: 'finance', label: 'Finance & Wealth', icon: '💎', count: 4 },
  { id: 'system', label: 'System & Mobile', icon: '🚀', count: 3 },
];

const MODULES = [
  // Finance
  {
    id: 'cash-flow',
    icon: Receipt,
    label: 'Cash In & Expenses',
    desc: 'Instant income & expense entry with automatic smart categorizations',
    category: 'finance',
    categoryName: 'Finance',
    gradient: 'linear-gradient(135deg, #0A84FF 0%, #0055D4 100%)',
    glow: 'rgba(10, 132, 255, 0.45)',
    accent: '#0A84FF',
    badge: 'Live Reconcile',
    status: 'Real-time',
    highlight: 'Instant categorized transactions with recurring inflow & outflow tracking.',
  },
  {
    id: 'budgets',
    icon: Wallet,
    label: 'Smart Budgets',
    desc: 'Category spending caps with executive health status indicators',
    category: 'finance',
    categoryName: 'Finance',
    gradient: 'linear-gradient(135deg, #30D158 0%, #1B8A38 100%)',
    glow: 'rgba(48, 209, 88, 0.45)',
    accent: '#30D158',
    badge: 'Pacing Alerts',
    status: 'Tracking',
    highlight: 'Period pacing thresholds and health pills preventing budget overruns.',
  },
  {
    id: 'savings',
    icon: PiggyBank,
    label: 'Savings Vault',
    desc: 'Milestone-based deposits with visual progress fill rings',
    category: 'finance',
    categoryName: 'Finance',
    gradient: 'linear-gradient(135deg, #FF9F0A 0%, #D97706 100%)',
    glow: 'rgba(255, 159, 10, 0.45)',
    accent: '#FF9F0A',
    badge: 'Goal Vault',
    status: 'Milestones',
    highlight: 'Automated compound deposit history and milestone target projections.',
  },
  {
    id: 'reports',
    icon: FileText,
    label: 'Executive Reports',
    desc: 'One-click multi-page PDF & styled Excel analytics exports',
    category: 'finance',
    categoryName: 'Finance',
    gradient: 'linear-gradient(135deg, #64D2FF 0%, #0091FF 100%)',
    glow: 'rgba(100, 210, 255, 0.45)',
    accent: '#64D2FF',
    badge: 'PDF & XLSX',
    status: 'Export Ready',
    highlight: 'Multi-sheet styled workbooks and periodic comparison chart summaries.',
  },

  // Productivity
  {
    id: 'tasks',
    icon: ListChecks,
    label: 'Execution Tasks',
    desc: 'Prioritized daily workflow with one-click timetable conversion',
    category: 'productivity',
    categoryName: 'Productivity',
    gradient: 'linear-gradient(135deg, #5E5CE6 0%, #3B38B8 100%)',
    glow: 'rgba(94, 92, 230, 0.45)',
    accent: '#5E5CE6',
    badge: 'Kanban + Matrix',
    status: 'High Velocity',
    highlight: 'Directly convert timetable blocks into prioritized actionable tasks.',
  },
  {
    id: 'habits',
    icon: Repeat,
    label: 'Habit Engine',
    desc: 'Streak tracking with automated consistency heatmaps and logs',
    category: 'productivity',
    categoryName: 'Productivity',
    gradient: 'linear-gradient(135deg, #FF375F 0%, #C41C40 100%)',
    glow: 'rgba(255, 55, 95, 0.45)',
    accent: '#FF375F',
    badge: 'Streaks Heatmap',
    status: 'Daily Sync',
    highlight: 'Optimistic streak check-in with rolling 30-day interactive history grid.',
  },
  {
    id: 'goals',
    icon: Target,
    label: 'Goals & Milestones',
    desc: 'Multi-stage visual journey roadmaps with checkpoint pins',
    category: 'productivity',
    categoryName: 'Productivity',
    gradient: 'linear-gradient(135deg, #BF5AF2 0%, #8928BA 100%)',
    glow: 'rgba(191, 90, 242, 0.45)',
    accent: '#BF5AF2',
    badge: 'Visual Roadmaps',
    status: 'Long-range',
    highlight: 'Animated vector progression with active beacon checkpoints.',
  },
  {
    id: 'timetable',
    icon: Calendar,
    label: 'Dynamic Timetable',
    desc: 'Weekly schedule template with automated task conversion',
    category: 'productivity',
    categoryName: 'Productivity',
    gradient: 'linear-gradient(135deg, #00C7BE 0%, #00827C 100%)',
    glow: 'rgba(0, 199, 190, 0.45)',
    accent: '#00C7BE',
    badge: 'Auto Convert',
    status: '7-Day View',
    highlight: 'Color-coded weekly timeboxing matrices with instant task pushers.',
  },
  {
    id: 'projects',
    icon: Layers,
    label: 'Project Portfolios',
    desc: 'Detailed roadmaps, task breakdowns, and performance analytics',
    category: 'productivity',
    categoryName: 'Productivity',
    gradient: 'linear-gradient(135deg, #FF6482 0%, #E0244D 100%)',
    glow: 'rgba(255, 100, 130, 0.45)',
    accent: '#FF6482',
    badge: 'Full Stages',
    status: 'Active Track',
    highlight: 'Terminal delivery tracking ensuring all project goals are fulfilled.',
  },

  // System & Mobile
  {
    id: 'analytics',
    icon: TrendingUp,
    label: 'Unified Intelligence',
    desc: 'Convergence dashboard merging financial health & task velocity',
    category: 'system',
    categoryName: 'Intelligence',
    gradient: 'linear-gradient(135deg, #FF453A 0%, #B8281E 100%)',
    glow: 'rgba(255, 69, 58, 0.45)',
    accent: '#FF453A',
    badge: 'Cross-Domain KPI',
    status: 'Real-time',
    highlight: 'Holistic executive charts merging finance health and productivity output.',
  },
  {
    id: 'pwa',
    icon: Smartphone,
    label: 'Native Mobile PWA',
    desc: 'Installable app with offline support and standalone iOS/Android UI',
    category: 'system',
    categoryName: 'Platform',
    gradient: 'linear-gradient(135deg, #32ADE6 0%, #0077A6 100%)',
    glow: 'rgba(50, 173, 230, 0.45)',
    accent: '#32ADE6',
    badge: 'iOS & Android',
    status: 'Offline Ready',
    highlight: 'Zero app-store friction, instantaneous home-screen launch with service workers.',
  },
  {
    id: 'privacy',
    icon: ShieldCheck,
    label: 'Private Cloud Vault',
    desc: 'Encrypted personal data scoped strictly to your authenticated login',
    category: 'system',
    categoryName: 'Security',
    gradient: 'linear-gradient(135deg, #30D158 0%, #009944 100%)',
    glow: 'rgba(48, 209, 88, 0.45)',
    accent: '#30D158',
    badge: '100% Private',
    status: 'Encrypted',
    highlight: 'Supabase Row Level Security scoping data exclusively to your account.',
  },
];

const STEPS = [
  { n: '01', title: 'Create your workspace', desc: 'Sign up with email or Google. Your account is yours alone — no shared workspace, no team seats.' },
  { n: '02', title: 'Track what matters', desc: 'Log income and expenses, set budgets and savings goals, add tasks, habits, and your weekly timetable.' },
  { n: '03', title: 'Review and adjust', desc: 'The dashboard reconciles money and time into one view, and reports export to PDF or Excel whenever you need them.' },
];

const FAQS = [
  {
    q: 'Do I need to connect a bank account?',
    a: 'No. ApexHub never asks for banking credentials. Entries are added by you or imported, which keeps the system entirely under your control.',
  },
  {
    q: 'Who can see my data?',
    a: 'Only you. Everything is scoped to your own authenticated account. Your information is never sold, never shared, and never used to train external models.',
  },
  {
    q: 'Can I use it on my phone?',
    a: 'Yes. The interface is fully responsive and installs as a progressive web app, so it opens from your home screen like a native app.',
  },
  {
    q: 'Can I get my data back out?',
    a: 'Yes. Reports export to both PDF and Excel, so your records stay portable rather than locked inside the system.',
  },
  {
    q: 'Does it support dark mode?',
    a: 'Yes — the entire system is themed for both light and dark, and it follows whichever you choose from the toggle.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const progressRef = useRef(null);

  const [heroRef, heroInView] = useInView();
  const [modRef, modInView] = useInView();
  const [featRef, featInView] = useInView();
  const [stepRef, stepInView] = useInView();
  const [privacyRef, privacyInView] = useInView();
  const [faqRef, faqInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Illustrative figures for the preview cards — regenerated per visit,
  // not tied to any real account data.
  const [netWorth, setNetWorth] = useState(142500);
  const [efficiency, setEfficiency] = useState(85);
  const [streak, setStreak] = useState(12);

  useEffect(() => {
    setNetWorth(Math.floor(Math.random() * (250000 - 50000 + 1)) + 50000);
    setEfficiency(Math.floor(Math.random() * (98 - 70 + 1)) + 70);
    setStreak(Math.floor(Math.random() * (28 - 6 + 1)) + 6);
  }, []);

  // Nav background + reading-progress bar. The bar is written straight to the
  // DOM node so scrolling doesn't re-render the page on every frame.
  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 24);
      const el = progressRef.current;
      if (el) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        el.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
      }
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedModule, setSelectedModule] = useState(MODULES[0]);

  const filteredModules = useMemo(() => {
    if (activeCategory === 'all') return MODULES;
    return MODULES.filter(m => m.category === activeCategory);
  }, [activeCategory]);

  const goLogin = () => router.push('/login');

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="landing-root" id="top">
      <div className="landing-progress-track">
        <div className="landing-progress-bar" ref={progressRef} />
      </div>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <a href="#top" className="landing-brand" onClick={scrollToTop}>
          <img src="/icon_logo.png" alt="ApexHub" width={32} height={32} className="landing-brand-icon" />
          <span className="landing-brand-name">ApexHub</span>
        </a>
        <div className="landing-nav-actions">
          <a href="#modules" className="landing-nav-link">Modules</a>
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#how" className="landing-nav-link">How it works</a>
          <a href="#faq" className="landing-nav-link">FAQ</a>
          <button onClick={toggleTheme} className="landing-icon-btn" aria-label="Toggle theme">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={goLogin} className="landing-btn-ghost">Sign in</button>
          <button onClick={goLogin} className="landing-btn-primary">Try ApexHub</button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="landing-hero">
        {/* Floating 3D preview cards — decorative, hidden on narrow screens */}
        <TiltCard className="lf-1">
          <div className="ff-header"><span className="ff-dot ff-blue" /><span>Net Worth</span></div>
          <div className="ff-value">${netWorth.toLocaleString()}</div>
          <div className="ff-trend">+12.4% vs last month</div>
        </TiltCard>

        <TiltCard className="lf-2">
          <div className="ff-header"><span className="ff-dot ff-purple" /><span>Tasks Completed</span></div>
          <div className="ff-progress-track"><div className="ff-progress-fill" style={{ width: `${efficiency}%` }} /></div>
          <div className="ff-detail">{efficiency}% efficiency</div>
        </TiltCard>

        <TiltCard className="lf-3">
          <div className="ff-header"><span className="ff-dot ff-green" /><span>Weekly Budget</span></div>
          <div className="ff-status-pill">On Track</div>
        </TiltCard>

        <TiltCard className="lf-4">
          <div className="ff-header"><span className="ff-dot ff-amber" /><span>Habit Streak</span></div>
          <div className="ff-value">{streak} days</div>
          <div className="ff-detail">Longest run this month</div>
        </TiltCard>

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
            <a href="#how" className="landing-btn-outline landing-btn-lg">See how it works</a>
          </div>
          <div className="landing-trust-row">
            <span className="landing-trust-item"><Check size={14} /> No bank credentials</span>
            <span className="landing-trust-item"><Check size={14} /> Private to your account</span>
            <span className="landing-trust-item"><Check size={14} /> Export any time</span>
          </div>
        </div>

        {/* Product preview — built from the app's real dashboard styling */}
        <div className={`landing-preview-wrap ${heroInView ? 'in-view' : ''}`}>
          <div className="landing-preview">
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

      {/* ── IPHONE CONTROL CENTER MODULES ──────────────────────────── */}
      <section ref={modRef} id="modules" className="landing-section">
        <div className={`landing-section-head ${modInView ? 'in-view' : ''}`}>
          <div className="landing-cc-badge">
            <span className="cc-badge-dot" />
            <span>CONTROL CENTER SYSTEM</span>
          </div>
          <h2 className="landing-h2">Unified Command Deck.</h2>
          <p className="landing-sub center">
            Twelve specialized engines configured into an intuitive, iPhone Control Center inspired glass workspace.
          </p>

          {/* iOS Control Center Category Switcher */}
          <div className="ios-cc-switcher">
            {MODULE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`ios-cc-tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="ios-cc-tab-icon">{cat.icon}</span>
                <span className="ios-cc-tab-label">{cat.label}</span>
                <span className="ios-cc-tab-count">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* iOS Control Center Grid */}
        <div className="ios-cc-grid">
          {filteredModules.map((m, i) => {
            const Icon = m.icon;
            const isSelected = selectedModule?.id === m.id;
            return (
              <div
                key={m.id}
                className={`ios-cc-tile ${modInView ? 'in-view' : ''} ${isSelected ? 'selected' : ''}`}
                style={{ 
                  '--tile-accent': m.accent,
                  '--tile-glow': m.glow,
                  '--tile-gradient': m.gradient,
                  transitionDelay: `${(i % 6) * 0.05}s` 
                }}
                onClick={() => setSelectedModule(m)}
                onMouseEnter={() => setSelectedModule(m)}
              >
                <div className="ios-cc-tile-top">
                  <div className="ios-cc-icon-box" style={{ background: m.gradient }}>
                    <Icon size={22} className="ios-cc-icon" />
                  </div>
                  <div className="ios-cc-pill-badge">
                    <span className="ios-cc-status-dot" style={{ background: m.accent, boxShadow: `0 0 8px ${m.accent}` }} />
                    <span>{m.status}</span>
                  </div>
                </div>

                <div className="ios-cc-tile-body">
                  <div className="ios-cc-tile-title-row">
                    <h3 className="ios-cc-tile-title">{m.label}</h3>
                    <span className="ios-cc-tile-badge">{m.badge}</span>
                  </div>
                  <p className="ios-cc-tile-desc">{m.desc}</p>
                </div>

                <div className="ios-cc-tile-footer">
                  <span className="ios-cc-category-chip">{m.categoryName}</span>
                  <div className="ios-cc-toggle-indicator">
                    <span className="ios-cc-switch-knob" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* iOS Control Center Spotlight Bar */}
        {selectedModule && (
          <div className="ios-cc-spotlight-bar fade-in">
            <div className="ios-cc-spotlight-left">
              <div className="ios-cc-spotlight-icon" style={{ background: selectedModule.gradient }}>
                {(() => {
                  const SelIcon = selectedModule.icon;
                  return <SelIcon size={24} color="#ffffff" />;
                })()}
              </div>
              <div>
                <div className="ios-cc-spotlight-header">
                  <span className="ios-cc-spotlight-tag">{selectedModule.categoryName} Engine</span>
                  <span className="ios-cc-spotlight-subdot">•</span>
                  <span className="ios-cc-spotlight-active">Active in Workspace</span>
                </div>
                <h4 className="ios-cc-spotlight-title">{selectedModule.label}</h4>
                <p className="ios-cc-spotlight-desc">{selectedModule.highlight}</p>
              </div>
            </div>
            <div className="ios-cc-spotlight-right">
              <button onClick={goLogin} className="ios-cc-spotlight-btn">
                Launch in Workspace <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section ref={featRef} id="features" className="landing-section">
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

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section ref={stepRef} id="how" className="landing-section">
        <div className={`landing-section-head ${stepInView ? 'in-view' : ''}`}>
          <p className="landing-eyebrow center">How it works</p>
          <h2 className="landing-h2">Running in three steps.</h2>
        </div>
        <div className="landing-step-grid">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className={`landing-step ${stepInView ? 'in-view' : ''}`}
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <span className="landing-step-n">{s.n}</span>
              <h3 className="landing-step-title">{s.title}</h3>
              <p className="landing-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRIVACY ─────────────────────────────────────────────────── */}
      <section ref={privacyRef} id="privacy" className="landing-section landing-privacy">
        <div className={`landing-privacy-inner ${privacyInView ? 'in-view' : ''}`}>
          <div className="landing-privacy-icon"><ShieldCheck size={26} /></div>
          <h2 className="landing-h2">Your data stays yours.</h2>
          <p className="landing-sub center">
            ApexHub is built to be the private ledger of your own life — your
            information is never sold, never shared, and never used to train
            external models.
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section ref={faqRef} id="faq" className="landing-section">
        <div className={`landing-section-head ${faqInView ? 'in-view' : ''}`}>
          <p className="landing-eyebrow center">Questions</p>
          <h2 className="landing-h2">Good things to know.</h2>
        </div>
        <div className="landing-faq-list">
          {FAQS.map((item, i) => (
            <div key={item.q} className={`landing-faq-item ${openFaq === i ? 'open' : ''}`}>
              <button
                className="landing-faq-q"
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                aria-expanded={openFaq === i}
              >
                <span>{item.q}</span>
                <ChevronDown size={18} className="landing-faq-chevron" />
              </button>
              <div className="landing-faq-a"><p>{item.a}</p></div>
            </div>
          ))}
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
        <a href="#top" className="landing-brand" onClick={scrollToTop}>
          <img src="/icon_logo.png" alt="ApexHub" width={22} height={22} className="landing-brand-icon muted" />
          <span className="landing-footer-name">ApexHub</span>
        </a>
        <div className="landing-footer-links">
          <a href="#modules" className="landing-footer-link">Modules</a>
          <a href="#privacy" className="landing-footer-link">Privacy</a>
          <a href="#faq" className="landing-footer-link">FAQ</a>
          <button onClick={goLogin} className="landing-footer-link as-button">Sign in</button>
        </div>
        <span className="landing-footer-copy">© {new Date().getFullYear()} ApexHub. All rights reserved.</span>
      </footer>

      {/*
        Plain (non-scoped) <style>, not styled-jsx. TiltCard is a separate
        component and styled-jsx only scopes CSS to elements written directly
        inside this component's own return — it cannot reach a child
        component's markup. Every class here is namespaced (landing-* / ff-*).
      */}
      <style>{`
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

        /* ── Reading progress ── */
        .landing-progress-track {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 3px;
          z-index: 300;
          background: transparent;
          pointer-events: none;
        }
        .landing-progress-bar {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, var(--accent-start), var(--accent-end));
          box-shadow: 0 0 12px var(--accent-glow);
          transition: width 0.1s linear;
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
          transition: background 0.3s ease, border-color 0.3s ease;
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
          text-decoration: none;
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .landing-brand:hover { transform: translateY(-1px); }
        .landing-brand-icon {
          border-radius: 8px;
          box-shadow: 0 0 12px var(--accent-glow);
        }
        .landing-brand-icon.muted { box-shadow: none; filter: grayscale(100%) opacity(0.7); }
        .landing-brand-name {
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.4px;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .landing-nav-actions { display: flex; align-items: center; gap: 8px; }
        .landing-nav-link {
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-decoration: none;
          transition: var(--transition-fast);
        }
        .landing-nav-link:hover { color: var(--accent); background: var(--accent-subtle); }
        .landing-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px;
          border-radius: 10px;
          color: var(--text-secondary);
          transition: var(--transition-fast);
        }
        .landing-icon-btn:hover { background: var(--accent-subtle); color: var(--accent); }
        .landing-btn-ghost {
          padding: 9px 18px;
          border-radius: 100px;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 600;
          transition: var(--transition-fast);
        }
        .landing-btn-ghost:hover { color: var(--text-primary); border-color: var(--accent); }
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
        .landing-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 26px var(--accent-glow); }
        .landing-btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 100px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-primary);
          font-weight: 700;
          text-decoration: none;
          transition: var(--transition-fast);
        }
        .landing-btn-outline:hover { border-color: var(--accent); color: var(--accent); }
        .landing-btn-lg { padding: 15px 32px; font-size: 1rem; }

        /* ── Hero ── */
        .landing-hero {
          position: relative;
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
        .landing-hero-inner.in-view { opacity: 1; transform: translateY(0); }
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
        .landing-hero-actions {
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .landing-trust-row {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 28px;
        }
        .landing-trust-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .landing-trust-item svg { color: var(--success); }

        /* ── Floating 3D cards ── */
        .landing-float-outer {
          position: absolute;
          z-index: 5;
          opacity: 0;
          animation: lfEnter 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .landing-float-outer.lf-1 { top: 12%; left: 4%; animation-delay: 0.2s; }
        .landing-float-outer.lf-2 { top: 46%; left: 7%; animation-delay: 0.4s; }
        .landing-float-outer.lf-3 { top: 12%; right: 4%; animation-delay: 0.3s; }
        .landing-float-outer.lf-4 { top: 46%; right: 7%; animation-delay: 0.5s; }

        .landing-float-outer.lf-1 .landing-float-card { animation: lfFloatA 7s ease-in-out infinite; }
        .landing-float-outer.lf-2 .landing-float-card { animation: lfFloatB 8s ease-in-out infinite; }
        .landing-float-outer.lf-3 .landing-float-card { animation: lfFloatC 9s ease-in-out infinite; }
        .landing-float-outer.lf-4 .landing-float-card { animation: lfFloatB 8.5s ease-in-out infinite; }

        @keyframes lfEnter {
          from { opacity: 0; transform: translateY(24px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes lfFloatA { 0%,100% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(6px,-14px) rotate(1.5deg); } }
        @keyframes lfFloatB { 0%,100% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(-10px,10px) rotate(-1.5deg); } }
        @keyframes lfFloatC { 0%,100% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(8px,12px) rotate(1.2deg); } }

        .landing-float-card {
          width: 210px;
          padding: 18px;
          border-radius: 16px;
          text-align: left;
          background: var(--bg-topnav);
          border: 1px solid var(--border-color);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          cursor: default;
          transform-style: preserve-3d;
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease;
          will-change: transform;
        }
        .landing-float-card:hover {
          box-shadow: 0 24px 50px rgba(0, 0, 0, 0.35), 0 0 24px var(--accent-glow);
        }

        .ff-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }
        .ff-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ff-blue { background: #3b82f6; box-shadow: 0 0 10px #3b82f6; }
        .ff-purple { background: #8b5cf6; box-shadow: 0 0 10px #8b5cf6; }
        .ff-green { background: #10b981; box-shadow: 0 0 10px #10b981; }
        .ff-amber { background: #fbbf24; box-shadow: 0 0 10px #fbbf24; }
        .ff-value { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; letter-spacing: -0.3px; }
        .ff-trend { font-size: 0.8rem; font-weight: 600; color: var(--success); }
        .ff-detail { font-size: 0.78rem; color: var(--text-muted); text-align: right; }
        .ff-progress-track { width: 100%; height: 6px; border-radius: 3px; background: rgba(148, 163, 184, 0.25); overflow: hidden; margin-bottom: 8px; }
        .ff-progress-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--accent-start), var(--accent-end)); }
        .ff-status-pill {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 20px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #34d399;
          font-size: 0.85rem;
          font-weight: 700;
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
        .landing-preview-wrap.in-view { opacity: 1; transform: translateY(0); }
        .landing-preview {
          border-radius: 20px;
          border: 1px solid var(--border-card);
          background: var(--bg-card);
          box-shadow: 0 30px 70px -20px rgba(0, 0, 0, 0.35);
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
        .lp-url { margin-left: 12px; font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }
        .landing-preview-body { padding: 28px; display: flex; flex-direction: column; gap: 18px; }
        .landing-kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 0; }
        .landing-stats-card { margin-bottom: 0; }

        /* ── Sections ── */
        .landing-section {
          padding: 100px 24px;
          max-width: 1160px;
          margin: 0 auto;
          width: 100%;
          scroll-margin-top: 80px;
        }
        .landing-section-head {
          text-align: center;
          max-width: 640px;
          margin: 0 auto 56px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .landing-section-head.in-view { opacity: 1; transform: translateY(0); }

        /* ── iOS Control Center Modules Section ── */
        .landing-cc-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 18px;
          border-radius: 100px;
          background: rgba(10, 132, 255, 0.12);
          border: 1px solid rgba(10, 132, 255, 0.32);
          color: #0A84FF;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 20px;
          box-shadow: 0 4px 16px rgba(10, 132, 255, 0.18);
        }
        .cc-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #0A84FF;
          box-shadow: 0 0 10px #0A84FF;
          animation: pulseDot 2s infinite ease-in-out;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.8); }
        }

        /* ── iOS Control Center Filter Switcher ── */
        .ios-cc-switcher {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px;
          border-radius: 100px;
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          box-shadow: 0 12px 32px -10px rgba(0, 0, 0, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          margin-top: 16px;
          max-width: 100%;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .ios-cc-switcher::-webkit-scrollbar { display: none; }
        .ios-cc-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 100px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ios-cc-tab:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.08);
        }
        .ios-cc-tab.active {
          background: linear-gradient(135deg, #0A84FF, #0055D4);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 4px 18px rgba(10, 132, 255, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.35);
          transform: scale(1.02);
        }
        .ios-cc-tab-icon { font-size: 0.95rem; }
        .ios-cc-tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 7px;
          border-radius: 20px;
          background: rgba(0, 0, 0, 0.2);
          font-size: 0.74rem;
          font-weight: 800;
        }
        .ios-cc-tab.active .ios-cc-tab-count {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }

        /* ── iOS Control Center Grid ── */
        .ios-cc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(265px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .ios-cc-tile {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 22px;
          border-radius: 22px;
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          box-shadow: 0 12px 32px -10px rgba(0, 0, 0, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease, border-color 0.28s ease, opacity 0.6s ease;
          user-select: none;
        }
        .ios-cc-tile.in-view { opacity: 1; transform: translateY(0); }
        .ios-cc-tile::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top left, var(--tile-glow), transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .ios-cc-tile:hover {
          transform: translateY(-5px) scale(1.02);
          border-color: var(--tile-accent);
          box-shadow: 0 22px 48px -12px var(--tile-glow), inset 0 1px 2px rgba(255, 255, 255, 0.35);
        }
        .ios-cc-tile:hover::before { opacity: 0.16; }
        .ios-cc-tile:active {
          transform: scale(0.97);
        }
        .ios-cc-tile.selected {
          border-color: var(--tile-accent);
          box-shadow: 0 18px 45px -10px var(--tile-glow), inset 0 1px 2px rgba(255, 255, 255, 0.35);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), transparent), var(--bg-card);
        }
        .ios-cc-tile.selected::before { opacity: 0.2; }

        .ios-cc-tile-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .ios-cc-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          position: relative;
          box-shadow: 0 8px 22px var(--tile-glow);
          transition: transform 0.25s ease;
        }
        .ios-cc-tile:hover .ios-cc-icon-box {
          transform: scale(1.08) rotate(-2deg);
        }
        .ios-cc-icon { stroke-width: 2.2px; }

        .ios-cc-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 100px;
          background: rgba(148, 163, 184, 0.12);
          border: 1px solid rgba(148, 163, 184, 0.22);
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .ios-cc-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .ios-cc-tile-body {
          margin-bottom: 18px;
          text-align: left;
        }
        .ios-cc-tile-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 6px;
        }
        .ios-cc-tile-title {
          font-size: 1.05rem;
          font-weight: 800;
          letter-spacing: -0.3px;
          color: var(--text-primary);
        }
        .ios-cc-tile-badge {
          font-size: 0.68rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          background: var(--accent-subtle);
          color: var(--accent);
          white-space: nowrap;
        }
        .ios-cc-tile-desc {
          font-size: 0.84rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        .ios-cc-tile-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .ios-cc-category-chip {
          font-size: 0.74rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--text-muted);
        }
        .ios-cc-toggle-indicator {
          width: 32px;
          height: 18px;
          border-radius: 12px;
          background: rgba(148, 163, 184, 0.22);
          position: relative;
          padding: 2px;
          transition: background 0.25s ease;
        }
        .ios-cc-switch-knob {
          display: block;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ios-cc-tile:hover .ios-cc-toggle-indicator,
        .ios-cc-tile.selected .ios-cc-toggle-indicator {
          background: var(--tile-accent);
        }
        .ios-cc-tile:hover .ios-cc-switch-knob,
        .ios-cc-tile.selected .ios-cc-switch-knob {
          transform: translateX(14px);
        }

        /* ── iOS Control Center Spotlight Bar ── */
        .ios-cc-spotlight-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 22px 28px;
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent 60%), var(--bg-card);
          border: 1px solid var(--border-card);
          box-shadow: 0 20px 50px -15px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          margin-top: 12px;
          text-align: left;
        }
        .ios-cc-spotlight-left {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .ios-cc-spotlight-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
        }
        .ios-cc-spotlight-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .ios-cc-spotlight-tag {
          font-size: 0.74rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--accent);
        }
        .ios-cc-spotlight-subdot { color: var(--text-muted); }
        .ios-cc-spotlight-active {
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--success);
        }
        .ios-cc-spotlight-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .ios-cc-spotlight-desc {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin: 0;
        }
        .ios-cc-spotlight-right {
          flex-shrink: 0;
        }
        .ios-cc-spotlight-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 26px;
          border-radius: 100px;
          border: none;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          color: #ffffff;
          font-size: 0.92rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 22px var(--accent-glow);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .ios-cc-spotlight-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px var(--accent-glow);
        }

        @media (max-width: 768px) {
          .ios-cc-spotlight-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .ios-cc-spotlight-right {
            width: 100%;
          }
          .ios-cc-spotlight-btn {
            width: 100%;
            justify-content: center;
          }
        }

        /* ── Features ── */
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
        .landing-feature-card.in-view { opacity: 1; transform: translateY(0); }
        .landing-feature-card:hover { box-shadow: var(--shadow-card-hover); border-color: var(--accent); }
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
        .landing-feature-title { font-size: 1.15rem; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.2px; }
        .landing-feature-desc { font-size: 0.95rem; color: var(--text-secondary); line-height: 1.65; }

        /* ── Steps ── */
        .landing-step-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 28px;
        }
        .landing-step {
          padding: 28px 24px;
          border-radius: 18px;
          border: 1px solid var(--border-card);
          background: var(--bg-card);
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .landing-step.in-view { opacity: 1; transform: translateY(0); }
        .landing-step-n {
          display: inline-block;
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 1px;
          color: var(--accent);
          margin-bottom: 14px;
        }
        .landing-step-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; }
        .landing-step-desc { font-size: 0.94rem; color: var(--text-secondary); line-height: 1.65; }

        /* ── Privacy ── */
        .landing-privacy { text-align: center; }
        .landing-privacy-inner {
          max-width: 620px;
          margin: 0 auto;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .landing-privacy-inner.in-view { opacity: 1; transform: translateY(0); }
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

        /* ── FAQ ── */
        .landing-faq-list { max-width: 780px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
        .landing-faq-item {
          border-radius: 14px;
          border: 1px solid var(--border-card);
          background: var(--bg-card);
          overflow: hidden;
          transition: border-color 0.25s ease;
        }
        .landing-faq-item.open { border-color: var(--accent); }
        .landing-faq-q {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 22px;
          text-align: left;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .landing-faq-chevron { flex-shrink: 0; color: var(--text-muted); transition: transform 0.3s ease, color 0.3s ease; }
        .landing-faq-item.open .landing-faq-chevron { transform: rotate(180deg); color: var(--accent); }
        .landing-faq-a {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .landing-faq-item.open .landing-faq-a { grid-template-rows: 1fr; }
        .landing-faq-a > p {
          overflow: hidden;
          margin: 0;
          padding: 0 22px;
          font-size: 0.95rem;
          line-height: 1.65;
          color: var(--text-secondary);
        }
        .landing-faq-item.open .landing-faq-a > p { padding-bottom: 20px; }

        /* ── CTA ── */
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
        .landing-cta-inner.in-view { opacity: 1; transform: translateY(0); }

        /* ── Footer ── */
        .landing-footer {
          padding: 32px 40px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .landing-footer-name { font-weight: 600; font-size: 0.92rem; color: var(--text-secondary); }
        .landing-footer-links { display: flex; gap: 20px; flex-wrap: wrap; }
        .landing-footer-link {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .landing-footer-link:hover { color: var(--accent); }
        .landing-footer-link.as-button { background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; }
        .landing-footer-copy { font-size: 0.85rem; color: var(--text-muted); }

        /* ── Responsive ── */
        @media (max-width: 1280px) {
          .landing-float-outer { display: none; }
        }
        @media (max-width: 900px) {
          .landing-nav-link { display: none; }
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
