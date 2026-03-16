import React from 'react';

const ACCENT_COLORS = {
  records: { accent: "#6366f1", icon: "#6366f1" },
  total:   { accent: "#8b5cf6", icon: "#8b5cf6" },
  avg:     { accent: "#0ea5e9", icon: "#0ea5e9" },
  max:     { accent: "#10b981", icon: "#10b981" },
};

// Compact number formatter  e.g. 1_400_000 → "1.4M"
function fmt(n) {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.?0+$/, "")   + "K";
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

// ── Icons ────────────────────────────────────────────────────────────
const IconDatabase = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
  </svg>
);

const IconActivity = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const IconBar = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
  </svg>
);

const IconTrend = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

// ── KPI Card ──────────────────────────────────────────────────────────
const cardStyle = {
  background: "var(--surface-color, #fff)",
  border: "1px solid var(--border-color)",
  borderRadius: "12px",
  padding: "18px 20px 16px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  position: "relative",
  overflow: "hidden",
  transition: "border-color 0.2s",
  boxShadow: "var(--shadow-sm)",
};

const labelStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const valueStyle = {
  fontFamily: "'DM Mono', 'Fira Mono', monospace",
  fontSize: "26px",
  fontWeight: 700,
  color: "var(--text-primary)",
  lineHeight: 1,
  letterSpacing: "-0.02em",
};

const subStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "11px",
  color: "var(--text-tertiary)",
  marginTop: "3px",
};

function KpiCard({ accentColor, icon, label, value, sub }) {
  return (
    <div style={cardStyle} className="premium-kpi-card hover:border-indigo-500/50">
      {/* left accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: "3px", height: "100%",
        background: accentColor,
        borderRadius: "3px 0 0 3px",
      }} />

      <div style={labelStyle}>
        {icon}
        {label}
      </div>

      <div>
        <div style={valueStyle}>{value}</div>
        {sub && <div style={subStyle}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────
export default function KpiCards({ data, isNumeric, numericKey, total, max }) {
  const avg = data.length > 0 ? total / data.length : 0;
  const c = ACCENT_COLORS;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "14px",
      padding: "4px 3px",
      animation: "fadeIn 0.3s ease",
    }}>
      {/* Records — always shown */}
      <KpiCard
        accentColor={c.records.accent}
        icon={<IconDatabase color={c.records.icon} />}
        label="Records"
        value={data.length.toLocaleString()}
        sub="total rows"
      />

      {isNumeric && (
        <>
          <KpiCard
            accentColor={c.total.accent}
            icon={<IconActivity color={c.total.icon} />}
            label="Total"
            value={fmt(total)}
            sub={`sum of ${numericKey}`}
          />

          <KpiCard
            accentColor={c.avg.accent}
            icon={<IconBar color={c.avg.icon} />}
            label="Average"
            value={fmt(avg)}
            sub="per record"
          />

          {max !== -Infinity && (
            <KpiCard
              accentColor={c.max.accent}
              icon={<IconTrend color={c.max.icon} />}
              label="Maximum"
              value={fmt(max)}
              sub="highest value"
            />
          )}
        </>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
