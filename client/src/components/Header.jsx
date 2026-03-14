import React from 'react';
import { UploadCloud, BarChart2, Moon, Sun, LogOut, Database } from 'lucide-react';
import './Header.css';

const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

const Header = ({ 
  userName = "Himanshu", 
  onUploadClick, 
  onManageClick, 
  toggleTheme, 
  isDark, 
  onLogout 
}) => {
  return (
    <>
      <header className="app-header glass-panel">
        <div className="header-logo">
          <div className="logo-icon">
            <BarChart2 size={24} color="#fff" />
          </div>
          <h1 className="logo-text">
            Lumina <span className="gradient-text">BI</span>
          </h1>
        </div>
        
        <div className="header-actions">
          <button className="icon-btn desktop-only" onClick={toggleTheme} title="Toggle Theme">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button className="btn-secondary desktop-only" onClick={onManageClick}>
            <Database size={16} />
            <span>Manage Data</span>
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
         <button className="mobile-nav-item" onClick={onManageClick}>
           <Database size={20} />
           <span>Manage</span>
         </button>
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