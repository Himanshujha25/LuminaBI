import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Send, MessageSquare, ListFilter, Sparkles, Activity, Download, Image as ImageIcon, Menu, X, GripHorizontal, Trash2, LayoutDashboard, BarChart, TrendingUp, PieChart, AreaChart, TableProperties, Zap } from 'lucide-react';
import html2canvas from 'html2canvas';
import axios from 'axios';
import DynamicChartComponent from '../ChartComponent';
import './MainDashboard.css';

// Memoize the chart component to prevent expensive re-renders
const MemoizedChart = React.memo(DynamicChartComponent);

const MainDashboard = ({ activeDataset, datasets, setActiveDataset }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSideLoading, setIsSideLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // DRAG AND DROP REFS
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const chatScrollRef = useRef(null);

  const [chatHistories, setChatHistories] = useState({});
  
  const [chartTypeOverride, setChartTypeOverride] = useState(null);
  const [showSQL, setShowSQL] = useState(false);
  const [viewMode, setViewMode] = useState('chart'); 
  const [sidePrompt, setSidePrompt] = useState('');
  const [pinState, setPinState] = useState('idle'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [pinnedCharts, setPinnedCharts] = useState(() => {
    const saved = localStorage.getItem('lumina_pinned_charts');
    if (saved) {
       try {
           const parsed = JSON.parse(saved);
           const unique = [];
           const seen = new Set();
           parsed.forEach(c => {
               const key = `${c.sql_used}_${c.chart_type}`;
               if (!seen.has(key)) {
                   seen.add(key);
                   unique.push(c);
               }
           });
           return unique;
       } catch (e) { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('lumina_pinned_charts', JSON.stringify(pinnedCharts));
  }, [pinnedCharts]);

  const history = activeDataset ? (chatHistories[activeDataset.id] || []) : [];
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isSidebarOpen]);

  // Fetch chat history from DB when dataset changes
  useEffect(() => {
    let controller = new AbortController();
    if (activeDataset?.id && !chatHistories[activeDataset.id]) {
        setIsSideLoading(true);
        axios.get(`https://luminabi.onrender.com/api/datasets/${activeDataset.id}/chats`, { 
          signal: controller.signal,
          timeout: 10000 
        })
          .then(res => {
             const formatted = res.data.map(row => ({
                 id: row.id,
                 role: row.role,
                 text: row.text,
                 data: row.data || null
             }));
             setChatHistories(prev => ({ ...prev, [activeDataset.id]: formatted }));
          })
          .catch(err => {
            if (err.name !== 'CanceledError') {
              console.error("Failed to fetch chat history:", err);
            }
          })
          .finally(() => setIsSideLoading(false));
    }
    return () => controller.abort();
  }, [activeDataset?.id]);

  // Handle mobile viewport height stabilization
  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
     setChartTypeOverride(null);
     setShowSQL(false);
     setViewMode('chart');
     setPrompt('');
     setSidePrompt('');
  }, [activeDataset?.id]);

  // Auto-scroll chat history
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [history, isSideLoading]);

  const handleSubmit = async (overridePrompt, isSideSearch = false) => {
    const finalPrompt = overridePrompt || prompt;
    if (!finalPrompt.trim() || !activeDataset) return;
    
    if (isSideSearch) setIsSideLoading(true);
    else setIsLoading(true);

    setError(null);
    setPrompt(''); 
    setSidePrompt('');
    setChartTypeOverride(null); 
    setShowSQL(false);

    if (!isSideSearch) setIsSidebarOpen(true);

    // Add optimistic UI message (without ID yet)
    const optimisticUserMsg = { role: 'user', text: finalPrompt };
    setChatHistories(prev => ({
       ...prev, [activeDataset.id]: [...(prev[activeDataset.id] || []), optimisticUserMsg]
    }));

    try {
      const res = await axios.post('https://luminabi.onrender.com/api/query', { 
        prompt: finalPrompt,
        datasetId: activeDataset.id,
        history: history.slice(-6) 
      }, { 
        timeout: 30000 // 30s timeout for AI reasoning
      });
      
      if (res.data.error) {
        setError(res.data.error);
        setChatHistories(prev => {
           const oldH = prev[activeDataset.id] || [];
           // Update optimistic user msg with DB ID
           if (res.data.userMessageId && oldH.length > 0) {
              oldH[oldH.length - 1].id = res.data.userMessageId;
           }
           return { ...prev, [activeDataset.id]: [...oldH, { role: 'ai', text: res.data.error }] };
        });
      } else {
        setChatHistories(prev => {
           const oldH = prev[activeDataset.id] || [];
           if (res.data.userMessageId && oldH.length > 0) {
              oldH[oldH.length - 1].id = res.data.userMessageId;
           }
           return { 
              ...prev, 
              [activeDataset.id]: [
                 ...oldH, 
                 {
                    id: res.data.aiMessageId,
                    role: 'ai', 
                    text: res.data.explanation,
                    data: res.data.data_query !== false ? res.data : null 
                 }
              ] 
           };
        });
      }
    } catch (err) {
      if (err.name === 'CanceledError') return;
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
       const targetType = chartTypeOverride || currentData.chart_type;
       setPinnedCharts(prev => {
          const isDuplicate = prev.some(pc => pc.sql_used === currentData.sql_used && pc.chart_type === targetType);
          if (isDuplicate) {
             setPinState('duplicate');
             setTimeout(() => setPinState('idle'), 2000);
             return prev; 
          }
          setPinState('success');
          setTimeout(() => setPinState('idle'), 2000);
          return [{ 
             ...currentData, 
             id: Date.now(),
             chart_type: targetType
          }, ...prev];
       });
       
       setTimeout(() => {
           const container = document.querySelector('.dashboard-content');
           if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
       }, 100);
    }
  };

  const handleUnpinChart = (id) => {
    setPinnedCharts(prev => prev.filter(c => c.id !== id));
  };

  const handleClearChat = async () => {
    if (!activeDataset) return;
    if (window.confirm('Are you sure you want to clear the entire chat history for this dataset?')) {
      try {
        await axios.delete(`https://luminabi.onrender.com/api/datasets/${activeDataset.id}/chats`);
        setChatHistories(prev => ({ ...prev, [activeDataset.id]: [] }));
        setPrompt('');
        setSidePrompt('');
        setError(null);
      } catch (err) {
        console.error("Failed to clear chat", err);
        alert("Failed to clear chat history from server.");
      }
    }
  };

  const handleRemoveMessage = async (index) => {
    if (!activeDataset) return;
    
    // Attempt to delete from backend right away. If no ID (like optimistic UI, it might fail)
    const msg = history[index];
    if (msg.id) {
       try {
          await axios.delete(`https://luminabi.onrender.com/api/chats/${msg.id}`);
       } catch (e) {
          console.error("Failed to delete from backend", e);
       }
    }

    setChatHistories(prev => {
      const newHistory = [...(prev[activeDataset.id] || [])];
      
      // If we remove a user message, also remove the subsequent AI message if it exists
      if (newHistory[index].role === 'user' && newHistory[index+1]?.role === 'ai') {
        const nextMsg = newHistory[index+1];
        if (nextMsg.id) axios.delete(`https://luminabi.onrender.com/api/chats/${nextMsg.id}`).catch(()=>null);
        newHistory.splice(index, 2);
      } else if (newHistory[index].role === 'ai' && newHistory[index-1]?.role === 'user') {
        const prevMsg = newHistory[index-1];
        if (prevMsg.id) axios.delete(`https://luminabi.onrender.com/api/chats/${prevMsg.id}`).catch(()=>null);
        newHistory.splice(index-1, 2); // If removing an AI message, also remove the user message before it
      } else {
        newHistory.splice(index, 1);
      }
      return { ...prev, [activeDataset.id]: newHistory };
    });
  };

  // --- NATIVE DRAG AND DROP HANDLER ---
  const handleSort = () => {
    const _pinnedCharts = [...pinnedCharts];
    // Remove the dragged item
    const draggedItemContent = _pinnedCharts.splice(dragItem.current, 1)[0];
    // Insert it at the new position
    _pinnedCharts.splice(dragOverItem.current, 0, draggedItemContent);
    // Reset refs & set state
    dragItem.current = null;
    dragOverItem.current = null;
    setPinnedCharts(_pinnedCharts);
  };

  const exportAsPNG = async (elementId, filename) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { backgroundColor: '#0f172a', scale: 2 });
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error('Failed to export image', e); }
  };

  const exportAsCSV = (dataList, filename) => {
    if (!dataList || dataList.length === 0) return;
    const headers = Object.keys(dataList[0]);
    const csvContent = [
      headers.join(','),
      ...dataList.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href); // Memory cleanup
  };

  const currentData = useMemo(() => {
    return history.slice().reverse().find(h => h.role === 'ai' && h.data)?.data;
  }, [history]);

  return (
    <div className="dashboard-wrapper">
      
      <button 
        className="mobile-assistant-toggle animate-fade-in" 
        onClick={() => setIsSidebarOpen(true)}
        title="Open AI Assistant"
      >
        <Sparkles size={26} />
      </button>

      <div className="dashboard-main">
        <div className="search-header">
          <div className="dataset-selector-wrapper">
            <span className="dataset-selector-label">Analyzing:</span>
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

        <div className="dashboard-content">
          {isLoading ? (
            <div className="animate-fade-in" style={{ padding: '20px 0' }}>
               <div className="skeleton-title skeleton" style={{ width: '40%', height: '32px', marginBottom: '32px' }}></div>
               <div className="kpi-header" style={{ marginBottom: '32px' }}>
                  <div className="skeleton-kpi skeleton" style={{ flex: 1, minHeight: '100px' }}></div>
                  <div className="skeleton-kpi skeleton" style={{ flex: 2, minHeight: '100px' }}></div>
               </div>
               <div className="skeleton-chart skeleton" style={{ height: '400px' }}></div>
            </div>
          ) : currentData ? (
             <div className="chart-view animate-slide-up">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ background: 'var(--accent-light)', padding: '6px', borderRadius: '8px' }}>
                        <Sparkles size={16} color="var(--accent-blue)" />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>AI-Informed Summary</span>
                </div>

                <div className="kpi-header">
                   <div className="kpi-card glass-panel">
                      <div className="kpi-icon"><Activity size={20} color="var(--accent-blue)"/></div>
                      <div className="kpi-data">
                         <span className="kpi-label">Visualization Type</span>
                         <span className="kpi-value">{(currentData.chart_type || 'chart').toUpperCase()}</span>
                      </div>
                   </div>
                   <div className="kpi-card glass-panel executive-summary-card">
                      <span className="kpi-label">Executive Summary</span>
                      <p className="kpi-desc text-secondary">{currentData.explanation}</p>
                   </div>
                </div>

                <div className="main-chart-container glass-panel">
                    <div className="chart-controls-header">
                        <h3 className="chart-title-main">Dynamic Data Visualization</h3>
                        
                        <div className="chart-type-selector">
                           <button onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')} className={`ui-btn ${viewMode === 'table' ? 'active' : ''}`}>
                             <ListFilter size={14} /> {viewMode === 'chart' ? 'Table View' : 'Chart View'}
                           </button>
                           {viewMode === 'chart' && ['bar', 'line', 'area', 'pie'].map(ct => (
                              <button 
                                 key={ct} 
                                 onClick={() => setChartTypeOverride(ct)} 
                                 className={`ui-btn ${((chartTypeOverride || currentData.chart_type) === ct) ? 'active' : ''}`}
                              >
                                 {ct.charAt(0).toUpperCase() + ct.slice(1)}
                              </button>
                           ))}
                           <div className="divider-vert"></div>
                           <button onClick={() => setShowSQL(!showSQL)} className={`ui-btn ${showSQL ? 'active' : ''}`}>
                             <Zap size={14} /> SQL
                           </button>
                           <button 
                             onClick={handlePinChart} 
                             className="ui-btn" 
                             style={{ 
                               background: pinState === 'success' ? '#10b981' : (pinState === 'duplicate' ? '#f59e0b' : 'var(--surface-hover)'), 
                               color: pinState !== 'idle' ? '#fff' : 'var(--accent-blue)'
                             }}
                           >
                             <LayoutDashboard size={14} /> {pinState === 'success' ? 'Pinned' : (pinState === 'duplicate' ? 'Duplicate' : 'Pin Grid')}
                           </button>
                           <div className="divider-vert"></div>
                           <button onClick={() => exportAsCSV(currentData.data, 'lumina_export')} title="CSV" className="ui-btn icon-only"><Download size={16} /></button>
                           <button onClick={() => exportAsPNG('main-chart-export', 'lumina_insight')} title="PNG" className="ui-btn icon-only"><ImageIcon size={16} /></button>
                        </div>
                    </div>

                    {showSQL && (
                       <div className="sql-viewer animate-fade-in">
                          <div className="sql-label">PostgreSQL Generated Engine</div>
                          <code>{currentData.sql_used}</code>
                       </div>
                    )}

                    {viewMode === 'table' ? (
                        <div id="main-chart-export" className="animate-fade-in" style={{ overflowX: 'auto', borderRadius: '12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                               <thead>
                                  <tr style={{ background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                     {currentData.data && currentData.data.length > 0 && Object.keys(currentData.data[0]).map(key => (
                                        <th key={key} style={{ padding: '16px 12px', fontWeight: 600 }}>{key}</th>
                                     ))}
                                  </tr>
                               </thead>
                               <tbody>
                                  {currentData.data && currentData.data.slice(0, 100).map((row, i) => (
                                     <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        {Object.values(row).map((val, j) => (
                                           <td key={j} style={{ padding: '14px 12px', color: 'var(--text-primary)' }}>{val}</td>
                                        ))}
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                        </div>
                    ) : (
                        <div id="main-chart-export" className="animate-fade-in" style={{ padding: '16px', borderRadius: '12px', background: 'var(--surface-color)' }}>
                            <MemoizedChart config={currentData} overrideChartType={chartTypeOverride} />
                        </div>
                    )}
                </div>
             </div>
          ) : (
            <div className="empty-state animate-fade-in">
               <div className="discovery-header">
                  <div className="empty-icon glass-panel">
                    <Sparkles size={44} className="gradient-text" />
                  </div>
                  <h1>
                    Lumina <span className="gradient-text">Conversational BI</span>
                  </h1>
                  <p className="text-secondary">
                    The industry standard for rapid data exploration. Ask anything—from trend analysis to many more—and let the AI visualize the future.
                  </p>
               </div>

               <div className="suggestion-grid">
                  <div className="suggestion-card glass-panel" onClick={() => setPrompt("Give me a monthly trend of orders")}>
                     <div className="suggestion-icon-box blue"><Activity size={24} /></div>
                     <h3 className="suggestion-title">Predictive Trends</h3>
                     <p className="suggestion-text">"Show me the monthly trend of order volume for the last quarter."</p>
                  </div>
                  <div className="suggestion-card glass-panel" onClick={() => setPrompt("What is the revenue breakdown by product category?")}>
                     <div className="suggestion-icon-box purple"><PieChart size={24} /></div>
                     <h3 className="suggestion-title">Composition Analysis</h3>
                     <p className="suggestion-text">"What is the revenue breakdown by product category as a pie chart?"</p>
                  </div>
                  <div className="suggestion-card glass-panel" onClick={() => setPrompt("Compare the performance of our top 3 regions")}>
                     <div className="suggestion-icon-box green"><ListFilter size={24} /></div>
                     <h3 className="suggestion-title">Comparative BI</h3>
                     <p className="suggestion-text">"Compare the performance of our top 3 regions by customer growth."</p>
                  </div>
                </div>
            </div>
          )}

          {pinnedCharts.length > 0 && !isLoading && !isSideLoading && (
             <div className="pinned-charts-section animate-slide-up" style={{ marginTop: '60px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Executive Dashboard Grid</h2>
                    <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{pinnedCharts.length} INSIGHTS PINNED</span>
                </div>
                <div className="pinned-grid">
                   {pinnedCharts.map((chart, index) => (
                      <div 
                        key={chart.id} 
                        className="draggable-card" 
                        draggable
                        onDragStart={(e) => {
                           dragItem.current = index;
                           e.currentTarget.classList.add('dragging');
                        }}
                        onDragEnter={() => dragOverItem.current = index}
                        onDragEnd={(e) => {
                           e.currentTarget.classList.remove('dragging');
                           handleSort();
                        }}
                        onDragOver={(e) => e.preventDefault()}
                      >
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div className="drag-handle" title="Drag to reorder">
                                    <GripHorizontal size={20} color="var(--text-tertiary)" />
                                </div>
                                <div className="pinned-chart-info">
                                    <div className="pinned-chart-tag">{chart.chart_type} Insight</div>
                                    <h4 className="pinned-chart-explanation">{chart.explanation}</h4>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => exportAsCSV(chart.data, `pinned_data_${chart.id}`)} title="Export CSV" className="ui-btn icon-only small"><Download size={14} /></button>
                                <button onClick={() => exportAsPNG(`pinned-chart-${chart.id}`, `pinned_chart_${chart.id}`)} title="Export PNG" className="ui-btn icon-only small"><ImageIcon size={14} /></button>
                                <button onClick={() => handleUnpinChart(chart.id)} title="Remove from grid" className="ui-btn icon-only small danger">✕</button>
                            </div>
                         </div>
                         <div id={`pinned-chart-${chart.id}`} style={{ padding: '16px', borderRadius: '12px', background: 'var(--surface-color)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.03)' }}>
                             <MemoizedChart config={chart} />
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}
          <div style={{ paddingBottom: '90px' }} />
        </div>
      </div>

      {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>}

      <aside className={`assistant-sidebar glass-panel ${isSidebarOpen ? 'open' : ''}`}>
        <div className="mobile-drag-handle" onClick={() => setIsSidebarOpen(false)}>
           <div className="drag-pill"></div>
        </div>

        <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={18} color="var(--accent-blue)" />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Assistant Chat</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {history.length > 0 && (
              <button 
                className="ui-btn danger icon-only small" 
                onClick={handleClearChat}
                title="Clear Chat History"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', padding: '4px', cursor: 'pointer' }}
              >
                <Trash2 size={16} />
              </button>
            )}
            <button className="mobile-close-sidebar" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="chat-history" ref={chatScrollRef}>
          {history.length === 0 && !isSideLoading ? (
            <div className="empty-chat text-tertiary">
               <Sparkles size={24} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
               <p>No questions asked yet. Ask a question to start the conversation.</p>
            </div>
          ) : (
            history.map((msg, i) => {
              let chips = [];
              if (msg.role === 'ai' && msg.data) {
                 if (msg.data.suggested_follow_ups && msg.data.suggested_follow_ups.length > 0) {
                     chips = msg.data.suggested_follow_ups;
                 } else if (msg.data.data_query) {
                     const xCol = msg.data.x_axis_column || 'categories';
                     const altChart = msg.data.chart_type === 'pie' ? 'bar' : 'pie';
                     chips = [`Show me the top 5 ${xCol}`, `Display this as a ${altChart} chart instead`];
                 } else {
                     chips = ["Tell me more about this data", "What are the key takeaways?"];
                 }
              }

              return (
                <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}`} style={{ position: 'relative', paddingRight: '28px' }}>
                  <button 
                    onClick={() => handleRemoveMessage(i)}
                    title="Remove message"
                    style={{ position: 'absolute', top: '6px', right: '6px', background: 'transparent', border: 'none', color: 'inherit', opacity: 0.5, cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                  >
                     <X size={14} />
                  </button>
                  <div className="bubble-content">{msg.text}</div>
                  
                  {msg.role === 'ai' && chips.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                         Suggested Next Steps
                      </span>
                      {chips.map((followUp, idx) => (
                        <button 
                           key={idx}
                           onClick={() => handleSubmit(followUp, true)} 
                           className="chat-chip-btn"
                        >
                          <Sparkles size={12} />
                          <span style={{ lineHeight: '1.3' }}>{followUp}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
          
          {isSideLoading && (
             <div className="chat-bubble ai-bubble">
                <div className="bubble-content" style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', display: 'inline-block', borderTopColor: 'var(--accent-blue)', marginRight: '8px' }}></span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>AI is analyzing data...</span>
                </div>
             </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="sidebar-input-area">
           <div className="side-search-container glass-panel">
              <input 
                type="text" 
                value={sidePrompt} 
                onChange={e => setSidePrompt(e.target.value)} 
                onKeyDown={handleSideKeyPress}
                placeholder="Ask follow-up..." 
                disabled={isLoading || isSideLoading || !activeDataset}
              />
              <button 
                onClick={() => handleSubmit(sidePrompt, true)} 
                disabled={isLoading || isSideLoading || !sidePrompt.trim() || !activeDataset}
                className="side-send-btn"
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