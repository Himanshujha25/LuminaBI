import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search, Send, MessageSquare, ListFilter, Sparkles, Activity,
  Download, Image as ImageIcon, X, GripHorizontal, Trash2,
  LayoutDashboard, PieChart, Zap, Eye, FileText, Clock, ChevronRight, Database
} from 'lucide-react';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { API_URL } from '../config';
import DynamicChartComponent from '../ChartComponent';
import DatasetPreview from './DatasetPreview';
import { generatePDFReport } from '../utils/pdfExport';
import './MainDashboard.css';

const MemoizedChart = React.memo(DynamicChartComponent);

const MainDashboard = ({ activeDataset, datasets, setActiveDataset }) => {
  const [prompt, setPrompt]                          = useState('');
  const [isLoading, setIsLoading]                   = useState(false);
  const [isSideLoading, setIsSideLoading]           = useState(false);
  const [error, setError]                           = useState(null);
  const [chatHistories, setChatHistories]           = useState({});
  const [chartTypeOverride, setChartTypeOverride]   = useState(null);
  const [showSQL, setShowSQL]                       = useState(false);
  const [viewMode, setViewMode]                     = useState('chart');
  const [sidePrompt, setSidePrompt]                 = useState('');
  const [pinState, setPinState]                     = useState('idle');
  const [isSidebarOpen, setIsSidebarOpen]           = useState(false);
  const [showPreview, setShowPreview]               = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown]   = useState(false);
  const [showDatasetDropdown, setShowDatasetDropdown]   = useState(false);
  const [isExportingPDF, setIsExportingPDF]         = useState(false);
  const [queryHistory, setQueryHistory]             = useState(() => {
    try { return JSON.parse(localStorage.getItem('lumina_query_history') || '[]'); } catch { return []; }
  });
  const [pinnedCharts, setPinnedCharts] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('lumina_pinned_charts') || '[]');
      const seen = new Set();
      return parsed.filter(c => { const k = `${c.sql_used}_${c.chart_type}`; return seen.has(k) ? false : seen.add(k); });
    } catch { return []; }
  });

  const dragItem        = useRef(null);
  const dragOverItem    = useRef(null);
  const chatScrollRef   = useRef(null);
  const chatEndRef      = useRef(null);
  const searchInputRef  = useRef(null);
  const datasetDropRef  = useRef(null);

  const history = activeDataset ? (chatHistories[activeDataset.id] || []) : [];

  // Persist pins
  useEffect(() => { localStorage.setItem('lumina_pinned_charts', JSON.stringify(pinnedCharts)); }, [pinnedCharts]);

  // Load chat history
  useEffect(() => {
    const ctrl = new AbortController();
    if (activeDataset?.id && !chatHistories[activeDataset.id]) {
      setIsSideLoading(true);
      axios.get(`${API_URL}/datasets/${activeDataset.id}/chats`, { signal: ctrl.signal, timeout: 10000 })
        .then(res => setChatHistories(prev => ({ ...prev, [activeDataset.id]: res.data.map(r => ({ id: r.id, role: r.role, text: r.text, data: r.data || null })) })))
        .catch(err => { if (err.name !== 'CanceledError') console.error(err); })
        .finally(() => setIsSideLoading(false));
    }
    return () => ctrl.abort();
  }, [activeDataset?.id]);

  // Viewport height for mobile
  useEffect(() => {
    const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    window.addEventListener('resize', setVh); setVh();
    return () => window.removeEventListener('resize', setVh);
  }, []);

  // Ctrl+K focus
  useEffect(() => {
    const fn = e => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchInputRef.current?.focus(); } };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  // Click-outside history dropdown
  useEffect(() => {
    const fn = e => {
      if (!e.target.closest('.history-dropdown-anchor')) setShowHistoryDropdown(false);
      if (datasetDropRef.current && !datasetDropRef.current.contains(e.target)) setShowDatasetDropdown(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Reset on dataset change
  useEffect(() => {
    setChartTypeOverride(null); setShowSQL(false); setViewMode('chart'); setPrompt(''); setSidePrompt('');
  }, [activeDataset?.id]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [history, isSideLoading]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, isSidebarOpen]);

  // ── Handlers ──
  const handleSubmit = async (overridePrompt, isSideSearch = false) => {
    const q = (overridePrompt || prompt).trim();
    if (!q || !activeDataset) return;
    setQueryHistory(prev => { const upd = [q, ...prev.filter(x => x !== q)].slice(0, 20); localStorage.setItem('lumina_query_history', JSON.stringify(upd)); return upd; });
    setShowHistoryDropdown(false);
    isSideSearch ? setIsSideLoading(true) : setIsLoading(true);
    setError(null);
    setChatHistories(prev => ({ ...prev, [activeDataset.id]: [...(prev[activeDataset.id] || []), { role: 'user', text: q }] }));
    isSideSearch ? setSidePrompt('') : setPrompt('');
    try {
      const { data } = await axios.post(`${API_URL}/query`, { prompt: q, datasetId: activeDataset.id, history: history.slice(-6) });
      setChatHistories(prev => ({ ...prev, [activeDataset.id]: [...(prev[activeDataset.id] || []), { id: data.message_id, role: 'ai', text: data.explanation || data.message || 'Here is what I found.', data }] }));
    } catch (err) {
      const msg = `❌ ${err.response?.data?.error || 'Something went wrong'}`;
      setChatHistories(prev => ({ ...prev, [activeDataset.id]: [...(prev[activeDataset.id] || []), { role: 'ai', text: msg }] }));
      setError(msg);
    } finally { setIsLoading(false); setIsSideLoading(false); }
  };

  const handleKeyPress     = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } };
  const handleSideKeyPress = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(sidePrompt, true); } };

  const handlePinChart = () => {
    if (!currentData) return;
    if (pinnedCharts.some(c => c.sql_used === currentData.sql_used && c.chart_type === currentData.chart_type)) {
      setPinState('duplicate'); setTimeout(() => setPinState('idle'), 2000); return;
    }
    setPinnedCharts(prev => [...prev, { ...currentData, id: Date.now() }]);
    setPinState('success'); setTimeout(() => setPinState('idle'), 2000);
  };
  const handleUnpinChart = id => setPinnedCharts(prev => prev.filter(c => c.id !== id));
  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const arr = [...pinnedCharts];
    const [m] = arr.splice(dragItem.current, 1);
    arr.splice(dragOverItem.current, 0, m);
    dragItem.current = null; dragOverItem.current = null;
    setPinnedCharts(arr);
  };
  const handleClearChat = async () => {
    if (!activeDataset || !window.confirm('Clear all chat history for this dataset?')) return;
    try {
      await axios.delete(`${API_URL}/datasets/${activeDataset.id}/chats`);
      setChatHistories(prev => ({ ...prev, [activeDataset.id]: [] }));
      setPrompt(''); setSidePrompt('');
    } catch (e) { console.error(e); }
  };
  const handleRemoveMessage = async index => {
    const msg = history[index];
    if (msg.id) { try { await axios.delete(`${API_URL}/chats/${msg.id}`); } catch {} }
    const nh = [...history];
    if (nh[index].role === 'user' && nh[index + 1]?.role === 'ai') {
      if (nh[index + 1].id) axios.delete(`${API_URL}/chats/${nh[index + 1].id}`).catch(() => {});
      nh.splice(index, 2);
    } else if (nh[index].role === 'ai' && nh[index - 1]?.role === 'user') {
      if (nh[index - 1].id) axios.delete(`${API_URL}/chats/${nh[index - 1].id}`).catch(() => {});
      nh.splice(index - 1, 2);
    } else { nh.splice(index, 1); }
    setChatHistories(prev => ({ ...prev, [activeDataset.id]: nh }));
  };

  const exportAsCSV = (data, filename) => {
    if (!data?.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`${headers}\n${rows}`], { type: 'text/csv' }));
    a.download = `${filename}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  const exportAsPNG = async (elementId, filename) => {
    const el = document.getElementById(elementId); if (!el) return;
    try {
      const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
      const a = document.createElement('a'); a.download = `${filename}.png`; a.href = canvas.toDataURL('image/png'); a.click();
    } catch {}
  };

  const currentData = useMemo(() => history.slice().reverse().find(h => h.role === 'ai' && h.data)?.data, [history]);

  // ── Reusable UI atoms ──
  const UiBtn = ({ active, danger, disabled, onClick, title, children, className = '' }) => (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border',
        'transition-all duration-150 cursor-pointer whitespace-nowrap select-none',
        'border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--text-secondary)]',
        !disabled && !active && !danger && 'hover:border-indigo-400/40 hover:text-[var(--text-primary)] hover:bg-indigo-500/8',
        active  ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300 shadow-[inset_0_1px_0_rgba(99,102,241,0.2)]' : '',
        danger  ? 'hover:bg-red-500/10 hover:border-red-400/40 hover:text-red-400' : '',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
        className,
      ].filter(Boolean).join(' ')}
    >{children}</button>
  );

  const Skeleton = ({ className }) => <div className={`skeleton rounded-xl ${className}`} />;

  // ── CHART TYPE BUTTONS ──
  const chartTypes = ['bar', 'line', 'area', 'pie'];

  return (
    <div className="dashboard-wrapper">

      {/* ── Mobile FAB ── */}
      <button className="mobile-assistant-toggle" onClick={() => setIsSidebarOpen(true)}>
        <Sparkles size={18} />
      </button>

      {/* ══════════════ MAIN PANEL ══════════════ */}
      <main className="dashboard-main flex flex-col min-h-0">

        {/* ── STICKY HEADER ── */}
       {/* ── CLEAN ENTERPRISE HEADER ── */}
        <header className="topbar-shell">

          {/* 1. Dataset Selector */}
          <div ref={datasetDropRef} style={{ position: 'relative', width: '100%', maxWidth: '340px', flexShrink: 0 }}>
            <button className="dataset-pill" onClick={() => setShowDatasetDropdown(v => !v)}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '6px', background: 'var(--surface-hover)', borderRadius: '6px', color: 'var(--accent-blue)' }}>
                  <Database size={16} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>
                    Active Workspace
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                    {activeDataset?.name || 'Select a dataset...'}
                  </span>
                </div>
              </div>

              <ChevronRight 
                size={16} 
                style={{ color: 'var(--text-tertiary)', flexShrink: 0, transform: showDatasetDropdown ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} 
              />
            </button>

            {/* Dataset Dropdown */}
            {showDatasetDropdown && datasets.length > 0 && (
              <div className="history-drop animate-fade-in">
                <div className="history-drop__header">
                  <Database size={12} /> Your Datasets
                </div>
                <div className="custom-scrollbar" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {datasets.map(d => (
                    <button
                      key={d.id}
                      onClick={() => { setActiveDataset(d); setShowDatasetDropdown(false); }}
                      className="history-drop__item"
                      style={activeDataset?.id === d.id ? { borderLeftColor: 'var(--accent-blue)', background: 'var(--surface-hover)' } : {}}
                    >
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: activeDataset?.id === d.id ? 600 : 500, color: activeDataset?.id === d.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {d.name}
                      </span>
                      {activeDataset?.id === d.id && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-blue)', background: 'var(--accent-light)', padding: '2px 6px', borderRadius: '4px' }}>ACTIVE</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Search Bar */}
          <div className="searchbar history-dropdown-anchor" style={{ flex: 1, position: 'relative' }}>
            
            {isLoading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <Search size={18} className="searchbar__icon" />}
            
            <input
              ref={searchInputRef}
              type="text"
              className="searchbar__input"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={() => queryHistory.length > 0 && setShowHistoryDropdown(true)}
              placeholder={activeDataset ? 'Ask anything about your data... (e.g., "Revenue by region")' : 'Select a dataset to begin...'}
              disabled={isLoading || !activeDataset}
            />

            {/* Keyboard hint (Visible on Desktop) */}
            <span style={{ display: 'none', padding: '4px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', background: 'var(--surface-hover)', borderRadius: '6px', border: '1px solid var(--border-color)' }} className="sm:inline-block">
              Ctrl K
            </span>

            <button className="searchbar__btn" onClick={() => handleSubmit()} disabled={isLoading || !prompt.trim() || !activeDataset}>
              <Sparkles size={14} />
              <span style={{ display: 'none' }} className="sm:inline">Generate</span>
            </button>

            {/* History Dropdown */}
            {showHistoryDropdown && queryHistory.length > 0 && (
              <div className="history-drop animate-fade-in">
                <div className="history-drop__header">
                  <Clock size={12} /> Recent Queries
                </div>
                <div className="custom-scrollbar" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {queryHistory.slice(0, 6).map((q, i) => (
                    <button 
                      key={i} 
                      className="history-drop__item"
                      onClick={() => { setPrompt(q); setShowHistoryDropdown(false); searchInputRef.current?.focus(); }}
                    >
                      <Search size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>
        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-6 space-y-8">

          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-4 animate-fade-in">
              <Skeleton className="h-7 w-1/3" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24 sm:col-span-2" />
              </div>
              <Skeleton className="h-80" />
            </div>
          )}

          {/* ── RESULT ── */}
          {!isLoading && currentData && (
            <div className="space-y-5 animate-slide-up">

              {/* Premium Header & Summary Row */}
              <div className="premium-summary-section">
                <div className="premium-ai-badge">
                  <div className="pulse-dot"></div>
                  <Sparkles size={13} className="badge-icon" />
                  <span>AI-Informed Insights</span>
                </div>
                
                <div className="premium-kpi-grid">
                  <div className="premium-kpi-card chart-type-card">
                    <div className="kpi-icon-wrapper">
                      <Activity size={20} />
                    </div>
                    <div className="kpi-content">
                      <span className="kpi-subtitle">VISUALIZATION</span>
                      <strong className="kpi-title">{(currentData.chart_type || 'chart').toUpperCase()}</strong>
                    </div>
                  </div>
                  
                  <div className="premium-kpi-card summary-card">
                    <span className="kpi-subtitle">EXECUTIVE SUMMARY</span>
                    <p className="kpi-body">{currentData.explanation}</p>
                  </div>
                </div>
              </div>

              {/* Chart panel */}
              {/* ── PROFESSIONAL CHART PANEL ── */}
              <div className="chart-panel-container animate-slide-up">
                
                {/* Controls Header */}
                <div className="chart-panel-header">
                  
                  {/* Left Side: Title */}
                  <div className="chart-panel-title">
                    <Activity size={18} className="title-icon" />
                    <h2>Data Visualization</h2>
                  </div>

                  {/* Right Side: Toolbars & Actions */}
                  <div className="chart-panel-actions">
                    
                    {/* Segmented Control: View Mode */}
                    <div className="segmented-control">
                      <button 
                        className={`seg-btn ${viewMode === 'table' ? 'active' : ''}`} 
                        onClick={() => setViewMode('table')}
                      >
                        <ListFilter size={14} /> <span>Table</span>
                      </button>
                      <button 
                        className={`seg-btn ${viewMode === 'chart' ? 'active' : ''}`} 
                        onClick={() => setViewMode('chart')}
                      >
                        <PieChart size={14} /> <span>Chart</span>
                      </button>
                    </div>

                    {/* Segmented Control: Chart Types (Only show if Chart mode) */}
                    {viewMode === 'chart' && (
                      <div className="segmented-control">
                        {chartTypes.map(ct => (
                          <button
                            key={ct}
                            className={`seg-btn ${(chartTypeOverride || currentData.chart_type) === ct ? 'active' : ''}`}
                            onClick={() => setChartTypeOverride(ct)}
                          >
                            <span style={{ textTransform: 'capitalize' }}>{ct}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="divider-vert" />

                    {/* Secondary Actions */}
                    <button 
                      className={`action-btn ${showSQL ? 'active' : ''}`} 
                      onClick={() => setShowSQL(!showSQL)} 
                      title="View SQL"
                    >
                      <Zap size={15} /> <span className="action-btn-text">SQL</span>
                    </button>

                    <button className="action-btn icon-only" onClick={() => exportAsCSV(currentData.data, 'lumina_export')} title="Export CSV">
                      <Download size={15} />
                    </button>
                    <button className="action-btn icon-only" onClick={() => exportAsPNG('main-chart-export', 'lumina_insight')} title="Export PNG">
                      <ImageIcon size={15} />
                    </button>

                    {/* Primary Action Button */}
                    <button
                      onClick={handlePinChart}
                      className={`primary-btn ${pinState !== 'idle' ? pinState : ''}`}
                    >
                      <LayoutDashboard size={14} />
                      <span className="action-btn-text">
                        {pinState === 'success' ? 'Pinned!' : pinState === 'duplicate' ? 'Saved' : 'Pin to Board'}
                      </span>
                    </button>

                  </div>
                </div>

                {/* SQL viewer */}
                {showSQL && (
                  <div className="sql-viewer-pro">
                    <div className="sql-label-pro"><Database size={12}/> Executed PostgreSQL Query</div>
                    <code>{currentData.sql_used}</code>
                  </div>
                )}

                {/* Main Content Area */}
                <div id="main-chart-export" className="chart-content-area">
                  {viewMode === 'table' ? (
                    <div className="pro-table-wrapper">
                      <table className="pro-table">
                        <thead>
                          <tr>
                            {currentData.data?.[0] && Object.keys(currentData.data[0]).map(k => (
                              <th key={k}>{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {currentData.data?.slice(0, 100).map((row, i) => (
                            <tr key={i}>
                              {Object.values(row).map((v, j) => (
                                <td key={j}>{String(v ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="pro-chart-wrapper">
                      <MemoizedChart config={currentData} overrideChartType={chartTypeOverride} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── WELCOME / EMPTY STATE ── */}
          {!isLoading && !currentData && (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 animate-fade-in" style={{ minHeight: '54vh' }}>

              {/* Glow orb */}
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-2xl scale-150" />
                <div className="relative w-20 h-20 rounded-2xl glass-panel flex items-center justify-center border border-indigo-500/20">
                  <Sparkles size={34} className="text-indigo-400" />
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3 leading-tight tracking-tight">
                Lumina{' '}
                <span className="gradient-text">Conversational BI</span>
              </h1>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-md mb-10 leading-relaxed">
                Ask anything about your data — trends, breakdowns, comparisons — and let AI render it instantly.
              </p>

              {/* Suggestion cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full max-w-3xl">
                {[
                  { icon: <Activity size={17} />, color: 'blue',   title: 'Trend Analysis',       desc: 'Monthly order trend for last quarter.',      q: 'Give me a monthly trend of orders' },
                  { icon: <PieChart size={17} />,  color: 'purple', title: 'Composition Breakdown', desc: 'Revenue breakdown by product category.',      q: 'What is the revenue breakdown by product category?' },
                  { icon: <ListFilter size={17} />, color: 'green', title: 'Comparative BI',        desc: 'Top 3 regions by customer growth.',           q: 'Compare the performance of our top 3 regions', span: 'sm:col-span-2 lg:col-span-1' },
                ].map((c, i) => (
                  <button
                    key={i}
                    className={`suggestion-card glass-panel text-left group w-full ${c.span || ''}`}
                    onClick={() => handleSubmit(c.q)}
                  >
                    <div className={`suggestion-icon-box ${c.color} mb-4`}>{c.icon}</div>
                    <h3 className="suggestion-title mb-1">{c.title}</h3>
                    <p className="suggestion-text">"{c.desc}"</p>
                    <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] group-hover:text-indigo-400 transition-colors">
                      <Sparkles size={9} /> Try this
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── PINNED CHARTS ── */}
          {pinnedCharts.length > 0 && !isLoading && (
            <div className="pt-8 mt-4 border-t border-[var(--border-color)] animate-slide-up">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)] tracking-tight">Executive Dashboard</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mt-0.5">
                    {pinnedCharts.length} chart{pinnedCharts.length !== 1 ? 's' : ''} · drag to reorder
                  </p>
                </div>
               <button
  onClick={async () => {
    setIsExportingPDF(true);
    try {
      await generatePDFReport(pinnedCharts, activeDataset?.name || "Report");
    } finally {
      setIsExportingPDF(false);
    }
  }}
  disabled={isExportingPDF}
  className="
    inline-flex items-center gap-2
    px-2 py-1
    rounded-sm
    text-sm font-small
    text-indigo-500
    hover:bg-indigo-700
    hover:border-indigo-500
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  "
>
  {isExportingPDF ? (
    <>
      <span
        className="animate-spin rounded-full border-2 border-white/40 border-t-white"
        style={{ width: 14, height: 14 }}
      />
      Generating...
    </>
  ) : (
    <>
      <FileText size={15} />
      Export PDF
    </>
  )}
</button>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {pinnedCharts.map((chart, index) => (
                  <div
                    key={chart.id}
                    className="draggable-card"
                    draggable
                    onDragStart={e => { dragItem.current = index; e.currentTarget.classList.add('dragging'); }}
                    onDragEnter={() => dragOverItem.current = index}
                    onDragEnd={e => { e.currentTarget.classList.remove('dragging'); handleSort(); }}
                    onDragOver={e => e.preventDefault()}
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="drag-handle shrink-0 mt-0.5 cursor-grab">
                          <GripHorizontal size={14} className="text-[var(--text-tertiary)]" />
                        </div>
                        <div className="min-w-0">
                          <div className="pinned-chart-tag">{chart.chart_type} Insight</div>
                          <p className="pinned-chart-explanation">{chart.explanation}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <UiBtn title="Export CSV" onClick={() => exportAsCSV(chart.data, `pinned_${chart.id}`)}><Download size={11} /></UiBtn>
                        <UiBtn title="Export PNG" onClick={() => exportAsPNG(`pinned-chart-${chart.id}`, `pinned_${chart.id}`)}><ImageIcon size={11} /></UiBtn>
                        <UiBtn danger title="Remove" onClick={() => handleUnpinChart(chart.id)}>✕</UiBtn>
                      </div>
                    </div>

                    <div id={`pinned-chart-${chart.id}`} className="rounded-xl overflow-hidden bg-[var(--bg-color)]">
                      <MemoizedChart config={chart} compact={true} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pb-24 sm:pb-8" />
        </div>
      </main>

      {/* ── Backdrop ── */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ══════════════ ASSISTANT SIDEBAR ══════════════ */}
      <aside className={`assistant-sidebar glass-panel ${isSidebarOpen ? 'open' : ''}`}>

        {/* Drag handle (mobile) */}
        <div className="mobile-drag-handle" onClick={() => setIsSidebarOpen(false)}>
          <div className="drag-pill" />
        </div>

        {/* Sidebar header */}
        <div className="sidebar-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <MessageSquare size={13} className="text-indigo-400" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] m-0">Assistant Chat</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {history.length > 0 && (
              <button
                onClick={handleClearChat}
                title="Clear history"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-400/10 transition-all"
              >
                <Trash2 size={13} />
              </button>
            )}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="mobile-close-sidebar w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Chat messages */}
        <div className="chat-history" ref={chatScrollRef}>
          {history.length === 0 && !isSideLoading ? (
            <div className="empty-chat">
              <Sparkles size={22} className="opacity-20 mb-3" />
              <p className="text-xs text-[var(--text-tertiary)] text-center leading-relaxed">
                Ask a question in the search bar above.<br />The conversation will appear here.
              </p>
            </div>
          ) : (
            history.map((msg, i) => {
              const chips = msg.role === 'ai' && msg.data
                ? (msg.data.suggested_follow_ups?.length > 0 ? msg.data.suggested_follow_ups : ['Tell me more', 'Key takeaways?'])
                : [];
              return (
                <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'} relative pr-6`}>
                  <button
                    onClick={() => handleRemoveMessage(i)}
                    className="absolute top-2 right-2 w-4 h-4 flex items-center justify-center rounded opacity-0 hover:opacity-100
                               bg-transparent border-none cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)]
                               transition-all group-hover:opacity-60"
                    title="Remove"
                  >
                    <X size={10} />
                  </button>
                  <div className="bubble-content">{msg.text}</div>
                  {chips.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-dashed border-[var(--border-color)]">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-tertiary)]">Follow-ups</span>
                      {chips.map((f, idx) => (
                        <button key={idx} onClick={() => handleSubmit(f, true)} className="chat-chip-btn">
                          <Sparkles size={9} />
                          <span className="text-xs leading-snug">{f}</span>
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
              <div className="bubble-content flex items-center gap-2">
                <span className="spinner" style={{ width: 11, height: 11, borderWidth: 2, display: 'inline-block' }} />
                <span className="text-xs text-[var(--text-secondary)]">Analyzing…</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Sidebar input */}
        <div className="sidebar-input-area">
          <div className="side-search-container glass-panel">
            <input
              type="text"
              value={sidePrompt}
              onChange={e => setSidePrompt(e.target.value)}
              onKeyDown={handleSideKeyPress}
              placeholder="Ask follow-up…"
              disabled={isLoading || isSideLoading || !activeDataset}
              className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            />
            <button
              onClick={() => handleSubmit(sidePrompt, true)}
              disabled={isLoading || isSideLoading || !sidePrompt.trim() || !activeDataset}
              className="side-send-btn"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Dataset preview modal */}
      {showPreview && <DatasetPreview dataset={activeDataset} onClose={() => setShowPreview(false)} />}
    </div>
  );
};

export default MainDashboard;