import React, { useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity, ArrowUpRight, Sparkles } from 'lucide-react';

const chartData = [
  { month: 'Jan', revenue: 45000, users: 1200, growth: 8 },
  { month: 'Feb', revenue: 52000, users: 1450, growth: 12 },
  { month: 'Mar', revenue: 48000, users: 1380, growth: 10 },
  { month: 'Apr', revenue: 61000, users: 1680, growth: 15 },
  { month: 'May', revenue: 58000, users: 1590, growth: 13 },
  { month: 'Jun', revenue: 67000, users: 1820, growth: 18 },
];

const stats = [
  { label: 'Total Revenue', value: '₹3.31L', change: '+18%', icon: <DollarSign size={18} />, color: '#6366f1', bg: 'rgba(99,102,241,.12)' },
  { label: 'Active Users', value: '1,820', change: '+12%', icon: <Users size={18} />, color: '#8b5cf6', bg: 'rgba(139,92,246,.12)' },
  { label: 'Avg Growth', value: '12.7%', change: '+3.2%', icon: <TrendingUp size={18} />, color: '#38bdf8', bg: 'rgba(56,189,248,.12)' },
  { label: 'Engagement', value: '94.2%', change: '+5.1%', icon: <Activity size={18} />, color: '#34d399', bg: 'rgba(52,211,153,.12)' },
];

const STYLES = `
  .dashboard-preview-card {
    background: linear-gradient(135deg, #0f1629 0%, #0b0f19 100%);
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,.08);
    padding: 0;
    position: relative;
    overflow: hidden;
    box-shadow: 
      0 20px 60px rgba(0,0,0,.5),
      0 8px 24px rgba(0,0,0,.3),
      0 0 0 1px rgba(255,255,255,.05),
      inset 0 1px 0 rgba(255,255,255,.08);
    transition: all .4s cubic-bezier(.22,1,.36,1);
  }

  .dashboard-preview-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle 300px at var(--mouse-x, 50%) var(--mouse-y, 50%),
      rgba(90,95,255,.12),
      transparent 70%
    );
    opacity: 0;
    transition: opacity .4s;
    pointer-events: none;
    z-index: 1;
  }

  .dashboard-preview-card:hover::before {
    opacity: 1;
  }

  .dashboard-preview-card:hover {
    box-shadow: 
      0 28px 75px rgba(0,0,0,.6),
      0 12px 32px rgba(99,102,241,.2),
      0 0 0 1px rgba(255,255,255,.1),
      inset 0 1px 0 rgba(255,255,255,.12);
    border-color: rgba(99,102,241,.2);
  }

  .dp-bg-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
    background-size: 32px 32px;
    opacity: .6;
    mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, black 40%, transparent 100%);
  }

  .dp-glow {
    position: absolute;
    top: -120px;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 400px;
    background: radial-gradient(circle, rgba(99,102,241,.2), rgba(139,92,246,.15) 40%, transparent 70%);
    filter: blur(100px);
    pointer-events: none;
    animation: glow-pulse 4s ease-in-out infinite;
  }

  @keyframes glow-pulse {
    0%, 100% { opacity: .6; transform: translateX(-50%) scale(1); }
    50% { opacity: .8; transform: translateX(-50%) scale(1.05); }
  }

  .dp-content {
    position: relative;
    z-index: 1;
    padding: 24px 28px 28px 28px;
  }

  .dp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,.08);
  }

  .dp-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dp-icon-box {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 
      0 0 0 1px rgba(255,255,255,.15),
      0 8px 20px rgba(99,102,241,.4),
      inset 0 1px 0 rgba(255,255,255,.2);
    transition: all .3s cubic-bezier(.22,1,.36,1);
  }

  .dashboard-preview-card:hover .dp-icon-box {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 
      0 0 0 1px rgba(255,255,255,.2),
      0 12px 28px rgba(99,102,241,.5),
      inset 0 1px 0 rgba(255,255,255,.3);
  }

  .dp-title-group {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .dp-title {
    font-size: 16px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: -.02em;
  }

  .dp-subtitle {
    font-size: 12px;
    color: rgba(255,255,255,.4);
    font-weight: 500;
  }

  .dp-live-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    background: rgba(52,211,153,.15);
    border: 1px solid rgba(52,211,153,.3);
    font-size: 11px;
    font-weight: 600;
    color: #34d399;
    box-shadow: 0 4px 12px rgba(52,211,153,.2), inset 0 1px 0 rgba(255,255,255,.1);
    transition: all .3s;
  }

  .dashboard-preview-card:hover .dp-live-badge {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(52,211,153,.3), inset 0 1px 0 rgba(255,255,255,.15);
  }

  .dp-live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 8px rgba(52,211,153,.6);
    animation: pulse-dot 2s ease infinite;
  }

  .dp-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 20px;
  }

  .dp-stat-box {
    background: linear-gradient(135deg, rgba(255,255,255,.05) 0%, rgba(255,255,255,.02) 100%);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 12px;
    padding: 16px 14px;
    transition: all .3s cubic-bezier(.22,1,.36,1);
    position: relative;
    overflow: hidden;
    box-shadow: 
      0 4px 12px rgba(0,0,0,.2),
      inset 0 1px 0 rgba(255,255,255,.06);
  }

  .dp-stat-box::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 0%, rgba(99,102,241,.12), transparent 70%);
    opacity: 0;
    transition: opacity .3s;
  }

  .dp-stat-box:hover::before {
    opacity: 1;
  }

  .dp-stat-box:hover {
    border-color: rgba(255,255,255,.15);
    transform: translateY(-4px) scale(1.02);
    box-shadow: 
      0 12px 28px rgba(0,0,0,.3),
      0 4px 12px rgba(99,102,241,.2),
      inset 0 1px 0 rgba(255,255,255,.1);
  }

  .dp-stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    position: relative;
  }

  .dp-stat-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.1);
    transition: all .3s;
  }

  .dp-stat-box:hover .dp-stat-icon {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 6px 16px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.15);
  }

  .dp-stat-change {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
    color: #34d399;
    padding: 3px 7px;
    border-radius: 6px;
    background: rgba(52,211,153,.12);
    border: 1px solid rgba(52,211,153,.2);
  }

  .dp-stat-value {
    font-size: 22px;
    font-weight: 800;
    color: #f1f5f9;
    letter-spacing: -.03em;
    margin-bottom: 4px;
    display: block;
    position: relative;
    text-shadow: 0 2px 8px rgba(0,0,0,.3);
  }

  .dp-stat-label {
    font-size: 11px;
    color: rgba(255,255,255,.45);
    font-weight: 500;
    position: relative;
  }

  .dp-charts-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 14px;
  }

  .dp-chart-card {
    background: linear-gradient(135deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.02) 100%);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 12px;
    padding: 18px;
    position: relative;
    overflow: hidden;
    box-shadow: 
      0 4px 12px rgba(0,0,0,.2),
      inset 0 1px 0 rgba(255,255,255,.06);
    transition: all .3s cubic-bezier(.22,1,.36,1);
  }

  .dp-chart-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 0%, rgba(99,102,241,.08), transparent 60%);
    opacity: 0;
    transition: opacity .3s;
  }

  .dp-chart-card:hover::before {
    opacity: 1;
  }

  .dp-chart-card:hover {
    border-color: rgba(255,255,255,.15);
    transform: translateY(-3px);
    box-shadow: 
      0 12px 28px rgba(0,0,0,.3),
      0 4px 12px rgba(99,102,241,.15),
      inset 0 1px 0 rgba(255,255,255,.1);
  }

  .dp-chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .dp-chart-title {
    font-size: 13px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: -.01em;
  }

  .dp-chart-badge {
    font-size: 10px;
    font-weight: 600;
    color: rgba(255,255,255,.4);
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.08);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
  }

  .dp-chart {
    height: 180px;
    position: relative;
  }

  @media (max-width: 900px) {
    .dp-stats {
      grid-template-columns: repeat(2, 1fr);
    }
    .dp-charts-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .dp-content {
      padding: 20px;
    }
    .dp-stats {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .dp-stat-box {
      padding: 12px;
    }
  }
`;

const DashboardPreview = () => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--mouse-x', `${x}%`);
    cardRef.current.style.setProperty('--mouse-y', `${y}%`);
  };

  return (
  <>
    <style>{STYLES}</style>
    <div 
      ref={cardRef}
      className="dashboard-preview-card"
      onMouseMove={handleMouseMove}
    >
      <div className="dp-bg-grid" />
      <div className="dp-glow" />
      
      <div className="dp-content">
        <div className="dp-header">
          <div className="dp-header-left">
            <div className="dp-icon-box">
              <Sparkles size={18} color="#fff" />
            </div>
            <div className="dp-title-group">
              <span className="dp-title">Analytics Dashboard</span>
              <span className="dp-subtitle">Real-time business metrics</span>
            </div>
          </div>
          <div className="dp-live-badge">
            <span className="dp-live-dot" />
            Live
          </div>
        </div>

        <div className="dp-stats">
          {stats.map((s) => (
            <div key={s.label} className="dp-stat-box">
              <div className="dp-stat-header">
                <div className="dp-stat-icon" style={{ background: s.bg }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <span className="dp-stat-change">
                  <ArrowUpRight size={11} />
                  {s.change}
                </span>
              </div>
              <span className="dp-stat-value">{s.value}</span>
              <span className="dp-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="dp-charts-grid">
          <div className="dp-chart-card">
            <div className="dp-chart-header">
              <span className="dp-chart-title">Revenue Trend</span>
              <span className="dp-chart-badge">6 MONTHS</span>
            </div>
            <div className="dp-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,.35)' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,.35)' }}
                    tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    cursor={{ stroke: 'rgba(99,102,241,.3)', strokeWidth: 1 }}
                    contentStyle={{ 
                      background: '#0e1120', 
                      border: '1px solid rgba(255,255,255,.1)', 
                      borderRadius: 8, 
                      fontSize: 12,
                      color: '#f1f5f9'
                    }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    fill="url(#colorRevenue)" 
                    isAnimationActive 
                    animationDuration={1200}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dp-chart-card">
            <div className="dp-chart-header">
              <span className="dp-chart-title">Growth Rate</span>
              <span className="dp-chart-badge">%</span>
            </div>
            <div className="dp-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,.35)' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,.35)' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ 
                      background: '#0e1120', 
                      border: '1px solid rgba(255,255,255,.1)', 
                      borderRadius: 8, 
                      fontSize: 12,
                      color: '#f1f5f9'
                    }}
                    formatter={(value) => [`${value}%`, 'Growth']}
                  />
                  <Bar 
                    dataKey="growth" 
                    radius={[6, 6, 0, 0]} 
                    fill="#8b5cf6"
                    isAnimationActive 
                    animationDuration={1200}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);
};

export default DashboardPreview;