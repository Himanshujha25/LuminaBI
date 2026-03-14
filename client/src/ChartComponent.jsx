import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend 
} from "recharts";

// Premium Gradients and Colors
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const PIE_COLORS = ['url(#colorPie0)', 'url(#colorPie1)', 'url(#colorPie2)', 'url(#colorPie3)', 'url(#colorPie4)', 'url(#colorPie5)'];

// Number formatter for beautiful tooltips (e.g. 1000000 -> 1,000,000)
const formatNumber = (num) => {
  if (typeof num !== 'number') return num;
  return new Intl.NumberFormat('en-US').format(num);
};

function DynamicChartComponent({ config, overrideChartType }) {
  // Unique ID for gradients to prevent clashing when multiple charts exist
  const instanceId = React.useId().replace(/:/g, "");

  if (!config || !config.data || config.data.length === 0) return <p style={{ color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>No data to display.</p>;

  const { chart_type, x_axis_column, y_axis_column, data } = config;
  const actualChartType = overrideChartType || chart_type || 'bar';

  // Smart Column Detection
  const availableKeys = Object.keys(data[0] || {});
  
  // Find column matching requested x_axis_column (case-insensitive)
  const safeXKey = availableKeys.find(k => k.toLowerCase() === x_axis_column?.toLowerCase()) || 
                   x_axis_column || 
                   availableKeys[0];

  // Find column matching requested y_axis_column (case-insensitive)
  // or find the first column that actually has numeric-looking data
  const findNumericKey = () => {
    // 1. Try case-insensitive match
    const match = availableKeys.find(k => k.toLowerCase() === y_axis_column?.toLowerCase());
    if (match) return match;
    
    // 2. Try to find any key that contains numbers in the first few rows
    for (const key of availableKeys) {
        if (key === safeXKey) continue;
        const val = data[0]?.[key];
        if (!isNaN(parseFloat(val)) && isFinite(val)) return key;
    }
    return availableKeys[1] || availableKeys[0];
  };

  const safeYKey = findNumericKey();

  // Parse Numbers safely and handle NaN
  const chartData = data.slice(0, 200).map(d => {
    const rawVal = d[safeYKey];
    const parsedVal = parseFloat(rawVal);
    return {
      ...d,
      [safeYKey]: isNaN(parsedVal) ? 0 : parsedVal
    };
  });

  const renderChart = () => {
    switch (actualChartType?.toLowerCase()) {
      case 'line':
        return (
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id={`colorLine-${instanceId}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={1}/>
              </linearGradient>
              <filter id={`shadow-${instanceId}`} height="200%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.3"/>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.6} />
            <XAxis dataKey={safeXKey} tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-tertiary)' }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
            <Tooltip 
               formatter={(value) => [formatNumber(value), safeYKey]}
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }} 
               itemStyle={{ color: '#fff', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Line type="monotone" dataKey={safeYKey} stroke={`url(#colorLine-${instanceId})`} strokeWidth={4} filter={`url(#shadow-${instanceId})`} dot={{ r: 4, strokeWidth: 2, fill: 'var(--surface-color)' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6' }} animationDuration={1000} strokeFallback="#3b82f6" />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
               <linearGradient id={`colorArea-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
                 <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
               </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.6} />
            <XAxis dataKey={safeXKey} tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-tertiary)' }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
            <Tooltip 
               formatter={(value) => [formatNumber(value), safeYKey]}
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff' }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Area type="monotone" dataKey={safeYKey} stroke="#8b5cf6" fill={`url(#colorArea-${instanceId})`} strokeWidth={3} animationDuration={1000} fillOpacity={0.6} />
          </AreaChart>
        );

      case 'scatter':
        return (
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.6} />
            <XAxis dataKey={safeXKey} name={safeXKey} tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis dataKey={safeYKey} name={safeYKey} tick={{ fill: 'var(--text-tertiary)' }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
            <Tooltip 
               formatter={(value) => formatNumber(value)}
               cursor={{ strokeDasharray: '3 3', stroke: 'var(--border-color)' }} 
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff' }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Scatter name={safeYKey} data={chartData} fill="#ec4899" shape="circle" animationDuration={1500} />
          </ScatterChart>
        );

      case 'pie':
        return (
          <PieChart>
            <defs>
              {COLORS.map((color, i) => (
                <linearGradient key={`pieGrad-${instanceId}-${i}`} id={`colorPie-${instanceId}-${i}`} x1="0" y1="0" x2="1" y2="1">
                   <stop offset="0%" stopColor={color} stopOpacity={0.7}/>
                   <stop offset="100%" stopColor={color} stopOpacity={1}/>
                </linearGradient>
              ))}
              <filter id={`pieShadow-${instanceId}`} height="130%">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000" floodOpacity="0.2"/>
              </filter>
            </defs>
            <Tooltip 
               formatter={(value) => formatNumber(value)}
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff', border: 'none' }} 
               itemStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Pie
              data={chartData}
              dataKey={safeYKey}
              nameKey={safeXKey}
              cx="50%"
              cy="50%"
              outerRadius={130}
              innerRadius={80} /* Made it a Donut Chart for a modern look */
              paddingAngle={5}
              filter={`url(#pieShadow-${instanceId})`}
              animationDuration={1000}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#colorPie-${instanceId}-${index % COLORS.length})`} stroke="transparent" style={{ outline: 'none' }} />
              ))}
            </Pie>
          </PieChart>
        );

      case 'bar':
      default:
        return (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id={`colorBar-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.6} />
            <XAxis dataKey={safeXKey} tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-tertiary)' }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
            <Tooltip 
               formatter={(value) => [formatNumber(value), safeYKey]}
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff' }} 
               cursor={{fill: 'var(--border-color)', opacity: 0.2 }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Bar dataKey={safeYKey} fill={`url(#colorBar-${instanceId})`} radius={[6, 6, 0, 0]} maxBarSize={60} animationDuration={1000} fillFallback="#3b82f6" />
          </BarChart>
        );
    }
  };

  return (
    <div style={{ width: '100%', height: '400px', minHeight: '400px', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

export default DynamicChartComponent;