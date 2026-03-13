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
  userName = "Himanshu", // Add userName to your props (defaulted for testing)
  onUploadClick, 
  onManageClick, 
  toggleTheme, 
  isDark, 
  onLogout, 
  uploadState 
}) => {
  return (
    <header className="app-header glass-panel">
      <div className="header-logo">
        <div className="logo-icon">
          <BarChart2 size={24} color="#fff" />
        </div>
        <h1 className="logo-text">Lumina <span className="gradient-text">BI</span> Dashboard</h1>
      </div>
      
      <div className="header-actions">
        {uploadState && uploadState.uploading && (
           <div className="global-upload-indicator" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 16px', background: 'var(--surface-color)', borderRadius: '99px', border: '1px solid var(--accent-blue)', color: 'var(--text-primary)', fontSize: '13px', marginRight: '8px' }}>
              <Loader2 className="spinner-icon" size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-blue)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '120px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>{uploadState.progress === 100 ? 'Processing...' : 'Uploading...'}</span>
                    <span style={{ color: 'var(--accent-blue)' }}>{uploadState.progress}%</span>
                 </div>
                 <div style={{ width: '100%', height: '4px', background: 'var(--surface-hover)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadState.progress}%`, height: '100%', background: 'var(--accent-blue)', transition: 'width 0.2s' }}></div>
                 </div>
              </div>
           </div>
        )}
        {uploadState && !uploadState.uploading && uploadState.step === 2 && (
           <div className="global-upload-indicator animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--surface-color)', borderRadius: '99px', border: '1px solid #10b981', color: '#10b981', fontSize: '13px', marginRight: '8px', fontWeight: 600 }}>
              <CheckCircle size={16} /> Ready
           </div>
        )}
        {uploadState && !uploadState.uploading && uploadState.error && (
           <div className="global-upload-indicator animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--surface-color)', borderRadius: '99px', border: '1px solid #ef4444', color: '#ef4444', fontSize: '13px', marginRight: '8px', fontWeight: 600 }}>
              <AlertCircle size={16} /> Error
           </div>
        )}

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

        <div className="divider-vertical" style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>

        {/* --- USER AVATAR BADGE --- */}
        <div className="user-profile-badge" title={userName}>
          <div className="user-avatar">
            {getInitials(userName)}
          </div>
        </div>

        <button className="btn-logout" onClick={onLogout} title="Log Out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;