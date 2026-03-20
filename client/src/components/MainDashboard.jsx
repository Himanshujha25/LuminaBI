import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search, Send, MessageSquare, ListFilter, Sparkles, Activity,
  Download, Image as ImageIcon, X, GripHorizontal, Trash2,
  LayoutDashboard, PieChart, Zap, Eye, FileText, ChevronRight,
  Database, ChevronDown, BarChart3, LineChart,
  TrendingUp, Hash, Sigma, ArrowUpRight,
  BarChart2, Layers, Check, Maximize2, Minimize2, Pin, Target, Bot
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
import WorkspaceDropdown from './WorkspaceDropdown';
import useStore from '../store/useStore';

const MemoizedChart = React.memo(DynamicChartComponent);

/* ── KPI color themes ─────────────────────────────────────────────────────── */
const KPI_THEMES = [
  { bg: 'linear-gradient(135deg,#312e81,#4f46e5)', glow: 'rgba(79,70,229,.35)',  icon: <Sigma size={15}/> },
  { bg: 'linear-gradient(135deg,#1e3a5f,#0ea5e9)', glow: 'rgba(14,165,233,.35)', icon: <Activity size={15}/> },
  { bg: 'linear-gradient(135deg,#1a2e1a,#16a34a)', glow: 'rgba(22,163,74,.35)',  icon: <TrendingUp size={15}/> },
  { bg: 'linear-gradient(135deg,#3b1f1f,#dc2626)', glow: 'rgba(220,38,38,.35)',  icon: <Target size={15}/> },
  { bg: 'linear-gradient(135deg,#2d1b4e,#9333ea)', glow: 'rgba(147,51,234,.35)', icon: <Hash size={15}/> },
];

const CHART_TYPES = [
  { id: 'bar',  label: 'Bar',  icon: <BarChart3 size={12}/> },
  { id: 'line', label: 'Line', icon: <LineChart size={12}/> },
  { id: 'area', label: 'Area', icon: <Activity size={12}/> },
  { id: 'pie',  label: 'Pie',  icon: <PieChart size={12}/> },
];

const DATA_LIMITS = ['5', '10', '25', '50', 'All'];

/* ── KPI Card ─────────────────────────────────────────────────────────────── */
function KpiCard({ theme, label, value, sub }) {
  return (
    <div className="lm-kpi-card" style={{ '--kpi-bg': theme.bg, '--kpi-glow': theme.glow }}>
      <div className="lm-kpi-icon">{theme.icon}</div>
      <div className="lm-kpi-body">
        <span className="lm-kpi-label">{label}</span>
        <span className="lm-kpi-value">{value}</span>
        {sub && <span className="lm-kpi-sub">{sub}</span>}
      </div>
    </div>
  );
}

/* ── Shared dropdown hook ─────────────────────────────────────────────────── */
/*
  THE FIX: The `mousedown` listener on `document` used to close the menu
  immediately when clicking a menu item — before `click` could fire.
  Solution: attach a `menuRef` to the portal div and exclude it from
  the close condition. Now mousedown inside the menu is ignored, so
  the item's onClick fires normally, then closes the menu itself.
*/
function useDropdown() {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0, minWidth: 0 });
  const btnRef  = useRef(null);
  const menuRef = useRef(null);

  const openMenu = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left, minWidth: Math.max(r.width, 148) });
    }
    setOpen(true);
  };

  useEffect(() => {
    const onMouseDown = e => {
      // Keep open if clicking inside the trigger or the menu itself
      if (btnRef.current?.contains(e.target))  return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('scroll',    onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('scroll',    onScroll, true);
    };
  }, []);

  return { open, setOpen, pos, btnRef, menuRef, openMenu };
}

/* ── Chart type dropdown ──────────────────────────────────────────────────── */
function ChartTypeDropdown({ value, onChange, isDark }) {
  const { open, setOpen, pos, btnRef, menuRef, openMenu } = useDropdown();
  const current = CHART_TYPES.find(t => t.id === value) || CHART_TYPES[0];

  const menuStyle = {
    position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999,
    background:   isDark ? '#1f2937' : '#ffffff',
    border:       isDark ? '1px solid #374151' : '1px solid #e2e8f0',
    borderRadius: 10,
    boxShadow: isDark
      ? '0 20px 25px -5px rgba(0,0,0,.6), 0 8px 10px -6px rgba(0,0,0,.5)'
      : '0 10px 25px -5px rgba(0,0,0,.12), 0 4px 10px -6px rgba(0,0,0,.06)',
    minWidth: pos.minWidth, overflow: 'hidden',
  };
  const itemBase = {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '9px 14px', border: 'none',
    fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', textAlign: 'left',
  };
  const itemStyle = active => ({
    ...itemBase,
    background: active ? (isDark ? 'rgba(99,102,241,.25)' : '#e0e7ff') : 'transparent',
    color: active ? (isDark ? '#a5b4fc' : '#4338ca') : (isDark ? '#d1d5db' : '#374151'),
    fontWeight: active ? 600 : 400,
  });

  return (
    <>
      <button ref={btnRef} className="lm-dropdown-btn"
        onClick={open ? () => setOpen(false) : openMenu}>
        {current.icon}<span>{current.label}</span>
        <ChevronDown size={10} style={{ opacity: .5 }}/>
      </button>
      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={menuStyle}>
          {CHART_TYPES.map(t => (
            <button key={t.id}
              style={itemStyle(value === t.id)}
              onMouseEnter={e => { if (value !== t.id) { e.currentTarget.style.background = isDark ? '#374151' : '#f5f3ff'; }}}
              onMouseLeave={e => { e.currentTarget.style.background = value === t.id ? (isDark ? 'rgba(99,102,241,.25)' : '#e0e7ff') : 'transparent'; }}
              onClick={() => { onChange(t.id); setOpen(false); }}>
              {t.icon}{t.label}
              {value === t.id && <Check size={10} style={{ marginLeft: 'auto', color: isDark ? '#a5b4fc' : '#4338ca' }}/>}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

/* ── Data limit dropdown ──────────────────────────────────────────────────── */
function DataLimitDropdown({ value, onChange, isDark }) {
  const { open, setOpen, pos, btnRef, menuRef, openMenu } = useDropdown();

  const menuStyle = {
    position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999,
    background:   isDark ? '#1f2937' : '#ffffff',
    border:       isDark ? '1px solid #374151' : '1px solid #e2e8f0',
    borderRadius: 10,
    boxShadow: isDark
      ? '0 20px 25px -5px rgba(0,0,0,.6), 0 8px 10px -6px rgba(0,0,0,.5)'
      : '0 10px 25px -5px rgba(0,0,0,.12), 0 4px 10px -6px rgba(0,0,0,.06)',
    minWidth: pos.minWidth, overflow: 'hidden',
  };
  const itemBase = {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '9px 14px', border: 'none',
    fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', textAlign: 'left',
  };
  const itemStyle = active => ({
    ...itemBase,
    background: active ? (isDark ? 'rgba(99,102,241,.25)' : '#e0e7ff') : 'transparent',
    color: active ? (isDark ? '#a5b4fc' : '#4338ca') : (isDark ? '#d1d5db' : '#374151'),
    fontWeight: active ? 600 : 400,
  });

  return (
    <>
      <button ref={btnRef} className="lm-dropdown-btn"
        onClick={open ? () => setOpen(false) : openMenu}>
        <Layers size={12}/><span>Top {value}</span>
        <ChevronDown size={10} style={{ opacity: .5 }}/>
      </button>
      {open && ReactDOM.createPortal(
        <div ref={menuRef} style={menuStyle}>
          {DATA_LIMITS.map(o => (
            <button key={o}
              style={itemStyle(value === o)}
              onMouseEnter={e => { if (value !== o) { e.currentTarget.style.background = isDark ? '#374151' : '#f5f3ff'; }}}
              onMouseLeave={e => { e.currentTarget.style.background = value === o ? (isDark ? 'rgba(99,102,241,.25)' : '#e0e7ff') : 'transparent'; }}
              onClick={() => { onChange(o); setOpen(false); }}>
              <Hash size={11}/>{o === 'All' ? 'All rows' : `Top ${o}`}
              {value === o && <Check size={10} style={{ marginLeft: 'auto', color: isDark ? '#a5b4fc' : '#4338ca' }}/>}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const MainDashboard = () => {
  const navigate = useNavigate();
  const {
    activeDataset,
    isDark: isDarkStore,
    token,
    setCurrentView,
    isAiPanelOpen: isSidebarOpen,
    setIsAiPanelOpen: setIsSidebarOpen,
    user: storeUser,
    showPreview,
    setShowPreview,
  } = useStore();

  /* Reliable dark detection — store value OR DOM attribute */
  const isDark = isDarkStore ?? document.documentElement.getAttribute('data-theme') === 'dark';

  const [prompt, setPrompt]                         = useState('');
  const [isLoading, setIsLoading]                   = useState(false);
  const [isSideLoading, setIsSideLoading]           = useState(false);
  const [chatHistories, setChatHistories]           = useState({});
  const [chartTypeOverride, setChartTypeOverride]   = useState(null);
  const [showSQL, setShowSQL]                       = useState(false);
  const [viewMode, setViewMode]                     = useState('chart');
  const [sidePrompt, setSidePrompt]                 = useState('');
  const [pinState, setPinState]                     = useState('idle');
  const [isExportingPDF, setIsExportingPDF]         = useState(false);
  const [dataSlicerLimit, setDataSlicerLimit]       = useState('All');
  const isChartFullscreen = false;

  const userId          = storeUser?.id || 'guest';
  const PIN_STORAGE_KEY = `lumina_pinned_charts_${userId}`;

  const [pinnedCharts, setPinnedCharts] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(PIN_STORAGE_KEY) || '[]');
      const seen = new Set();
      return parsed.filter(c => {
        const key = `${c.sql_used}_${c.chart_type}`;
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
    } catch { return []; }
  });

  const handleAnalyticsClick = () => {
    if (!activeDataset) return;
    const slugName = activeDataset.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    navigate(`/analytics/${slugName}/${activeDataset.id}/lumina_25`);
    setCurrentView('analytics');
  };

  const dragItem        = useRef(null);
  const dragOverItem    = useRef(null);
  const chatScrollRef   = useRef(null);
  const chatEndRef      = useRef(null);
  const searchInputRef  = useRef(null);

  const history = activeDataset ? (chatHistories[activeDataset.id] || []) : [];

  useEffect(() => { localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(pinnedCharts)); }, [pinnedCharts, PIN_STORAGE_KEY]);

  useEffect(() => {
    const ctrl = new AbortController();
    if (activeDataset?.id && !chatHistories[activeDataset.id]) {
      setIsSideLoading(true);
      const tkn = localStorage.getItem('token');
      axios.get(`${API_URL}/datasets/${activeDataset.id}/chats`, {
        signal: ctrl.signal, timeout: 10000, headers: { Authorization: `Bearer ${tkn}` }
      })
        .then(res => setChatHistories(prev => ({
          ...prev,
          [activeDataset.id]: res.data.map(r => ({ id: r.id, role: r.role, text: r.text, data: r.data || null }))
        })))
        .catch(err => { if (err.name !== 'CanceledError') console.error(err); })
        .finally(() => setIsSideLoading(false));
    }
    return () => ctrl.abort();
  }, [activeDataset?.id]);

  useEffect(() => {
    const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    window.addEventListener('resize', setVh); setVh();
    return () => window.removeEventListener('resize', setVh);
  }, []);

  useEffect(() => {
    const fn = e => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchInputRef.current?.focus(); } };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  useEffect(() => {
    setChartTypeOverride(null); setShowSQL(false); setViewMode('chart');
    setPrompt(''); setSidePrompt(''); setDataSlicerLimit('All');
  }, [activeDataset?.id]);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [history, isSideLoading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => window.dispatchEvent(new Event('resize')), 450);
  }, [history, isSidebarOpen]);

  const handleSubmit = async (overridePrompt, isSideSearch = false) => {
    const q = (overridePrompt || prompt).trim();
    if (!q || !activeDataset) return;
    isSideSearch ? setIsSideLoading(true) : setIsLoading(true);
    setChartTypeOverride(null); setDataSlicerLimit('All');
    setChatHistories(prev => ({ ...prev, [activeDataset.id]: [...(prev[activeDataset.id] || []), { role: 'user', text: q }] }));
    isSideSearch ? setSidePrompt('') : setPrompt('');
    try {
      const tkn = localStorage.getItem('token');
      const { data } = await axios.post(`${API_URL}/query`, {
        prompt: q, datasetId: activeDataset.id, history: history.slice(-6)
      }, { headers: { Authorization: `Bearer ${tkn}` } });
      setChatHistories(prev => ({ ...prev, [activeDataset.id]: [...(prev[activeDataset.id] || []),
        { id: data.message_id, role: 'ai', text: data.explanation || data.message || 'Here is what I found.', data }
      ]}));
    } catch (err) {
      const msg = `❌ ${err.response?.data?.error || 'Something went wrong'}`;
      setChatHistories(prev => ({ ...prev, [activeDataset.id]: [...(prev[activeDataset.id] || []), { role: 'ai', text: msg }] }));
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
      await axios.delete(`${API_URL}/datasets/${activeDataset.id}/chats`, { headers: { Authorization: `Bearer ${token}` } });
      setChatHistories(prev => ({ ...prev, [activeDataset.id]: [] }));
      setPrompt(''); setSidePrompt('');
    } catch (e) { console.error(e); }
  };

  const handleRemoveMessage = async index => {
    const msg = history[index];
    const headers = { Authorization: `Bearer ${token}` };
    if (msg.id) {
      try {
        await axios.delete(`${API_URL}/chats/${msg.id}`, { headers });
      } catch (err) {
        console.error('Failed to delete chat message:', err);
      }
    }
    const nh = [...history];
    if (nh[index].role === 'user' && nh[index + 1]?.role === 'ai') {
      if (nh[index + 1].id) axios.delete(`${API_URL}/chats/${nh[index + 1].id}`, { headers }).catch(() => {});
      nh.splice(index, 2);
    } else if (nh[index].role === 'ai' && nh[index - 1]?.role === 'user') {
      if (nh[index - 1].id) axios.delete(`${API_URL}/chats/${nh[index - 1].id}`, { headers }).catch(() => {});
      nh.splice(index - 1, 2);
    } else { nh.splice(index, 1); }
    setChatHistories(prev => ({ ...prev, [activeDataset.id]: nh }));
  };

  const exportAsCSV = (data, filename) => {
    if (!data?.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`${headers}\n${rows}`], { type: 'text/csv' }));
    a.download = `${filename}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  const exportAsPNG = async (elementId, filename) => {
    const el = document.getElementById(elementId); if (!el) return;
    try {
      const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
      const a = document.createElement('a'); a.download = `${filename}.png`;
      a.href = canvas.toDataURL('image/png'); a.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
  };

  const currentData = useMemo(() =>
    history.slice().reverse().find(h => h.role === 'ai' && h.data)?.data,
  [history]);

  const slicedData = useMemo(() => {
    if (!currentData?.data) return null;
    if (dataSlicerLimit === 'All') return currentData.data;
    return currentData.data.slice(0, parseInt(dataSlicerLimit, 10));
  }, [currentData, dataSlicerLimit]);

  const slicedConfig = useMemo(() => {
    if (!currentData || !slicedData) return null;
    return { ...currentData, data: slicedData };
  }, [currentData, slicedData]);

  /* ── Robust KPI stats ── */
  const kpiStats = useMemo(() => {
    if (!currentData?.data?.length) return null;
    const data = currentData.data;
    const keys = Object.keys(data[0]);

    const isNumeric = (row, k) => {
      const v = row[k];
      if (v === null || v === undefined || v === '') return false;
      return !isNaN(parseFloat(String(v).replace(/,/g, '')));
    };
    const parseNum = v => parseFloat(String(v).replace(/,/g, ''));

    let numKey = null;
    if (currentData.y_axis_column && isNumeric(data[0], currentData.y_axis_column)) {
      numKey = currentData.y_axis_column;
    } else {
      const numericKeys = keys.filter(k => k !== currentData.x_axis_column && isNumeric(data[0], k));
      numKey = numericKeys[0] || keys.find(k => {
        const count = data.filter(r => isNumeric(r, k)).length;
        return count > data.length * 0.5;
      });
    }

    if (!numKey) {
      return [{ ...KPI_THEMES[4], label: 'Records', value: data.length.toLocaleString(), sub: 'Total rows' }];
    }

    const vals = data.map(r => parseNum(r[numKey])).filter(v => !isNaN(v));
    if (!vals.length) return null;
    const total = vals.reduce((a, b) => a + b, 0);
    const avg   = total / vals.length;
    const max   = Math.max(...vals);
    const min   = Math.min(...vals);
    const fmt   = v => {
      const abs = Math.abs(v);
      if (abs >= 1e9) return `${(v/1e9).toFixed(1)}B`;
      if (abs >= 1e6) return `${(v/1e6).toFixed(1)}M`;
      if (abs >= 1e3) return `${(v/1e3).toFixed(1)}K`;
      return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
    };
    return [
      { ...KPI_THEMES[0], label: numKey,    value: fmt(total), sub: 'Total sum' },
      { ...KPI_THEMES[1], label: 'Average', value: fmt(avg),   sub: 'Per record' },
      { ...KPI_THEMES[2], label: 'Peak',    value: fmt(max),   sub: 'Highest' },
      { ...KPI_THEMES[3], label: 'Min',     value: fmt(min),   sub: 'Lowest' },
      { ...KPI_THEMES[4], label: 'Records', value: data.length.toLocaleString(), sub: 'Total rows' },
    ];
  }, [currentData]);

  const Skeleton = ({ className }) => <div className={`skeleton rounded-xl ${className}`} />;
  const suggestedPrompts = ['Show top 10 by revenue', 'Monthly trend analysis', 'Compare categories', 'Distribution breakdown'];

  return (
    <div className="dashboard-wrapper">

      <main className="dashboard-main flex flex-col min-h-0">

        {/* ── Topbar ── */}
        <header className="topbar-shell">
          <WorkspaceDropdown />

          <div className="searchbar" style={{ flex: 1, position: 'relative' }}>
            {isLoading
              ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              : <Search size={18} className="searchbar__icon" />}
            <div className="relative flex-1 flex flex-col justify-center min-w-0">
              <input
                ref={searchInputRef} type="text"
                className="searchbar__input w-full pr-8"
                value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={handleKeyPress}
                placeholder={activeDataset ? 'Ask anything about your data… (Ctrl+K)' : 'Select a dataset to begin...'}
                disabled={isLoading || !activeDataset}
              />
              {prompt.trim() && (
                <button type="button" onClick={() => { setPrompt(''); searchInputRef.current?.focus(); }}
                  className="absolute right-2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors rounded-full">
                  <X size={15} />
                </button>
              )}
            </div>
            <button className="searchbar__btn" onClick={() => handleSubmit()} disabled={isLoading || !prompt.trim() || !activeDataset}>
              <Sparkles size={14} /><span>Ask</span>
            </button>
          </div>

          <div className="lm-topbar-right">

            <button className={`lm-ai-toggle ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen
                ? <><ChevronRight size={14}/><span>Close AI</span></>
                : <><Sparkles size={14}/><span>AI Chat</span></>
              }
            </button>
          </div>
        </header>

        {/* ── Body row ── */}
        <div className="lm-body-row">

          {/* Content column */}
          <div className="lm-content-col">

            {isLoading && (
              <div className="space-y-4 animate-fade-in" style={{ paddingTop: 20 }}>
                <div className="lm-kpi-row">
                  {[...Array(5)].map((_, i) => <div key={i} className="skeleton rounded-xl" style={{ height: 82 }} />)}
                </div>
                <Skeleton className="h-12" />
                <Skeleton className="h-80" />
              </div>
            )}

            {!isLoading && currentData && (
              <div className="lm-data-view animate-slide-up">

                {/* KPI Row */}
                {kpiStats && (
                  <div className="lm-kpi-row">
                    {kpiStats.map((k, i) => <KpiCard key={i} theme={k} label={k.label} value={k.value} sub={k.sub} />)}
                  </div>
                )}

                {/* Chart panel */}
                <div className={`chart-panel-container ${isChartFullscreen ? 'lm-fullscreen' : ''}`}>
                  <div className="chart-panel-header">
                    <div className="chart-panel-title">
                      <BarChart2 size={16} className="title-icon" />
                      <h2>Visualization</h2>
                      {currentData.chart_type && (
                        <span className="lm-chart-badge">{chartTypeOverride || currentData.chart_type}</span>
                      )}
                    </div>

                    <div className="chart-panel-actions">
                      <div className="segmented-control">
                        <button className={`seg-btn ${viewMode === 'chart' ? 'active' : ''}`} onClick={() => setViewMode('chart')}>
                          <BarChart3 size={13}/><span>Chart</span>
                        </button>
                        <button className={`seg-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
                          <ListFilter size={13}/><span>Table</span>
                        </button>
                      </div>

                      <div className="divider-vert" />

                      {viewMode === 'chart' && (
                        <ChartTypeDropdown
                          value={chartTypeOverride || currentData.chart_type}
                          onChange={setChartTypeOverride}
                          isDark={isDark}
                        />
                      )}
                      <DataLimitDropdown value={dataSlicerLimit} onChange={setDataSlicerLimit} isDark={isDark} />

                      <div className="divider-vert" />

                      <button className={`action-btn ${showSQL ? 'active' : ''}`} onClick={() => setShowSQL(!showSQL)}>
                        <Database size={14}/><span className="action-btn-text">SQL</span>
                      </button>
                      <button className="action-btn icon-only" onClick={() => exportAsCSV(currentData.data, 'lumina_export')} title="Export CSV">
                        <Download size={14}/>
                      </button>
                      <button className="action-btn icon-only" onClick={() => exportAsPNG('main-chart-export', 'lumina_insight')} title="Export PNG">
                        <ImageIcon size={14}/>
                      </button>

                      <div className="divider-vert" />

                      <button onClick={handlePinChart} className={`primary-btn ${pinState !== 'idle' ? pinState : ''}`}>
                        <Pin size={13}/>
                        <span className="action-btn-text">
                          {pinState === 'success' ? 'Pinned!' : pinState === 'duplicate' ? 'Saved' : 'Pin'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {showSQL && (
                    <div className="sql-viewer-pro">
                      <div className="sql-label-pro"><Database size={12}/> Executed PostgreSQL Query</div>
                      <code>{currentData.sql_used}</code>
                    </div>
                  )}

                  {/* AI Summary — sits between header and chart, always visible */}
                  {currentData.explanation && (
                    <div className="lm-summary-bar animate-fade-in">
                      <div className="lm-summary-accent" />
                      <div className="lm-summary-content">
                        <span className="lm-summary-tag">AI Summary</span>
                        <p className="lm-summary-text">{currentData.explanation}</p>
                      </div>
                    </div>
                  )}

                  <div id="main-chart-export" className="chart-content-area">
                    {viewMode === 'table' ? (
                      <div className="pro-table-wrapper">
                        <table className="pro-table">
                          <thead>
                            <tr>{slicedConfig?.data?.[0] && Object.keys(slicedConfig.data[0]).map(k => <th key={k}>{k}</th>)}</tr>
                          </thead>
                          <tbody>
                            {slicedConfig?.data?.slice(0, 100).map((row, i) => (
                              <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{String(v ?? '')}</td>)}</tr>
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
            )}

            {!isLoading && !currentData && (
              <>
                <div className="flex sm:hidden flex-col items-center justify-center text-center px-6 animate-fade-in" style={{ minHeight: '45vh' }}>
                  <Search size={32} className="mb-4 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Type a question about your data above.</p>
                </div>
                <div className="flex flex-col animate-fade-in py-4 pl-1" style={{ minHeight: '40vh' }}>
                  <div className="hidden sm:flex flex-col items-center justify-center text-center py-8">
                    <h1 className="text-3xl lg:text-4xl font-black mb-3 leading-tight tracking-tight">
                      Lumina <span className="gradient-text">Conversational BI</span>
                    </h1>
                    <p className="text-base max-w-md mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Ask anything about your data — trends, breakdowns, comparisons — AI renders it instantly.
                    </p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center', maxWidth:480 }}>
                      {suggestedPrompts.map((s, i) => (
                        <button key={i} className="lm-suggestion-chip" onClick={() => handleSubmit(s)}>
                          <Sparkles size={11}/>{s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {pinnedCharts.length > 0 && !isLoading && (
              <div className="exec-dashboard-section animate-slide-up">
                <div className="exec-dashboard-header">
                  <div className="exec-dashboard-title-group">
                    <div>
                      <h2 className="exec-dashboard-title">Executive Board</h2>
                      <p className="exec-dashboard-sub">{pinnedCharts.length} insight{pinnedCharts.length !== 1 ? 's' : ''} · drag to reorder</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => { setIsExportingPDF(true); try { await generatePDFReport(pinnedCharts, activeDataset?.name || 'Report'); } finally { setIsExportingPDF(false); } }}
                      disabled={isExportingPDF} className="exec-pdf-btn">
                      {isExportingPDF ? <><span className="spinner" style={{ width:13, height:13, borderWidth:2 }}/> Generating…</> : <><FileText size={14}/> Export PDF</>}
                    </button>
                    <button onClick={handleAnalyticsClick} className="exec-pdf-btn"
                      style={{ background:'linear-gradient(135deg,rgba(99,102,241,.1),rgba(139,92,246,.1))', borderColor:'rgba(139,92,246,.3)', color:'#8b5cf6' }}>
                      <Sparkles size={14}/> Professional Board
                    </button>
                  </div>
                </div>
                <div className="pinned-cards-grid">
                  {pinnedCharts.map((chart, index) => {
                    const typeColors = {
                      bar:  { accent:'#6366f1', glow:'rgba(99,102,241,0.15)',  label:'BAR' },
                      line: { accent:'#22d3ee', glow:'rgba(34,211,238,0.15)',  label:'LINE' },
                      area: { accent:'#a78bfa', glow:'rgba(167,139,250,0.15)', label:'AREA' },
                      pie:  { accent:'#f472b6', glow:'rgba(244,114,182,0.15)', label:'PIE' },
                    };
                    const tc = typeColors[chart.chart_type] || typeColors.bar;
                    return (
                      <div key={chart.id} className="pinned-card"
                        style={{ '--card-accent':tc.accent, '--card-glow':tc.glow }}
                        draggable
                        onDragStart={e => { dragItem.current=index; e.currentTarget.classList.add('dragging'); }}
                        onDragEnter={() => { dragOverItem.current=index; }}
                        onDragEnd={e => { e.currentTarget.classList.remove('dragging'); handleSort(); }}
                        onDragOver={e => e.preventDefault()}>
                        <div className="pinned-card__drag-strip">
                          <GripHorizontal size={13}/>
                          <span className="pinned-card__type-badge" style={{ color:tc.accent, background:tc.glow }}>{tc.label}</span>
                        </div>
                        <p className="pinned-card__summary">{chart.explanation}</p>
                        <div id={`pinned-chart-${chart.id}`} className="pinned-card__chart">
                          <MemoizedChart config={chart} compact={true}/>
                        </div>
                        <div className="pinned-card__actions">
                          <button className="pca-btn" onClick={() => exportAsCSV(chart.data, `pinned_${chart.id}`)}><Download size={11}/> CSV</button>
                          <button className="pca-btn" onClick={() => exportAsPNG(`pinned-chart-${chart.id}`, `pinned_${chart.id}`)}><ImageIcon size={11}/> PNG</button>
                          <button className="pca-btn pca-btn--danger" onClick={() => handleUnpinChart(chart.id)}><Trash2 size={11}/> Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ height: 80 }} />
          </div>

          {/* AI Sidebar */}
          <aside className={`lm-ai-sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ position:'relative' }}>
            <button className="lm-sidebar-tab" onClick={() => setIsSidebarOpen(false)} title="Close AI">
              <ChevronRight size={13}/>
            </button>

            <div className="lm-sidebar-header">
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div className="lm-sidebar-logo"><Sparkles size={13} color="#fff"/></div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>Lumina AI</div>
                  <div style={{ fontSize:10, color:'var(--text-tertiary)', overflow:'hidden', textOverflow:'ellipsis', maxWidth:160, whiteSpace:'nowrap' }}>
                    {activeDataset ? activeDataset.name : 'No dataset'}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                {history.length > 0 && (
                  <button onClick={handleClearChat} title="Clear history"
                    style={{ width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', borderRadius:6 }}
                    onMouseEnter={e => e.currentTarget.style.color='#f87171'}
                    onMouseLeave={e => e.currentTarget.style.color='var(--text-tertiary)'}>
                    <Trash2 size={13}/>
                  </button>
                )}
                <button
                  type="button"
                  className="lm-sidebar-close-mobile"
                  onClick={() => setIsSidebarOpen(false)}
                  title="Close AI"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="chat-history lm-chat-messages" ref={chatScrollRef}>
              {history.length === 0 && !isSideLoading ? (
                <div className="empty-chat">
                  <Sparkles size={22} className="opacity-20 mb-3"/>
                  <p style={{ fontSize:12, color:'var(--text-tertiary)', textAlign:'center', lineHeight:1.65 }}>
                    Ask a question in the search bar.<br/>Conversation appears here.
                  </p>
                  {activeDataset && (
                    <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:12, width:'100%' }}>
                      {suggestedPrompts.slice(0,3).map((s,i) => (
                        <button key={i} className="chat-chip-btn" onClick={() => handleSubmit(s, true)}>
                          <Sparkles size={9}/><span className="text-xs">{s}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                history.map((msg, i) => {
                  const chips = msg.role === 'ai' && msg.data
                    ? (msg.data.suggested_follow_ups?.length > 0 ? msg.data.suggested_follow_ups : ['Tell me more', 'Key takeaways?'])
                    : [];
                  return (
                    <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'} relative group`}>
                      <button onClick={() => handleRemoveMessage(i)} className="lm-delete-msg"
                        style={{ position:'absolute', top:6, right:6, width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', borderRadius:4, opacity:0, transition:'opacity .12s' }}>
                        <X size={9}/>
                      </button>
                      <div className="bubble-content text-xs leading-relaxed">{msg.text}</div>
                      {chips.length > 0 && (
                        <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:10, paddingTop:10, borderTop:'1px dashed var(--border-color)' }}>
                          <span style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-tertiary)' }}>Follow-ups</span>
                          {chips.map((f,idx) => (
                            <button key={idx} onClick={() => handleSubmit(f, true)} className="chat-chip-btn">
                              <Sparkles size={9}/><span className="text-xs leading-snug">{f}</span>
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
                  <span className="spinner" style={{ width:11, height:11, borderWidth:2 }}/>
                  <span className="text-xs" style={{ color:'var(--text-secondary)' }}>Analyzing…</span>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>

            <div className="sidebar-input-area">
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                {['Trends', 'Top performer', 'Summarize'].map(s => (
                  <button key={s} className="lm-quick-chip" onClick={() => setSidePrompt(s)}>{s}</button>
                ))}
              </div>
              <div className="side-search-container glass-panel">
                <input type="text" value={sidePrompt} onChange={e => setSidePrompt(e.target.value)}
                  onKeyDown={handleSideKeyPress}
                  placeholder={history.length === 0 ? 'Ask anything…' : 'Ask a follow-up…'}
                  disabled={isLoading || isSideLoading || !activeDataset}
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                  style={{ color:'var(--text-primary)' }}
                />
                <button onClick={() => handleSubmit(sidePrompt, true)}
                  disabled={isLoading || isSideLoading || !sidePrompt.trim() || !activeDataset}
                  className="side-send-btn">
                  <Send size={15}/>
                </button>
              </div>
            </div>
          </aside>

        </div>
      </main>

      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}
          style={{ display:'none' }} />
      )}

      {showPreview && <DatasetPreview key={activeDataset?.id} dataset={activeDataset} onClose={() => setShowPreview(false)} />}
    </div>
  );
};

export default MainDashboard;
