  import React from 'react';
  import { useLocation, useNavigate } from 'react-router-dom';
  import {
    LayoutDashboard, Database, BarChart3,
    Settings, Zap, Sparkles, LifeBuoy, Layers
  } from 'lucide-react';
  import useStore from '../store/useStore';

  /* ─── All tokens in one place ─────────────────────────────────────────────── */
  const SIDEBAR_STYLES = `
    :root {
      --sb-bg:               #ffffff;
      --sb-border:           rgba(0,0,0,0.06);
      --sb-divider:          rgba(0,0,0,0.05);
      --sb-brand-text:       #060e20;
      --sb-brand-accent:     #0891b2;
      --sb-group-label:      rgba(0,0,0,0.30);
      --sb-item-color:       rgba(0,0,0,0.44);
      --sb-item-hover-bg:    rgba(8,145,178,0.05);
      --sb-item-hover-color: rgba(0,0,0,0.80);
      --sb-item-active-bg:   rgba(8,145,178,0.08);
      --sb-item-active-color:#0891b2;
      --sb-item-active-bar:  #22d3ee;
      --sb-ds-bg:            rgba(8,145,178,0.05);
      --sb-ds-border:        rgba(8,145,178,0.14);
      --sb-ds-dot:           #059669;
      --sb-ds-label:         rgba(0,0,0,0.36);
      --sb-ds-name:          rgba(0,0,0,0.78);
      --sb-up-bg:            rgba(8,145,178,0.06);
      --sb-up-border:        rgba(8,145,178,0.22);
      --sb-up-color:         #0891b2;
      --sb-card-bg:          rgba(8,145,178,0.04);
      --sb-card-border:      rgba(8,145,178,0.13);
      --sb-card-title:       #0c4a6e;
      --sb-card-desc:        rgba(0,0,0,0.44);
    }

    [data-theme="dark"] {
      --sb-bg:               #070d1a;
      --sb-border:           rgba(34,211,238,0.07);
      --sb-divider:          rgba(34,211,238,0.05);
      --sb-brand-text:       #e8f4f8;
      --sb-brand-accent:     #22d3ee;
      --sb-group-label:      rgba(232,244,248,0.22);
      --sb-item-color:       rgba(232,244,248,0.46);
      --sb-item-hover-bg:    rgba(34,211,238,0.06);
      --sb-item-hover-color: rgba(232,244,248,0.85);
      --sb-item-active-bg:   rgba(34,211,238,0.12);
      --sb-item-active-color:#22d3ee;
      --sb-item-active-bar:  #22d3ee;
      --sb-ds-bg:            rgba(34,211,238,0.06);
      --sb-ds-border:        rgba(34,211,238,0.14);
      --sb-ds-dot:           #10b981;
      --sb-ds-label:         rgba(232,244,248,0.34);
      --sb-ds-name:          rgba(232,244,248,0.88);
      --sb-up-bg:            rgba(34,211,238,0.08);
      --sb-up-border:        rgba(34,211,238,0.28);
      --sb-up-color:         #22d3ee;
      --sb-card-bg:          rgba(34,211,238,0.04);
      --sb-card-border:      rgba(34,211,238,0.10);
      --sb-card-title:       #e8f4f8;
      --sb-card-desc:        rgba(232,244,248,0.38);
    }

    .sb-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: background 0.13s, color 0.13s;
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
      text-align: left;
      position: relative;
      background: transparent;
      color: var(--sb-item-color);
    }
    .sb-btn:hover {
      background: var(--sb-item-hover-bg);
      color: var(--sb-item-hover-color);
    }
    .sb-btn.active {
      background: var(--sb-item-active-bg);
      color: var(--sb-item-active-color);
      font-weight: 600;
    }
    .sb-upload {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 9px 14px;
      border-radius: 9px;
      border: 1px solid var(--sb-up-border);
      background: var(--sb-up-bg);
      color: var(--sb-up-color);
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.13s, border-color 0.13s;
    }
    .sb-upload:hover {
      background: rgba(99,102,241,0.16);
      border-color: rgba(99,102,241,0.52);
    }
    .sb-upgrade {
      width: 100%;
      padding: 7px;
      border: none;
      border-radius: 7px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      letter-spacing: 0.02em;
      transition: opacity 0.13s;
    }
    .sb-upgrade:hover { opacity: 0.87; }

    @media (max-width: 900px) {
      .sb-shell {
        display: none !important;
      }
    }
  `;

  const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
      activeDataset,
      currentView: activeTab,
      isSidebarVisible: isVisible,
      setCurrentView,
      setIsManageOpen,
    } = useStore();

    const handleAnalyticsClick = () => {
      if (!activeDataset) return;
      const slugName = activeDataset.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      navigate(`/analytics/${slugName}/${activeDataset.id}/dashtalk_25`);
      setCurrentView('analytics');
    };

    const openDashboardView = (view, options = {}) => {
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard');
      }
      if (options.openManage) {
        setIsManageOpen(true);
      }
      setCurrentView(view);
    };

    const navGroups = [
    {
      group: 'Workspace',
      items: [
        { id: 'overview',  label: 'Overview',         Icon: LayoutDashboard, action: () => openDashboardView('overview')  },
        { id: 'analytics', label: 'Dashboard',        Icon: BarChart3,       action: handleAnalyticsClick }, 
        { id: 'dashboards',label: 'Saved Dashboards', Icon: Layers,          action: () => openDashboardView('dashboards') },
        { id: 'datasets',  label: 'Datasets',         Icon: Database,        action: () => openDashboardView('datasets', { openManage: true })   },
      ],
    },
    {
      group: 'Account',
      items: [
        { id: 'support',  label: 'Support',  Icon: LifeBuoy, action: () => openDashboardView('support') },
        { id: 'settings', label: 'Settings', Icon: Settings, action: () => openDashboardView('settings') },
      ],
    },
  ];

    return (
      <>
        <style>{SIDEBAR_STYLES}</style>

        {isSidebarOpen && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 30 }}
            onClick={() => setIsSidebarOpen?.(false)}
          />
        )}

        <aside className="sb-shell" style={{
          width: isVisible ? '240px' : '0',
          minWidth: isVisible ? '240px' : '0',
          overflow: 'hidden',
          transition: 'width 0.25s ease, min-width 0.25s ease',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--sb-bg)',
          borderRight: '1px solid var(--sb-border)',
          position: 'relative',
          zIndex: 20,
          flexShrink: 0,
        }}>
          <div style={{ width: '240px', height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Brand */}
            <div style={{
              padding: '20px 18px 16px',
              borderBottom: '1px solid var(--sb-divider)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={16} color="white" />
              </div>
              <span style={{
                fontSize: 16, fontWeight: 800,
                color: 'var(--sb-brand-text)',
                letterSpacing: '-0.4px', whiteSpace: 'nowrap',
              }}>
                Dash<span style={{ color: 'var(--sb-brand-accent)' }}>Talk</span>
              </span>
            </div>

            {/* Active dataset badge */}
            {activeDataset && (
              <div style={{
                margin: '12px 12px 4px',
                padding: '8px 12px',
                background: 'var(--sb-ds-bg)',
                border: '1px solid var(--sb-ds-border)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--sb-ds-dot)', flexShrink: 0,
                }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: 10, color: 'var(--sb-ds-label)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1,
                  }}>Active dataset</p>
                  <p style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--sb-ds-name)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {activeDataset.name}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav style={{
              flex: 1, padding: '8px 10px', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 20,
            }}>
              {navGroups.map(group => (
                <div key={group.group}>
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    color: 'var(--sb-group-label)', textTransform: 'uppercase',
                    padding: '0 8px', marginBottom: 4,
                  }}>
                    {group.group}
                  </p>
                  {group.items.map(item => {
                    const isActive = activeTab === item.id;
                    const ItemIcon = item.Icon;
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        className={`sb-btn${isActive ? ' active' : ''}`}
                      >
                        {isActive && (
                          <span style={{
                            position: 'absolute', left: 0, top: '50%',
                            transform: 'translateY(-50%)',
                            width: 3, height: 18,
                            borderRadius: '0 3px 3px 0',
                            background: 'var(--sb-item-active-bar)',
                          }} />
                        )}
                        <ItemIcon size={16} />
                        <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Upgrade card */}
            <div style={{
              margin: '0 12px 16px', padding: '14px',
              background: 'var(--sb-card-bg)',
              border: '1px solid var(--sb-card-border)',
              borderRadius: 12,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, marginBottom: 10,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={14} color="white" />
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--sb-card-title)', marginBottom: 4 }}>
                DashTalk Premium
              </p>
              <p style={{ fontSize: 11, color: 'var(--sb-card-desc)', lineHeight: 1.5, marginBottom: 10 }}>
                Unlock 500MB uploads, priority AI & advanced analytics.
              </p>
              <button className="sb-upgrade">Upgrade Now →</button>
            </div>

          </div>
        </aside>
      </>
    );
  };

  export default Sidebar;
