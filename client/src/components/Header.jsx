import React, { useEffect, useState } from 'react';
import {
  UploadCloud, Moon, Sun, LogOut,
  PanelLeftClose, PanelLeftOpen, Loader2,
  CheckCircle2, XCircle,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import './Header.css';

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
const Header = ({
  onUploadClick,
  onManageClick,
  toggleTheme,
  isDark,
  onLogout,
  uploadState,
  isSidebarVisible,
  setIsSidebarVisible,
}) => {
  const [userName, setUserName] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const scroller = document.querySelector('.dashboard-main') || window;
    const onScroll = () => {
      const top = scroller === window ? window.scrollY : scroller.scrollTop;
      setScrolled(top > 10);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.user?.name) setUserName(res.data.user.name);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    fetchUser();
  }, []);

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
            {isSidebarVisible
              ? <PanelLeftClose size={18} />
              : <PanelLeftOpen  size={18} />}
          </button>
          <span className="hdr-crumb">Workspace / Analytics</span>
        </div>

        {/* Right: actions */}
        <div className="hdr-right">

          {/* Upload status */}
          <UploadStatus uploadState={uploadState} />

          {/* Theme toggle */}
          <button
            className="hdr-icon-btn hdr-desktop"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Upload */}
          <button className="hdr-upload-btn hdr-desktop" onClick={onUploadClick}>
            <UploadCloud size={15} />
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
            onClick={onLogout}
            title="Log out"
          >
            <LogOut size={17} />
          </button>

        </div>
      </header>

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <nav className="hdr-mobile-nav">
        <button className="hdr-mob-item" onClick={onUploadClick}>
          <div className="hdr-mob-upload">
            <UploadCloud size={22} />
          </div>
        </button>

        <button className="hdr-mob-item" onClick={toggleTheme}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
          <span>Theme</span>
        </button>

        <button className="hdr-mob-item danger" onClick={onLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
};

export default Header;