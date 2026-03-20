import React from 'react';
import {
  UploadCloud, Moon, Sun, LogOut,
  PanelLeftClose, PanelLeftOpen, Loader2,
  CheckCircle2, XCircle, Sparkles, Menu
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
  const { 
    isDark, 
    toggleTheme, 
    logout,
    globalUploadState, 
    isSidebarVisible, 
    setIsSidebarVisible, 
    isAiSidebarOpen,
    setIsAiSidebarOpen,
    setIsUploadOpen,
    user 
  } = useStore();

  const userName = user?.name || '';

  return (
    <>
      {/* ── Desktop header ────────────────────────────────────────────────── */}
      <header className="app-header">

        {/* Left: toggle + breadcrumb */}
        <div className="hdr-left">
          <button
            className="hdr-icon-btn hdr-toggle"
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            title={isSidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
          >
            <Menu size={18} className="hdr-mobile-only" />
            <div className="hdr-desktop-only" style={{ display: 'flex' }}>
              {isSidebarVisible ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </div>
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
          <div className="hdr-avatar-wrap" title={userName || 'Profile'}>
            <div className="hdr-avatar">{getInitials(userName)}</div>
          </div>

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

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <nav className="hdr-mobile-nav">
        <button className="hdr-mob-item" onClick={() => setIsAiSidebarOpen(true)} style={{ color: isAiSidebarOpen ? 'var(--hdr-text-primary)' : '' }}>
          <Sparkles size={20} />
          <span>AI Chat</span>
        </button>

        <button className="hdr-mob-item" onClick={() => setIsUploadOpen(true)}>
          <div className="hdr-mob-upload">
            <UploadCloud size={22} />
          </div>
        </button>

        <button className="hdr-mob-item" onClick={toggleTheme}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
          <span>Theme</span>
        </button>
      </nav>
    </>
  );
};


export default Header;