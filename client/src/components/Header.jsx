import React from 'react';
import { UploadCloud, BarChart2, Moon, Sun, LogOut, Database } from 'lucide-react';
import './Header.css';

const Header = ({ onUploadClick, onManageClick, toggleTheme, isDark, onLogout }) => {
  return (
    <header className="app-header glass-panel">
      <div className="header-logo">
        <div className="logo-icon">
          <BarChart2 size={24} color="#fff" />
        </div>
        <h1 className="logo-text">AI <span className="gradient-text">BI</span> Dashboard</h1>
      </div>
      
      <div className="header-actions">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="btn-manage" onClick={onManageClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s' }}>
          <Database size={16} />
          <span>Manage Data</span>
        </button>
        <button className="btn-upload" onClick={onUploadClick}>
          <UploadCloud size={18} />
          <span>Upload CSV Data</span>
        </button>
        <button className="btn-logout" onClick={onLogout} title="Log Out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
