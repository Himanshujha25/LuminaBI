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
  Zap, Database, CheckCircle2, Eye, Activity, TrendingUp, FileText
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

export default function DynamicDashboard({ charts, onClose }) {
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

  const generateLayout = useCallback((preset = '3col', filteredCharts = charts) =>
    filteredCharts.map((chart, i) => {
      let w = 4, h = 4;
      if (preset === '1col')  { w = 12; h = 5; }
      else if (preset === '2col')  { w = 6;  h = 4; }
      else if (preset === '4col')  { w = 3;  h = 4; }
      else if (preset === 'smart') {
        w = (chart.chart_type === 'line' || chart.chart_type === 'area') ? 8 : chart.chart_type === 'pie' ? 4 : 6;
        h = 4;
      }
      return { i: String(chart.id), x: (i * w) % 12, y: Math.floor((i * w) / 12) * h, w, h, minW: 2, minH: 4 };
    }), [charts]);

  const [layouts, setLayouts] = useState(() => ({ lg: generateLayout('3col') }));

  const visibleCharts = useMemo(() =>
    charts.filter(c => !removedPanels.includes(String(c.id)) && (chartFilter === 'all' || c.chart_type === chartFilter)),
    [charts, removedPanels, chartFilter]);

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
        type, content, name: activeDataset?.name, dashboard_id: charts[0]?.dashboard_id
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
        ? `The primary variance driver is ${charts[0]?.x_axis_column || 'the lead dimension'}.`
        : `${charts.length} visualizations are loaded from ${activeDataset?.name}. Ask me anything specific.`;
      setChatMessages(p => [...p, { role: 'ai', text: reply }]);
      setIsAITyping(false);
    }, 900);
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
          {/* ── FIXED back button — type=button, uses handleBack ── */}
          <button type="button" onClick={handleBack} className="dd-back-btn">
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <div style={{ width: 1, height: 18, background: 'var(--dd-border)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dd-text-1)', lineHeight: 1.2 }}>
              {activeDataset?.name || 'Analytics'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--dd-text-3)', lineHeight: 1.2 }}>
              {visibleCharts.length} panels
            </div>
          </div>
        </div>

        {!isPresentMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Chart type filter */}
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

            {/* Layout picker */}
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
          <button type="button" onClick={() => setIsConsultOpen(!isConsultOpen)} className="dd-btn-primary">
            <Sparkles size={13} />
            <span>AI</span>
          </button>
        </div>
      </header>

      {/* ── KPI Strip ── */}
      <div className="dd-kpi-strip">
        {[
          { label: 'Panels',  value: String(visibleCharts.length), icon: <Activity size={11} /> },
          { label: 'Engine',  value: 'Lumina v2.5',                icon: <Zap size={11} /> },
          { label: 'Status',  value: 'Live',                       icon: <TrendingUp size={11} /> },
        ].map((k, i) => (
          <div key={i} className="dd-kpi-item">
            <span className="dd-kpi-label">{k.label}</span>
            <span className="dd-kpi-value">{k.icon}{k.value}</span>
          </div>
        ))}
      </div>

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
            {visibleCharts.map(c => (
              <div key={String(c.id)} id={`panel-${c.id}`} className="dd-panel group">
                <div className="dd-panel-header drag-handle">
                  <div className="dd-panel-drag-area">
                    <span className="dd-panel-title">
                      <span className="dd-panel-title-icon">{chartTypeLabels[c.chart_type]}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                        {c.title || 'Untitled'}
                      </span>
                    </span>
                  </div>
                  <div className="dd-panel-actions">
                    <button
                      type="button"
                      onClick={() => setPinnedInsights(p =>
                        p.includes(String(c.id)) ? p.filter(x => x !== String(c.id)) : [...p, String(c.id)]
                      )}
                      className={`dd-panel-action ${pinnedInsights.includes(String(c.id)) ? 'dd-active-pin' : ''}`}
                      title="Pin insight"
                    >
                      <Zap size={12} fill={pinnedInsights.includes(String(c.id)) ? 'currentColor' : 'none'} />
                    </button>
                    <button type="button" onClick={() => handleExportImage(String(c.id))} className="dd-panel-action" title="Export PNG">
                      <ImageIcon size={12} />
                    </button>
                    <button type="button" onClick={() => setRemovedPanels(p => [...p, String(c.id)])} className="dd-panel-action" title="Remove">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, padding: '12px', overflow: 'hidden' }}>
                  <MemoizedChart config={c} compact={true} exportWidth={exportWidth} />
                </div>

                {c.explanation && (
                  <div className={`dd-insight-overlay ${pinnedInsights.includes(String(c.id)) ? 'dd-pinned-insight' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <button 
                        type="button"
                        onClick={() => setPinnedInsights(p =>
                          p.includes(String(c.id)) ? p.filter(x => x !== String(c.id)) : [...p, String(c.id)]
                        )}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, marginTop: 4 }}
                        title="Pin Summary"
                      >
                        <Zap size={14} fill={pinnedInsights.includes(String(c.id)) ? 'var(--dd-blue)' : 'none'} style={{ color: pinnedInsights.includes(String(c.id)) ? 'var(--dd-blue)' : 'var(--dd-text-3)' }} />
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
            ))}
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
    </div>
  );
}