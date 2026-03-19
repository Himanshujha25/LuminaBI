import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { WidthProvider, Responsive } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './DynamicDashboard.css';
import DynamicChartComponent from '../ChartComponent';
import {
  ArrowLeft, Grid3x3, Download, Share2,
  LayoutDashboard, Image as ImageIcon, Trash2, Sparkles,
  Sun, Moon, ChevronDown, MonitorPlay, Columns,
  X, Loader2, BarChart3, LineChart,
  PieChart, Table as TableIcon, Send, Cpu,
  Zap, Database, CheckCircle2, Eye, Activity, TrendingUp, FileText, Edit2, Save,
  Maximize2, Minimize2, RefreshCw, Settings, Palette, RotateCcw, 
  SlidersHorizontal, Layers, Lock, Unlock, Search, Bell, HelpCircle,
  BarChart2, Pin, PinOff, EyeOff, Copy, Move
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';
import { API_URL } from '../config';
import useStore from '../store/useStore';

const ResponsiveGridLayout = WidthProvider(Responsive);
const MemoizedChart = React.memo(DynamicChartComponent, (prev, next) =>
  prev.config === next.config &&
  prev.compact === next.compact &&
  prev.exportWidth === next.exportWidth
);

/* ── Background options ──────────────────────────────────────────────────── */
const BG_OPTIONS = [
  { id: 'default', label: 'Default', dark: '#0d0f1a', light: '#f0f1f8' },
  { id: 'aurora',  label: 'Aurora',  gradient: true },
  { id: 'mesh',    label: 'Mesh',    gradient: true },
  { id: 'slate',   label: 'Slate',   dark: '#0e1117', light: '#f0f2f5' },
  { id: 'warm',    label: 'Warm',    gradient: true },
  { id: 'ocean',   label: 'Ocean',   gradient: true },
  { id: 'forest',  label: 'Forest',  gradient: true },
];

const BG_SWATCHES = {
  default: 'linear-gradient(135deg, #0d0f1a, #13161f)',
  aurora:  'linear-gradient(135deg, #1a0533, #0d0f1a, #001a33)',
  mesh:    'linear-gradient(135deg, #1a0e2e, #0a1628, #0d1f0d)',
  slate:   'linear-gradient(135deg, #0e1117, #1a1d28)',
  warm:    'linear-gradient(135deg, #1c1208, #0d0f1a)',
  ocean:   'linear-gradient(135deg, #021022, #0d0f1a)',
  forest:  'linear-gradient(135deg, #081a0a, #0d0f1a)',
};

/* ── Toast helper ────────────────────────────────────────────────────────── */
function Toast({ msg, type = 'success', onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="dd-toast">
      <div className={`dd-toast-dot ${type === 'error' ? 'error' : ''}`} />
      <span>{msg}</span>
    </div>
  );
}

export default function DynamicDashboard({ charts, onClose, initialLayout, dashboardName }) {
  const { isDark, toggleTheme, token, activeDataset } = useStore();
  const navigate = useNavigate();

  const handleBack = () => (typeof onClose === 'function' ? onClose() : navigate(-1));

  /* ── State ── */
  const [removedPanels,     setRemovedPanels]     = useState([]);
  const [pinnedInsights,    setPinnedInsights]    = useState([]);
  const [chartFilter,       setChartFilter]       = useState('all');
  const [isExportingPDF,    setIsExportingPDF]    = useState(false);
  const [isPresentMode,     setIsPresentMode]     = useState(false);
  const [copiedShare,       setCopiedShare]       = useState(false);
  const [activePreset,      setActivePreset]      = useState(localStorage.getItem('lumina_layout') || '3col');
  const [isLayoutOpen,      setIsLayoutOpen]      = useState(false);
  const [isConsultOpen,     setIsConsultOpen]     = useState(false);
  const [currentMessage,    setCurrentMessage]    = useState('');
  const [isAITyping,        setIsAITyping]        = useState(false);
  const [exportWidth,       setExportWidth]       = useState(null);
  const [layoutKey,         setLayoutKey]         = useState(0);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType,        setExportType]        = useState('pdf');
  const [reportName,        setReportName]        = useState('');
  const [isSaveModalOpen,   setIsSaveModalOpen]   = useState(false);
  const [saveModalName,     setSaveModalName]     = useState('');
  const [isSavingDashboard, setIsSavingDashboard] = useState(false);
  const [localCharts,       setLocalCharts]       = useState(charts);
  const [editingIndex,      setEditingIndex]      = useState(null);
  const [tempTitle,         setTempTitle]         = useState('');
  const [toast,             setToast]             = useState(null);
  const [fullscreenPanel,   setFullscreenPanel]   = useState(null);
  const [isLocked,          setIsLocked]          = useState(false);
  const [searchQuery,       setSearchQuery]       = useState('');
  const [isSearchOpen,      setIsSearchOpen]      = useState(false);
  const [activeBg,          setActiveBg]          = useState(localStorage.getItem('lumina_bg') || 'default');
  const [isBgModalOpen,     setIsBgModalOpen]     = useState(false);
  const [sidebarTab,        setSidebarTab]        = useState('ai'); // 'ai' | 'panels'
  const [isSettingsOpen,    setIsSettingsOpen]    = useState(false);
  const [compactMode,       setCompactMode]       = useState(false);

  /* ── Theme: use light/dark class, default dark ── */
  const themeClass = isDark ? '' : 'light';

  /* ── Sync charts prop ── */
  useEffect(() => { setLocalCharts(charts); }, [charts]);

  /* ── Close dropdown on outside click ── */
  const dropdownRef = useRef(null);
  useEffect(() => {
    const fn = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsLayoutOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  /* ── Chat storage ── */
  const chatStorageKey = `lumina_chat_${activeDataset?.id || 'default'}`;
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(chatStorageKey);
      return saved ? JSON.parse(saved) : [
        { role: 'ai', text: `Analytics ready. ${charts.length} visualizations loaded from ${activeDataset?.name || 'this dataset'}.` }
      ];
    } catch { return []; }
  });
  useEffect(() => { localStorage.setItem(chatStorageKey, JSON.stringify(chatMessages)); }, [chatMessages, chatStorageKey]);

  /* ── Layout generation ── */
  const generateLayout = useCallback((preset = '3col', filteredCharts = localCharts) =>
    filteredCharts.map((chart, i) => {
      let w = 4, h = 4;
      if (preset === '1col')       { w = 12; h = 5; }
      else if (preset === '2col')  { w = 6;  h = 4; }
      else if (preset === '4col')  { w = 3;  h = 4; }
      else if (preset === 'smart') {
        w = (chart.chart_type === 'line' || chart.chart_type === 'area') ? 8 : chart.chart_type === 'pie' ? 4 : 6;
        h = 4;
      }
      return { i: String(chart.id || i), x: (i * w) % 12, y: Math.floor((i * w) / 12) * h, w, h, minW: 2, minH: 3 };
    }), [localCharts]);

  const [layouts, setLayouts] = useState(() => initialLayout || { lg: generateLayout('3col') });

  /* ── Visible charts (filtered + searched) ── */
  const visibleCharts = useMemo(() =>
    localCharts.filter(c => {
      if (removedPanels.includes(String(c.id))) return false;
      if (chartFilter !== 'all' && c.chart_type !== chartFilter) return false;
      if (searchQuery && !((c.title || '').toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      return true;
    }), [localCharts, removedPanels, chartFilter, searchQuery]);

  useEffect(() => {
    setLayouts({ lg: generateLayout(activePreset, visibleCharts) });
    setLayoutKey(k => k + 1);
  }, [activePreset, visibleCharts.length, chartFilter, searchQuery]);

  const onLayoutChange = (_, allLayouts) => setLayouts(allLayouts);

  const applyPreset = p => {
    setActivePreset(p);
    localStorage.setItem('lumina_layout', p);
    setIsLayoutOpen(false);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
  };

  const applyBg = id => {
    setActiveBg(id);
    localStorage.setItem('lumina_bg', id);
  };

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  /* ── Export ── */
  const captureGrid = async () => {
    const gridEl = document.querySelector('.react-grid-layout');
    if (!gridEl) throw new Error('Grid not found');
    const canvasArea = document.querySelector('.dd-canvas-area');
    document.body.style.overflow = 'visible';
    if (canvasArea) canvasArea.style.overflow = 'visible';
    gridEl.style.overflow = 'visible';
    gridEl.style.height = gridEl.scrollHeight + 'px';
    const firstPanel = gridEl.querySelector('[id^="panel-"]');
    setExportWidth(firstPanel ? firstPanel.offsetWidth - 24 : 380);
    await new Promise(r => setTimeout(r, 600));
    const canvas = await html2canvas(gridEl, {
      scale: 1.5, useCORS: true, logging: false,
      backgroundColor: isDark ? '#0d0f1a' : '#f0f1f8',
      allowTaint: true, foreignObjectRendering: false,
      width: gridEl.offsetWidth, height: gridEl.scrollHeight,
      scrollX: 0, scrollY: 0, x: 0, y: 0,
    });
    gridEl.style.height = ''; gridEl.style.overflow = '';
    if (canvasArea) canvasArea.style.overflow = '';
    document.body.style.overflow = '';
    setExportWidth(null);
    return { canvas, imgWidth: canvas.width / 1.5, imgHeight: canvas.height / 1.5 };
  };

  const handleExportPDF = async (name) => {
    setIsExportModalOpen(false);
    setIsExportingPDF(true);
    try {
      const currentUrl = window.location.href;
      const userData = localStorage.getItem('user') || '{}';
      const userId = JSON.parse(userData)?.id || 'guest';
      const pinKey = `lumina_pinned_charts_${userId}`;
      const pinnedChartsData = localStorage.getItem(pinKey) || '[]';
      const response = await axios.post(`${API_URL}/exports/generate-pdf`,
        { targetUrl: currentUrl, theme: isDark ? 'dark' : 'light', layout: activePreset, userData, pinnedCharts: pinnedChartsData, pinKey },
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
      );
      const safeName = name ? name.replace(/\s+/g, '_') : 'Lumina_Report';
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `${safeName}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
      showToast('PDF exported successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showToast('Failed to generate PDF', 'error');
    } finally { setIsExportingPDF(false); }
  };

  const handleExportPPT = async name => {
    setIsExportModalOpen(false);
    await new Promise(r => setTimeout(r, 350));
    setIsExportingPDF(true);
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 100));
      const { canvas, imgWidth, imgHeight } = await captureGrid();
      const imgData = canvas.toDataURL('image/png');
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pres = new PptxGenJS();
      pres.layout = 'LAYOUT_16x9';
      const cover = pres.addSlide();
      cover.background = { color: isDark ? '0d0f1a' : 'f0f1f8' };
      cover.addText('Lumina Intelligence', { x: 0, y: '40%', w: '100%', align: 'center', fontSize: 40, color: isDark ? 'e8eaf5' : '12142a', bold: true });
      cover.addText(name || activeDataset?.name || 'Analytics Report', { x: 0, y: '55%', w: '100%', align: 'center', fontSize: 18, color: '818cf8' });
      const slide = pres.addSlide();
      slide.background = { color: isDark ? '0d0f1a' : 'f0f1f8' };
      slide.addText(name || 'Dashboard Overview', { x: 0.5, y: 0.3, w: '90%', fontSize: 20, color: isDark ? 'e8eaf5' : '12142a', bold: true });
      const maxW = 9.0, maxH = 4.5;
      const aspect = imgWidth / imgHeight;
      const fitW = Math.min(maxW, maxH * aspect);
      const fitH = fitW / aspect;
      slide.addImage({ data: imgData, x: (10 - fitW) / 2, y: 1.0, w: fitW, h: fitH });
      await pres.writeFile({ fileName: `${name || 'Lumina'}_Report.pptx` });
      showToast('PowerPoint exported successfully');
    } catch (e) {
      console.error('PPT Export Error:', e);
      showToast('Failed to generate PPT', 'error');
      setExportWidth(null);
    } finally { setIsExportingPDF(false); }
  };

  const handleExportImage = async id => {
    const el = document.getElementById(`panel-${id}`);
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png'); a.download = `panel-${id}.png`; a.click();
    showToast('Panel image downloaded');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopiedShare(true);
    showToast('Link copied to clipboard');
    setTimeout(() => setCopiedShare(false), 2000);
  };

  /* ── AI chat ── */
  const handleSend = async () => {
    if (!currentMessage.trim() || isAITyping) return;
    const msg = currentMessage;
    setChatMessages(p => [...p, { role: 'user', text: msg }]);
    setCurrentMessage('');
    setIsAITyping(true);
    setTimeout(() => {
      const q = msg.toLowerCase();
      const reply = q.includes('trend')
        ? `The line charts indicate a consistent growth pattern. Consider seasonality as a factor.`
        : q.includes('top')
        ? `The primary variance driver is ${localCharts[0]?.x_axis_column || 'the lead dimension'}.`
        : `${localCharts.length} visualizations are loaded from ${activeDataset?.name}. Ask me anything specific.`;
      setChatMessages(p => [...p, { role: 'ai', text: reply }]);
      setIsAITyping(false);
    }, 900);
  };

  /* ── Title editing ── */
  const saveChartTitle = async (targetIndex) => {
    if (!tempTitle.trim() || targetIndex === null) { setEditingIndex(null); return; }
    const updatedCharts = [...localCharts];
    updatedCharts[targetIndex] = { ...updatedCharts[targetIndex], title: tempTitle };
    setLocalCharts(updatedCharts);
    setEditingIndex(null);
    const dashboardId = updatedCharts[0]?.dashboard_id;
    if (!dashboardId) return;
    try {
      await axios.put(`${API_URL}/dashboards/${dashboardId}`, { charts: updatedCharts }, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Title saved');
    } catch { showToast('Failed to save title', 'error'); }
  };

  /* ── Save dashboard ── */
  const handleSaveDashboard = async () => {
    if (!saveModalName.trim()) return;
    setIsSavingDashboard(true);
    try {
      const payload = { name: saveModalName, layout: layouts, charts: localCharts, dataset_id: activeDataset?.id };
      const response = await axios.post(`${API_URL}/dashboards`, payload, { headers: { Authorization: `Bearer ${token}` } });
      const newDashboardId = response.data.id;
      setLocalCharts(localCharts.map(c => ({ ...c, dashboard_id: newDashboardId })));
      setIsSaveModalOpen(false);
      showToast('Dashboard saved successfully!');
    } catch (error) {
      console.error('Failed to save dashboard:', error);
      showToast('Failed to save dashboard', 'error');
    } finally { setIsSavingDashboard(false); }
  };

  /* ── Restore last removed panel ── */
  const handleRestorePanel = () => {
    if (removedPanels.length === 0) return;
    setRemovedPanels(p => p.slice(0, -1));
    showToast('Panel restored');
  };

  /* ── Refresh layout ── */
  const handleRefreshLayout = () => {
    setLayouts({ lg: generateLayout(activePreset, visibleCharts) });
    setLayoutKey(k => k + 1);
    showToast('Layout refreshed');
  };

  /* ── Fullscreen toggle ── */
  const toggleFullscreen = (chartId) => {
    setFullscreenPanel(fullscreenPanel === chartId ? null : chartId);
  };

  const chartTypeLabels = {
    bar:   <BarChart3 size={12} />,
    line:  <LineChart size={12} />,
    pie:   <PieChart size={12} />,
    table: <TableIcon size={12} />,
  };

  const fullscreenChart = fullscreenPanel ? localCharts.find(c => String(c.id) === String(fullscreenPanel)) : null;

  return (
    <div className={`dd-root ${themeClass} ${activeBg !== 'default' ? `bg-${activeBg}` : ''}`}>

      {/* ── HEADER ── */}
      <header className="dd-header">
        {/* Left: Back + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexShrink: 0 }}>
          <button type="button" onClick={handleBack} className="dd-back-btn">
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>
          <div className="dd-logo-mark"><BarChart2 size={14} color="#fff" /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dd-text-1)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
              {dashboardName || activeDataset?.name || 'Analytics'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--dd-text-3)', lineHeight: 1.2 }}>
              {visibleCharts.length} panels · {activePreset}
            </div>
          </div>
        </div>

        {/* Center: filters + layout (hidden on mobile) */}
        {!isPresentMode && (
          <div className="dd-header-center" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {/* Search */}
            {isSearchOpen ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.05)', border: '1px solid var(--dd-border-2)', borderRadius: 'var(--dd-radius-sm)', padding: '0 10px', height: 30 }}>
                <Search size={12} style={{ color: 'var(--dd-text-3)' }} />
                <input
                  autoFocus type="text" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search panels…"
                  style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'var(--dd-text-1)', width: 130, fontFamily: 'inherit' }}
                  onBlur={() => { if (!searchQuery) setIsSearchOpen(false); }}
                />
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dd-text-3)', padding: 0, display: 'flex' }}>
                    <X size={12} />
                  </button>
                )}
              </div>
            ) : (
              <button type="button" onClick={() => setIsSearchOpen(true)} className="dd-btn-icon" title="Search panels">
                <Search size={13} />
              </button>
            )}

            {/* Chart type filter */}
            <div className="dd-filter-bar">
              {[
                { k: 'all',   i: <Grid3x3 size={12} />,   label: 'All' },
                { k: 'bar',   i: <BarChart3 size={12} />,  label: 'Bar' },
                { k: 'line',  i: <LineChart size={12} />,  label: 'Line' },
                { k: 'pie',   i: <PieChart size={12} />,   label: 'Pie' },
                { k: 'table', i: <TableIcon size={12} />,  label: 'Table' },
              ].map(t => (
                <button type="button" key={t.k} onClick={() => setChartFilter(t.k)} className={`dd-tool-btn ${chartFilter === t.k ? 'active' : ''}`} title={t.label}>
                  {t.i}
                </button>
              ))}
            </div>

            {/* Layout dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button type="button" onClick={() => setIsLayoutOpen(!isLayoutOpen)} className="dd-btn-outline" style={{ gap: 5 }}>
                <LayoutDashboard size={12} />
                <span style={{ fontSize: 11 }}>
                  {activePreset === 'smart' ? 'Smart' : activePreset === '1col' ? '1 Col' : `${activePreset.charAt(0)} Col`}
                </span>
                <ChevronDown size={10} style={{ opacity: .5 }} />
              </button>
              {isLayoutOpen && (
                <div className="dd-dropdown">
                  <div className="dd-dropdown-section">Layout</div>
                  {[
                    { id: '1col',  name: '1 Column',  icon: <Columns size={12} /> },
                    { id: '2col',  name: '2 Columns', icon: <Columns size={12} /> },
                    { id: '3col',  name: '3 Columns', icon: <Grid3x3 size={12} /> },
                    { id: '4col',  name: '4 Columns', icon: <LayoutDashboard size={12} /> },
                    { id: 'smart', name: 'Smart',     icon: <Zap size={12} /> },
                  ].map(p => (
                    <button type="button" key={p.id} onClick={() => applyPreset(p.id)}>
                      {p.icon}{p.name}
                      {activePreset === p.id && <CheckCircle2 size={11} style={{ marginLeft: 'auto', color: '#818cf8' }} />}
                    </button>
                  ))}
                  <div className="dd-dropdown-divider" />
                  <div className="dd-dropdown-section">Options</div>
                  <button type="button" onClick={() => { setCompactMode(p => !p); setIsLayoutOpen(false); }}>
                    <SlidersHorizontal size={12} />
                    Compact mode
                    {compactMode && <CheckCircle2 size={11} style={{ marginLeft: 'auto', color: '#818cf8' }} />}
                  </button>
                  <button type="button" onClick={() => { handleRefreshLayout(); setIsLayoutOpen(false); }}>
                    <RefreshCw size={12} />
                    Reset layout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right: actions */}
        <div className="dd-header-right">
          <button type="button" onClick={() => setIsLocked(p => !p)} className={`dd-btn-icon ${isLocked ? 'dd-active' : ''}`} title={isLocked ? 'Unlock panels' : 'Lock panels'}>
            {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
          <button type="button" onClick={() => setIsPresentMode(!isPresentMode)} className={`dd-btn-icon ${isPresentMode ? 'dd-active' : ''}`} title="Present mode">
            <Eye size={13} />
          </button>
          <button type="button" onClick={toggleTheme} className="dd-btn-icon" title="Toggle theme">
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <button type="button" onClick={() => setIsBgModalOpen(true)} className="dd-btn-icon" title="Background">
            <Palette size={13} />
          </button>

          <div className="dd-sep" />

          <button type="button" onClick={handleShare} className="dd-btn-outline">
            {copiedShare ? <CheckCircle2 size={13} /> : <Share2 size={13} />}
            <span>Share</span>
          </button>
          <button type="button" onClick={() => { setExportType('pdf'); setIsExportModalOpen(true); }} disabled={isExportingPDF} className="dd-btn-outline">
            {isExportingPDF ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            <span>PDF</span>
          </button>
          <button type="button" onClick={() => { setExportType('ppt'); setIsExportModalOpen(true); }} className="dd-btn-primary dd-btn-orange">
            <MonitorPlay size={13} />
            <span>PPT</span>
          </button>
          <button type="button"
            onClick={() => { setSaveModalName(dashboardName || (activeDataset?.name ? `${activeDataset.name} Dashboard` : 'My Dashboard')); setIsSaveModalOpen(true); }}
            className="dd-btn-primary dd-btn-save"
          >
            <Save size={13} />
            <span>Save</span>
          </button>
          <button type="button" onClick={() => setIsConsultOpen(!isConsultOpen)} className={`dd-btn-primary ${isConsultOpen ? '' : ''}`}>
            <Sparkles size={13} />
            <span>AI</span>
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="dd-body">
        <div className="dd-canvas-area">
          <ResponsiveGridLayout
            key={layoutKey}
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={compactMode ? 80 : 100}
            draggableHandle=".drag-handle"
            isDraggable={!isLocked}
            isResizable={!isLocked}
            onLayoutChange={onLayoutChange}
            margin={compactMode ? [8, 8] : [14, 14]}
            compactType="vertical"
          >
            {visibleCharts.map((c) => {
              const trueIndex = localCharts.indexOf(c);
              const panelId = String(c.id || trueIndex);
              const isPinned = pinnedInsights.includes(panelId);

              return (
                <div key={panelId} id={`panel-${panelId}`} className="dd-panel group">
                  <div className="dd-panel-header drag-handle">
                    <div className="dd-panel-drag-area">
                      <span className="dd-panel-title">
                        <span className="dd-panel-title-icon">{chartTypeLabels[c.chart_type]}</span>

                        {editingIndex === trueIndex ? (
                          <input
                            autoFocus type="text" value={tempTitle}
                            onChange={e => setTempTitle(e.target.value)}
                            onBlur={() => saveChartTitle(trueIndex)}
                            onMouseDown={e => e.stopPropagation()}
                            onKeyDown={e => {
                              e.stopPropagation();
                              if (e.key === 'Enter') { e.preventDefault(); saveChartTitle(trueIndex); }
                              if (e.key === 'Escape') setEditingIndex(null);
                            }}
                            style={{
                              background: 'rgba(79,82,232,.12)', border: '1px solid rgba(129,140,248,.4)',
                              color: 'var(--dd-text-1)', borderRadius: '5px',
                              padding: '2px 7px', fontSize: '11px', outline: 'none',
                              maxWidth: 150, fontFamily: 'inherit',
                            }}
                          />
                        ) : (
                          <div
                            onClick={() => { setEditingIndex(trueIndex); setTempTitle(c.title || 'Untitled'); }}
                            title="Click to rename"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', maxWidth: 160 }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.title || 'Untitled'}
                            </span>
                            <Edit2 size={10} style={{ color: 'var(--dd-text-3)', flexShrink: 0, opacity: .6 }} />
                          </div>
                        )}
                      </span>
                    </div>

                    <div className="dd-panel-actions">
                      <button type="button" onClick={() => toggleFullscreen(panelId)} className="dd-panel-action" title="Fullscreen">
                        <Maximize2 size={11} />
                      </button>
                      <button type="button"
                        onClick={() => setPinnedInsights(p => isPinned ? p.filter(x => x !== panelId) : [...p, panelId])}
                        className={`dd-panel-action ${isPinned ? 'dd-active-pin' : ''}`} title="Pin insight"
                      >
                        <Zap size={11} fill={isPinned ? 'currentColor' : 'none'} />
                      </button>
                      <button type="button" onClick={() => handleExportImage(panelId)} className="dd-panel-action" title="Export PNG">
                        <ImageIcon size={11} />
                      </button>
                      <button type="button" onClick={() => { setRemovedPanels(p => [...p, panelId]); showToast('Panel hidden'); }} className="dd-panel-action" title="Hide panel">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: compactMode ? '8px' : '12px', overflow: 'hidden' }}>
                    <MemoizedChart config={c} compact={true} exportWidth={exportWidth} />
                  </div>

                  {c.explanation && (
                    <div className={`dd-insight-overlay ${isPinned ? 'dd-pinned-insight' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                        <button type="button"
                          onClick={() => setPinnedInsights(p => isPinned ? p.filter(x => x !== panelId) : [...p, panelId])}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, marginTop: 3 }}
                        >
                          <Zap size={13} fill={isPinned ? '#818cf8' : 'none'} style={{ color: isPinned ? '#818cf8' : 'var(--dd-text-3)' }} />
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--dd-text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>AI Summary</div>
                          <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: 'var(--dd-text-2)', maxHeight: '80px', overflowY: 'auto' }}>
                            {c.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </ResponsiveGridLayout>
        </div>

        {/* ── AI sidebar ── */}
        {isConsultOpen && (
          <aside className="dd-sidebar animate-in">
            <div className="dd-sidebar-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#4f52e8,#7c5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={13} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dd-text-1)' }}>Lumina AI</div>
                  <div style={{ fontSize: 10, color: 'var(--dd-text-3)' }}>Contextual analyst</div>
                </div>
              </div>
              <button type="button" onClick={() => setIsConsultOpen(false)} className="dd-panel-action"><X size={14} /></button>
            </div>

            {/* Sidebar tabs */}
            <div className="dd-sidebar-tabs">
              {['ai', 'panels'].map(tab => (
                <button key={tab} type="button" className={`dd-sidebar-tab ${sidebarTab === tab ? 'active' : ''}`} onClick={() => setSidebarTab(tab)}>
                  {tab === 'ai' ? 'AI Chat' : 'Panels'}
                </button>
              ))}
            </div>

            {sidebarTab === 'ai' ? (
              <>
                <div className="dd-chat-messages">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`dd-bubble ${m.role === 'user' ? 'dd-bubble-user' : 'dd-bubble-ai'}`}>{m.text}</div>
                  ))}
                  {isAITyping && (
                    <div className="dd-bubble dd-bubble-ai" style={{ opacity: .6 }}>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>Analyzing···</span>
                    </div>
                  )}
                </div>
                <div className="dd-sidebar-footer">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {['Show trends', 'Top performer', 'Summarize'].map(s => (
                      <button key={s} type="button"
                        onClick={() => { setCurrentMessage(s); }}
                        style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--dd-border-2)', background: 'rgba(79,82,232,.08)', color: '#818cf8', cursor: 'pointer', fontFamily: 'inherit' }}
                      >{s}</button>
                    ))}
                  </div>
                  <div className="dd-input-group">
                    <input type="text" value={currentMessage} onChange={e => setCurrentMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask about this data…" />
                    <button type="button" onClick={handleSend} className="dd-send-btn"><Send size={13} /></button>
                  </div>
                </div>
              </>
            ) : (
              <div className="dd-chat-messages">
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--dd-text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
                  {visibleCharts.length} visible · {removedPanels.length} hidden
                </div>
                {localCharts.map((c, i) => {
                  const panelId = String(c.id || i);
                  const isHidden = removedPanels.includes(panelId);
                  return (
                    <div key={panelId} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,.03)', border: '1px solid var(--dd-border)', marginBottom: 4 }}>
                      <span style={{ color: 'var(--dd-text-3)', flexShrink: 0 }}>{chartTypeLabels[c.chart_type]}</span>
                      <span style={{ flex: 1, fontSize: 11.5, color: isHidden ? 'var(--dd-text-3)' : 'var(--dd-text-1)', textDecoration: isHidden ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.title || 'Untitled'}
                      </span>
                      <button type="button"
                        onClick={() => isHidden ? setRemovedPanels(p => p.filter(x => x !== panelId)) : setRemovedPanels(p => [...p, panelId])}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isHidden ? '#818cf8' : 'var(--dd-text-3)', padding: 0, display: 'flex', flexShrink: 0 }}
                        title={isHidden ? 'Show' : 'Hide'}
                      >
                        {isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ── Present mode exit ── */}
      {isPresentMode && (
        <button type="button" onClick={() => setIsPresentMode(false)} className="dd-exit-present-btn"
          style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2000 }}>
          <div className="dd-exit-icon"><X size={12} /></div>
          Exit presentation
        </button>
      )}

      {/* ── Restore bar ── */}
      {removedPanels.length > 0 && !isPresentMode && (
        <div className="dd-restore-bar">
          <EyeOff size={13} style={{ color: 'var(--dd-text-3)' }} />
          <span>{removedPanels.length} panel{removedPanels.length > 1 ? 's' : ''} hidden</span>
          <button type="button" onClick={handleRestorePanel}>Undo</button>
          <button type="button" onClick={() => setRemovedPanels([])}>Restore all</button>
        </div>
      )}

      {/* ── Fullscreen panel ── */}
      {fullscreenChart && (
        <div className="dd-fullscreen-panel">
          <div className="dd-panel-header" style={{ padding: '14px 20px', borderBottom: '1px solid var(--dd-border)', cursor: 'default' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dd-text-1)' }}>{fullscreenChart.title || 'Untitled'}</span>
            <button type="button" onClick={() => setFullscreenPanel(null)} className="dd-btn-icon" style={{ marginLeft: 'auto' }}>
              <Minimize2 size={14} />
            </button>
          </div>
          <div style={{ flex: 1, padding: 24, overflow: 'hidden' }}>
            <MemoizedChart config={fullscreenChart} compact={false} exportWidth={null} />
          </div>
        </div>
      )}

      {/* ── Background modal ── */}
      {isBgModalOpen && (
        <div className="dd-modal-overlay" onClick={() => setIsBgModalOpen(false)}>
          <div className="dd-modal" onClick={e => e.stopPropagation()}>
            <div className="dd-modal-title"><Palette size={16} style={{ color: '#818cf8' }} />Background</div>
            <p className="dd-modal-sub">Choose a background style for your dashboard.</p>
            <div className="dd-bg-options">
              {BG_OPTIONS.map(bg => (
                <div key={bg.id} className={`dd-bg-option ${activeBg === bg.id ? 'selected' : ''}`}
                  style={{ background: BG_SWATCHES[bg.id] }}
                  onClick={() => applyBg(bg.id)}
                >
                  <span>{bg.label}</span>
                </div>
              ))}
            </div>
            <div className="dd-modal-actions">
              <button type="button" className="dd-modal-cancel" onClick={() => setIsBgModalOpen(false)}>Close</button>
              <button type="button" className="dd-modal-confirm" style={{ background: 'var(--dd-gradient)' }} onClick={() => setIsBgModalOpen(false)}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Export modal ── */}
      {isExportModalOpen && (
        <div className="dd-modal-overlay">
          <div className="dd-modal">
            <div className="dd-modal-title">
              {exportType === 'pdf' ? <FileText size={16} style={{ color: '#818cf8' }} /> : <MonitorPlay size={16} style={{ color: '#818cf8' }} />}
              Export {exportType.toUpperCase()}
            </div>
            <p className="dd-modal-sub">{visibleCharts.length} panels will be exported. Give this report a name.</p>
            <label className="dd-modal-label">Report title</label>
            <input type="text" value={reportName} onChange={e => setReportName(e.target.value)}
              placeholder="e.g. Q1 Analysis" autoFocus className="dd-modal-input"
              style={{ marginBottom: 0 }}
            />
            <div className="dd-modal-actions">
              <button type="button" className="dd-modal-cancel" onClick={() => setIsExportModalOpen(false)} disabled={isExportingPDF}>Cancel</button>
              <button type="button" className="dd-modal-confirm"
                style={{ background: 'var(--dd-gradient)', opacity: (isExportingPDF || !reportName.trim()) ? .35 : 1 }}
                onClick={() => exportType === 'pdf' ? handleExportPDF(reportName) : handleExportPPT(reportName)}
                disabled={isExportingPDF || !reportName.trim()}
              >
                {isExportingPDF ? <Loader2 size={13} className="animate-spin" /> : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save modal ── */}
      {isSaveModalOpen && (
        <div className="dd-modal-overlay">
          <div className="dd-modal">
            <div className="dd-modal-title"><Save size={16} style={{ color: '#34d399' }} />Save Dashboard</div>
            <p className="dd-modal-sub">Save this layout and all renamed charts to your workspace.</p>
            <label className="dd-modal-label">Dashboard Name</label>
            <input type="text" value={saveModalName} onChange={e => setSaveModalName(e.target.value)}
              autoFocus className="dd-modal-input" style={{ marginBottom: 0 }} />
            <div className="dd-modal-actions">
              <button type="button" className="dd-modal-cancel" onClick={() => setIsSaveModalOpen(false)} disabled={isSavingDashboard}>Cancel</button>
              <button type="button" className="dd-modal-confirm"
                style={{ background: 'linear-gradient(135deg,#059669,#10b981)', opacity: (isSavingDashboard || !saveModalName.trim()) ? .35 : 1 }}
                onClick={handleSaveDashboard} disabled={isSavingDashboard || !saveModalName.trim()}
              >
                {isSavingDashboard ? <Loader2 size={13} className="animate-spin" /> : 'Save Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

    </div>
  );
}