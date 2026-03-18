import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const chartData = [
  { month: 'Jan', value: 400 },
  { month: 'Feb', value: 700 },
  { month: 'Mar', value: 300 },
  { month: 'Apr', value: 900 },
];

const BAR_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

const stats = [
  { label: 'Revenue', value: '₹45,000' },
  { label: 'Users', value: '1,200' },
  { label: 'Growth', value: '+12%' },
];

const DashboardPreview = () => (
  <div className="dashboard-preview-card">
    <div className="dp-header">
      <span className="dp-title">Sales Dashboard</span>
      <span className="dp-live-dot" />
    </div>

    <div className="dp-stats">
      {stats.map((s) => (
        <div key={s.label} className="dp-stat-box">
          <span className="dp-stat-value">{s.value}</span>
          <span className="dp-stat-label">{s.label}</span>
        </div>
      ))}
    </div>

    <div className="dp-chart">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} barSize={28} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13 }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={900}>
            {chartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default DashboardPreview;
