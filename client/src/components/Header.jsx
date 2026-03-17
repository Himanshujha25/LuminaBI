import React, { useEffect, useState } from 'react';
import { UploadCloud, BarChart2, Moon, Sun, LogOut, Database, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import './Header.css';

const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

const Header = ({
  onUploadClick,
  onManageClick,
  toggleTheme,
  isDark,
  onLogout,
  isSidebarVisible,
  setIsSidebarVisible
}) => {

  const [userName, setUserName] = useState('');

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.data?.user?.name) {
          setUserName(res.data.user.name);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };

    fetchUser();
  }, []);

  return (
    <>
      <header className="app-header glass-panel">
        <div className="flex items-center gap-2 pl-4">
          <button 
            className="icon-btn dashboard-sidebar-toggle" 
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            title={isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
          >
            {isSidebarVisible ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
          <div className="header-breadcrumbs">
            <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Workspace / Analytics</span>
          </div>
        </div>


        <div className="header-actions">
          <button className="icon-btn desktop-only" onClick={toggleTheme} title="Toggle Theme">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>



          <button className="btn-primary desktop-only" onClick={onUploadClick}>
            <UploadCloud size={18} />
            <span>Upload CSV</span>
          </button>

          <div className="divider-vertical desktop-only"></div>

          <div className="user-profile-badge" title={userName}>
            <div className="user-avatar">
              {getInitials(userName)}
            </div>
          </div>

          <button className="icon-btn btn-logout desktop-only" onClick={onLogout} title="Log Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <nav className="mobile-bottom-bar glass-panel">


        <button className="mobile-nav-item" onClick={onUploadClick}>
          <div className="upload-nav-icon">
            <UploadCloud size={24} />
          </div>
        </button>

        <button className="mobile-nav-item" onClick={toggleTheme}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
          <span>Theme</span>
        </button>

        <button className="mobile-nav-item text-danger" onClick={onLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
};

export default Header;