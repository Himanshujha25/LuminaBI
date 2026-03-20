import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud, Moon, Sun, LogOut, Menu, X, MessageSquareMore,
  PanelLeftClose, PanelLeftOpen, Loader2,
  CheckCircle2, XCircle,
  LayoutDashboard, BarChart3, Layers, Settings, LifeBuoy, Database,
} from 'lucide-react';
import './Header.css';
import useStore from '../store/useStore';


const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

/* ── Upload status pill ──────────────────────────────────────────────────── */
const UploadStatus = ({ uploadState }) => {
  if (!uploadState) return null;
  const { status, progress, fileName } = uploadState;

  if (status === 'uploading') return (
    <div className="hdr-status uploading">
      <Loader2 size={14} className="hdr-spin" />
      <div className="hdr-progress">
        <div className="hdr-progress-row">
          <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fileName}
          </span>
          <span className="hdr-progress-pct">{progress ?? 0}%</span>
        </div>
        <div className="hdr-progress-track">
          <div className="hdr-progress-fill" style={{ width: `${progress ?? 0}%` }} />
        </div>
      </div>
    </div>
  );

  if (status === 'success') return (
    <div className="hdr-status success">
      <CheckCircle2 size={14} />
      <span>Upload complete</span>
    </div>
  );

  if (status === 'error') return (
    <div className="hdr-status error">
      <XCircle size={14} />
      <span>Upload failed</span>
    </div>
  );

  return null;
};

/* ── Main component ──────────────────────────────────────────────────────── */
const Header = () => {
  const navigate = useNavigate();
  const { 
    isDark, 
    toggleTheme, 
    logout, 
    globalUploadState, 
    isSidebarVisible, 
    setIsSidebarVisible, 
    setIsUploadOpen,
    user,
    activeDataset,
    currentView,
    setCurrentView,
    setIsManageOpen,
    isAiPanelOpen,
    setIsAiPanelOpen,
  } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userName = user?.name || '';
  const userTitle = userName || user?.email || 'Profile';
  const mobileTitleMap = {
    overview: 'Dashboard',
    analytics: 'Dashboard',
    dashboards: 'Saved Dashboards',
    settings: 'Settings',
    support: 'Support',
    datasets: 'Datasets',
  };
  const mobileTitle = mobileTitleMap[currentView] || 'Workspace';

  const handleOpenOverview = () => {
    navigate('/dashboard');
    setCurrentView('overview');
    setIsAiPanelOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleOpenChat = () => {
    navigate('/dashboard');
    setCurrentView('overview');
    setIsAiPanelOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleAnalyticsClick = () => {
    if (!activeDataset) return;
    const slugName = activeDataset.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    navigate(`/analytics/${slugName}/${activeDataset.id}/lumina_25`);
    setCurrentView('analytics');
    setIsMobileMenuOpen(false);
  };

  const mobileMenuItems = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard, action: handleOpenOverview },
    { key: 'analytics', label: 'Dashboard', icon: BarChart3, action: handleAnalyticsClick, disabled: !activeDataset },
    { key: 'chat', label: 'Chat', icon: MessageSquareMore, action: handleOpenChat },
    { key: 'dashboards', label: 'Saved Dashboards', icon: Layers, action: () => { navigate('/dashboard'); setCurrentView('dashboards'); setIsMobileMenuOpen(false); } },
    { key: 'datasets', label: 'Datasets', icon: Database, action: () => { navigate('/dashboard'); setCurrentView('datasets'); setIsManageOpen(true); setIsMobileMenuOpen(false); } },
    { key: 'support', label: 'Support', icon: LifeBuoy, action: () => { navigate('/dashboard'); setCurrentView('support'); setIsMobileMenuOpen(false); } },
    { key: 'settings', label: 'Settings', icon: Settings, action: () => { navigate('/dashboard'); setCurrentView('settings'); setIsMobileMenuOpen(false); } },
  ];

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) {
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
    <>
      {/* ── Desktop header ────────────────────────────────────────────────── */}
      <header className="app-header">

        {/* Left: toggle + breadcrumb */}
        <div className="hdr-left">
          <div className="hdr-mobile-title">
            <strong>{mobileTitle}</strong>
            <span>{activeDataset?.name || 'LuminaBI'}</span>
          </div>
          <button
            className="hdr-icon-btn hdr-toggle"
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            title={isSidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
          >
            {isSidebarVisible
              ? <PanelLeftClose size={16} />
              : <PanelLeftOpen  size={16} />}
          </button>
          <span className="hdr-crumb">Workspace / Analytics</span>
        </div>

        {/* Right: actions */}
        <div className="hdr-right">

          {/* Upload status */}
          <UploadStatus uploadState={globalUploadState} />

          {/* Theme toggle */}
          <button
            className="hdr-icon-btn hdr-desktop"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Upload */}
          <button className="hdr-upload-btn hdr-desktop" onClick={() => setIsUploadOpen(true)}>
            <UploadCloud size={13} />
            Upload CSV
          </button>

          <div className="hdr-divider hdr-desktop" />

          {/* Avatar */}
          <div className="hdr-avatar-wrap hdr-desktop" title={userName || 'Profile'}>
            <div className="hdr-avatar">{getInitials(userName)}</div>
          </div>

          <div className="hdr-mobile-profile" title={userTitle}>
            <div className="hdr-avatar">{getInitials(userName)}</div>
          </div>

          <button
            className="hdr-icon-btn hdr-mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            title={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>

          {/* Logout */}
          <button
            className="hdr-icon-btn hdr-logout hdr-desktop"
            onClick={logout}
            title="Log out"
          >
            <LogOut size={15} />
          </button>

        </div>
      </header>

      {isMobileMenuOpen && (
        <>
          <button className="hdr-mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close mobile menu" />
          <div className="hdr-mobile-drawer">
            <div className="hdr-mobile-drawer-head">
              <div className="hdr-mobile-user">
                <div className="hdr-avatar">{getInitials(userName)}</div>
                <div className="hdr-mobile-user-copy">
                  <strong>{userTitle}</strong>
                  <span>{activeDataset?.name || 'No dataset selected'}</span>
                </div>
              </div>
              <button className="hdr-icon-btn" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close mobile menu">
                <X size={17} />
              </button>
            </div>

            <div className="hdr-mobile-menu-list">
              {mobileMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    className="hdr-mobile-menu-item"
                    onClick={item.action}
                    disabled={item.disabled}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              className="hdr-mobile-menu-item hdr-mobile-menu-logout"
              onClick={() => {
                setIsMobileMenuOpen(false);
                logout();
              }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </>
      )}

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <nav className="hdr-mobile-nav">
        <button className="hdr-mob-item" onClick={() => setIsUploadOpen(true)}>
          <div className="hdr-mob-upload">
            <UploadCloud size={22} />
          </div>
          <span>Upload</span>
        </button>

        <button className="hdr-mob-item" onClick={toggleTheme}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
          <span>Theme</span>
        </button>

        <button
          className={`hdr-mob-item ${isAiPanelOpen ? 'active' : ''}`}
          onClick={() => {
            navigate('/dashboard');
            setCurrentView('overview');
            setIsAiPanelOpen(!isAiPanelOpen);
          }}
        >
          <MessageSquareMore size={20} />
          <span>AI</span>
        </button>
      </nav>
    </>
  );
};


export default Header;
