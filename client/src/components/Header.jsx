import React from 'react';
import { UploadCloud, BarChart2, Moon, Sun, LogOut, Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import './Header.css';

// Helper function to extract initials (e.g., "himanshu" -> "H", "rahul kumar" -> "RK")
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
  onLogout, 
  uploadState 
}) => {
  return (
    <>
      <header className="app-header glass-panel">
        <div className="header-logo">
          <div className="logo-icon">
            <BarChart2 size={24} color="#fff" />
          </div>
          {/* Enhanced: Hides only "Dashboard" on mobile so "Lumina BI" still shows */}
          <h1 className="logo-text">
            Lumina <span className="gradient-text">BI</span> <span className="hide-on-mobile">Dashboard</span>
          </h1>
        </div>
        
        <div className="header-actions">
          {/* Upload Status Indicators */}
          {uploadState && uploadState.uploading && (
             <div className="status-indicator uploading">
                <Loader2 className="spinner-icon" size={16} />
                <div className="progress-container">
                   <div className="progress-text">
                      <span>{uploadState.progress === 100 ? 'Processing...' : 'Uploading...'}</span>
                      <span className="progress-percentage">{uploadState.progress}%</span>
                   </div>
                   <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${uploadState.progress}%` }}></div>
                   </div>
                </div>
             </div>
          )}
          {uploadState && !uploadState.uploading && uploadState.step === 2 && (
             <div className="status-indicator success animate-fade-in">
                <CheckCircle size={16} /> Ready
             </div>
          )}
          {uploadState && !uploadState.uploading && uploadState.error && (
             <div className="status-indicator error animate-fade-in">
                <AlertCircle size={16} /> Error
             </div>
          )}

          {/* Desktop Only Tools */}
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

          {/* User Avatar - Visible on Desktop AND Mobile */}
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

      {/* Mobile Bottom Navigation Bar */}
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