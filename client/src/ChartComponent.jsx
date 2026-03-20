import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

/* ── Palette ─────────────────────────────────────────────────────────────── */
const PALETTE = [
  ['#6366f1', '#818cf8'],
  ['#0ea5e9', '#38bdf8'],
  ['#10b981', '#34d399'],
  ['#f59e0b', '#fbbf24'],
  ['#ef4444', '#f87171'],
  ['#ec4899', '#f472b6'],
  ['#8b5cf6', '#a78bfa'],
  ['#14b8a6', '#2dd4bf'],
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = v => {
  if (typeof v !== 'number') return v;
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(v);
};

const trunc = (s, n = 12) => {
  const str = String(s ?? '');
  return str.length > n ? str.slice(0, n) + '…' : str;
};

/* ── Custom tooltip ──────────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null;
  const bg  = isDark ? 'rgba(15,23,42,.97)' : 'rgba(255,255,255,.97)';
  const bdr = isDark ? '#374151'             : '#e2e8f0';
  const tx1 = isDark ? '#f9fafb'             : '#0f172a';
  const tx2 = isDark ? '#9ca3af'             : '#64748b';
  return (
    <div style={{
      background: bg, border: `1px solid ${bdr}`, borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 10px 30px rgba(0,0,0,.2)',
      backdropFilter: 'blur(8px)', minWidth: 120,
    }}>
      {label !== undefined && (
        <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: tx2, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {String(label)}
        </p>
      )}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: i > 0 ? 4 : 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: tx1 }}>{fmt(p.value)}</span>
          <span style={{ fontSize: 11, color: tx2 }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Custom legend ───────────────────────────────────────────────────────── */
function CustomLegend({ payload, isDark }) {
  if (!payload?.length) return null;
  const tx = isDark ? '#9ca3af' : '#64748b';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center', paddingTop: 10 }}>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: tx }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
function DynamicChartComponent({ config, overrideChartType, compact = false, exportWidth = null }) {
  const containerRef = React.useRef(null);
  const rafRef       = React.useRef(null);

  /*
   * KEY FIX: initial state is null, not a fallback 400px.
   * We only render the chart once we have a real measurement.
   * This eliminates the "wrong size on first render" bug entirely.
   */
  const [dims, setDims] = React.useState(null);

  /* Detect dark mode from DOM */
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    || document.documentElement.classList.contains('dark');

  /* Measure the container ─────────────────────────────────────────────── */
  const measure = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width > 10) {
      setDims({ w: Math.floor(width), h: Math.floor(height) || (compact ? 220 : 420) });
    }
  }, [compact]);

  React.useEffect(() => {
    if (!containerRef.current) return;

    /* 1. Measure immediately */
    measure();

    /* 2. Also measure after next paint (parent flex may not have settled yet) */
    rafRef.current = requestAnimationFrame(() => {
      measure();
      /* 3. One more time after 120ms for slow layouts / sidebar animations */
      setTimeout(measure, 120);
    });

    /* 4. ResizeObserver for ongoing resizes */
    const ob = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    });
    ob.observe(containerRef.current);

    /* 5. Also listen to the global resize event (e.g. sidebar open/close) */
    window.addEventListener('resize', measure);

    return () => {
      ob.disconnect();
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(rafRef.current);
    };
  }, [measure]);

  /* Data prep ─────────────────────────────────────────────────────────── */
  const instanceId = React.useId().replace(/:/g, '');

  const noData = !config?.data?.length;

  const { chart_type, x_axis_column, y_axis_column, data = [] } = config || {};
  const actualType = (overrideChartType || chart_type || 'bar').toLowerCase();

  const keys     = Object.keys(data[0] || {});
  const safeXKey = keys.find(k => k.toLowerCase() === x_axis_column?.toLowerCase()) || x_axis_column || keys[0];

  const findY = () => {
    const m = keys.find(k => k.toLowerCase() === y_axis_column?.toLowerCase());
    if (m) return m;
    for (const k of keys) {
      if (k === safeXKey) continue;
      const v = data[0]?.[k];
      if (!isNaN(parseFloat(v)) && isFinite(Number(v))) return k;
    }
    return keys[1] || keys[0];
  };
  const safeYKey = findY();

  const chartData = data
    .filter(d => { const v = d[safeXKey]; return v !== null && v !== undefined && String(v).trim() !== ''; })
    .slice(0, 200)
    .map(d => {
      const raw = d[safeYKey];
      const val = parseFloat(String(raw).replace(/,/g, ''));
      return { ...d, [safeYKey]: isNaN(val) ? 0 : val };
    });

  /* Dimensions ─────────────────────────────────────────────────────────── */
  const W = exportWidth || dims?.w || 0;
  const H = compact ? 220 : (dims?.h || 420);

  const isSmall    = compact || W < 400;
  const isVerySmall = W < 260;
  const n          = chartData.length;

  /* Axis config */
  const xInterval = isVerySmall
    ? Math.max(0, Math.ceil(n / 3) - 1)
    : isSmall
      ? Math.max(0, Math.ceil(n / 5) - 1)
      : n > 30 ? Math.ceil(n / 10) - 1 : n > 15 ? Math.ceil(n / 8) - 1 : 0;

  const xAngle    = (isSmall || n > 8) ? -38 : 0;
  const xAnchor   = xAngle !== 0 ? 'end' : 'middle';
  const xHeight   = xAngle !== 0 ? 60 : 28;
  const tickSz    = isSmall ? 10 : 11;
  const maxLbl    = isSmall ? 8 : 14;

  const tickColor = isDark ? '#9ca3af' : '#64748b';

  const xProps = {
    dataKey: safeXKey, axisLine: false, tickLine: false,
    tick: { fill: tickColor, fontSize: tickSz, fontWeight: 500 },
    interval: xInterval, angle: xAngle, textAnchor: xAnchor,
    height: xHeight, tickFormatter: v => trunc(String(v ?? ''), maxLbl),
  };
  const yProps = {
    axisLine: false, tickLine: false,
    tick: { fill: tickColor, fontSize: tickSz, fontWeight: 500 },
    tickFormatter: fmt, width: isSmall ? 38 : 56,
  };

  const gridColor  = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const margins    = isSmall
    ? { top: 8, right: 10, left: 0, bottom: 6 }
    : { top: 14, right: 18, left: 4, bottom: 6 };

  const tooltipProps = {
    content: <CustomTooltip isDark={isDark} />,
    cursor: { fill: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)' },
  };

  const legendProps = { content: <CustomLegend isDark={isDark} /> };

  /* Gradient defs shared across charts */
  const Defs = () => (
    <defs>
      {PALETTE.map(([c1, c2], i) => (
        <React.Fragment key={i}>
          <linearGradient id={`gH-${instanceId}-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={c1} stopOpacity={0.95}/>
            <stop offset="100%" stopColor={c2} stopOpacity={0.45}/>
          </linearGradient>
          <linearGradient id={`gA-${instanceId}-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={c1} stopOpacity={0.6}/>
            <stop offset="100%" stopColor={c1} stopOpacity={0.03}/>
          </linearGradient>
          <linearGradient id={`gL-${instanceId}-${i}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={c1} stopOpacity={1}/>
            <stop offset="100%" stopColor={c2} stopOpacity={1}/>
          </linearGradient>
        </React.Fragment>
      ))}
    </defs>
  );

  /* ── Render per type ───────────────────────────────────────────────── */
  const renderChart = () => {
    switch (actualType) {

      case 'line':
        return (
          <LineChart width={W} height={H} data={chartData} margin={margins}>
            <Defs/>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
            <XAxis {...xProps}/>
            <YAxis {...yProps}/>
            <Tooltip {...tooltipProps}/>
            <Legend {...legendProps}/>
            <Line
              isAnimationActive={false}
              type="monotone" dataKey={safeYKey}
              stroke={`url(#gL-${instanceId}-0)`}
              strokeWidth={2.5}
              dot={{ r: 3, fill: PALETTE[0][0], strokeWidth: 0 }}
              activeDot={{ r: 5, fill: PALETTE[0][0] }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart width={W} height={H} data={chartData} margin={margins}>
            <Defs/>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
            <XAxis {...xProps}/>
            <YAxis {...yProps}/>
            <Tooltip {...tooltipProps}/>
            <Legend {...legendProps}/>
            <Area
              isAnimationActive={false}
              type="monotone" dataKey={safeYKey}
              stroke={PALETTE[0][0]}
              fill={`url(#gA-${instanceId}-0)`}
              strokeWidth={2.5} fillOpacity={1}
            />
          </AreaChart>
        );

      case 'scatter':
        return (
          <ScatterChart width={W} height={H} margin={margins}>
            <Defs/>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
            <XAxis {...xProps} name={safeXKey}/>
            <YAxis {...yProps} dataKey={safeYKey} name={safeYKey}/>
            <Tooltip {...tooltipProps} cursor={{ strokeDasharray: '3 3' }}/>
            <Scatter isAnimationActive={false} name={safeYKey} data={chartData} fill={PALETTE[4][0]}/>
          </ScatterChart>
        );

      case 'pie': {
        const outerR = isSmall ? 80 : Math.min(W * .38, H * .38, 140);
        const innerR = outerR * 0.58;
        return (
          <PieChart width={W} height={H} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Defs/>
            <Tooltip {...tooltipProps} cursor={false}/>
            <Legend {...legendProps}/>
            <Pie
              isAnimationActive={false}
              data={chartData}
              dataKey={safeYKey} nameKey={safeXKey}
              cx="50%" cy="48%"
              outerRadius={outerR} innerRadius={innerR}
              paddingAngle={3} strokeWidth={0}
            >
              {chartData.map((_, i) => (
                <Cell key={i}
                  fill={`url(#gH-${instanceId}-${i % PALETTE.length})`}
                  style={{ outline: 'none' }}
                />
              ))}
            </Pie>
          </PieChart>
        );
      }

      case 'bar':
      default:
        return (
          <BarChart width={W} height={H} data={chartData} margin={margins}>
            <Defs/>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
            <XAxis {...xProps}/>
            <YAxis {...yProps}/>
            <Tooltip {...tooltipProps}/>
            <Legend {...legendProps}/>
            <Bar
              isAnimationActive={false}
              dataKey={safeYKey}
              fill={`url(#gH-${instanceId}-0)`}
              radius={[5, 5, 0, 0]}
              maxBarSize={isSmall ? 40 : 100}
              barCategoryGap="18%"
            />
          </BarChart>
        );
    }
  };

  /* ── Empty / loading states ─────────────────────────────────────────── */
  const emptyStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', height: '100%', minHeight: compact ? 220 : 300,
    color: isDark ? '#4b5563' : '#94a3b8',
    fontSize: 13, fontWeight: 500,
  };

  if (noData) {
    return <div style={emptyStyle}>No data to display.</div>;
  }

  /* Show a subtle pulse while we wait for the first measurement */
  if (!dims || W < 10) {
    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: compact ? 220 : 300 }}>
        <div style={{
          ...emptyStyle,
          background: isDark
            ? 'linear-gradient(90deg,rgba(255,255,255,.03) 25%,rgba(255,255,255,.06) 50%,rgba(255,255,255,.03) 75%)'
            : 'linear-gradient(90deg,rgba(0,0,0,.03) 25%,rgba(0,0,0,.06) 50%,rgba(0,0,0,.03) 75%)',
          backgroundSize: '200% 100%',
          animation: 'chartShimmer 1.2s infinite',
          borderRadius: 8,
        }}>
          <style>{`@keyframes chartShimmer{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: compact ? 220 : 300 }}
    >
      {renderChart()}
    </div>
  );
}

export default DynamicChartComponent;