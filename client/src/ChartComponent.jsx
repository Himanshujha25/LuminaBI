import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend 
} from "recharts";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const formatNumber = (num) => {
  if (typeof num !== 'number') return num;
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US').format(num);
};

// Truncate long labels for X-axis
const truncateLabel = (label, maxLen = 10) => {
  if (typeof label !== 'string') return label;
  return label.length > maxLen ? label.slice(0, maxLen) + '…' : label;
};

// Custom X-axis tick that truncates and rotates
const CustomXTick = ({ x, y, payload, angle = -35, maxLen = 10 }) => {
  const label = truncateLabel(String(payload?.value ?? ''), maxLen);
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0} y={0} dy={10}
        textAnchor="end"
        fill="var(--text-tertiary)"
        fontSize={11}
        transform={`rotate(${angle})`}
      >
        {label}
      </text>
    </g>
  );
};

function DynamicChartComponent({ config, overrideChartType, compact = false }) {
  const containerRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(400);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w) setContainerWidth(w);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const instanceId = React.useId().replace(/:/g, "");

  if (!config || !config.data || config.data.length === 0)
    return <p style={{ color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>No data to display.</p>;

  const { chart_type, x_axis_column, y_axis_column, data } = config;
  const actualChartType = overrideChartType || chart_type || 'bar';

  const availableKeys = Object.keys(data[0] || {});
  const safeXKey = availableKeys.find(k => k.toLowerCase() === x_axis_column?.toLowerCase()) || x_axis_column || availableKeys[0];

  const findNumericKey = () => {
    const match = availableKeys.find(k => k.toLowerCase() === y_axis_column?.toLowerCase());
    if (match) return match;
    for (const key of availableKeys) {
      if (key === safeXKey) continue;
      const val = data[0]?.[key];
      if (!isNaN(parseFloat(val)) && isFinite(val)) return key;
    }
    return availableKeys[1] || availableKeys[0];
  };

  const safeYKey = findNumericKey();
  const chartData = data.slice(0, 200).map(d => {
    const rawVal = d[safeYKey];
    const parsedVal = parseFloat(rawVal);
    return { ...d, [safeYKey]: isNaN(parsedVal) ? 0 : parsedVal };
  });

  // Decide how many labels to show based on container width + data count
  const isSmall = compact || containerWidth < 380 || isMobile;
  const isVerySmall = containerWidth < 260;
  const dataCount = chartData.length;

  // interval = skip every N ticks
  const xInterval = (() => {
    if (isVerySmall) return Math.ceil(dataCount / 3) - 1;
    if (isSmall) return Math.ceil(dataCount / 5) - 1;
    if (dataCount > 30) return Math.ceil(dataCount / 10) - 1;
    if (dataCount > 15) return Math.ceil(dataCount / 8) - 1;
    return 0; // show all
  })();

  // Label rotation angle
  const xAngle = (isSmall || dataCount > 8) ? -40 : 0;
  const xTextAnchor = xAngle !== 0 ? 'end' : 'middle';
  const xHeight = xAngle !== 0 ? 65 : 30;
  const xFontSize = isSmall ? 10 : 11;

  // Chart height
  const chartHeight = isSmall ? 280 : 380;

  // Margins
  const margins = isSmall
    ? { top: 10, right: 12, left: 0, bottom: 10 }
    : { top: 16, right: 20, left: 8, bottom: 10 };

  const tooltipStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(8px)',
    borderColor: 'var(--border-color)',
    borderRadius: '12px',
    color: '#fff',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
  };

  const xAxisProps = {
    dataKey: safeXKey,
    axisLine: false,
    tickLine: false,
    tick: { fill: 'var(--text-tertiary)', fontSize: xFontSize },
    interval: xInterval,
    angle: xAngle,
    textAnchor: xTextAnchor,
    height: xHeight,
    tickFormatter: (v) => truncateLabel(String(v ?? ''), isSmall ? 8 : 14),
  };

  const yAxisProps = {
    tick: { fill: 'var(--text-tertiary)', fontSize: xFontSize },
    tickFormatter: formatNumber,
    axisLine: false,
    tickLine: false,
    width: isSmall ? 40 : 52,
  };

  const legendStyle = { paddingTop: isSmall ? '4px' : '14px', fontSize: isSmall ? '11px' : '13px' };

  const renderChart = () => {
    switch (actualChartType?.toLowerCase()) {

      case 'line':
        return (
          <LineChart data={chartData} margin={margins}>
            <defs>
              <linearGradient id={`colorLine-${instanceId}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip formatter={(v) => [formatNumber(v), safeYKey]} contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
            <Legend wrapperStyle={legendStyle} iconType="circle" />
            <Line type="monotone" dataKey={safeYKey} stroke={`url(#colorLine-${instanceId})`} strokeWidth={3} dot={{ r: 3, strokeWidth: 2, fill: 'var(--surface-color)' }} activeDot={{ r: 6, fill: '#3b82f6' }} animationDuration={400} />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={chartData} margin={margins}>
            <defs>
              <linearGradient id={`colorArea-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.75}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.04}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip formatter={(v) => [formatNumber(v), safeYKey]} contentStyle={tooltipStyle} />
            <Legend wrapperStyle={legendStyle} iconType="circle" />
            <Area type="monotone" dataKey={safeYKey} stroke="#8b5cf6" fill={`url(#colorArea-${instanceId})`} strokeWidth={2.5} animationDuration={400} fillOpacity={0.6} />
          </AreaChart>
        );

      case 'scatter':
        return (
          <ScatterChart margin={margins}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
            <XAxis {...xAxisProps} name={safeXKey} />
            <YAxis {...yAxisProps} dataKey={safeYKey} name={safeYKey} />
            <Tooltip formatter={(v) => formatNumber(v)} cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} />
            <Legend wrapperStyle={legendStyle} iconType="circle" />
            <Scatter name={safeYKey} data={chartData} fill="#ec4899" animationDuration={400} />
          </ScatterChart>
        );

      case 'pie':
        const outerR = isSmall ? 80 : 110;
        const innerR = isSmall ? 48 : 64;
        return (
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              {COLORS.map((color, i) => (
                <linearGradient key={i} id={`colorPie-${instanceId}-${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.75}/>
                  <stop offset="100%" stopColor={color} stopOpacity={1}/>
                </linearGradient>
              ))}
            </defs>
            <Tooltip formatter={(v) => formatNumber(v)} contentStyle={tooltipStyle} itemStyle={{ color: '#fff', fontWeight: 600 }} />
            <Legend wrapperStyle={legendStyle} iconType="circle" />
            <Pie data={chartData} dataKey={safeYKey} nameKey={safeXKey} cx="50%" cy="50%" outerRadius={outerR} innerRadius={innerR} paddingAngle={4} animationDuration={500}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={`url(#colorPie-${instanceId}-${index % COLORS.length})`} stroke="transparent" style={{ outline: 'none' }} />
              ))}
            </Pie>
          </PieChart>
        );

      case 'bar':
      default:
        return (
          <BarChart data={chartData} margin={margins}>
            <defs>
              <linearGradient id={`colorBar-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.55}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip formatter={(v) => [formatNumber(v), safeYKey]} contentStyle={tooltipStyle} cursor={{ fill: 'var(--border-color)', opacity: 0.15 }} />
            <Legend wrapperStyle={legendStyle} iconType="circle" />
            <Bar dataKey={safeYKey} fill={`url(#colorBar-${instanceId})`} radius={[5, 5, 0, 0]} maxBarSize={isSmall ? 36 : 56} animationDuration={400} />
          </BarChart>
        );
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: `${chartHeight}px`, minHeight: `${chartHeight}px`, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

export default DynamicChartComponent;