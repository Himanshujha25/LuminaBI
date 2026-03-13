import React, { useState, useRef, useEffect } from 'react';
import { Search, Send, MessageSquare, ListFilter, Sparkles, Activity } from 'lucide-react';
import axios from 'axios';
import DynamicChartComponent from '../ChartComponent';
import './MainDashboard.css';

const MainDashboard = ({ activeDataset, datasets, setActiveDataset }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSideLoading, setIsSideLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistories, setChatHistories] = useState(() => {
    const saved = localStorage.getItem('lumina_chat_histories');
    if (saved) return JSON.parse(saved);
    return {};
  }); // { [datasetId]: [{ role: 'user' | 'ai', text: string, data?: any }] }
  const [chartTypeOverride, setChartTypeOverride] = useState(null);
  const [showSQL, setShowSQL] = useState(false);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'table'
  const [sidePrompt, setSidePrompt] = useState('');
  const [pinnedCharts, setPinnedCharts] = useState(() => {
    const saved = localStorage.getItem('lumina_pinned_charts');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist pinned charts
  useEffect(() => {
    localStorage.setItem('lumina_pinned_charts', JSON.stringify(pinnedCharts));
  }, [pinnedCharts]);

  // Persist chat histories to local storage so they survive refreshes
  useEffect(() => {
    localStorage.setItem('lumina_chat_histories', JSON.stringify(chatHistories));
  }, [chatHistories]);

  const history = activeDataset ? (chatHistories[activeDataset.id] || []) : [];
  
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Clean UI overrides when switching the active analysis Dataset
  useEffect(() => {
     setChartTypeOverride(null);
     setShowSQL(false);
     setViewMode('chart');
     setPrompt('');
     setSidePrompt('');
  }, [activeDataset?.id]);

  const handleSubmit = async (overridePrompt, isSideSearch = false) => {
    const finalPrompt = overridePrompt || prompt;
    if (!finalPrompt.trim() || !activeDataset) return;
    
    if (isSideSearch) setIsSideLoading(true);
    else setIsLoading(true);

    setError(null);
    setPrompt(''); // clear input
    setSidePrompt('');
    setChartTypeOverride(null); // clear old override
    setShowSQL(false);

    // Add user message to history
    setChatHistories(prev => ({
       ...prev, [activeDataset.id]: [...(prev[activeDataset.id] || []), { role: 'user', text: finalPrompt }]
    }));

    try {
      const res = await axios.post('http://localhost:5000/api/query', { 
        prompt: finalPrompt,
        datasetId: activeDataset.id,
        history: history.slice(-6) // send last 6 messages mapped to THIS dataset
      });
      
      if (res.data.error) {
        setError(res.data.error);
        setChatHistories(prev => ({
           ...prev, [activeDataset.id]: [...(prev[activeDataset.id] || []), { role: 'ai', text: res.data.error }]
        }));
      } else {
        setChatHistories(prev => ({
           ...prev, [activeDataset.id]: [...(prev[activeDataset.id] || []), {
              role: 'ai', 
              text: res.data.explanation,
              data: res.data.data_query !== false ? res.data : null 
           }]
        }));
      }
    } catch (err) {
      const errorMsg = "Failed to generate insights. Our servers might be busy.";
      setError(errorMsg);
      setChatHistories(prev => ({
         ...prev, [activeDataset.id]: [...(prev[activeDataset.id] || []), { role: 'ai', text: errorMsg }]
      }));
    } finally {
      if (isSideSearch) setIsSideLoading(false);
      else setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSideKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(sidePrompt, true);
    }
  };

  const handlePinChart = () => {
    if (currentData) {
       setPinnedCharts(prev => [{ ...currentData, id: Date.now() }, ...prev]);
    }
  };

  const handleUnpinChart = (id) => {
    setPinnedCharts(prev => prev.filter(c => c.id !== id));
  };

  // Find the latest AI data object to display in the main view
  const currentData = history.slice().reverse().find(h => h.role === 'ai' && h.data)?.data;

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-main">
        {/* Search header area */}
        <div className="search-header">
          <div className="dataset-selector-wrapper">
            <span className="text-secondary" style={{fontSize: '14px'}}>Analyzing:</span>
            <select 
              className="dataset-selector" 
              value={activeDataset?.id || ''} 
              onChange={(e) => setActiveDataset(datasets.find(d => d.id == e.target.value))}
            >
              {datasets.length === 0 && <option value="">No Active Datasets</option>}
              {datasets.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className={`search-container ${isLoading ? 'is-loading' : ''} glass-panel`}>
            <Search className="search-icon" size={20} />
            <input 
              type="text"
              className="search-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question about your data..."
              disabled={isLoading || !activeDataset}
            />
            <button 
              className="search-btn" 
              onClick={() => handleSubmit()}
              disabled={isLoading || !prompt.trim() || !activeDataset}
            >
              <Sparkles size={18} />
              <span>Generate</span>
            </button>
          </div>
        </div>

        {/* Dashboard Content Area */}
        <div className="dashboard-content">
          {isLoading ? (
            <div className="processing-view animate-fade-in">
              <div className="skeleton-loader glass-panel">
                <div className="spinner-lg"></div>
                <h2>Analyzing Data</h2>
                <p className="text-tertiary">Processing natural language and optimizing dynamic SQL query...</p>
                <div className="progress-bar"><div className="progress-fill"></div></div>
              </div>
            </div>
          ) : currentData ? (
             <div className="chart-view animate-slide-up">
                <div className="kpi-header">
                   <div className="kpi-card glass-panel">
                      <div className="kpi-icon"><Activity size={20} color="var(--accent-blue)"/></div>
                      <div className="kpi-data">
                         <span className="kpi-label">AI Suggested Info</span>
                         <span className="kpi-value">{currentData.chart_type.toUpperCase()} CHART</span>
                      </div>
                   </div>
                   <div className="kpi-card glass-panel" style={{ flex: 2 }}>
                      <span className="kpi-label">Summary</span>
                      <p className="kpi-desc text-secondary">{currentData.explanation}</p>
                   </div>
                </div>
                <div className="main-chart-container glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                        <h3 className="chart-title" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>Visualized Data</h3>
                        
                        <div className="chart-type-selector" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                           <button 
                             onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
                             style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', background: 'var(--surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', marginRight: '8px' }}
                           >
                             {viewMode === 'chart' ? 'Data Table' : 'Show Chart'}
                           </button>
                           <button 
                             onClick={handlePinChart}
                             style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', background: 'var(--surface-hover)', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)', marginRight: '8px', fontWeight: 600 }}
                           >
                             📌 Pin Chart
                           </button>
                           <button 
                             onClick={() => setShowSQL(!showSQL)}
                             style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', background: 'var(--surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', marginRight: '8px' }}
                           >
                             {showSQL ? 'Hide SQL' : 'View SQL'}
                           </button>
                           {['bar', 'line', 'area', 'pie', 'scatter'].map(ct => (
                              <button 
                                 key={ct} 
                                 onClick={() => setChartTypeOverride(ct)} 
                                 style={{
                                     padding: '6px 14px', 
                                     borderRadius: '6px', 
                                     backgroundColor: (chartTypeOverride || currentData.chart_type) === ct ? 'var(--accent-blue)' : 'var(--bg-color)', 
                                     color: (chartTypeOverride || currentData.chart_type) === ct ? '#fff' : 'var(--text-primary)', 
                                     border: '1px solid',
                                     borderColor: (chartTypeOverride || currentData.chart_type) === ct ? 'var(--accent-blue)' : 'var(--border-color)',
                                     fontSize: '13px', 
                                     textTransform: 'capitalize',
                                     fontWeight: 500,
                                     transition: 'all 0.2s'
                                 }}
                              >
                                 {ct}
                              </button>
                           ))}
                        </div>
                    </div>

                    {showSQL && (
                       <div className="sql-viewer" style={{ padding: '16px', background: 'var(--bg-color)', borderRadius: '8px', marginBottom: '24px', fontFamily: 'monospace', fontSize: '14px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase' }}>Generated PostgreSQL</div>
                          <code style={{ color: 'var(--accent-blue)' }}>{currentData.sql_used}</code>
                       </div>
                    )}

                    {viewMode === 'table' ? (
                       <div className="data-table-container sql-viewer" style={{ padding: '16px', background: 'var(--bg-color)', borderRadius: '8px', overflowX: 'auto', border: '1px solid var(--border-color)', maxHeight: '400px' }}>
                           <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                              <thead>
                                 <tr style={{ borderBottom: '1px solid var(--accent-blue)', color: 'var(--text-secondary)' }}>
                                    {currentData.data && currentData.data.length > 0 && Object.keys(currentData.data[0]).map(key => (
                                       <th key={key} style={{ padding: '12px 8px' }}>{key}</th>
                                    ))}
                                 </tr>
                              </thead>
                              <tbody>
                                 {currentData.data && currentData.data.map((row, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                       {Object.values(row).map((val, j) => (
                                          <td key={j} style={{ padding: '12px 8px', color: 'var(--text-primary)' }}>{val}</td>
                                       ))}
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                       </div>
                    ) : (
                       <DynamicChartComponent config={currentData} overrideChartType={chartTypeOverride} />
                    )}
                </div>
             </div>
          ) : (
            <div className="empty-state">
               <div className="empty-icon glass-panel"><ListFilter size={48} color="var(--accent-blue)"/></div>
               <h2>Welcome to your AI Dashboard</h2>
               <p className="text-secondary">Upload a CSV or select an existing dataset, then ask a question to generate instant insights.</p>
               <div className="suggestion-chips">
                  <button onClick={() => setPrompt("Show me the data breakdown as a pie chart")}>"Show me the data breakdown as a pie chart"</button>
                  <button onClick={() => setPrompt("Create a bar chart of the top performing categories")}>"Create a bar chart of top performing categories"</button>
               </div>
            </div>
          )}

          {pinnedCharts.length > 0 && !isLoading && !isSideLoading && (
             <div className="pinned-charts-section animate-slide-up" style={{ marginTop: '40px', paddingBottom: '40px' }}>
                <h3 className="chart-title">Pinned Dashboards</h3>
                <div className="pinned-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(45%, 1fr))', gap: '24px' }}>
                   {pinnedCharts.map(chart => (
                      <div key={chart.id} className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
                         <button onClick={() => handleUnpinChart(chart.id)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--surface-hover)', borderRadius: '50%', width: '28px', height: '28px', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>✕</button>
                         <div style={{ fontSize: '12px', color: 'var(--accent-blue)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>{chart.chart_type} Chart</div>
                         <div style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '20px', paddingRight: '24px' }}>{chart.explanation}</div>
                         <DynamicChartComponent config={chart} />
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Assistant Sidebar */}
      <aside className="assistant-sidebar glass-panel">
        <div className="sidebar-header">
          <MessageSquare size={18} />
          <h3 style={{ margin: 0, fontSize: '16px' }}>Assistant Chat</h3>
        </div>
        
        <div className="chat-history">
          {history.length === 0 && !isSideLoading ? (
            <p className="empty-chat text-tertiary">No questions asked yet. Ask a question to start the conversation.</p>
          ) : (
            history.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
                <div className="bubble-content">{msg.text}</div>
                {msg.role === 'ai' && msg.data && (
                  <div className="chat-chart-preview" onClick={() => window.scrollTo(0,0)}>
                    <Activity size={14}/> <span>Generated {msg.data.chart_type} chart</span>
                  </div>
                )}
              </div>
            ))
          )}
          {isSideLoading && (
             <div className="chat-bubble ai-bubble">
                <div className="bubble-content" style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', display: 'inline-block', borderTopColor: 'var(--accent-blue)', marginRight: '8px' }}></span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>AI is thinking...</span>
                </div>
             </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="sidebar-input-area" style={{ padding: '16px', borderTop: '1px solid var(--border-color)', background: 'var(--surface-color)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
           <div className="side-search-container" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '9999px', padding: '8px 16px' }}>
              <input 
                type="text" 
                value={sidePrompt} 
                onChange={e => setSidePrompt(e.target.value)} 
                onKeyDown={handleSideKeyPress}
                placeholder="Ask follow-up..." 
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14px' }} 
                disabled={isLoading || isSideLoading || !activeDataset}
              />
              <button 
                onClick={() => handleSubmit(sidePrompt, true)} 
                disabled={isLoading || isSideLoading || !sidePrompt.trim() || !activeDataset}
                style={{ background: 'var(--accent-blue)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Send size={14} />
              </button>
           </div>
        </div>

      </aside>
    </div>
  );
};

export default MainDashboard;
