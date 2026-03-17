import React from 'react';

const ACCENT_COLORS = {
  records: { accent: "#6366f1", icon: "#6366f1", bg: "rgba(99, 102, 241, 0.08)" },
  total:   { accent: "#a855f7", icon: "#a855f7", bg: "rgba(168, 85, 247, 0.08)" },
  avg:     { accent: "#0ea5e9", icon: "#0ea5e9", bg: "rgba(14, 165, 233, 0.08)" },
  max:     { accent: "#10b981", icon: "#10b981", bg: "rgba(16, 185, 129, 0.08)" },
};

// Compact number formatter
function fmt(n) {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.?0+$/, "")   + "K";
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

// ── Icons (Lucide-like style but lightweight) ──
const IconDatabase = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
  </svg>
);

const IconActivity = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const IconBar = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const IconTrend = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

function KpiCard({ accentColor, bgColor, icon, label, value, sub, delay }) {
  return (
    <div 
        className="premium-kpi-card" 
        style={{ 
            animationDelay: `${delay}ms`,
            borderColor: 'var(--border-color)',
            background: 'var(--surface-color)',
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
    >
      {/* Decorative background glow */}
      <div style={{
          position: "absolute",
          top: "-10px",
          right: "-10px",
          width: "60px",
          height: "60px",
          background: accentColor,
          opacity: 0.05,
          filter: "blur(20px)",
          borderRadius: "50%"
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
        }}>
            {label}
        </div>
        <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            backgroundColor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {icon}
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div style={{
            fontSize: "32px",
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
            fontFamily: "'Inter', sans-serif"
        }}>{value}</div>
        {sub && (
            <div style={{
                fontSize: "11px",
                color: "var(--text-tertiary)",
                marginTop: "6px",
                fontWeight: 500,
                opacity: 0.8
            }}>{sub}</div>
        )}
      </div>

      {/* Bottom accent glow */}
      <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${accentColor}, transparent)`
      }} />
    </div>
  );
}

export default function KpiCards({ data, isNumeric, numericKey, total, max }) {
  const avg = data.length > 0 ? total / data.length : 0;
  const c = ACCENT_COLORS;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "20px",
      padding: "8px 0",
      animation: "premiumFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
    }}>
      <KpiCard
        accentColor={c.records.accent}
        bgColor={c.records.bg}
        icon={<IconDatabase color={c.records.icon} />}
        label="Total Records"
        value={data.length.toLocaleString()}
        sub="Processed Data Nodes"
        delay={0}
      />

      {isNumeric && (
        <>
          <KpiCard
            accentColor={c.total.accent}
            bgColor={c.total.bg}
            icon={<IconActivity color={c.total.icon} />}
            label="Cumulative Value"
            value={fmt(total)}
            sub={`Sum of ${numericKey}`}
            delay={100}
          />

          <KpiCard
            accentColor={c.avg.accent}
            bgColor={c.avg.bg}
            icon={<IconBar color={c.avg.icon} />}
            label="Statistical Mean"
            value={fmt(avg)}
            sub="Per record distribution"
            delay={200}
          />

          {max !== -Infinity && (
            <KpiCard
              accentColor={c.max.accent}
              bgColor={c.max.bg}
              icon={<IconTrend color={c.max.icon} />}
              label="Peak Performance"
              value={fmt(max)}
              sub="Highest identified value"
              delay={300}
            />
          )}
        </>
      )}

      <style>{`
        @keyframes premiumFadeIn { 
            from { opacity: 0; transform: translateY(12px); } 
            to { opacity: 1; transform: translateY(0); } 
        }
        .premium-kpi-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-lg);
            border-color: var(--accent-blue) !important;
        }
      `}</style>
    </div>
  );
}
