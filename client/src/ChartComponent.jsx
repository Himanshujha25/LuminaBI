import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend 
} from "recharts";

// Premium Gradients and Colors for UI
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const PIE_COLORS = ['url(#colorPie0)', 'url(#colorPie1)', 'url(#colorPie2)', 'url(#colorPie3)', 'url(#colorPie4)', 'url(#colorPie5)'];

function DynamicChartComponent({ config, overrideChartType }) {
  if (!config || !config.data || config.data.length === 0) return <p>No data to display.</p>;

  const { chart_type, x_axis_column, y_axis_column, data } = config;
  const actualChartType = overrideChartType || chart_type;

  // Make sure numeric data is actually parsed as numbers, as SQL might return bigints as strings sometimes
  const chartData = data.map(d => ({
    ...d,
    [y_axis_column]: Number(d[y_axis_column])
  }));

  // Render different charts based on the AI's decision or User's override
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
            <XAxis dataKey={x_axis_column} tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip 
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }} 
               itemStyle={{ color: '#fff' }}
               cursor={{stroke: 'var(--accent-blue)', strokeWidth: 2, strokeDasharray: '4 4'}}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Line type="monotone" dataKey={y_axis_column} stroke="url(#colorLine)" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: 'var(--surface-color)' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6', style: {filter: 'drop-shadow(0px 0px 8px rgba(59, 130, 246, 0.8))'} }} />
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
            <XAxis dataKey={x_axis_column} tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip 
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }} 
               itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Area type="monotone" dataKey={y_axis_column} stroke="#8b5cf6" fill="url(#colorArea)" strokeWidth={3} activeDot={{ r: 8, strokeWidth: 0, fill: '#8b5cf6', style: {filter: 'drop-shadow(0px 0px 8px rgba(139, 92, 246, 0.8))'} }} />
          </AreaChart>
        );
      case 'scatter':
        return (
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.6} />
            <XAxis dataKey={x_axis_column} name={x_axis_column} tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis dataKey={y_axis_column} name={y_axis_column} tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip 
               cursor={{ strokeDasharray: '3 3', stroke: 'var(--border-color)' }} 
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }} 
               itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Scatter name={y_axis_column} data={chartData} fill="#ec4899" shape="circle" style={{ filter: 'drop-shadow(0px 4px 6px rgba(236, 72, 153, 0.4))' }} />
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
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }} 
               itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Pie
              data={chartData}
              dataKey={y_axis_column}
              nameKey={x_axis_column}
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={60}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text x={x} y={y} fill="currentColor" fontWeight={600} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                    {value}
                  </text>
                );
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="var(--surface-color)" strokeWidth={3} style={{ filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.15))', outline: 'none' }} />
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
            <XAxis dataKey={x_axis_column} tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip 
               contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', borderColor: 'var(--border-color)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }} 
               itemStyle={{ color: '#fff' }}
               cursor={{fill: 'var(--border-color)', opacity: 0.4 }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Bar dataKey={y_axis_column} fill="url(#colorBar)" radius={[6, 6, 0, 0]} maxBarSize={60} />
          </BarChart>
        );
    }
  };

  // Wrap in a ResponsiveContainer so it looks good on any screen
  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

export default DynamicChartComponent;