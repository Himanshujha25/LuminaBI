import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { WidthProvider, Responsive } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './DynamicDashboard.css';
import DynamicChartComponent from '../ChartComponent';
import {
  Grid3x3, Download, Share2, Menu,
  LayoutDashboard, Image as ImageIcon, Trash2, Sparkles,
  Sun, Moon, ChevronDown, MonitorPlay, Columns,
  X, Loader2, BarChart3, LineChart,
  PieChart, Table as TableIcon, Send, Cpu,
  Zap, Database, CheckCircle2, Eye, Activity, TrendingUp, FileText, Edit2, Save,
  Maximize2, Minimize2, RefreshCw, Settings, Palette, RotateCcw, 
  SlidersHorizontal, Layers, Lock, Unlock, Search, Bell, HelpCircle,
  BarChart2, Pin, PinOff, EyeOff, Copy, Move, MessageSquareMore, LifeBuoy, LogOut, List, Trash
} from 'lucide-react';
import html2canvas from 'html2canvas';
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

const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
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

export default function DynamicDashboard({ charts, initialLayout, dashboardName, onToggleSidebar, isSidebarVisible }) {
  const { isDark, toggleTheme, token, activeDataset, setCurrentView, setIsManageOpen, logout, user } = useStore();
  const navigate = useNavigate();

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
  const [searchQuery,       setSearchQuery]       = useState('');
  const [isSearchOpen,      setIsSearchOpen]      = useState(false);
  const [activeBg,          setActiveBg]          = useState(localStorage.getItem('lumina_bg') || 'default');
  const [isBgModalOpen,     setIsBgModalOpen]     = useState(false);
  const [sidebarTab,        setSidebarTab]        = useState('ai'); // 'ai' | 'panels'
  const [compactMode,       setCompactMode]       = useState(false);
  const [isMobileMenuOpen,  setIsMobileMenuOpen]  = useState(false);
  const [isLocked,          setIsLocked]          = useState(localStorage.getItem(`lumina_lock_${activeDataset?.id}`) === 'true');
  const [isBulkMode,        setIsBulkMode]        = useState(false);
  const [selectedCharts,    setSelectedCharts]    = useState([]);

  useEffect(() => {
    localStorage.setItem(`lumina_lock_${activeDataset?.id}`, isLocked);
  }, [isLocked, activeDataset?.id]);

  const isViewer = activeDataset?.isShared && activeDataset.role?.toLowerCase() === 'viewer';

  /* ── Theme: use light/dark class, default dark ── */
  const themeClass = isDark ? '' : 'light';

  /* ── Sync charts prop ── */
  useEffect(() => { setLocalCharts(charts); }, [charts]);

  const socket = useStore.getState().socket;
  useEffect(() => {
    if (activeDataset?.id && socket) {
      socket.emit('join-dataset', activeDataset.id);
    }
  }, [activeDataset?.id, socket]);

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

  // Update layouts WITHOUT resetting positions from scratch when searching/filtering
  useEffect(() => {
    // Only re-generate from scratch if we don't have enough plots or preset changed
    // Otherwise, we just want to keep what RGL already calculated
    const existingIds = new Set((layouts.lg || []).map(l => l.i));
    const hasMissing = visibleCharts.some(c => !existingIds.has(String(c.id)));
    
    if (hasMissing) {
      setLayouts({ lg: generateLayout(activePreset, visibleCharts) });
    }
  }, [visibleCharts.length, activePreset]);

  // Keep search/filter from triggering a full re-layout calculation
  // (the grid already hides what's not in its children)

  // Only remount when preset fundamentally changes (to force new grid-layout calculations)
  useEffect(() => {
    setLayoutKey(k => k + 1);
  }, [activePreset]);

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
  const saveChartTitle = async (targetId) => {
    if (!tempTitle.trim() || !targetId) { setEditingIndex(null); return; }
    const updatedCharts = localCharts.map(c => 
      String(c.id) === String(targetId) ? { ...c, title: tempTitle } : c
    );
    setLocalCharts(updatedCharts);
    setEditingIndex(null);
    const dashboardId = updatedCharts[0]?.dashboard_id;
    if (!dashboardId) return;
    try {
      await axios.put(`${API_URL}/dashboards/${dashboardId}`, { charts: updatedCharts }, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Title saved');
      if (socket && activeDataset?.id) {
          socket.emit('chat-updated', activeDataset.id);
      }
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

  const handleBulkDelete = async () => {
    if (!selectedCharts.length) return;
    if (!window.confirm(`Delete ${selectedCharts.length} selected charts permanently?`)) return;
    
    try {
      await Promise.all(selectedCharts.map(id => 
        axios.delete(`${API_URL}/chats/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      ));
      setLocalCharts(prev => prev.filter(c => !selectedCharts.includes(String(c.id))));
      setSelectedCharts([]);
      setIsBulkMode(false);
      showToast(`${selectedCharts.length} charts deleted`);
      
      const socket = useStore.getState().socket;
      if (socket && activeDataset?.id) socket.emit('chat-updated', activeDataset.id);
    } catch (err) {
      showToast("Bulk delete failed", "error");
    }
  };

  const handlePermanentDelete = async (panelId) => {
    if (isViewer) {
      showToast("Viewers cannot delete charts.", "error");
      return;
    }
    
    if (!window.confirm("Delete this chart permanently from the shared history?")) return;
    
    try {
      await axios.delete(`${API_URL}/chats/${panelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setLocalCharts(prev => prev.filter(c => String(c.id) !== String(panelId)));
      // Also update removedPanels just in case
      setRemovedPanels(prev => [...prev, String(panelId)]);
      
      showToast("Chart deleted permanently");
      
      // Notify others via socket
      const socket = useStore.getState().socket;
      if (socket && activeDataset?.id) {
          socket.emit('chat-updated', activeDataset.id);
      }
      
    } catch (err) {
      showToast("Failed to delete chart", "error");
      console.error(err);
    }
  };

  const chartTypeLabels = {
    bar:   <BarChart3 size={12} />,
    line:  <LineChart size={12} />,
    pie:   <PieChart size={12} />,
    table: <TableIcon size={12} />,
  };

  const fullscreenChart = fullscreenPanel ? localCharts.find(c => String(c.id) === String(fullscreenPanel)) : null;
  const userName = user?.name || '';
  const userTitle = userName || user?.email || 'Profile';

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const goToOverview = () => { navigate('/dashboard'); setCurrentView('overview'); closeMobileMenu(); };
  const goToChat = () => { navigate('/dashboard'); setCurrentView('overview'); closeMobileMenu(); };
  const goToSavedDashboards = () => { navigate('/dashboard'); setCurrentView('dashboards'); closeMobileMenu(); };
  const goToDatasets = () => { navigate('/dashboard'); setCurrentView('datasets'); setIsManageOpen(true); closeMobileMenu(); };
  const goToSupport = () => { navigate('/dashboard'); setCurrentView('support'); closeMobileMenu(); };
  const goToSettings = () => { navigate('/dashboard'); setCurrentView('settings'); closeMobileMenu(); };
  const goToCurrentDashboard = () => { closeMobileMenu(); };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className={`dd-root ${themeClass} ${activeBg !== 'default' ? `bg-${activeBg}` : ''}`}>

      {/* ── HEADER ── */}
      <header className="dd-header">
        {/* Left: title */}
        <div className="dd-header-left">
          {onToggleSidebar && (
            <button 
              type="button" 
              onClick={onToggleSidebar} 
              className={`dd-btn-icon ${!isSidebarVisible ? 'dd-active-sidebar-btn' : ''}`}
              title={isSidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
              style={{ marginRight: 8 }}
            >
              <Menu size={16} />
            </button>
          )}

          {!isViewer && (
            <button 
              type="button" 
              onClick={() => setIsLocked(!isLocked)} 
              className={`dd-btn-icon ${isLocked ? 'dd-active-lock-btn' : ''}`} 
              title={isLocked ? 'Unlock for Editing' : 'Lock for Safety'} 
              style={{ marginRight: 8 }}
            >
              {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
            </button>
          )}
          <div className="dd-logo-mark"><BarChart2 size={14} color="#fff" /></div>
          <div className="dd-title-block">
            <div className="dd-title">
              {dashboardName || activeDataset?.name || 'Analytics'}
            </div>
            <div className="dd-subtitle">
              {visibleCharts.length} panels · {activePreset}
            </div>
          </div>
        </div>

        {/* Center: filters + layout (hidden on mobile) */}
        {!isPresentMode && (
          <div className="dd-header-center">
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
         
          {!isViewer && (
            <>
              {isBulkMode ? (
                <>
                  <button type="button" onClick={() => setSelectedCharts(selectedCharts.length === localCharts.length ? [] : localCharts.map(ch => String(ch.id)))} 
                    className="dd-btn-outline" style={{ marginRight: 8, height: 30 }}>
                    {selectedCharts.length === localCharts.length ? 'Unselect All' : 'Select All'}
                  </button>
                  <button type="button" onClick={handleBulkDelete} disabled={!selectedCharts.length} 
                    className="dd-btn-primary dd-btn-orange" style={{ marginRight: 8, height: 30 }}>
                    <Trash size={13} />
                    <span>Delete ({selectedCharts.length})</span>
                  </button>
                </>
              ) : null}
              <button type="button" onClick={() => { setIsBulkMode(!isBulkMode); setSelectedCharts([]); }} 
                className={`dd-btn-icon ${isBulkMode ? 'dd-active-lock-btn' : ''}`} 
                title={isBulkMode ? 'Cancel Bulk Selection' : 'Bulk Delete'} style={{ marginRight: 8 }}>
                <List size={13} />
              </button>
            </>
          )}

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

        <div className="dd-shell-controls">
          <div className="dd-header-avatar-wrap" title={userTitle}>
            <div className="dd-header-avatar">{getInitials(userName)}</div>
          </div>

          <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="dd-btn-icon dd-shell-menu-btn" title="Open menu">
            <Menu size={14} />
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <>
          <button className="dd-mobile-overlay" onClick={closeMobileMenu} aria-label="Close dashboard menu" />
          <div className="dd-mobile-drawer">
            <div className="dd-mobile-drawer-head">
              <div className="dd-mobile-drawer-title">
                <div className="dd-logo-mark"><BarChart2 size={14} color="#fff" /></div>
                <div>
                  <strong>{dashboardName || activeDataset?.name || 'Analytics'}</strong>
                  <span>{visibleCharts.length} panels</span>
                </div>
              </div>
              <button type="button" onClick={closeMobileMenu} className="dd-btn-icon">
                <X size={14} />
              </button>
            </div>

            <div className="dd-mobile-menu-list">
              {[
                { key: 'overview', label: 'Overview', icon: LayoutDashboard, action: goToOverview },
                { key: 'dashboard', label: 'Dashboard', icon: BarChart3, action: goToCurrentDashboard },
                { key: 'chat', label: 'Chat', icon: MessageSquareMore, action: goToChat },
                { key: 'saved', label: 'Saved Dashboards', icon: Layers, action: goToSavedDashboards },
                { key: 'datasets', label: 'Datasets', icon: Database, action: goToDatasets },
                { key: 'support', label: 'Support', icon: LifeBuoy, action: goToSupport },
                { key: 'settings', label: 'Settings', icon: Settings, action: goToSettings },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.key} type="button" className="dd-mobile-menu-item" onClick={item.action}>
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="dd-mobile-menu-item dd-mobile-menu-logout"
              onClick={() => {
                closeMobileMenu();
                logout();
                navigate('/login');
              }}
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </>
      )}

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
            {visibleCharts.map((c, i) => {
              const panelId = String(c.id || i);
              const isPinned = pinnedInsights.includes(panelId);

              return (
                <div key={panelId} id={`panel-${panelId}`} className="dd-panel group">
                  <div className="dd-panel-header drag-handle">
                    <div className="dd-panel-drag-area">
                      <span className="dd-panel-title">
                      {isBulkMode ? (
                        <input 
                          type="checkbox" 
                          checked={selectedCharts.includes(panelId)}
                          onChange={() => setSelectedCharts(p => p.includes(panelId) ? p.filter(x => x !== panelId) : [...p, panelId])}
                          style={{ marginRight: 8, cursor: 'pointer', accentColor: '#f59e0b', width: 14, height: 14 }}
                        />
                      ) : (
                        <span className="dd-panel-title-icon">{chartTypeLabels[c.chart_type]}</span>
                      )}

                        {editingIndex === panelId ? (
                          <input
                            autoFocus type="text" value={tempTitle}
                            onChange={e => setTempTitle(e.target.value)}
                            onBlur={() => saveChartTitle(panelId)}
                            onMouseDown={e => e.stopPropagation()}
                            onKeyDown={e => {
                              e.stopPropagation();
                              if (e.key === 'Enter') { e.preventDefault(); saveChartTitle(panelId); }
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
                            onClick={() => { setEditingIndex(panelId); setTempTitle(c.title || 'Untitled'); }}
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
                      {(!isViewer && !isLocked) && (
                        <button type="button" onClick={() => handlePermanentDelete(panelId)} className="dd-panel-action" title="Delete permanently">
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: compactMode ? '8px' : '15px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, minHeight: 180 }}>
                      <MemoizedChart config={c} compact={true} exportWidth={exportWidth} />
                    </div>
                    {c.explanation && (
                      <div style={{ marginTop: 12, borderTop: '1px solid var(--dd-border-1)', paddingTop: 12 }}>
                        <p style={{ fontSize: '11px', color: 'var(--dd-text-2)', lineHeight: '1.6', margin: 0 }}>
                           <Sparkles size={10} style={{ color: '#818cf8', marginRight: 5 }} />
                           {c.explanation}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {Array.isArray(c.anomalies) && c.anomalies.slice(0, 2).map((a, i) => (
                            <span key={i} style={{ fontSize: '9px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>⚠️ {a.label}: {a.reason || 'Anomaly'}</span>
                          ))}
                          {Array.isArray(c.predictions) && c.predictions.slice(0, 2).map((p, i) => (
                            <span key={i} style={{ fontSize: '9px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>✨ Forecast: {typeof p.value === 'number' ? p.value.toLocaleString() : p.label}</span>
                          ))}
                        </div>
                      </div>
                    )}
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
                          <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: 'var(--dd-text-2)', maxHeight: '120px', overflowY: 'auto', marginBottom: 6 }}>
                            {c.explanation}
                          </p>

                          {/* Predictions */}
                          {Array.isArray(c.predictions) && c.predictions.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                              {c.predictions.map((p, i) => (
                                <div key={i} style={{ flex: 1, minWidth: '100px', padding: '6px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                  <div style={{ fontSize: 9, fontWeight: 800, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', marginBottom: 2 }}>
                                    <TrendingUp size={9}/> Prediction
                                  </div>
                                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--dd-text-1)' }}>{p.value?.toLocaleString() || p.label}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Anomalies */}
                          {Array.isArray(c.anomalies) && c.anomalies.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {c.anomalies.map((a, i) => (
                                <div key={i} style={{ flex: 1, minWidth: '100px', padding: '6px 10px', borderRadius: 8, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                                  <div style={{ fontSize: 9, fontWeight: 800, color: '#fb923c', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', marginBottom: 2 }}>
                                    <Activity size={9}/> Anomaly & Note
                                  </div>
                                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--dd-text-1)' }}>{a.label}</div>
                                  { (a.reason || a.note) && <div style={{ fontSize: 10, color: 'var(--dd-text-3)', fontStyle: 'italic', marginTop: 2 }}>{a.reason || a.note}</div> }
                                </div>
                              ))}
                            </div>
                          )}
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
