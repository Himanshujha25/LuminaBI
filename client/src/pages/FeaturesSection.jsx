import React, { useEffect, useRef, useState } from 'react';
import {
  MessageSquare, BarChart2, UploadCloud,
  Zap, Shield, LayoutDashboard
} from 'lucide-react';
import './FeaturesSection.css';

const FEATURES = [
  {
    icon: <MessageSquare size={22} />,
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    glow: 'rgba(59,130,246,0.25)',
    title: 'Conversational AI',
    desc: 'Ask questions in plain English and get instant, accurate answers from your data.',
  },
  {
    icon: <BarChart2 size={22} />,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
    glow: 'rgba(139,92,246,0.25)',
    title: 'Dynamic Charts',
    desc: 'Auto-renders Bar, Line, Area, and Pie charts perfectly matched to your query.',
  },
  {
    icon: <UploadCloud size={22} />,
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    glow: 'rgba(6,182,212,0.25)',
    title: 'Instant CSV Upload',
    desc: 'Drop any CSV and it\'s ingested into a live PostgreSQL table in seconds.',
  },
  {
    icon: <Zap size={22} />,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    glow: 'rgba(245,158,11,0.25)',
    title: 'Zero-Latency Queries',
    desc: 'Indexed schemas and optimised SQL execution deliver results under 300ms.',
  },
  {
    icon: <Shield size={22} />,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    glow: 'rgba(16,185,129,0.25)',
    title: 'Enterprise Accuracy',
    desc: 'Schema-aware prompts eliminate hallucinations for business-grade reliability.',
  },
  {
    icon: <LayoutDashboard size={22} />,
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    glow: 'rgba(236,72,153,0.25)',
    title: 'Pinnable Dashboards',
    desc: 'Pin any insight to your executive board and export as PDF in one click.',
  },
];

const FeaturesSection = () => {
  const [visible, setVisible] = useState([]);
  const cardRefs = useRef([]);

  useEffect(() => {
    const observers = cardRefs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(prev => [...new Set([...prev, i])]);
            obs.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  return (
    <section className="features-section">
      {/* Section header */}
      <div className="fs-header">
        <span className="fs-eyebrow">Everything you need</span>
        <h2 className="fs-title">
          Built for modern <span className="fs-gradient-text">data teams</span>
        </h2>
        <p className="fs-subtitle">
          From raw CSV to boardroom-ready insights — no SQL, no code, no waiting.
        </p>
      </div>

      {/* Cards grid */}
      <div className="fs-grid">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            ref={el => (cardRefs.current[i] = el)}
            className={`fs-card${visible.includes(i) ? ' fs-card--visible' : ''}`}
            style={{ '--glow': f.glow, '--delay': `${i * 0.08}s` }}
          >
            {/* Top accent line */}
            <div className="fs-card-accent" style={{ background: f.gradient }} />

            {/* Icon */}
            <div className="fs-icon-wrap" style={{ background: f.gradient }}>
              <span className="fs-icon" style={{ color: '#fff' }}>{f.icon}</span>
            </div>

            {/* Text */}
            <h3 className="fs-card-title">{f.title}</h3>
            <p className="fs-card-desc">{f.desc}</p>

            {/* Hover glow overlay */}
            <div className="fs-card-glow" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
