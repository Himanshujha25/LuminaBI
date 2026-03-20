import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2, ChevronRight, Database, MessageSquare,
  Cpu, Zap, Shield, TrendingUp, ArrowRight, Check
} from 'lucide-react';
import DashboardPreview from './DashboardPreview';

/* ─────────────────────────────────────────────────────────────────────────────
   INLINE CSS — zero dependency on Home.css
───────────────────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #080a12;
    --surface:   #0e1120;
    --surface-2: #131628;
    --border:    rgba(255,255,255,.07);
    --border-md: rgba(255,255,255,.12);
    --text-1:    #eef0fa;
    --text-2:    rgba(238,240,250,.50);
    --text-3:    rgba(238,240,250,.28);
    --accent:    #5a5fff;
    --accent-2:  #a78bfa;
    --accent-3:  #38bdf8;
    --green:     #34d399;
    --amber:     #fbbf24;
    --font-head: 'Bricolage Grotesque', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text-1);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: rgba(90,95,255,.3); border-radius: 999px; }

  /* ── Noise texture overlay ── */
  .noise-overlay {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    opacity: .028;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 128px;
  }

  /* ── Grid ── */
  .bg-grid {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,.024) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.024) 1px, transparent 1px);
    background-size: 52px 52px;
    mask-image: radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 100%);
  }

  /* ── Glow blobs ── */
  .blob {
    position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
    filter: blur(120px); opacity: .18;
  }
  .blob-1 { width: 700px; height: 700px; top: -200px; left: -100px; background: #5a5fff; }
  .blob-2 { width: 500px; height: 500px; top: 100px; right: -100px; background: #a78bfa; opacity: .12; }
  .blob-3 { width: 400px; height: 400px; bottom: 10%; left: 30%; background: #38bdf8; opacity: .09; }

  /* ── Utility ── */
  .gradient-text {
    background: linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #38bdf8 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Animations ── */
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes slide-up { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fade-in  { from{opacity:0} to{opacity:1} }
  @keyframes shimmer-move {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes spin-slow { to { transform: rotate(360deg); } }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
  @keyframes count-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  .anim-slide-up  { animation: slide-up .55s cubic-bezier(.22,1,.36,1) both; }
  .anim-fade-in   { animation: fade-in .6s ease both; }
  .anim-float     { animation: float 6s ease-in-out infinite; }

  /* Reveal on scroll */
  .reveal { opacity:0; transform:translateY(24px); transition:opacity .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1); }
  .reveal.visible { opacity:1; transform:translateY(0); }

  /* ── Navbar ── */
  .lbi-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 40px; height: 60px;
    background: rgba(8,10,18,.7);
    backdrop-filter: blur(20px) saturate(1.4);
    border-bottom: 1px solid var(--border);
    transition: background .3s;
  }
  .lbi-logo {
    display: flex; align-items: center; gap: 9px;
    text-decoration: none;
  }
  .lbi-logo-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #4f52e8, #7c5cf6);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 1px rgba(255,255,255,.12), 0 4px 12px rgba(79,82,232,.4);
  }
  .lbi-logo-text {
    font-family: var(--font-head); font-size: 17px; font-weight: 700;
    color: var(--text-1); letter-spacing: -.3px;
  }
  .lbi-nav-links { display: flex; align-items: center; gap: 10px; }
  .btn-ghost {
    padding: 7px 16px; border-radius: 8px; border: none;
    background: transparent; color: var(--text-2);
    font-family: var(--font-body); font-size: 13.5px; font-weight: 500;
    cursor: pointer; text-decoration: none; transition: color .15s, background .15s;
  }
  .btn-ghost:hover { color: var(--text-1); background: rgba(255,255,255,.05); }
  .btn-cta {
    padding: 8px 18px; border-radius: 8px;
    background: linear-gradient(135deg, #4f52e8, #7c5cf6);
    color: #fff; font-family: var(--font-body); font-size: 13.5px; font-weight: 600;
    border: none; cursor: pointer; text-decoration: none;
    box-shadow: 0 0 0 1px rgba(255,255,255,.12), 0 3px 10px rgba(79,82,232,.35);
    transition: opacity .15s, transform .12s;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .btn-cta:hover { opacity: .9; transform: translateY(-1px); }

  /* ── Hero ── */
  .hero {
    position: relative; z-index: 1;
    min-height: 100vh; padding: 160px 40px 100px;
    display: flex; flex-direction: column; align-items: center;
    text-align: center; max-width: 900px; margin: 0 auto;
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 14px; border-radius: 999px;
    border: 1px solid rgba(90,95,255,.3);
    background: rgba(90,95,255,.08);
    font-size: 12.5px; font-weight: 500; color: #a5b4fc;
    margin-bottom: 28px; letter-spacing: .01em;
  }
  .hero-badge-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
    animation: pulse-dot 2s ease infinite;
  }
  .hero-title {
    font-family: var(--font-head); font-size: clamp(34px, 10vw, 84px);
    font-weight: 800; line-height: 1.05; letter-spacing: -.03em;
    color: var(--text-1); margin-bottom: 22px;
  }
  .hero-sub {
    font-size: clamp(15px, 2vw, 18px); color: var(--text-2);
    line-height: 1.7; max-width: 580px; margin: 0 auto 40px;
  }
  .hero-actions {
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: center;
    margin-bottom: 18px;
  }
  .btn-hero-primary {
    padding: 13px 28px; border-radius: 10px; border: none; cursor: pointer;
    background: linear-gradient(135deg, #4f52e8 0%, #7c5cf6 100%);
    color: #fff; font-family: var(--font-head); font-size: 15px; font-weight: 700;
    text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
    box-shadow: 0 0 0 1px rgba(255,255,255,.14), 0 8px 28px rgba(79,82,232,.45);
    transition: all .2s; letter-spacing: -.01em;
  }
  .btn-hero-primary:hover { opacity: .9; transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(255,255,255,.18), 0 12px 36px rgba(79,82,232,.55); }
  .btn-hero-secondary {
    padding: 13px 24px; border-radius: 10px;
    border: 1px solid var(--border-md); background: rgba(255,255,255,.04);
    color: var(--text-1); font-family: var(--font-head); font-size: 15px; font-weight: 600;
    text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
    transition: all .15s; backdrop-filter: blur(8px);
  }
  .btn-hero-secondary:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.2); }
  .hero-disclaimer { font-size: 12.5px; color: var(--text-3); }

  /* ── Plain feature strip ── */
  .feature-strip {
    position: relative; z-index: 1;
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    padding: 15px 40px;
    display: flex; align-items: center; justify-content: center;
    gap: 0; flex-wrap: wrap;
  }
  .strip-item {
    display: flex; align-items: center; gap: 7px;
    font-size: 13px; color: var(--text-3); white-space: nowrap;
    padding: 4px 20px; border-right: 1px solid var(--border);
  }
  .strip-item:last-child { border-right: none; }

  /* ── Dashboard preview wrapper ── */
  .preview-wrap {
    position: relative; z-index: 1;
    padding: 0 40px 80px;
    max-width: 1200px; margin: 0 auto;
  }
  .preview-fade-top {
    position: absolute; top: 0; left: 0; right: 0; height: 120px; z-index: 2;
    background: linear-gradient(to bottom, var(--bg), transparent);
  }
  .preview-fade-bottom {
    position: absolute; bottom: 0; left: 0; right: 0; height: 120px; z-index: 2;
    background: linear-gradient(to top, var(--bg), transparent);
  }
  .preview-glow {
    position: absolute; inset: -40px; border-radius: 24px; z-index: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(90,95,255,.12), transparent 70%);
  }
  .preview-inner {
    position: relative; z-index: 1;
    border: 1px solid rgba(255,255,255,.10);
    border-radius: 16px; overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.06);
  }
  .preview-chrome {
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
    padding: 10px 16px;
    display: flex; align-items: center; gap: 7px;
  }
  .chrome-dot { width: 10px; height: 10px; border-radius: 50%; }

  /* ── Section shared ── */
  .section {
    position: relative; z-index: 1;
    padding: 100px 40px;
    max-width: 1200px; margin: 0 auto;
  }
  .section-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 14px;
  }
  .section-eyebrow::before {
    content: ''; display: block; width: 20px; height: 1.5px; background: var(--accent);
  }
  .section-title {
    font-family: var(--font-head); font-size: clamp(28px, 4vw, 44px);
    font-weight: 800; line-height: 1.1; letter-spacing: -.03em;
    color: var(--text-1); margin-bottom: 14px;
  }
  .section-sub {
    font-size: 16px; color: var(--text-2); line-height: 1.7;
    max-width: 520px;
  }

  /* ── Features grid ── */
  .features-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
    border: 1px solid var(--border); border-radius: 16px; overflow: hidden;
    background: var(--border);
    margin-top: 60px;
  }
  .feature-cell {
    background: var(--surface); padding: 32px 28px;
    transition: background .2s;
    position: relative; overflow: hidden;
  }
  .feature-cell::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle 200px at var(--mx,50%) var(--my,50%), rgba(90,95,255,.08), transparent 70%);
    opacity: 0; transition: opacity .3s;
  }
  .feature-cell:hover::before { opacity: 1; }
  .feature-cell:hover { background: rgba(255,255,255,.025); }
  .feature-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px; border: 1px solid rgba(255,255,255,.08);
  }
  .feature-name {
    font-family: var(--font-head); font-size: 16px; font-weight: 700;
    color: var(--text-1); margin-bottom: 7px; letter-spacing: -.02em;
  }
  .feature-desc { font-size: 13.5px; color: var(--text-2); line-height: 1.65; }

  /* ── How it works ── */
  .flow-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 0; margin-top: 60px; position: relative;
  }
  .flow-grid::before {
    content: '';
    position: absolute; top: 28px; left: calc(12.5% + 28px); right: calc(12.5% + 28px);
    height: 1px;
    background: linear-gradient(to right, transparent, var(--accent), var(--accent-2), transparent);
    z-index: 0;
  }
  .flow-step { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 16px; position: relative; z-index: 1; }
  .flow-num {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--surface-2); border: 1px solid var(--border-md);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
    box-shadow: 0 0 0 4px var(--bg);
  }
  .flow-step-title {
    font-family: var(--font-head); font-size: 15px; font-weight: 700;
    color: var(--text-1); margin-bottom: 8px; letter-spacing: -.02em;
  }
  .flow-step-desc { font-size: 13px; color: var(--text-2); line-height: 1.65; }



  /* ── CTA section ── */
  .cta-section {
    position: relative; z-index: 1;
    margin: 0 40px 100px; border-radius: 20px;
    padding: 80px 60px;
    background: linear-gradient(135deg, rgba(79,82,232,.15) 0%, rgba(124,92,246,.10) 50%, rgba(56,189,248,.08) 100%);
    border: 1px solid rgba(90,95,255,.2);
    text-align: center; overflow: hidden;
  }
  .cta-section::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 70% 80% at 50% -20%, rgba(90,95,255,.18), transparent 70%);
  }
  .cta-title {
    font-family: var(--font-head); font-size: clamp(28px, 4vw, 46px);
    font-weight: 800; letter-spacing: -.03em; color: var(--text-1); margin-bottom: 14px;
    position: relative;
  }
  .cta-sub { font-size: 16px; color: var(--text-2); margin-bottom: 36px; position: relative; }
  .cta-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; position: relative; }
  .cta-checklist {
    display: flex; gap: 24px; justify-content: center; flex-wrap: wrap;
    margin-top: 24px; position: relative;
  }
  .cta-check-item {
    display: flex; align-items: center; gap: 7px;
    font-size: 13px; color: var(--text-3);
  }

  /* ── Footer ── */
  .lbi-footer {
    position: relative; z-index: 1;
    border-top: 1px solid var(--border);
    padding: 40px;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
  }
  .footer-brand { display: flex; align-items: center; gap: 9px; }
  .footer-copy { font-size: 13px; color: var(--text-3); }
  .footer-links { display: flex; gap: 24px; }
  .footer-link { font-size: 13px; color: var(--text-3); text-decoration: none; transition: color .15s; }
  .footer-link:hover { color: var(--text-2); }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .features-grid { grid-template-columns: 1fr 1fr; }
    .flow-grid { grid-template-columns: 1fr 1fr; gap: 40px; }
    .flow-grid::before { display: none; }
    .lbi-nav { padding: 0 20px; }
    .hero { padding: 120px 20px 80px; }
    .section { padding: 72px 20px; }
    .cta-section { margin: 0 20px 72px; padding: 56px 28px; }
  }
  @media (max-width: 600px) {
    .features-grid { grid-template-columns: 1fr; }
    .flow-grid { grid-template-columns: 1fr; }
    .lbi-footer { flex-direction: column; align-items: center; text-align: center; gap: 20px; }
    .hide-mobile { display: none !important; }
    .lbi-nav-links { gap: 4px; }
    .btn-ghost { padding: 6px 8px; font-size: 13px; }
    .btn-cta { padding: 8px 12px; font-size: 12.5px; }
    .hero-disclaimer { margin-top: 10px; opacity: .7; }
    .lbi-logo-text { font-size: 15px; }
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <MessageSquare size={20} />, color: '#818cf8', bg: 'rgba(129,140,248,.12)',
    name: 'Natural language queries',
    desc: 'Ask questions in plain English. No SQL expertise needed — just type what you want to know and get exact answers.',
  },
  {
    icon: <Zap size={20} />, color: '#fbbf24', bg: 'rgba(251,191,36,.10)',
    name: 'Instant AI-powered SQL',
    desc: 'Gemini reads your schema and generates highly accurate PostgreSQL queries in milliseconds — with zero hallucinations.',
  },
  {
    icon: <BarChart2 size={20} />, color: '#34d399', bg: 'rgba(52,211,153,.10)',
    name: 'Beautiful visualizations',
    desc: 'Auto-generated Recharts dashboards with intelligent chart-type selection based on the shape of your data.',
  },
  {
    icon: <Database size={20} />, color: '#38bdf8', bg: 'rgba(56,189,248,.10)',
    name: 'Real PostgreSQL tables',
    desc: 'CSVs land in isolated PostgreSQL schemas — not flat file stores. Query with full SQL power and join across uploads.',
  },
  {
    icon: <Shield size={20} />, color: '#f472b6', bg: 'rgba(244,114,182,.10)',
    name: 'Enterprise-grade security',
    desc: 'Row-level isolation, JWT auth, and encrypted keys. Your data never touches another tenant\'s tables.',
  },
  {
    icon: <TrendingUp size={20} />, color: '#a78bfa', bg: 'rgba(167,139,250,.10)',
    name: 'Multi-provider AI engine',
    desc: 'Switch between Gemini, GPT-4o, Claude, or DeepSeek. Bring your own API key for unlimited queries.',
  },
];

const FLOW_STEPS = [
  {
    num: '01', icon: <Database size={22} />, color: '#818cf8',
    title: 'Upload your CSV',
    desc: 'Drop any CSV and we parse, type-infer, and load it into a dedicated PostgreSQL schema instantly.',
  },
  {
    num: '02', icon: <MessageSquare size={22} />, color: '#a78bfa',
    title: 'Ask in plain English',
    desc: 'Type your question naturally. We resolve it against your schema with zero ambiguity.',
  },
  {
    num: '03', icon: <Cpu size={22} />, color: '#38bdf8',
    title: 'AI generates SQL',
    desc: 'Gemini reads the schema context and returns precise PostgreSQL — validated before execution.',
  },
  {
    num: '04', icon: <BarChart2 size={22} />, color: '#34d399',
    title: 'Instant dashboard',
    desc: 'Results render as interactive charts, tables, or KPI cards — ready to share or export.',
  },
];



/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────────── */
const Home = () => {
  const revealRefs = useRef([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    revealRefs.current.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const addReveal = (delay = 0) => el => {
    if (el) {
      el.style.transitionDelay = `${delay}s`;
      if (!revealRefs.current.includes(el)) revealRefs.current.push(el);
    }
  };

  /* Mouse-tracking for feature cell glow */
  const handleFeatureMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Atmosphere */}
      <div className="noise-overlay" />
      <div className="bg-grid" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* ── NAV ── */}
      <nav className="lbi-nav">
        <Link to="/" className="lbi-logo">
          <div className="lbi-logo-icon"><BarChart2 size={18} color="#fff" /></div>
          <span className="lbi-logo-text">Lumina<span className="gradient-text">BI</span></span>
        </Link>
        <div className="lbi-nav-links">
          <a href="#features" className="btn-ghost hide-mobile">Features</a>
          <a href="#how-it-works" className="btn-ghost hide-mobile">How it works</a>
          <Link to="/login" className="btn-ghost">Log in</Link>
          <Link to="/signup" className="btn-cta">Start free <ChevronRight size={13} /></Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-badge anim-slide-up">
          <span className="hero-badge-dot" />
          Powered by Gemini 2.5 Flash · Multi-model support
        </div>

        <h1 className="hero-title anim-slide-up" style={{ animationDelay: '.08s' }}>
          Chat with your data.<br />
          <span className="gradient-text">Ship insights faster.</span>
        </h1>

        <p className="hero-sub anim-slide-up" style={{ animationDelay: '.16s' }}>
          LuminaBI turns raw CSVs into interactive dashboards using natural language.
          No SQL. No BI engineers. Just ask and see.
        </p>

        <div className="hero-actions anim-slide-up" style={{ animationDelay: '.24s' }}>
          <Link to="/signup" className="btn-hero-primary">
            Get started free <ChevronRight size={16} />
          </Link>
          <Link to="/login" className="btn-hero-secondary">
            Sign in <ArrowRight size={15} />
          </Link>
        </div>

        <p className="hero-disclaimer anim-slide-up" style={{ animationDelay: '.30s' }}>
          No credit card required · Free tier forever · Setup in 30 seconds
        </p>
      </section>

      {/* ── WHAT IT OFFERS STRIP ── */}
      <div className="feature-strip">
        {[
          { icon: <Check size={13} color="#34d399" />, text: 'Natural language to SQL' },
          { icon: <Check size={13} color="#34d399" />, text: 'Real PostgreSQL tables' },
          { icon: <Check size={13} color="#34d399" />, text: 'Multi-model AI support' },
          { icon: <Check size={13} color="#34d399" />, text: 'No SQL knowledge needed' },
          { icon: <Check size={13} color="#34d399" />, text: 'Free to start' },
        ].map((item) => (
          <span key={item.text} className="strip-item">
            {item.icon}
            {item.text}
          </span>
        ))}
      </div>

      {/* ── DASHBOARD PREVIEW ── */}
      <div className="preview-wrap">
        <div style={{ position: 'relative' }}>
          <div className="preview-glow" />
          <div className="preview-fade-top" />
          <div className="preview-inner">
            <div className="preview-chrome">
              <div className="chrome-dot" style={{ background: '#ff5f57' }} />
              <div className="chrome-dot" style={{ background: '#febc2e' }} />
              <div className="chrome-dot" style={{ background: '#28c840' }} />
              <div style={{ flex: 1 }} />
              <div style={{
                height: 20, width: 180, borderRadius: 4,
                background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 5,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>app.lumina.bi/dashboard</span>
              </div>
              <div style={{ flex: 1 }} />
            </div>
            <DashboardPreview />
          </div>
          <div className="preview-fade-bottom" />
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="section">
        <div ref={addReveal(0)}>
          <span className="section-eyebrow reveal" ref={addReveal(0)}>Capabilities</span>
        </div>
        <h2 className="section-title reveal" ref={addReveal(.06)}>
          Everything your data team<br />actually needs
        </h2>
        <p className="section-sub reveal" ref={addReveal(.1)}>
          Built for analysts who want answers in seconds, not dashboards that take weeks to configure.
        </p>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.name}
              className="feature-cell reveal"
              ref={addReveal(i * .07)}
              onMouseMove={handleFeatureMouseMove}
            >
              <div className="feature-icon" style={{ background: f.bg }}>
                <span style={{ color: f.color }}>{f.icon}</span>
              </div>
              <p className="feature-name">{f.name}</p>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="section" style={{ paddingTop: 0 }}>
        <span className="section-eyebrow reveal" ref={addReveal(0)}>How it works</span>
        <h2 className="section-title reveal" ref={addReveal(.06)}>From CSV to chart in under 10 seconds</h2>
        <p className="section-sub reveal" ref={addReveal(.1)}>
          A high-accuracy pipeline built on real PostgreSQL — not in-memory lookups or flat-file hacks.
        </p>

        <div className="flow-grid">
          {FLOW_STEPS.map((s, i) => (
            <div key={s.num} className="flow-step reveal" ref={addReveal(i * .08)}>
              <div className="flow-num">
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <p className="flow-step-title">{s.title}</p>
              <p className="flow-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>



      {/* ── CTA ── */}
      <div className="cta-section reveal" ref={addReveal(0)}>
        <h2 className="cta-title">
          Ready to talk to your data?
        </h2>
        <p className="cta-sub">
          Stop waiting on dashboards. Start getting answers from your data today.
        </p>
        <div className="cta-actions">
          <Link to="/signup" className="btn-hero-primary">
            Start for free <ChevronRight size={16} />
          </Link>
        </div>
        <div className="cta-checklist">
          {['No credit card', 'Free tier forever', '30-second setup', 'Cancel anytime'].map(item => (
            <span key={item} className="cta-check-item">
              <Check size={13} color="#34d399" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="lbi-footer">
        <div className="footer-brand">
          <div className="lbi-logo-icon" style={{ width: 28, height: 28 }}>
            <BarChart2 size={15} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--text-2)' }}>
            Lumina<span className="gradient-text">BI</span>
          </span>
        </div>
        <p className="footer-copy">© 2026 LuminaBI · All rights reserved</p>
      </footer>
    </>
  );
};

export default Home;