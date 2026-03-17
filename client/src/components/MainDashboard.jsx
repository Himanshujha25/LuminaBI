import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Send, MessageSquare, ListFilter, Sparkles, Activity,
  Download, Image as ImageIcon, X, GripHorizontal, Trash2,
  LayoutDashboard, PieChart, Zap, Eye, FileText, ChevronRight, Database, Table, Plus
} from 'lucide-react';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { API_URL } from '../config';
import DynamicChartComponent from '../ChartComponent';
import DatasetPreview from './DatasetPreview';
import DynamicDashboard from './DynamicDashboard';
import { generatePDFReport } from '../utils/pdfExport';
import KpiCards from './KpiCards';
import './MainDashboard.css';

const MemoizedChart = React.memo(DynamicChartComponent);

const MainDashboard = ({ activeDataset, datasets, setActiveDataset, toggleTheme, isDark, onAnalyticsClick, onUploadClick }) => {
  const navigate = useNavigate();
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
  const [isSidebarOpen, setIsSidebarOpen]           = useState(true);
  const [showPreview, setShowPreview]               = useState(false);
  const [showDatasetDropdown, setShowDatasetDropdown]   = useState(false);
  const [isExportingPDF, setIsExportingPDF]         = useState(false);
  const [dataSlicerLimit, setDataSlicerLimit]       = useState('All');
  const user = JSON.parse(localStorage.getItem("user") || "{}");
const userId = user?.id || "guest";
const PIN_STORAGE_KEY = `lumina_pinned_charts_${userId}`;
const [pinnedCharts, setPinnedCharts] = useState(() => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PIN_STORAGE_KEY) || "[]");
    const seen = new Set();
    return parsed.filter(c => {
      const key = `${c.sql_used}_${c.chart_type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch {
    return [];
  }
});
  const dragItem        = useRef(null);
  const dragOverItem    = useRef(null);
  const chatScrollRef   = useRef(null);
  const chatEndRef      = useRef(null);
  const searchInputRef  = useRef(null);
  const datasetDropRef  = useRef(null);

  const history = activeDataset ? (chatHistories[activeDataset.id] || []) : [];

  // Persist pins
 useEffect(() => {
  localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(pinnedCharts));
}, [pinnedCharts, PIN_STORAGE_KEY]);
  // Load chat history
  useEffect(() => {
    const ctrl = new AbortController();
    if (activeDataset?.id && !chatHistories[activeDataset.id]) {
      setIsSideLoading(true);
      const token = localStorage.getItem('token');
      axios.get(`${API_URL}/datasets/${activeDataset.id}/chats`, { 
        signal: ctrl.signal, 
        timeout: 10000,
        headers: { Authorization: `Bearer ${token}` }
      })
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

  // Click-outside dataset dropdown
  useEffect(() => {
    const fn = e => {
      if (datasetDropRef.current && !datasetDropRef.current.contains(e.target)) setShowDatasetDropdown(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Reset on dataset change
  useEffect(() => {
    setChartTypeOverride(null); setShowSQL(false); setViewMode('chart'); setPrompt(''); setSidePrompt(''); setDataSlicerLimit('All');
  }, [activeDataset?.id]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [history, isSideLoading]);

  useEffect(() => { 
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Trigger window resize to help Recharts adjust to the sidebar width change
    setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 450);
  }, [history, isSidebarOpen]);

  // ── Handlers ──
  const handleSubmit = async (overridePrompt, isSideSearch = false) => {
    const q = (overridePrompt || prompt).trim();
    if (!q || !activeDataset) return;
    isSideSearch ? setIsSideLoading(true) : setIsLoading(true);
    setError(null);
    setChartTypeOverride(null);
    setDataSlicerLimit('All');
    setChatHistories(prev => ({ ...prev, [activeDataset.id]: [...(prev[activeDataset.id] || []), { role: 'user', text: q }] }));
    isSideSearch ? setSidePrompt('') : setPrompt('');
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${API_URL}/query`, { 
        prompt: q, 
        datasetId: activeDataset.id, 
        history: history.slice(-6) 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
    if (!slicedConfig) return;
    const configToPin = { ...slicedConfig, chart_type: chartTypeOverride || slicedConfig.chart_type };
    if (pinnedCharts.some(c => c.sql_used === configToPin.sql_used && c.chart_type === configToPin.chart_type && c.data?.length === configToPin.data?.length)) {
      setPinState('duplicate'); setTimeout(() => setPinState('idle'), 2000); return;
    }
    setPinnedCharts(prev => [...prev, { ...configToPin, id: Date.now() }]);
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

  const slicedData = useMemo(() => {
    if (!currentData || !currentData.data) return null;
    if (dataSlicerLimit === 'All') return currentData.data;
    return currentData.data.slice(0, parseInt(dataSlicerLimit, 10));
  }, [currentData, dataSlicerLimit]);

  const slicedConfig = useMemo(() => {
    if (!currentData || !slicedData) return null;
    return { ...currentData, data: slicedData };
  }, [currentData, slicedData]);

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

  const renderKPIs = (data, xAxis, yAxis) => {
    if (!data || data.length === 0) return null;
    let total = 0;
    let max = -Infinity;
    let isNumeric = false;
    
    // Find numeric column
    const keys = Object.keys(data[0]);
    let numericKey = yAxis;
    if (!numericKey || isNaN(parseFloat(data[0][numericKey]))) {
      numericKey = keys.find(k => k !== xAxis && !isNaN(parseFloat(data[0][k])));
    }

    if (numericKey) {
      isNumeric = true;
      data.forEach(row => {
        const val = parseFloat(row[numericKey]);
        if (!isNaN(val)) {
          total += val;
          if (val > max) max = val;
        }
      });
    }

    return <KpiCards data={data} isNumeric={isNumeric} numericKey={numericKey} total={total} max={max} />;
  };

  const renderKPIsHorizontal = (data, xAxis, yAxis) => {
    if (!data || data.length === 0) return null;
    let total = 0;
    let max = -Infinity;
    let numericKey = yAxis;
    const keys = Object.keys(data[0]);
    
    if (!numericKey || isNaN(parseFloat(data[0][numericKey]))) {
      numericKey = keys.find(k => k !== xAxis && !isNaN(parseFloat(data[0][k])));
    }

    if (numericKey) {
      data.forEach(row => {
        const val = parseFloat(row[numericKey]);
        if (!isNaN(val)) {
          total += val;
          if (val > max) max = val;
        }
      });
    }

    if (!numericKey) return null;

    return (
      <div className="flex flex-wrap items-center justify-between w-full gap-4">
        {/* Total Metric Card */}
        <div className="premium-metric-card group">
          <div className="metric-icon-box bg-indigo-500/10 text-indigo-500 border border-indigo-500/10">
            <Activity size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-tertiary)] mb-1">Total {numericKey}</span>
            <div className="flex items-baseline gap-2">
              <strong className="text-xl font-black text-[var(--text-primary)] tracking-tight">{total.toLocaleString()}</strong>
              <span className="flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                <ChevronRight size={10} className="-rotate-90" /> 12.5%
              </span>
            </div>
          </div>
        </div>

        {/* Avg Metric Card */}
        <div className="premium-metric-card group">
          <div className="metric-icon-box bg-purple-500/10 text-purple-500 border border-purple-500/10">
            <Zap size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-tertiary)] mb-1">Average Value</span>
            <div className="flex items-baseline gap-2">
              <strong className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                {(total / data.length).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </strong>
              <span className="text-[10px] font-medium text-[var(--text-tertiary)]">per record</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

          {/* 1. Page Title */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              {activeDataset?.name || 'Getting Started'}
            </h1>
            <div className="hidden sm:block h-6 w-[1px] bg-[var(--border-color)] mx-2" />
            
            {/* View Dataset Button */}
            {activeDataset && (
              <button
                onClick={() => setShowPreview(true)}
                title="Preview Raw Data"
                className="group inline-flex items-center justify-center gap-2 h-9 px-4 
                           bg-white dark:bg-neutral-900 
                           border border-neutral-200 dark:border-neutral-700 
                           rounded-[9px] cursor-pointer shrink-0
                           hover:border-indigo-300 dark:hover:border-indigo-600
                           hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30
                           hover:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]
                           hover:-translate-y-px
                           active:translate-y-0 active:scale-[0.97]
                           transition-all duration-150"
              >
                <Table size={15} className="text-neutral-400 group-hover:text-indigo-500 transition-colors duration-150" />
                <span className="hidden sm:inline text-[13px] font-medium text-neutral-500 dark:text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-150">
                  Preview Dataset
                </span>
              </button>
            )}
          </div>


          {/* 2. Search Bar (Mobile Only) */}
          <div className="searchbar sm:!hidden" style={{ flex: 1, position: 'relative' }}>
            
            {isLoading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <Search size={18} className="searchbar__icon" />}
            
            <div className="relative flex-1 flex flex-col justify-center min-w-0">
              <input
                ref={searchInputRef}
                type="text"
                className="searchbar__input w-full pr-8"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={activeDataset ? 'Ask anything about your data...' : 'Select a dataset to begin...'}
                disabled={isLoading || !activeDataset}
              />
              {prompt.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => { setPrompt(''); searchInputRef.current?.focus(); }}
                  title="Clear search"
                  className="absolute right-2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors rounded-full"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Keyboard hint (Visible on Desktop) */}
            <span style={{ display: 'none', padding: '4px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', background: 'var(--surface-hover)', borderRadius: '6px', border: '1px solid var(--border-color)' }} className="sm:inline-block">
              Ctrl K
            </span>

            <button className="searchbar__btn" onClick={() => handleSubmit()} disabled={isLoading || !prompt.trim() || !activeDataset}>
              <Sparkles size={14} />
              <span style={{ display: 'none' }} className="sm:inline">Generate</span>
            </button>
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
            <div className="animate-slide-up pb-8 pl-1 sm:pl-2 xl:pl-4">
              {/* ── Main Chart Area (Full Width now, moving metadata to top) ── */}
              <div className="flex flex-col min-w-0">
                
                {/* ── Metadata Top Bar (New Clean Version) ── */}
                <div className="flex flex-col mb-6">
                   <div className="w-full">
                      {renderKPIsHorizontal(currentData.data, currentData.x_axis_column, currentData.y_axis_column)}
                   </div>
                </div>

                <div className="chart-panel-container flex-1 flex flex-col m-0 shadow-md">
                   
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

                      {/* Segmented Control: Data Slicer */}
                      <div className="segmented-control hidden sm:flex">
                        {['5', '10', 'All'].map(limit => (
                          <button
                            key={limit}
                            className={`seg-btn ${dataSlicerLimit === limit ? 'active' : ''}`}
                            onClick={() => setDataSlicerLimit(limit)}
                          >
                            <span>Top {limit}</span>
                          </button>
                        ))}
                      </div>

                      <div className="divider-vert hidden sm:block" />

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

                      <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`action-btn ${isSidebarOpen ? 'active' : ''}`}
                        style={isSidebarOpen ? { background: 'var(--accent-blue)', color: 'white' } : { background: 'var(--accent-light)', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
                      >
                        <MessageSquare size={14} />
                        <span className="action-btn-text">{isSidebarOpen ? 'Close Chat' : 'Open Chat'}</span>
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
                              {slicedConfig?.data?.[0] && Object.keys(slicedConfig.data[0]).map(k => (
                                <th key={k}>{k}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {slicedConfig?.data?.slice(0, 100).map((row, i) => (
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
                        <MemoizedChart config={slicedConfig} overrideChartType={chartTypeOverride} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* ── WELCOME / EMPTY STATE ── */}
          {!isLoading && !currentData && (
            <>
              {/* ── MOBILE: compact hint only ── */}
              <div className="flex sm:hidden flex-col items-center justify-center text-center px-6 animate-fade-in" style={{ minHeight: '45vh' }}>
                <Search size={32} className="mb-4 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Type a question about your data above to get started.
                </p>
              </div>

              {/* ── DESKTOP: full hero ── */}
              <div className="flex flex-col animate-fade-in py-4 pl-1" style={{ minHeight: '50vh' }}>
                
                {/* Workspaces Section (New) */}
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-sm">
                        <Database size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Your Workspaces</h2>
                        <p className="text-xs text-[var(--text-tertiary)] font-medium">Select a dataset to start chatting</p>
                      </div>
                    </div>
                    <button className="exec-pdf-btn px-4 h-9 flex items-center gap-2" style={{ width: 'auto' }} onClick={onUploadClick}>
                      <Plus size={16} /> <span className="text-xs font-bold uppercase tracking-wider">New Workspace</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {datasets.map(d => (
                      <button 
                        key={d.id} 
                        onClick={() => setActiveDataset(d)}
                        className={`workspace-card glass-panel group ${activeDataset?.id === d.id ? 'active' : ''}`}
                      >
                         <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/10 transition-all">
                               <Table size={24} />
                            </div>
                            <div className="text-left overflow-hidden">
                               <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">{d.name}</h3>
                               <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">CSV Dataset</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border-color)]">
                            <span className="text-[10px] font-bold text-[var(--text-tertiary)]">ID: {String(d.id).slice(0, 8)}</span>
                            <div className="w-5 h-5 rounded-full border border-[var(--border-color)] flex items-center justify-center group-hover:border-indigo-400 group-hover:bg-indigo-400/10 transition-all">
                               <ChevronRight size={10} className="group-hover:text-indigo-400" />
                            </div>
                         </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="hidden sm:flex flex-col items-center justify-center text-center py-8">
                  <h1 className="text-3xl lg:text-4xl font-black mb-3 leading-tight tracking-tight">
                    Lumina <span className="gradient-text">Conversational BI</span>
                  </h1>
                  <p className="text-base text-[var(--text-secondary)] max-w-md mb-10 leading-relaxed">
                    Ask anything about your data — trends, breakdowns, comparisons — and let AI render it instantly.
                  </p>

                  {/* Suggestion cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
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
                        <div className="flex flex-col">
                          <div className={`suggestion-icon-box shrink-0 ${c.color} mb-4`}>{c.icon}</div>
                          <h3 className="suggestion-title mb-1">{c.title}</h3>
                          <p className="suggestion-text">"{c.desc}"</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] group-hover:text-indigo-400 transition-colors">
                          <Sparkles size={9} /> Try this
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </>
          )}

          {/* ── EXECUTIVE DASHBOARD (PINNED CHARTS) ── */}
          {pinnedCharts.length > 0 && !isLoading && (
            <div className="exec-dashboard-section animate-slide-up">

              {/* ── Section header ── */}
              <div className="exec-dashboard-header">
                <div className="exec-dashboard-title-group">
                 
                  <div>
                    <h2 className="exec-dashboard-title">Executive Dashboard</h2>
                    <p className="exec-dashboard-sub">
                      <span className="">{pinnedCharts.length}</span>
                      {' '}insight{pinnedCharts.length !== 1 ? 's' : ''} · drag cards to reorder
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => { setIsExportingPDF(true); try { await generatePDFReport(pinnedCharts, activeDataset?.name || 'Report'); } finally { setIsExportingPDF(false); } }}
                    disabled={isExportingPDF}
                    className="exec-pdf-btn"
                  >
                    {isExportingPDF
                      ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> Generating…</>
                      : <><FileText size={14} /> Export PDF</>}
                  </button>
                  <button 
                    onClick={onAnalyticsClick}
                    className="exec-pdf-btn"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', borderColor: 'rgba(139,92,246,0.3)', color: '#8b5cf6' }}
                  >
                    <Sparkles size={14} /> Generate Professional Board
                  </button>

                </div>
              </div>

              {/* ── Cards grid ── */}
              <div className="pinned-cards-grid">
                {pinnedCharts.map((chart, index) => {
                  const typeColors = {
                    bar:   { accent: '#6366f1', glow: 'rgba(99,102,241,0.15)',  label: 'BAR' },
                    line:  { accent: '#22d3ee', glow: 'rgba(34,211,238,0.15)',  label: 'LINE' },
                    area:  { accent: '#a78bfa', glow: 'rgba(167,139,250,0.15)', label: 'AREA' },
                    pie:   { accent: '#f472b6', glow: 'rgba(244,114,182,0.15)', label: 'PIE' },
                  };
                  const tc = typeColors[chart.chart_type] || typeColors.bar;

                  return (
                    <div
                      key={chart.id}
                      className="pinned-card"
                      style={{ '--card-accent': tc.accent, '--card-glow': tc.glow }}
                      draggable
                      onDragStart={e => { dragItem.current = index; e.currentTarget.classList.add('dragging'); }}
                      onDragEnter={() => dragOverItem.current = index}
                      onDragEnd={e => { e.currentTarget.classList.remove('dragging'); handleSort(); }}
                      onDragOver={e => e.preventDefault()}
                    >
                      {/* Drag strip */}
                      <div className="pinned-card__drag-strip">
                        <GripHorizontal size={13} />
                        <span
                          className="pinned-card__type-badge"
                          style={{ color: tc.accent, background: tc.glow }}
                        >
                          {tc.label}
                        </span>
                      </div>

                      {/* Summary text */}
                      <p className="pinned-card__summary">{chart.explanation}</p>

                      {/* Chart */}
                      <div id={`pinned-chart-${chart.id}`} className="pinned-card__chart">
                        <MemoizedChart config={chart} compact={true} />
                      </div>

                      {/* Actions row */}
                      <div className="pinned-card__actions">
                        <button className="pca-btn" title="Export CSV" onClick={() => exportAsCSV(chart.data, `pinned_${chart.id}`)}>
                          <Download size={11} /> CSV
                        </button>
                        <button className="pca-btn" title="Export PNG" onClick={() => exportAsPNG(`pinned-chart-${chart.id}`, `pinned_${chart.id}`)}>
                          <ImageIcon size={11} /> PNG
                        </button>
                        <button className="pca-btn pca-btn--danger" title="Remove" onClick={() => handleUnpinChart(chart.id)}>
                          <Trash2 size={11} /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Bottom spacer — keeps content away from FAB / nav bar */}
          <div style={{ height: '120px' }} className="sm:hidden" />
          <div style={{ height: '64px' }} className="hidden sm:block" />
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
              title="Close Assistant"
              className="close-sidebar-btn px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-400/10 transition-all font-bold text-[11px] uppercase tracking-wider"
            >
              <X size={14} />
              <span>Close</span>
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
                <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'} relative group`}>
                  <button
                    onClick={() => handleRemoveMessage(i)}
                    className="absolute top-2 right-2 w-4 h-4 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100
                               bg-transparent border-none cursor-pointer text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-400/10
                               transition-all"
                    title="Remove"
                  >
                    <X size={10} />
                  </button>
                  <div className="bubble-content text-xs leading-relaxed">{msg.text}</div>
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
            <div className="chat-bubble ai-bubble flex items-center gap-2">
                <span className="spinner" style={{ width: 11, height: 11, borderWidth: 2 }} />
                <span className="text-xs text-[var(--text-secondary)]">Analyzing…</span>
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
              placeholder={history.length === 0 ? "Ask anything about your data..." : "Ask follow-up..."}
              disabled={isLoading || isSideLoading || !activeDataset}
              className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            />
            <button
              onClick={() => handleSubmit(sidePrompt, true)}
              disabled={isLoading || isSideLoading || !sidePrompt.trim() || !activeDataset}
              className="side-send-btn"
            >
              <Send size={15} />
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