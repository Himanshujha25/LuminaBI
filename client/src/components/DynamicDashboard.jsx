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
  Zap, Database, CheckCircle2, Eye, Activity, TrendingUp, FileText, Edit2, Save
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

export default function DynamicDashboard({ charts, onClose, initialLayout, dashboardName }) {
  const { isDark, toggleTheme, token, activeDataset } = useStore();

  // ── FIX: use navigate as fallback if onClose not provided ────────────────
  const navigate = useNavigate();
  const handleBack = () => {
    if (typeof onClose === 'function') {
      onClose();
    } else {
      navigate(-1);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  const [removedPanels,    setRemovedPanels]    = useState([]);
  const [pinnedInsights,   setPinnedInsights]   = useState([]);
  const [chartFilter,      setChartFilter]      = useState('all');
  const [isExportingPDF,   setIsExportingPDF]   = useState(false);
  const [isPresentMode,    setIsPresentMode]    = useState(false);
  const [copiedShare,      setCopiedShare]      = useState(false);
  const [activePreset,     setActivePreset]     = useState(localStorage.getItem('lumina_layout') || '3col');
  const [isLayoutOpen,     setIsLayoutOpen]     = useState(false);
  const [isConsultOpen,    setIsConsultOpen]    = useState(false);
  const [currentMessage,   setCurrentMessage]   = useState('');
  const [isAITyping,       setIsAITyping]       = useState(false);
  const [exportWidth,      setExportWidth]      = useState(null);
  const [layoutKey,        setLayoutKey]        = useState(0);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType,        setExportType]        = useState('pdf');
  const [reportName,        setReportName]        = useState('');

  // ── SAVE DASHBOARD STATE ──
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalName, setSaveModalName] = useState(''); // Renamed to avoid prop conflict
  const [isSavingDashboard, setIsSavingDashboard] = useState(false);

  // ── TITLE EDITING STATE ──
  const [localCharts, setLocalCharts] = useState(charts);
  const [editingIndex, setEditingIndex] = useState(null); 
  const [tempTitle, setTempTitle] = useState('');

  // Sync if props change
  useEffect(() => {
    setLocalCharts(charts);
  }, [charts]);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const fn = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsLayoutOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const chatStorageKey = `lumina_chat_${activeDataset?.id || 'default'}`;
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(chatStorageKey);
      return saved ? JSON.parse(saved) : [
        { role: 'ai', text: `Analytics ready. ${charts.length} visualizations loaded from ${activeDataset?.name || 'this dataset'}.` }
      ];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(chatStorageKey, JSON.stringify(chatMessages));
  }, [chatMessages, chatStorageKey]);

  const generateLayout = useCallback((preset = '3col', filteredCharts = localCharts) =>
    filteredCharts.map((chart, i) => {
      let w = 4, h = 4;
      if (preset === '1col')  { w = 12; h = 5; }
      else if (preset === '2col')  { w = 6;  h = 4; }
      else if (preset === '4col')  { w = 3;  h = 4; }
      else if (preset === 'smart') {
        w = (chart.chart_type === 'line' || chart.chart_type === 'area') ? 8 : chart.chart_type === 'pie' ? 4 : 6;
        h = 4;
      }
      return { i: String(chart.id || i), x: (i * w) % 12, y: Math.floor((i * w) / 12) * h, w, h, minW: 2, minH: 4 };
    }), [localCharts]);

  const [layouts, setLayouts] = useState(() => initialLayout || { lg: generateLayout('3col') });
  
  // ── FIX: Derive visible charts from localCharts so edits show instantly ──
  const visibleCharts = useMemo(() =>
    localCharts.filter(c => !removedPanels.includes(String(c.id)) && (chartFilter === 'all' || c.chart_type === chartFilter)),
    [localCharts, removedPanels, chartFilter]);

  useEffect(() => {
    setLayouts({ lg: generateLayout(activePreset, visibleCharts) });
    setLayoutKey(k => k + 1);
  }, [activePreset, visibleCharts.length, chartFilter]);

  const onLayoutChange = (_, allLayouts) => setLayouts(allLayouts);

  const applyPreset = p => {
    setActivePreset(p);
    localStorage.setItem('lumina_layout', p);
    setIsLayoutOpen(false);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
  };

  const saveExportToBackend = async (type, content) => {
    try {
      const res = await axios.post(`${API_URL}/exports/save`, {
        type, content, name: activeDataset?.name, dashboard_id: localCharts[0]?.dashboard_id
      }, { headers: { Authorization: `Bearer ${token}` } });
      navigator.clipboard.writeText(res.data.shareUrl);
      return res.data.shareUrl;
    } catch (e) { console.error('Save export failed', e); return null; }
  };

  const captureGrid = async () => {
    const gridEl = document.querySelector('.react-grid-layout');
    if (!gridEl) throw new Error('Grid not found');
    const canvasArea = document.querySelector('.dd-canvas-area');
    const saves = {
      bodyOverflow:   document.body.style.overflow,
      gridHeight:     gridEl.style.height,
      gridOverflow:   gridEl.style.overflow,
      canvasOverflow: canvasArea?.style.overflow,
    };
    document.body.style.overflow = 'visible';
    if (canvasArea) canvasArea.style.overflow = 'visible';
    gridEl.style.overflow = 'visible';
    gridEl.style.height = gridEl.scrollHeight + 'px';
    const firstPanel = gridEl.querySelector('[id^="panel-"]');
    setExportWidth(firstPanel ? firstPanel.offsetWidth - 24 : 380);
    await new Promise(r => setTimeout(r, 600));
    const fullHeight = gridEl.scrollHeight;
    const fullWidth  = gridEl.offsetWidth;
    const canvas = await html2canvas(gridEl, {
      scale: 1.5, useCORS: true, logging: false,
      backgroundColor: isDark ? '#0d0d0c' : '#f4f4f2',
      allowTaint: true, foreignObjectRendering: false,
      width: fullWidth, height: fullHeight,
      windowWidth: fullWidth, windowHeight: fullHeight,
      scrollX: 0, scrollY: 0, x: 0, y: 0,
    });
    document.body.style.overflow   = saves.bodyOverflow;
    if (canvasArea) canvasArea.style.overflow = saves.canvasOverflow;
    gridEl.style.height   = saves.gridHeight;
    gridEl.style.overflow = saves.gridOverflow;
    setExportWidth(null);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
      link.href = url;
      link.setAttribute('download', `${safeName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Make sure your backend server is running.');
    } finally {
      setIsExportingPDF(false);
    }
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
      cover.background = { color: isDark ? '0d0d0c' : 'f4f4f2' };
      cover.addText('Lumina Intelligence', { x: 0, y: '40%', w: '100%', align: 'center', fontSize: 40, color: isDark ? 'edede9' : '111110', bold: true });
      cover.addText(name || activeDataset?.name || 'Analytics Report', { x: 0, y: '55%', w: '100%', align: 'center', fontSize: 18, color: '6a6a66' });
      const slide = pres.addSlide();
      slide.background = { color: isDark ? '0d0d0c' : 'f4f4f2' };
      slide.addText(name || 'Dashboard Overview', { x: 0.5, y: 0.3, w: '90%', fontSize: 20, color: isDark ? 'edede9' : '111110', bold: true });
      const maxW = 9.0, maxH = 4.5;
      const aspect = imgWidth / imgHeight;
      const fitW = Math.min(maxW, maxH * aspect);
      const fitH = fitW / aspect;
      slide.addImage({ data: imgData, x: (10 - fitW) / 2, y: 1.0, w: fitW, h: fitH });
      await pres.writeFile({ fileName: `${name || 'Lumina'}_Report.pptx` });
      await saveExportToBackend('ppt', { name, type: 'exec_summary', image: imgData });
    } catch (e) {
      console.error('PPT Export Error:', e);
      setExportWidth(null);
    } finally { setIsExportingPDF(false); }
  };

  const handleExportImage = async id => {
    const el = document.getElementById(`panel-${id}`);
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `panel-${id}.png`;
    a.click();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

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

  const saveChartTitle = async (targetIndex) => {
    if (!tempTitle.trim() || targetIndex === null) {
      setEditingIndex(null);
      return;
    }

    // 1. Update local state immediately so it changes on the screen instantly!
    const updatedCharts = [...localCharts];
    updatedCharts[targetIndex] = { 
      ...updatedCharts[targetIndex], 
      title: tempTitle 
    };
    
    setLocalCharts(updatedCharts);
    setEditingIndex(null);

    // 2. ONLY send to the backend if this chart belongs to an already-saved dashboard.
    // (If it doesn't have a dashboard_id, it means it's just a dynamic preview view!)
    const dashboardId = updatedCharts[0]?.dashboard_id; 

    if (!dashboardId) {
      console.log("✏️ Title updated on screen. It will be saved permanently when you save the full dashboard.");
      return; // STOP HERE. Do not make the API call.
    }

    // 3. Send to backend (This only runs if dashboardId actually exists)
    try {
      await axios.put(`${API_URL}/dashboards/${dashboardId}`, {
        charts: updatedCharts
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      console.log("✅ Title saved to database!");
    } catch (error) {
      console.error("❌ Failed to save new chart title to database:", error);
    }
  };

  const handleSaveDashboard = async () => {
    if (!saveModalName.trim()) return;
    setIsSavingDashboard(true);
    
    try {
      // 1. Prepare the payload for your backend
      const payload = {
        name: saveModalName,
        layout: layouts, // the current grid layout
        charts: localCharts, // your charts with the updated titles
        dataset_id: activeDataset?.id
      };

      // 2. Send the POST request to create the dashboard
      const response = await axios.post(`${API_URL}/dashboards`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 3. The backend returns the new dashboard object (including its new ID)
      const newDashboardId = response.data.id;

      // 4. Update our local charts so they now know they belong to a saved dashboard!
      const updatedChartsWithId = localCharts.map(c => ({
        ...c,
        dashboard_id: newDashboardId
      }));
      setLocalCharts(updatedChartsWithId);

      setIsSaveModalOpen(false);
      alert('✅ Dashboard saved successfully!'); 

    } catch (error) {
      console.error("❌ Failed to save dashboard:", error);
      alert('Failed to save dashboard. Check console for details.');
    } finally {
      setIsSavingDashboard(false);
    }
  };

  const chartTypeLabels = {
    bar:   <BarChart3 size={13} />,
    line:  <LineChart size={13} />,
    pie:   <PieChart size={13} />,
    table: <TableIcon size={13} />,
  };

  return (
    <div className={`dd-root ${isDark ? 'dark' : ''}`}>

      {/* ── Header ── */}
      <header className="dd-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={handleBack} className="dd-back-btn">
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <div style={{ width: 1, height: 18, background: 'var(--dd-border)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dd-text-1)', lineHeight: 1.2 }}>
              {dashboardName || activeDataset?.name || 'Analytics'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--dd-text-3)', lineHeight: 1.2 }}>
              {visibleCharts.length} panels
            </div>
          </div>
        </div>

        {!isPresentMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="dd-filter-bar">
              {[
                { k: 'all',   i: <Grid3x3 size={13} /> },
                { k: 'bar',   i: <BarChart3 size={13} /> },
                { k: 'line',  i: <LineChart size={13} /> },
                { k: 'pie',   i: <PieChart size={13} /> },
                { k: 'table', i: <TableIcon size={13} /> },
              ].map(t => (
                <button type="button" key={t.k} onClick={() => setChartFilter(t.k)} className={`dd-tool-btn ${chartFilter === t.k ? 'active' : ''}`} title={t.k}>
                  {t.i}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button type="button" onClick={() => setIsLayoutOpen(!isLayoutOpen)} className="dd-btn-outline" style={{ gap: 6 }}>
                <LayoutDashboard size={13} />
                <span style={{ fontSize: 11 }}>
                  {activePreset === 'smart' ? 'Smart' : activePreset === '1col' ? '1 Col' : `${activePreset.charAt(0)} Col`}
                </span>
                <ChevronDown size={11} style={{ opacity: 0.5 }} />
              </button>
              {isLayoutOpen && (
                <div className="dd-dropdown">
                  {[
                    { id: '1col',  name: '1 Column',  icon: <Columns size={13} /> },
                    { id: '2col',  name: '2 Columns', icon: <Columns size={13} /> },
                    { id: '3col',  name: '3 Columns', icon: <Grid3x3 size={13} /> },
                    { id: '4col',  name: '4 Columns', icon: <LayoutDashboard size={13} /> },
                    { id: 'smart', name: 'Smart',     icon: <Zap size={13} /> },
                  ].map(p => (
                    <button type="button" key={p.id} onClick={() => applyPreset(p.id)}>
                      {p.icon}
                      {p.name}
                      {activePreset === p.id && <CheckCircle2 size={12} style={{ marginLeft: 'auto', color: 'var(--dd-blue)' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button type="button" onClick={() => setIsPresentMode(!isPresentMode)} className="dd-btn-outline" style={{ padding: '0 10px' }} title="Present mode">
            <Eye size={13} />
          </button>
          <button type="button" onClick={toggleTheme} className="dd-btn-outline" style={{ padding: '0 10px' }} title="Toggle theme">
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <button type="button" onClick={handleShare} className="dd-btn-outline">
            {copiedShare ? <CheckCircle2 size={13} /> : <Share2 size={13} />}
            <span>Share</span>
          </button>
          <button type="button" onClick={() => { setExportType('pdf'); setIsExportModalOpen(true); }} disabled={isExportingPDF} className="dd-btn-outline">
            {isExportingPDF ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            <span>PDF</span>
          </button>
          <button type="button" onClick={() => { setExportType('ppt'); setIsExportModalOpen(true); }} className="dd-btn-primary" style={{ background: '#ea580c' }}>
            <MonitorPlay size={13} />
            <span>PPT</span>
          </button>
          
          {/* ── SAVE DASHBOARD BUTTON ── */}
          <button 
            type="button" 
            onClick={() => {
              setSaveModalName(dashboardName || (activeDataset?.name ? `${activeDataset.name} Dashboard` : 'My Dashboard'));
              setIsSaveModalOpen(true);
            }} 
            className="dd-btn-primary" 
            style={{ background: 'var(--dd-blue)' }} 
          >
            <Save size={13} />
            <span>Save</span>
          </button>

          <button type="button" onClick={() => setIsConsultOpen(!isConsultOpen)} className="dd-btn-primary">
            <Sparkles size={13} />
            <span>AI</span>
          </button>
        </div>
      </header>

      {/* ── KPI Strip ── */}
      
      {/* ── Body ── */}
      <div className="dd-body">
        <div className="dd-canvas-area">
          <ResponsiveGridLayout
            key={layoutKey}
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            draggableHandle=".drag-handle"
            onLayoutChange={onLayoutChange}
            margin={[14, 14]}
            compactType="vertical"
          >
            {/* ── FIX: Maps using visibleCharts but references the exact trueIndex ── */}
            {visibleCharts.map((c, i) => {
              const trueIndex = localCharts.indexOf(c);
              
              return (
              <div key={String(c.id || trueIndex)} id={`panel-${c.id || trueIndex}`} className="dd-panel group">
                <div className="dd-panel-header drag-handle">
                  <div className="dd-panel-drag-area">
                    <span className="dd-panel-title">
                      <span className="dd-panel-title-icon">{chartTypeLabels[c.chart_type]}</span>
                      
                      {/* ── FIX: Index based checking + Event Stoppers ── */}
                      {editingIndex === trueIndex ? (
                        <input
                          autoFocus
                          type="text"
                          value={tempTitle}
                          onChange={(e) => setTempTitle(e.target.value)}
                          onBlur={() => saveChartTitle(trueIndex)}
                          onMouseDown={(e) => e.stopPropagation()} // Prevents dragging when clicking
                          onKeyDown={(e) => {
                            e.stopPropagation(); // Prevents grid from eating keystrokes
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveChartTitle(trueIndex);
                            }
                            if (e.key === 'Escape') {
                              setEditingIndex(null);
                            }
                          }}
                          style={{
                            background: 'var(--dd-bg)',
                            border: '1px solid var(--dd-blue)',
                            color: 'var(--dd-text-1)',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '12px',
                            outline: 'none',
                            maxWidth: 160
                          }}
                        />
                      ) : (
                        <div 
                          onClick={() => {
                            setEditingIndex(trueIndex);
                            setTempTitle(c.title || 'Untitled');
                          }}
                          title="Click to rename"
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            cursor: 'pointer', 
                            maxWidth: 180 
                          }}
                        >
                          <span style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }}>
                            {c.title || 'Untitled'}
                          </span>
                          <Edit2 size={12} style={{ color: 'var(--dd-text-3)', flexShrink: 0, opacity: 0.7 }} />
                        </div>
                      )}
                    </span>
                  </div>
                  <div className="dd-panel-actions">
                    <button
                      type="button"
                      onClick={() => setPinnedInsights(p =>
                        p.includes(String(c.id || trueIndex)) ? p.filter(x => x !== String(c.id || trueIndex)) : [...p, String(c.id || trueIndex)]
                      )}
                      className={`dd-panel-action ${pinnedInsights.includes(String(c.id || trueIndex)) ? 'dd-active-pin' : ''}`}
                      title="Pin insight"
                    >
                      <Zap size={12} fill={pinnedInsights.includes(String(c.id || trueIndex)) ? 'currentColor' : 'none'} />
                    </button>
                    <button type="button" onClick={() => handleExportImage(String(c.id || trueIndex))} className="dd-panel-action" title="Export PNG">
                      <ImageIcon size={12} />
                    </button>
                    <button type="button" onClick={() => setRemovedPanels(p => [...p, String(c.id || trueIndex)])} className="dd-panel-action" title="Remove">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, padding: '12px', overflow: 'hidden' }}>
                  <MemoizedChart config={c} compact={true} exportWidth={exportWidth} />
                </div>

                {c.explanation && (
                  <div className={`dd-insight-overlay ${pinnedInsights.includes(String(c.id || trueIndex)) ? 'dd-pinned-insight' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <button 
                        type="button"
                        onClick={() => setPinnedInsights(p =>
                          p.includes(String(c.id || trueIndex)) ? p.filter(x => x !== String(c.id || trueIndex)) : [...p, String(c.id || trueIndex)]
                        )}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, marginTop: 4 }}
                        title="Pin Summary"
                      >
                        <Zap size={14} fill={pinnedInsights.includes(String(c.id || trueIndex)) ? 'var(--dd-blue)' : 'none'} style={{ color: pinnedInsights.includes(String(c.id || trueIndex)) ? 'var(--dd-blue)' : 'var(--dd-text-3)' }} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--dd-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>AI Summary</div>
                        <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: 'var(--dd-text-2)', maxHeight: '100px', overflowY: 'auto' }}>
                          {c.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )})}
          </ResponsiveGridLayout>
        </div>

        {/* ── AI sidebar ── */}
        {isConsultOpen && (
          <aside className="dd-sidebar animate-in">
            <div className="dd-sidebar-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--dd-bg)', border: '1px solid var(--dd-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cpu size={13} style={{ color: 'var(--dd-text-2)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dd-text-1)' }}>Lumina AI</div>
                  <div style={{ fontSize: 10, color: 'var(--dd-text-3)' }}>Contextual analyst</div>
                </div>
              </div>
              <button type="button" onClick={() => setIsConsultOpen(false)} className="dd-panel-action"><X size={14} /></button>
            </div>
            <div className="dd-chat-messages">
              {chatMessages.map((m, i) => (
                <div key={i} className={`dd-bubble ${m.role === 'user' ? 'dd-bubble-user' : 'dd-bubble-ai'}`}>{m.text}</div>
              ))}
              {isAITyping && (
                <div className="dd-bubble dd-bubble-ai" style={{ opacity: 0.6 }}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>Analyzing···</span>
                </div>
              )}
            </div>
            <div className="dd-sidebar-footer">
              <div className="dd-input-group">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={e => setCurrentMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about this data…"
                />
                <button type="button" onClick={handleSend} className="dd-send-btn"><Send size={13} /></button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── Present mode exit ── */}
      {isPresentMode && (
        <button
          type="button"
          onClick={() => setIsPresentMode(false)}
          className="dd-exit-present-btn"
          style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2000 }}
        >
          <div className="dd-exit-icon"><X size={12} /></div>
          Exit presentation
        </button>
      )}

      {/* ── Export modal ── */}
      {isExportModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', padding: 16,
        }}>
          <div style={{
            background: 'var(--dd-surface)', border: '1px solid var(--dd-border)',
            borderRadius: 12, padding: 28, maxWidth: 380, width: '100%',
            boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              {exportType === 'pdf'
                ? <FileText size={17} style={{ color: 'var(--dd-text-2)' }} />
                : <MonitorPlay size={17} style={{ color: 'var(--dd-text-2)' }} />}
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dd-text-1)' }}>
                Export {exportType.toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--dd-text-3)', margin: '0 0 22px' }}>
              {visibleCharts.length} panels will be exported. Give this report a name.
            </p>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--dd-text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Report title
              </label>
              <input
                type="text"
                value={reportName}
                onChange={e => setReportName(e.target.value)}
                placeholder="e.g. Q1 Analysis"
                autoFocus
                style={{
                  width: '100%', padding: '9px 13px',
                  background: 'var(--dd-bg)', border: '1px solid var(--dd-border)',
                  borderRadius: 8, fontSize: 13, color: 'var(--dd-text-1)',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  transition: 'border-color 0.12s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--dd-blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--dd-border)'}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                disabled={isExportingPDF}
                style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid var(--dd-border)', background: 'none', color: 'var(--dd-text-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => exportType === 'pdf' ? handleExportPDF(reportName) : handleExportPPT(reportName)}
                disabled={isExportingPDF || !reportName.trim()}
                style={{
                  flex: 2, padding: '9px', borderRadius: 8, border: 'none',
                  background: 'var(--dd-accent)', color: 'var(--dd-bg)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: (isExportingPDF || !reportName.trim()) ? 0.4 : 1,
                  transition: 'opacity 0.12s',
                }}
              >
                {isExportingPDF ? <Loader2 size={13} className="animate-spin" /> : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save Dashboard Modal ── */}
      {isSaveModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', padding: 16,
        }}>
          <div style={{
            background: 'var(--dd-surface)', border: '1px solid var(--dd-border)',
            borderRadius: 12, padding: 28, maxWidth: 380, width: '100%',
            boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Save size={17} style={{ color: 'var(--dd-blue)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dd-text-1)' }}>
                Save Dashboard
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--dd-text-3)', margin: '0 0 22px' }}>
              Save this layout and all renamed charts to your workspace.
            </p>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--dd-text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Dashboard Name
              </label>
              <input
                type="text"
                value={saveModalName}
                onChange={e => setSaveModalName(e.target.value)}
                autoFocus
                style={{
                  width: '100%', padding: '9px 13px',
                  background: 'var(--dd-bg)', border: '1px solid var(--dd-border)',
                  borderRadius: 8, fontSize: 13, color: 'var(--dd-text-1)',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  transition: 'border-color 0.12s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--dd-blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--dd-border)'}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                disabled={isSavingDashboard}
                style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid var(--dd-border)', background: 'none', color: 'var(--dd-text-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDashboard}
                disabled={isSavingDashboard || !saveModalName.trim()}
                style={{
                  flex: 2, padding: '9px', borderRadius: 8, border: 'none',
                  background: 'var(--dd-blue)', color: '#fff',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: (isSavingDashboard || !saveModalName.trim()) ? 0.4 : 1,
                  transition: 'opacity 0.12s',
                }}
              >
                {isSavingDashboard ? <Loader2 size={13} className="animate-spin" /> : 'Save Now'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}