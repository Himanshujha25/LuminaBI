import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend 
} from "recharts";

// Premium Gradients and Colors for UI
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const PIE_COLORS = ['url(#colorPie0)', 'url(#colorPie1)', 'url(#colorPie2)', 'url(#colorPie3)', 'url(#colorPie4)', 'url(#colorPie5)'];

function DynamicChartComponent({ config, overrideChartType }) {
  if (!config || !config.data || config.data.length === 0) return <p style={{ color: 'white', padding: '20px' }}>No data to display.</p>;

  const { chart_type, x_axis_column, y_axis_column, data } = config;
  const actualChartType = overrideChartType || chart_type || 'bar';

  // 1. SMART COLUMN DETECTION
  const availableKeys = Object.keys(data[0] || {});
  const safeXKey = availableKeys.includes(x_axis_column) ? x_axis_column : availableKeys[0];
  const safeYKey = availableKeys.includes(y_axis_column) ? y_axis_column : (availableKeys[1] || availableKeys[0]);

  // 2. FAIL-SAFE NUMBER PARSING (AND 200 ROW LIMIT TO PREVENT BROWSER CRASH)
  const chartData = data.slice(0, 200).map(d => ({
    ...d,
    [safeYKey]: Number(d[safeYKey] || 0) 
  }));

  // DEBUGGING: Check your browser console (F12) to ensure data looks like [{ category: "A", count: 15 }]
  console.log("Chart Rendering Data:", chartData);
  console.log("Using X Key:", safeXKey, "| Using Y Key:", safeYKey);

  // 3. RENDER CHART (Removed manual width/height props!)
  const renderChart = () => {
    switch (actualChartType?.toLowerCase()) {
      case 'line':
        return (
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.6} />
            <XAxis dataKey={safeXKey} tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip 
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff' }} 
               itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Line type="monotone" dataKey={safeYKey} stroke="url(#colorLine)" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: 'var(--surface-color)' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6' }} />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
               <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
               </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.6} />
            <XAxis dataKey={safeXKey} tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip 
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff' }} 
               itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Area type="monotone" dataKey={safeYKey} stroke="#8b5cf6" fill="url(#colorArea)" strokeWidth={3} />
          </AreaChart>
        );

      case 'scatter':
        return (
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.6} />
            <XAxis dataKey={safeXKey} name={safeXKey} tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis dataKey={safeYKey} name={safeYKey} tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip 
               cursor={{ strokeDasharray: '3 3', stroke: 'var(--border-color)' }} 
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff' }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Scatter name={safeYKey} data={chartData} fill="#ec4899" shape="circle" />
          </ScatterChart>
        );

      case 'pie':
        return (
          <PieChart>
            <defs>
              {COLORS.map((color, i) => (
                <linearGradient key={`pieGrad-${i}`} id={`colorPie${i}`} x1="0" y1="0" x2="1" y2="1">
                   <stop offset="0%" stopColor={color} stopOpacity={0.6}/>
                   <stop offset="100%" stopColor={color} stopOpacity={1}/>
                </linearGradient>
              ))}
            </defs>
            <Tooltip 
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff' }} 
               itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Pie
              data={chartData}
              dataKey={safeYKey}
              nameKey={safeXKey}
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={60}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="var(--surface-color)" strokeWidth={3} style={{ outline: 'none' }} />
              ))}
            </Pie>
          </PieChart>
        );

      case 'bar':
      default:
        return (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.6} />
            <XAxis dataKey={safeXKey} tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip 
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff' }} 
               itemStyle={{ color: '#fff' }}
               cursor={{fill: 'var(--border-color)', opacity: 0.4 }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Bar dataKey={safeYKey} fill="url(#colorBar)" radius={[6, 6, 0, 0]} maxBarSize={60} />
          </BarChart>
        );
    }
  };

  // The wrapper div MUST have a strict pixel height, and ResponsiveContainer handles the rest natively
  return (
    <div style={{ width: '100%', height: '400px', minHeight: '400px', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

export default DynamicChartComponent;