import React from 'react';
import { UploadCloud, BarChart2, Moon, Sun, LogOut } from 'lucide-react';
import './Header.css';

const Header = ({ onUploadClick, toggleTheme, isDark, onLogout }) => {
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
