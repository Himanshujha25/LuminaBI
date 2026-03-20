import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart2, ChevronRight, Database, MessageSquare,
  Cpu, Zap, Shield, TrendingUp, ArrowRight, Check, Menu, X
} from 'lucide-react';
import DashboardPreview from './DashboardPreview';

/* ─────────────────────────────────────────────────────────────────────────────
   INLINE CSS
───────────────────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

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
    --font-head: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-mono: ui-monospace, 'SF Mono', 'Cascadia Code', 'Roboto Mono', monospace;
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text-1);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: rgba(90,95,255,.3); border-radius: 999px; }

  .noise-overlay {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    opacity: .028;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 128px;
  }

  .bg-grid {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,.024) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.024) 1px, transparent 1px);
    background-size: 52px 52px;
    mask-image: radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 100%);
  }

  .blob {
    position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
    filter: blur(120px); opacity: .18;
  }
  .blob-1 { width: 700px; height: 700px; top: -200px; left: -100px; background: #5a5fff; }
  .blob-2 { width: 500px; height: 500px; top: 100px; right: -100px; background: #a78bfa; opacity: .12; }
  .blob-3 { width: 400px; height: 400px; bottom: 10%; left: 30%; background: #38bdf8; opacity: .09; }

  .gradient-text {
    background: linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #38bdf8 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes slide-up { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fade-in  { from{opacity:0} to{opacity:1} }
  @keyframes spin-slow { to { transform: rotate(360deg); } }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
  @keyframes flow-pulse { 0%, 100% { opacity: .6; } 50% { opacity: 1; } }

  .anim-slide-up  { animation: slide-up .55s cubic-bezier(.22,1,.36,1) both; }
  .anim-fade-in   { animation: fade-in .6s ease both; }
  .anim-float     { animation: float 6s ease-in-out infinite; }

  .reveal {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity .5s cubic-bezier(.22,1,.36,1), transform .5s cubic-bezier(.22,1,.36,1);
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  /* ── NAV ── */
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
    color: var(--text-1); letter-spacing: -.5px;
  }

  /* Desktop nav links */
  .lbi-nav-links {
    display: flex; align-items: center; gap: 10px;
  }

  /* Mobile hamburger — hidden on desktop */
  .lbi-hamburger {
    display: none;
    align-items: center; justify-content: center;
    width: 38px; height: 38px; border-radius: 8px;
    border: 1px solid var(--border-md); background: rgba(255,255,255,.04);
    cursor: pointer; color: var(--text-2); transition: all .15s;
  }
  .lbi-hamburger:hover { background: rgba(255,255,255,.08); color: var(--text-1); }

  /* Mobile drawer */
  .lbi-mobile-drawer {
    display: none;
    position: fixed; top: 60px; left: 0; right: 0; z-index: 99;
    background: rgba(8,10,18,.96);
    backdrop-filter: blur(24px) saturate(1.4);
    border-bottom: 1px solid var(--border);
    flex-direction: column;
    padding: 16px 20px 20px;
    gap: 6px;
    animation: slide-up .22s cubic-bezier(.22,1,.36,1) both;
  }
  .lbi-mobile-drawer.open { display: flex; }
  .drawer-link {
    display: flex; align-items: center;
    padding: 11px 14px; border-radius: 10px;
    color: var(--text-2); font-size: 14px; font-weight: 500;
    text-decoration: none; transition: all .14s;
  }
  .drawer-link:hover { background: rgba(255,255,255,.06); color: var(--text-1); }
  .drawer-divider { height: 1px; background: var(--border); margin: 8px 0; }
  .drawer-cta {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 20px; border-radius: 10px;
    background: linear-gradient(135deg, #4f52e8, #7c5cf6);
    color: #fff; font-size: 14px; font-weight: 600;
    text-decoration: none; margin-top: 4px;
    box-shadow: 0 4px 16px rgba(79,82,232,.35);
  }

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

  /* ── HERO ── */
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
    font-family: var(--font-head); font-size: clamp(38px, 7vw, 80px);
    font-weight: 800; line-height: 1.05; letter-spacing: -.04em;
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

  /* ── Feature strip ── */
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

  /* ── Dashboard preview ── */
  .preview-wrap {
    position: relative; z-index: 1;
    padding: 0 40px 100px;
    max-width: 1400px; margin: 0 auto;
  }
  .preview-container { position: relative; border-radius: 20px; overflow: hidden; }
  .preview-fade-top {
    position: absolute; top: 0; left: 0; right: 0; height: 40px; z-index: 2;
    background: linear-gradient(to bottom, var(--bg), transparent); pointer-events: none;
  }
  .preview-fade-bottom {
    position: absolute; bottom: 0; left: 0; right: 0; height: 40px; z-index: 2;
    background: linear-gradient(to top, var(--bg), transparent); pointer-events: none;
  }
  .preview-glow {
    position: absolute; inset: -60px; border-radius: 24px; z-index: 0;
    background: radial-gradient(ellipse 70% 50% at 50% 50%, rgba(90,95,255,.15), transparent 70%);
    filter: blur(60px);
  }
  .preview-inner {
    position: relative; z-index: 1;
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 20px; overflow: hidden;
    box-shadow:
      0 40px 100px rgba(0,0,0,.7),
      0 20px 60px rgba(99,102,241,.15),
      0 0 0 1px rgba(255,255,255,.08),
      inset 0 1px 0 rgba(255,255,255,.1);
    transition: all .4s cubic-bezier(.22,1,.36,1);
  }
  .preview-inner:hover {
    transform: translateY(-4px);
    box-shadow:
      0 45px 110px rgba(0,0,0,.75),
      0 22px 65px rgba(99,102,241,.2),
      0 0 0 1px rgba(255,255,255,.12),
      inset 0 1px 0 rgba(255,255,255,.12);
  }

  /* ── Sections ── */
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
    font-family: var(--font-head); font-size: clamp(26px, 4vw, 44px);
    font-weight: 800; line-height: 1.1; letter-spacing: -.04em;
    color: var(--text-1); margin-bottom: 14px;
  }
  .section-sub {
    font-size: 16px; color: var(--text-2); line-height: 1.7; max-width: 520px;
  }

  /* ── Features grid ── */
  .features-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
    margin-top: 60px;
  }
  .feature-cell {
    background: linear-gradient(135deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.02) 100%);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 16px; padding: 32px 28px;
    transition: all .3s cubic-bezier(.22,1,.36,1);
    position: relative; overflow: hidden;
    box-shadow: 0 4px 16px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.06);
  }
  .feature-cell::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle 300px at var(--mx,50%) var(--my,50%), rgba(90,95,255,.12), transparent 70%);
    opacity: 0; transition: opacity .4s;
  }
  .feature-cell:hover::before { opacity: 1; }
  .feature-cell:hover {
    background: linear-gradient(135deg, rgba(255,255,255,.06) 0%, rgba(255,255,255,.03) 100%);
    border-color: rgba(99,102,241,.25);
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 16px 40px rgba(0,0,0,.3), 0 8px 20px rgba(99,102,241,.2), inset 0 1px 0 rgba(255,255,255,.1);
  }
  .feature-icon {
    width: 48px; height: 48px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 18px;
    border: 1px solid rgba(255,255,255,.1);
    box-shadow: 0 4px 16px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.08);
    transition: all .3s cubic-bezier(.22,1,.36,1);
    position: relative; z-index: 1;
  }
  .feature-cell:hover .feature-icon {
    transform: translateY(-4px) scale(1.1) rotate(5deg);
    box-shadow: 0 8px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.15);
  }
  .feature-name {
    font-family: var(--font-head); font-size: 17px; font-weight: 700;
    color: var(--text-1); margin-bottom: 8px; letter-spacing: -.02em; position: relative; z-index: 1;
  }
  .feature-desc { font-size: 14px; color: var(--text-2); line-height: 1.7; position: relative; z-index: 1; }

  /* ── How it works ── */
  .how-it-works-section {
    position: relative; z-index: 1;
    padding: 100px 40px;
    max-width: 1200px; margin: 0 auto;
  }
  .flow-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px; margin-top: 60px; position: relative;
  }
  .flow-connector {
    position: absolute; top: 40px; left: 0; right: 0; height: 2px;
    z-index: 0; pointer-events: none;
  }
  .flow-connector-line {
    position: absolute; top: 0; left: 12.5%; right: 12.5%; height: 100%;
    background: linear-gradient(to right, transparent 0%, rgba(99,102,241,.3) 10%, rgba(99,102,241,.6) 25%, rgba(139,92,246,.6) 50%, rgba(56,189,248,.6) 75%, rgba(52,211,153,.3) 90%, transparent 100%);
    animation: flow-pulse 3s ease-in-out infinite;
  }
  .flow-step {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    padding: 0; position: relative; z-index: 1;
    transition: all .4s cubic-bezier(.22,1,.36,1);
  }
  .flow-step:hover { transform: translateY(-8px); }
  .flow-num-wrapper { position: relative; margin-bottom: 24px; }
  .flow-num-glow {
    position: absolute; inset: -20px; border-radius: 50%;
    opacity: 0; transition: opacity .4s; filter: blur(30px);
  }
  .flow-step:hover .flow-num-glow { opacity: .8; }
  .flow-num {
    width: 80px; height: 80px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(14,17,32,.95), rgba(11,15,25,.9));
    border: 2px solid;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 4px;
    box-shadow: 0 0 0 8px var(--bg), 0 8px 32px rgba(0,0,0,.4), inset 0 2px 0 rgba(255,255,255,.1), inset 0 -2px 8px rgba(0,0,0,.3);
    transition: all .4s cubic-bezier(.22,1,.36,1); position: relative; overflow: hidden;
  }
  .flow-step:hover .flow-num {
    transform: scale(1.15) rotate(5deg);
    box-shadow: 0 0 0 8px var(--bg), 0 16px 48px rgba(0,0,0,.5), inset 0 2px 0 rgba(255,255,255,.15);
  }
  .flow-num-text {
    font-family: var(--font-mono); font-size: 13px; font-weight: 700;
    letter-spacing: .05em; opacity: .5; display: block;
  }
  .flow-step-card {
    background: linear-gradient(135deg, rgba(255,255,255,.05) 0%, rgba(255,255,255,.02) 100%);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 14px; padding: 20px 18px;
    box-shadow: 0 4px 20px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.08);
    transition: all .4s cubic-bezier(.22,1,.36,1);
    position: relative; overflow: hidden; min-height: 140px;
  }
  .flow-step:hover .flow-step-card {
    border-color: rgba(255,255,255,.2);
    box-shadow: 0 12px 40px rgba(0,0,0,.3), 0 4px 16px rgba(99,102,241,.2), inset 0 1px 0 rgba(255,255,255,.12);
  }
  .flow-step-title {
    font-family: var(--font-head); font-size: 16px; font-weight: 700;
    color: var(--text-1); margin-bottom: 10px; letter-spacing: -.02em;
    position: relative; display: block;
  }
  .flow-step-desc { font-size: 13px; color: var(--text-2); line-height: 1.7; position: relative; display: block; }

  /* ── CTA ── */
  .cta-section {
    position: relative; z-index: 1;
    margin: 0 40px 100px; border-radius: 24px;
    padding: 80px 60px;
    background: linear-gradient(135deg, rgba(79,82,232,.12) 0%, rgba(124,92,246,.08) 50%, rgba(56,189,248,.06) 100%);
    border: 1px solid rgba(99,102,241,.25);
    text-align: center; overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,.4), 0 8px 24px rgba(99,102,241,.15), inset 0 1px 0 rgba(255,255,255,.08);
  }
  .cta-section::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 70% at 50% -10%, rgba(99,102,241,.2), transparent 70%);
  }
  .cta-title {
    font-family: var(--font-head); font-size: clamp(26px, 4vw, 46px);
    font-weight: 800; letter-spacing: -.04em; color: var(--text-1); margin-bottom: 16px; position: relative;
  }
  .cta-sub { font-size: 17px; color: var(--text-2); margin-bottom: 36px; position: relative; line-height: 1.6; }
  .cta-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; position: relative; }
  .cta-checklist {
    display: flex; gap: 28px; justify-content: center; flex-wrap: wrap;
    margin-top: 28px; position: relative;
  }
  .cta-check-item {
    display: flex; align-items: center; gap: 8px;
    font-size: 13.5px; color: var(--text-2); font-weight: 500;
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

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .features-grid { grid-template-columns: 1fr 1fr; gap: 14px; }
    .flow-grid { grid-template-columns: 1fr 1fr; gap: 32px 20px; }
    .flow-connector { display: none; }
    .lbi-nav { padding: 0 20px; }
    .hero { padding: 120px 20px 80px; }
    .section { padding: 72px 20px; }
    .how-it-works-section { padding: 72px 20px; }
    .cta-section { margin: 0 20px 72px; padding: 56px 32px; }
    .preview-wrap { padding: 0 20px 80px; }
  }

  @media (max-width: 700px) {
    /* Show hamburger, hide desktop links */
    .lbi-nav-links { display: none; }
    .lbi-hamburger { display: flex; }

    .feature-strip { padding: 12px 20px; gap: 0; }
    .strip-item { padding: 4px 12px; font-size: 12px; }
  }

  @media (max-width: 600px) {
    .features-grid { grid-template-columns: 1fr; gap: 12px; }
    .flow-grid { grid-template-columns: 1fr; gap: 28px; }
    .flow-connector { display: none; }
    .lbi-footer { flex-direction: column; align-items: flex-start; }
    .hero-actions { flex-direction: column; width: 100%; }
    .btn-hero-primary, .btn-hero-secondary { width: 100%; justify-content: center; }
    .preview-wrap { padding: 0 16px 60px; }
    .cta-section { padding: 40px 24px; }
    .flow-num { width: 70px; height: 70px; }
    .flow-step-card { padding: 16px 14px; min-height: 120px; }
    .feature-cell { padding: 22px 18px; }
    .cta-checklist { gap: 14px; }

    /* Strip: hide on very small, or scroll */
    .feature-strip {
      overflow-x: auto; -webkit-overflow-scrolling: touch;
      flex-wrap: nowrap; justify-content: flex-start;
      scrollbar-width: none;
    }
    .feature-strip::-webkit-scrollbar { display: none; }
    .strip-item { flex-shrink: 0; border-right: 1px solid var(--border); }
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: <MessageSquare size={20} />, color: '#818cf8', bg: 'rgba(129,140,248,.12)', name: 'Natural language queries', desc: 'Ask questions in plain English. No SQL expertise needed — just type what you want to know and get exact answers.' },
  { icon: <Zap size={20} />, color: '#fbbf24', bg: 'rgba(251,191,36,.10)', name: 'Instant AI-powered SQL', desc: 'Gemini reads your schema and generates highly accurate PostgreSQL queries in milliseconds — with zero hallucinations.' },
  { icon: <BarChart2 size={20} />, color: '#34d399', bg: 'rgba(52,211,153,.10)', name: 'Beautiful visualizations', desc: 'Auto-generated Recharts dashboards with intelligent chart-type selection based on the shape of your data.' },
  { icon: <Database size={20} />, color: '#38bdf8', bg: 'rgba(56,189,248,.10)', name: 'Real PostgreSQL tables', desc: 'CSVs land in isolated PostgreSQL schemas — not flat file stores. Query with full SQL power and join across uploads.' },
  { icon: <Shield size={20} />, color: '#f472b6', bg: 'rgba(244,114,182,.10)', name: 'Enterprise-grade security', desc: "Row-level isolation, JWT auth, and encrypted keys. Your data never touches another tenant's tables." },
  { icon: <TrendingUp size={20} />, color: '#a78bfa', bg: 'rgba(167,139,250,.10)', name: 'Multi-provider AI engine', desc: 'Switch between Gemini, GPT-4o, Claude, or DeepSeek. Bring your own API key for unlimited queries.' },
];

const FLOW_STEPS = [
  { num: '01', icon: <Database size={22} />, color: '#818cf8', title: 'Upload your CSV', desc: 'Drop any CSV and we parse, type-infer, and load it into a dedicated PostgreSQL schema instantly.' },
  { num: '02', icon: <MessageSquare size={22} />, color: '#a78bfa', title: 'Ask in plain English', desc: 'Type your question naturally. We resolve it against your schema with zero ambiguity.' },
  { num: '03', icon: <Cpu size={22} />, color: '#38bdf8', title: 'AI generates SQL', desc: 'Gemini reads the schema context and returns precise PostgreSQL — validated before execution.' },
  { num: '04', icon: <BarChart2 size={22} />, color: '#34d399', title: 'Instant dashboard', desc: 'Results render as interactive charts, tables, or KPI cards — ready to share or export.' },
];

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────────── */
const Home = () => {
  const navigate = useNavigate();
  const revealRefs = useRef([]);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  /* ── Token-based redirect ── */
  const hasToken = Boolean(localStorage.getItem('token'));

  const handleAuthNav = (e, fallbackPath) => {
    if (hasToken) {
      e.preventDefault();
      navigate('/dashboard');
    }
    // else follow the <Link> / href naturally
    setMobileOpen(false);
  };

  /* ── Scroll reveal ── */
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

  /* ── Mouse glow for feature cards ── */
  const handleFeatureMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  /* ── Close drawer on outside click ── */
  useEffect(() => {
    if (!mobileOpen) return;
    const fn = (e) => {
      if (!e.target.closest('.lbi-nav') && !e.target.closest('.lbi-mobile-drawer')) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [mobileOpen]);

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

        {/* Desktop links */}
        <div className="lbi-nav-links">
          <a href="#features" className="btn-ghost">Features</a>
          <a href="#how-it-works" className="btn-ghost">How it works</a>
          <Link to="/login" className="btn-ghost" onClick={(e) => handleAuthNav(e, '/login')}>
            {hasToken ? 'Dashboard' : 'Log in'}
          </Link>
          <Link
            to={hasToken ? '/dashboard' : '/signup'}
            className="btn-cta"
            onClick={(e) => handleAuthNav(e, '/signup')}
          >
            {hasToken ? 'Go to Dashboard' : 'Start free'} <ChevronRight size={13} />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lbi-hamburger"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* ── Mobile drawer ── */}
      <div className={`lbi-mobile-drawer${mobileOpen ? ' open' : ''}`}>
        <a href="#features" className="drawer-link" onClick={() => setMobileOpen(false)}>Features</a>
        <a href="#how-it-works" className="drawer-link" onClick={() => setMobileOpen(false)}>How it works</a>
        <div className="drawer-divider" />
        <Link
          to="/login"
          className="drawer-link"
          onClick={(e) => handleAuthNav(e, '/login')}
        >
          {hasToken ? '→ Go to Dashboard' : 'Log in'}
        </Link>
        <Link
          to={hasToken ? '/dashboard' : '/signup'}
          className="drawer-cta"
          onClick={(e) => handleAuthNav(e, '/signup')}
        >
          {hasToken ? 'Open Dashboard' : 'Get started free'} <ChevronRight size={15} />
        </Link>
      </div>

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
          <Link
            to={hasToken ? '/dashboard' : '/signup'}
            className="btn-hero-primary"
            onClick={(e) => handleAuthNav(e, '/signup')}
          >
            {hasToken ? 'Go to Dashboard' : 'Get started free'} <ChevronRight size={16} />
          </Link>
          <Link
            to="/login"
            className="btn-hero-secondary"
            onClick={(e) => handleAuthNav(e, '/login')}
          >
            {hasToken ? 'Open Dashboard' : 'Sign in'} <ArrowRight size={15} />
          </Link>
        </div>

        <p className="hero-disclaimer anim-slide-up" style={{ animationDelay: '.30s' }}>
          {hasToken
            ? 'Welcome back! Your workspace is ready.'
            : 'No credit card required · Free tier forever · Setup in 30 seconds'
          }
        </p>
      </section>

      {/* ── STRIP ── */}
      <div className="feature-strip">
        {[
          { icon: <Check size={13} color="#34d399" />, text: 'Natural language to SQL' },
          { icon: <Check size={13} color="#34d399" />, text: 'Real PostgreSQL tables' },
          { icon: <Check size={13} color="#34d399" />, text: 'Multi-model AI support' },
          { icon: <Check size={13} color="#34d399" />, text: 'No SQL knowledge needed' },
          { icon: <Check size={13} color="#34d399" />, text: 'Free to start' },
        ].map(item => (
          <span key={item.text} className="strip-item">{item.icon}{item.text}</span>
        ))}
      </div>

      {/* ── DASHBOARD PREVIEW ── */}
      <div className="preview-wrap">
        <div className="preview-container">
          <div className="preview-glow" />
          <div className="preview-fade-top" />
          <div className="preview-inner">
            <DashboardPreview />
          </div>
          <div className="preview-fade-bottom" />
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="section">
        <span className="section-eyebrow reveal" ref={addReveal(0)}>Capabilities</span>
        <h2 className="section-title reveal" ref={addReveal(.05)}>Everything your data team<br />actually needs</h2>
        <p className="section-sub reveal" ref={addReveal(.08)}>Built for analysts who want answers in seconds, not dashboards that take weeks to configure.</p>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.name}
              className="feature-cell reveal"
              ref={addReveal(0.12 + i * .04)}
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
      <section id="how-it-works" className="how-it-works-section">
        <span className="section-eyebrow reveal" ref={addReveal(0)}>How it works</span>
        <h2 className="section-title reveal" ref={addReveal(.05)}>From CSV to chart in under 10 seconds</h2>
        <p className="section-sub reveal" ref={addReveal(.08)}>A high-accuracy pipeline built on real PostgreSQL — not in-memory lookups or flat-file hacks.</p>

        <div className="flow-grid">
          <div className="flow-connector">
            <div className="flow-connector-line" />
          </div>
          {FLOW_STEPS.map((s, i) => (
            <div key={s.num} className="flow-step reveal" ref={addReveal(0.12 + i * .05)}>
              <div className="flow-num-wrapper">
                <div className="flow-num-glow" style={{ background: s.color }} />
                <div className="flow-num" style={{ borderColor: s.color }}>
                  <span className="flow-num-text" style={{ color: s.color }}>{s.num}</span>
                  <div style={{ color: s.color }}>{s.icon}</div>
                </div>
              </div>
              <div className="flow-step-card">
                <p className="flow-step-title">{s.title}</p>
                <p className="flow-step-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="cta-section reveal" ref={addReveal(0)}>
        <h2 className="cta-title">Ready to talk to your data?</h2>
        <p className="cta-sub">Stop waiting on dashboards. Start getting answers from your data today.</p>
        <div className="cta-actions">
          <Link
            to={hasToken ? '/dashboard' : '/signup'}
            className="btn-hero-primary"
            onClick={(e) => handleAuthNav(e, '/signup')}
          >
            {hasToken ? 'Open Dashboard' : 'Start for free'} <ChevronRight size={16} />
          </Link>
        </div>
        <div className="cta-checklist">
          {['No credit card', 'Free tier forever', '30-second setup', 'Cancel anytime'].map(item => (
            <span key={item} className="cta-check-item">
              <Check size={13} color="#34d399" /> {item}
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