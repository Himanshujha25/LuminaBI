import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  BarChart3, 
  Settings, 
  Zap, 
  Plus, 
  ChevronRight,
  Sparkles,
  PieChart,
  LifeBuoy
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ 
  activeDataset, 
  datasets, 
  setActiveDataset, 
  onUploadClick, 
  onManageClick,
  onAnalyticsClick,
  isSidebarOpen,
  setIsSidebarOpen,
  isVisible 
}) => {
  return (
    <aside className={`saas-sidebar ${isSidebarOpen ? 'open' : ''} ${!isVisible ? 'hidden-desktop' : ''}`}>
      {/* 1. Header/Logo */}
      <div className="sidebar-brand">
        <div className="flex items-center gap-3">
          <div className="sidebar-logo-icon">
            <Sparkles size={18} fill="white" />
          </div>
          <span className="sidebar-logo-text">Lumina<span className="font-black text-indigo-500">BI</span></span>
        </div>
      </div>

      {/* 2. Main Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-group">
          <p className="nav-group-label">General</p>
          <button className="nav-item active">
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </button>
          <button className="nav-item" onClick={onAnalyticsClick}>
            <BarChart3 size={18} />
            <span>Analytics</span>
          </button>
          <button className="nav-item" onClick={onManageClick}>
            <Database size={18} />
            <span>Datasets</span>
          </button>
        </div>

        <div className="nav-group mt-auto">
          <button className="nav-item">
            <LifeBuoy size={18} />
            <span>Support</span>
          </button>
          <button className="nav-item">
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* Lumina BI Premium Promo Card */}
      <div className="sidebar-upgrade-card mb-4">
        <div className="upgrade-icon">
          <Zap size={18} fill="white" />
        </div>
        <div className="mt-3">
          <h4 className="upgrade-title">Lumina BI Premium</h4>
          <p className="upgrade-desc">Unlock 500MB uploads, priority AI, & advanced analytics.</p>
          <button className="upgrade-btn">
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>

  );
};

export default Sidebar;
