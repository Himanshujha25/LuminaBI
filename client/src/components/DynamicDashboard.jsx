import React, { useState, useCallback, useEffect, useRef } from 'react';
import { WidthProvider, Responsive } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './DynamicDashboard.css';
import DynamicChartComponent from '../ChartComponent';
import {
  ArrowLeft, GripHorizontal, Download, Share2, Filter,
  LayoutDashboard, Save, Image as ImageIcon, Trash2, Sparkles,
  Sun, Moon, Lightbulb, ChevronDown, MonitorPlay, Columns,
  Grid3x3, Focus, FolderDown, X, Trash, Loader2, FileText,
  BarChart3, LineChart, PieChart, Table as TableIcon,
  Send, Cpu, Zap, Database, CheckCircle2, RotateCcw, Eye
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';
import { API_URL } from '../config';

const ResponsiveGridLayout = WidthProvider(Responsive);
const MemoizedChart = React.memo(DynamicChartComponent);

const TYPE_META = {
  bar:   { accent: '#6366f1', bg: '#eef2ff', darkBg: '#1e1b4b', label: 'Bar'   },
  line:  { accent: '#0891b2', bg: '#ecfeff', darkBg: '#164e63', label: 'Line'  },
  area:  { accent: '#7c3aed', bg: '#f5f3ff', darkBg: '#2e1065', label: 'Area'  },
  pie:   { accent: '#db2777', bg: '#fdf2f8', darkBg: '#500724', label: 'Pie'   },
  table: { accent: '#d97706', bg: '#fffbeb', darkBg: '#451a03', label: 'Table' },
};

export default function DynamicDashboard({
  charts, onClose, activeDataset, toggleTheme, isDark
}) {
  const [removedPanels,    setRemovedPanels]    = useState([]);
  const [expandedInsights, setExpandedInsights] = useState([]);
  const [chartFilter,      setChartFilter]      = useState('all');
  const [searchQuery,      setSearchQuery]      = useState('');
  const [isMounted,        setIsMounted]        = useState(false);
  const [isExportingPDF,   setIsExportingPDF]   = useState(false);
  const [isPresentMode,    setIsPresentMode]    = useState(false);
  const [copiedShare,      setCopiedShare]      = useState(false);
  const [activePreset,     setActivePreset]     = useState('3col');
  const [isLayoutOpen,     setIsLayoutOpen]     = useState(false);
  const [isSavedOpen,      setIsSavedOpen]      = useState(false);
  const [showSavePrompt,   setShowSavePrompt]   = useState(false);
  const [saveName,         setSaveName]         = useState('');
  const [isSaving,         setIsSaving]         = useState(false);
  const [isConsultOpen,    setIsConsultOpen]    = useState(false);
  const [chatMessages,     setChatMessages]     = useState([
    { role: 'ai', text: `I've analyzed your ${charts.length} visualizations. What would you like to explore?` }
  ]);
  const [currentMessage,   setCurrentMessage]   = useState('');
  const [isAITyping,       setIsAITyping]       = useState(false);

  const [savedDashboards, setSavedDashboards] = useState(() => {
    try { return JSON.parse(localStorage.getItem('saas_saved_dashboards') || '[]'); }
    catch { return []; }
  });

  const generateLayout = useCallback((preset = '3col') =>
  charts.map((chart, i) => {
    let w = 4, h = 4;                          // ← was h: 4 (too short at rowHeight 80)
    if (preset === '2col') { w = 6; h = 4; }
    else if (preset === '4col') { w = 3; h = 4; }
    else if (preset === 'smart') {
      w = (chart.chart_type === 'line' || chart.chart_type === 'area') ? 8 : chart.chart_type === 'pie' ? 4 : 6;
      h = 4;                                   // consistent height for all types
    }
    return { i: String(chart.id), x: (i * w) % 12, y: Math.floor((i * w) / 12) * h, w, h, minW: 2, minH: 4 };
    //                                                                                              ↑ minH: 4
  }), [charts]);

  const [layouts, setLayouts] = useState(() => ({ lg: generateLayout('3col') }));

  useEffect(() => {
    setIsMounted(true);
    const fetch = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_URL}/dashboards`);
        setSavedDashboards(res.data);
      } catch (e) { console.error(e); }
    };
    fetch();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { if (isConsultOpen) setIsConsultOpen(false); else onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isConsultOpen, onClose]);

  const layoutRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (layoutRef.current && !layoutRef.current.contains(e.target)) setIsLayoutOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

const applyPreset = (preset) => {
  setActivePreset(preset);
  setLayouts({ lg: charts.map((chart, i) => {
    let w = 4, h = 4;
    if (preset === '2col')  { w = 6; h = 4; }
    if (preset === '4col')  { w = 3; h = 4; }
    if (preset === 'smart') {
      w = (chart.chart_type === 'line' || chart.chart_type === 'area') ? 8 : chart.chart_type === 'pie' ? 4 : 6;
      h = 4;
    }
    return { i: String(chart.id), x: (i * w) % 12, y: Math.floor((i * w) / 12) * h, w, h, minW: 2, minH: 4 };
  })});
  setIsLayoutOpen(false);
};
  const handleLayoutChange = useCallback((_, all) => { setLayouts(all); setActivePreset('custom'); }, []);

  const saveLayout = async () => {
    if (!saveName.trim()) return;
    setIsSaving(true);
    const token = localStorage.getItem('token');
    const data = { name: saveName.trim(), layout: layouts.lg, charts: charts.filter(c => !removedPanels.includes(String(c.id))), dataset_id: activeDataset?.id };
    try {
      if (token) {
        const res = await axios.post(`${API_URL}/dashboards`, data);
        setSavedDashboards(p => [res.data, ...p]);
      } else {
        const entry = { ...data, id: Date.now().toString(), timestamp: new Date().toISOString() };
        const updated = [entry, ...savedDashboards];
        setSavedDashboards(updated);
        localStorage.setItem('saas_saved_dashboards', JSON.stringify(updated));
      }
      setShowSavePrompt(false); setSaveName('');
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const deleteSaved = async (e, id) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      if (token && typeof id === 'number') await axios.delete(`${API_URL}/dashboards/${id}`);
      const updated = savedDashboards.filter(d => d.id !== id);
      setSavedDashboards(updated);
      localStorage.setItem('saas_saved_dashboards', JSON.stringify(updated));
    } catch (e) { console.error(e); }
  };

  const handleExportPDF = async () => {
    const el = document.querySelector('.layout');
    if (!el) return;
    setIsExportingPDF(true);
    try {
      const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${activeDataset?.name || 'Dashboard'}_Report.pdf`);
    } catch (e) { console.error(e); }
    finally { setIsExportingPDF(false); }
  };

  const handleExportImage = async (id) => {
    const el = document.getElementById(`panel-${id}`);
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = `panel-${id}.png`; a.click();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopiedShare(true); setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleSend = async () => {
    if (!currentMessage.trim() || isAITyping) return;
    setChatMessages(p => [...p, { role: 'user', text: currentMessage }]);
    setCurrentMessage(''); setIsAITyping(true);
    await new Promise(r => setTimeout(r, 900));
    const q = currentMessage.toLowerCase();
    const reply = q.includes('trend') ? `Trend patterns across your line charts suggest sequential movement. Time-based segmentation may reveal deeper correlations.`
      : q.includes('top') || q.includes('best') ? `The leading dimension appears to be "${charts[0]?.x_axis_column || 'primary axis'}". Cross-referencing area charts may reveal causality.`
      : `Your ${charts.length} visualizations reflect ${charts.length > 5 ? 'high-dimensional complexity suitable for strategic review' : 'focused KPI coverage ideal for executive reporting'}.`;
    setChatMessages(p => [...p, { role: 'ai', text: reply }]);
    setIsAITyping(false);
  };

  const visibleCharts = charts.filter(c =>
    !removedPanels.includes(String(c.id)) &&
    (chartFilter === 'all' || c.chart_type === chartFilter) &&
    (!searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.chart_type?.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const removedCount = removedPanels.length;

  return (
    <div className={`dd-root flex flex-col h-screen w-full overflow-hidden relative ${isDark ? 'dark' : ''}`}>

      {/* AI Consultant Sidebar */}
      <>
        {isConsultOpen && <div className="fixed inset-0 z-[290] bg-black/20" onClick={() => setIsConsultOpen(false)} />}
        <aside className={`dd-sidebar fixed inset-y-0 right-0 w-[360px] z-[300] flex flex-col transition-transform duration-300 ${isConsultOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="dd-sidebar-header flex items-center justify-between px-5 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="dd-ai-avatar w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                <Cpu size={14} />
              </div>
              <div>
                <p className="text-sm font-semibold m-0 dd-text-primary">AI Consultant</p>
                <p className="text-xs m-0 dd-text-muted">Analytics Intelligence</p>
              </div>
            </div>
            <button onClick={() => setIsConsultOpen(false)} className="dd-icon-btn"><X size={14} /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`dd-bubble ${msg.role === 'user' ? 'dd-bubble-user' : 'dd-bubble-ai'}`}>{msg.text}</div>
              </div>
            ))}
            {isAITyping && (
              <div className="flex justify-start">
                <div className="dd-bubble dd-bubble-ai flex items-center gap-1">
                  {[0, 160, 320].map(d => <span key={d} className="dd-dot" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            )}
          </div>

          <div className="dd-sidebar-footer px-4 py-3 shrink-0">
            <div className="dd-chat-input flex items-center gap-2">
              <input type="text" value={currentMessage} onChange={e => setCurrentMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask about your data…" className="flex-1 bg-transparent border-none outline-none text-sm dd-text-primary" />
              <button onClick={handleSend} className="dd-send-btn w-7 h-7 rounded-md flex items-center justify-center shrink-0"><Send size={13} /></button>
            </div>
          </div>
        </aside>
      </>

      {/* Header */}
      <header className="dd-header flex items-center justify-between px-5 shrink-0" style={{ height: 56 }}>
        <div className="flex items-center gap-3 h-full">
          <button onClick={onClose} className="dd-back-btn group flex items-center gap-1.5 h-full pr-3 text-sm font-medium">
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="dd-divider-v" />
          <div className="flex items-center gap-2.5">
            <div className="dd-brand-icon w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
              <LayoutDashboard size={14} />
            </div>
            <div>
              <h1 className="dd-page-title m-0 text-sm font-semibold dd-text-primary leading-tight">
                {activeDataset?.name || 'Dashboard'}
              </h1>
              <p className="dd-page-sub m-0 text-xs dd-text-muted flex items-center gap-1.5 leading-tight mt-0.5">
                <Database size={9} />
                {visibleCharts.length}/{charts.length} panels
                {removedCount > 0 && (
                  <button onClick={() => setRemovedPanels([])} className="dd-restore-inline ml-1 flex items-center gap-0.5 text-xs">
                    <RotateCcw size={9} /> Restore {removedCount}
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Chart type filter */}
          <div className="dd-filter-strip hidden md:flex items-center gap-0.5 p-1 rounded-lg mr-1">
            {[
              { key: 'all',   icon: <Grid3x3 size={13} /> },
              { key: 'bar',   icon: <BarChart3 size={13} /> },
              { key: 'line',  icon: <LineChart size={13} /> },
              { key: 'pie',   icon: <PieChart size={13} /> },
              { key: 'table', icon: <TableIcon size={13} /> },
            ].map(({ key, icon }) => (
              <button key={key} onClick={() => setChartFilter(key)} title={key} className={`dd-filter-btn p-1.5 rounded-md ${chartFilter === key ? 'dd-filter-active' : ''}`}>
                {icon}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative hidden md:block mr-1">
            
            <input type="text" placeholder="Filter…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="dd-search text-xs pl-7 pr-3 py-1.5 rounded-lg w-28 focus:w-40 transition-all outline-none" />
            <Filter size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 dd-text-muted" />
          </div>

          <div className="dd-divider-v hidden md:block mx-1" />

          {/* Layout dropdown */}
          <div className="relative" ref={layoutRef}>
            <button onClick={() => setIsLayoutOpen(!isLayoutOpen)} className="dd-btn-ghost text-xs flex items-center gap-1.5">
              <LayoutDashboard size={12} className="dd-icon-accent" />
              <span className="hidden sm:inline font-medium capitalize">{activePreset === 'custom' ? 'Custom' : activePreset}</span>
              <ChevronDown size={11} className={`dd-text-muted transition-transform ${isLayoutOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLayoutOpen && (
              <div className="dd-dropdown absolute right-0 top-full mt-1.5 w-52 z-50 rounded-xl p-1.5">
                <p className="dd-dropdown-label px-3 pt-2 pb-1 text-[10px]">Layout presets</p>
                {[
                  { key: 'smart', icon: <MonitorPlay size={12} />, label: 'Smart Auto',  sub: 'Type-aware'    },
                  { key: '2col',  icon: <Columns size={12} />,     label: '2 Columns',   sub: 'Wide panels'   },
                  { key: '3col',  icon: <Grid3x3 size={12} />,     label: '3 Columns',   sub: 'Balanced'      },
                  { key: '4col',  icon: <Focus size={12} />,       label: '4 Columns',   sub: 'Dense layout'  },
                ].map(({ key, icon, label, sub }) => (
                  <button key={key} onClick={() => applyPreset(key)} className={`dd-dropdown-item w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${activePreset === key ? 'dd-dropdown-item-active' : ''}`}>
                    <span className="dd-text-muted shrink-0">{icon}</span>
                    <span className="flex flex-col items-start">
                      <span className="font-medium dd-text-primary">{label}</span>
                      <span className="dd-text-muted">{sub}</span>
                    </span>
                    {activePreset === key && <CheckCircle2 size={11} className="ml-auto dd-icon-accent" />}
                  </button>
                ))}
                <div className="dd-dropdown-divider my-1.5" />
                <p className="dd-dropdown-label px-3 pb-1 text-[10px]">Actions</p>
                {!showSavePrompt ? (
                  <button onClick={() => setShowSavePrompt(true)} className="dd-dropdown-item w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs">
                    <Save size={12} className="text-emerald-500" /><span className="font-medium dd-text-primary">Save layout</span>
                  </button>
                ) : (
                  <div className="px-2 pb-2 pt-1">
                    <input autoFocus type="text" value={saveName} onChange={e => setSaveName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveLayout()} placeholder="Layout name…" className="dd-save-input w-full text-xs px-2.5 py-1.5 rounded-lg mb-1.5 outline-none" />
                    <div className="flex gap-1">
                      <button onClick={saveLayout} disabled={!saveName.trim() || isSaving} className="dd-btn-primary flex-1 text-xs py-1.5 rounded-lg font-medium disabled:opacity-40">{isSaving ? 'Saving…' : 'Save'}</button>
                      <button onClick={() => { setShowSavePrompt(false); setSaveName(''); }} className="dd-icon-btn px-2 rounded-lg"><X size={11} /></button>
                    </div>
                  </div>
                )}
                <button onClick={() => { setIsSavedOpen(true); setIsLayoutOpen(false); }} disabled={savedDashboards.length === 0} className="dd-dropdown-item w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs disabled:opacity-40">
                  <FolderDown size={12} className="text-blue-500" /><span className="font-medium dd-text-primary">Load saved</span>
                  {savedDashboards.length > 0 && <span className="dd-badge ml-auto">{savedDashboards.length}</span>}
                </button>
                {removedCount > 0 && (
                  <button onClick={() => { setRemovedPanels([]); setIsLayoutOpen(false); }} className="dd-dropdown-item w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs">
                    <RotateCcw size={12} className="text-amber-500" /><span className="font-medium dd-text-primary">Restore {removedCount} hidden</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="dd-divider-v mx-1" />

          <button onClick={() => setIsPresentMode(!isPresentMode)} title="Presentation mode" className={`dd-icon-btn ${isPresentMode ? 'dd-icon-btn-active' : ''}`}><Eye size={14} /></button>
          <button onClick={toggleTheme} title="Toggle theme" className="dd-icon-btn">{isDark ? <Sun size={14} /> : <Moon size={14} />}</button>
          <button onClick={handleShare} className={`dd-btn-ghost text-xs flex items-center gap-1.5 ${copiedShare ? 'dd-btn-success' : ''}`}>
            {copiedShare ? <><CheckCircle2 size={12} /> Copied</> : <><Share2 size={12} /> Share</>}
          </button>
          <button onClick={handleExportPDF} disabled={isExportingPDF} className="dd-btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50">
            {isExportingPDF ? <><Loader2 size={12} className="animate-spin" />Exporting…</> : <><FileText size={12} />Export PDF</>}
          </button>
          <button onClick={() => setIsConsultOpen(true)} className="dd-btn-ai hidden lg:flex items-center gap-1.5 text-xs ml-0.5">
            <Zap size={12} /> AI Consultant
          </button>
        </div>
      </header>

      {/* Removed panels banner */}
      {removedCount > 0 && (
        <div className="dd-restore-bar flex items-center justify-between px-5 py-2 shrink-0">
          <span className="text-xs font-medium dd-text-muted">{removedCount} panel{removedCount > 1 ? 's' : ''} hidden</span>
          <button onClick={() => setRemovedPanels([])} className="text-xs font-semibold dd-restore-inline flex items-center gap-1"><RotateCcw size={10} />Restore all</button>
        </div>
      )}

      {/* KPI strip */}
      <div className="dd-kpi-strip flex items-stretch shrink-0">
        {[
          { label: 'Active Panels', value: String(visibleCharts.length),                                              accent: '#6366f1' },
          { label: 'Dataset',       value: activeDataset?.name || 'Workspace',                                        accent: '#0891b2' },
          { label: 'Coverage',      value: `${Math.round((visibleCharts.length / Math.max(charts.length, 1)) * 100)}%`, accent: '#7c3aed' },
          // { label: 'Grade',         value: charts.length > 5 ? 'A+' : 'B',                                            accent: '#d97706' },
        ].map((k, i) => (
          <div key={i} className="dd-kpi-item flex-1 flex flex-col justify-center px-5 py-2.5">
            <span className="dd-kpi-label text-[10px] font-semibold uppercase tracking-wide dd-text-muted">{k.label}</span>
            <span className="dd-kpi-value text-base font-bold mt-0.5 leading-tight" style={{ color: k.accent }}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Grid canvas */}
      <div className="dd-canvas flex-1 overflow-auto p-5">
        {visibleCharts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
            <div className="dd-empty-icon w-12 h-12 rounded-xl flex items-center justify-center"><Grid3x3 size={22} /></div>
            <div className="text-center">
              <p className="text-sm font-semibold dd-text-primary m-0">No panels visible</p>
              <p className="text-xs dd-text-muted m-0 mt-1">All panels are removed or filtered out.</p>
            </div>
            <button onClick={() => { setRemovedPanels([]); setChartFilter('all'); setSearchQuery(''); }} className="dd-btn-primary text-xs flex items-center gap-1.5 mt-1">
              <RotateCcw size={12} /> Restore all
            </button>
          </div>
        ) : isMounted && (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            onLayoutChange={handleLayoutChange}
            isDraggable={!isPresentMode}
            isResizable={!isPresentMode}
            draggableHandle=".drag-handle"
            margin={[14, 14]}
            containerPadding={[0, 0]}
            compactType="vertical"
            useCSSTransforms
          >
            {visibleCharts.map(chart => {
              const tc = TYPE_META[chart.chart_type] || TYPE_META.bar;
              const idStr = String(chart.id);
              const isExpanded = expandedInsights.includes(idStr);

              return (
                <div key={idStr} id={`panel-${chart.id}`} className="dd-panel flex flex-col">
                  {/* Accent bar */}
                  <div className="absolute top-0 left-0 bottom-0 w-[3px] z-10 rounded-l-xl" style={{ background: tc.accent }} />

                  {/* Panel header */}
                  {!isPresentMode && (
                    <div className="drag-handle dd-panel-header flex items-center justify-between pl-4 pr-3 py-2 shrink-0 cursor-grab active:cursor-grabbing">
                      <div className="flex items-center gap-2 min-w-0">
                        <GripHorizontal size={11} className="dd-grip shrink-0" />
                        <h3 className="dd-panel-title text-xs font-semibold truncate m-0">
                          {chart.title || (chart.explanation ? chart.explanation.split('.')[0] : 'Visualization')}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {chart.explanation && (
                          <button
                            title="Insight"
                            onClick={() => setExpandedInsights(p => p.includes(idStr) ? p.filter(x => x !== idStr) : [...p, idStr])}
                            className={`dd-panel-action ${isExpanded ? 'dd-panel-action-active' : ''}`}
                          >
                            <Lightbulb size={11} />
                          </button>
                        )}
                        <button title="Export" onClick={() => handleExportImage(idStr)} className="dd-panel-action"><ImageIcon size={11} /></button>
                        <button title="Remove" onClick={() => setRemovedPanels(p => [...p, idStr])} className="dd-panel-action dd-panel-action-danger"><Trash2 size={11} /></button>
                        <span className="dd-chart-badge ml-1 text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: isDark ? tc.darkBg : tc.bg, color: tc.accent }}>
                          {tc.label}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Chart area */}
                  <div className="flex-1 min-h-0 overflow-hidden px-3 py-2">
                    <MemoizedChart config={chart} compact={true} />
                  </div>

                  {/* Insight footer */}
                  {chart.explanation && isExpanded && (
                    <div className="dd-insight-footer px-4 py-3 shrink-0">
                      <div className="flex items-start gap-2">
                        <Sparkles size={11} className="dd-icon-accent mt-0.5 shrink-0" />
                        <p className="text-xs leading-relaxed dd-text-muted m-0">{chart.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </ResponsiveGridLayout>
        )}
      </div>

      {/* Saved dashboards modal */}
      {isSavedOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/25 backdrop-blur-sm p-4">
          <div className="dd-modal w-full max-w-sm rounded-2xl overflow-hidden">
            <div className="dd-modal-header flex items-center justify-between px-5 py-4">
              <h2 className="text-sm font-semibold m-0 dd-text-primary flex items-center gap-2">
                <FolderDown size={13} className="text-blue-500" /> Saved Dashboards
              </h2>
              <button onClick={() => setIsSavedOpen(false)} className="dd-icon-btn"><X size={13} /></button>
            </div>
            <div className="p-2 max-h-[55vh] overflow-y-auto">
              {savedDashboards.length === 0 ? (
                <div className="py-8 text-center"><p className="text-xs dd-text-muted">No saved layouts yet.</p></div>
              ) : savedDashboards.map(dash => (
                <div key={dash.id} onClick={() => { setLayouts({ lg: dash.layout }); setActivePreset('saved'); setIsSavedOpen(false); }} className="dd-saved-item group flex items-center justify-between p-3 rounded-xl cursor-pointer">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-semibold m-0 dd-text-primary truncate">{dash.name}</p>
                    <p className="text-xs dd-text-muted m-0 mt-0.5">
                      {new Date(dash.timestamp || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      <span className="mx-1.5 opacity-30">·</span>{dash.layout?.length ?? 0} panels
                    </p>
                  </div>
                  <button onClick={e => deleteSaved(e, dash.id)} className="dd-panel-action dd-panel-action-danger opacity-0 group-hover:opacity-100">
                    <Trash size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .react-resizable-handle { opacity: 0; transition: opacity 0.15s; }
        .react-grid-item:hover .react-resizable-handle { opacity: 1; }
        .react-resizable-handle::after {
          border-right: 1.5px solid #94a3b8 !important;
          border-bottom: 1.5px solid #94a3b8 !important;
          width: 6px !important; height: 6px !important;
          right: 5px !important; bottom: 5px !important;
        }
        .react-grid-item.react-grid-placeholder {
          background: rgba(99,102,241,0.05) !important;
          border: 1.5px dashed rgba(99,102,241,0.25) !important;
          border-radius: 12px; opacity: 1 !important;
        }
        .react-grid-item.react-draggable-dragging {
          box-shadow: 0 16px 32px -8px rgba(0,0,0,0.12) !important;
          z-index: 100 !important;
        }
      `}</style>
    </div>
  );
}