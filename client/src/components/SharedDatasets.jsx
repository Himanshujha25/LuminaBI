import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import {
  Database, Shield, Eye, Users, RefreshCw,
  BarChart2, ArrowRight, Loader2, AlertCircle
} from 'lucide-react';
import useStore from '../store/useStore';

const CSS = `
  .sd-section { padding: 24px; }

  .sd-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px; gap: 12px; flex-wrap: wrap;
  }
  .sd-title-group { display: flex; align-items: center; gap: 10px; }
  .sd-icon {
    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(99,102,241,.3);
  }
  .sd-title { font-size: 16px; font-weight: 700; color: var(--text-primary); }
  .sd-subtitle { font-size: 12.5px; color: var(--text-secondary); margin-top: 1px; }

  .sd-refresh-btn {
    width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-color, rgba(0,0,0,.1));
    background: transparent; cursor: pointer; color: var(--text-secondary);
    display: flex; align-items: center; justify-content: center; transition: all .15s;
  }
  .sd-refresh-btn:hover { color: #6366f1; border-color: rgba(99,102,241,.3); background: rgba(99,102,241,.06); }
  .sd-refresh-btn.spinning svg { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .sd-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }

  .sd-card {
    border-radius: 14px;
    border: 1px solid;
    padding: 18px;
    cursor: pointer;
    transition: all .2s cubic-bezier(.22,1,.36,1);
    position: relative; overflow: hidden;
  }
  [data-theme="dark"] .sd-card {
    background: rgba(255,255,255,.03);
    border-color: rgba(255,255,255,.07);
  }
  :not([data-theme="dark"]) .sd-card {
    background: rgba(255,255,255,.9);
    border-color: rgba(0,0,0,.08);
    box-shadow: 0 2px 10px rgba(0,0,0,.05);
  }
  .sd-card:hover {
    border-color: rgba(99,102,241,.35) !important;
    transform: translateY(-3px);
  }
  [data-theme="dark"] .sd-card:hover {
    background: rgba(99,102,241,.07);
    box-shadow: 0 12px 36px rgba(0,0,0,.3), 0 4px 12px rgba(99,102,241,.15);
  }
  :not([data-theme="dark"]) .sd-card:hover {
    box-shadow: 0 12px 32px rgba(0,0,0,.1), 0 4px 12px rgba(99,102,241,.15);
  }

  .sd-card-glow {
    position: absolute; inset: 0; border-radius: inherit; z-index: 0; pointer-events: none;
    background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,.12), transparent 70%);
    opacity: 0; transition: opacity .3s;
  }
  .sd-card:hover .sd-card-glow { opacity: 1; }

  .sd-card-top {
    position: relative; z-index: 1;
    display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
    margin-bottom: 14px;
  }
  .sd-db-icon {
    width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
    background: linear-gradient(135deg, #4f52e8, #7c5cf6);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(99,102,241,.3);
  }
  .sd-card-name {
    flex: 1; font-size: 14px; font-weight: 700; color: var(--text-primary);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;
  }
  .sd-role-badge {
    padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .06em; flex-shrink: 0;
    display: flex; align-items: center; gap: 4px;
  }
  .sd-role-editor { background: rgba(99,102,241,.12); color: #818cf8; }
  .sd-role-viewer { background: rgba(16,185,129,.1);  color: #34d399; }

  .sd-owner-row {
    position: relative; z-index: 1;
    display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
  }
  .sd-owner-avatar {
    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, #0ea5e9, #38bdf8);
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; color: #fff;
  }
  .sd-owner-text { font-size: 12px; color: var(--text-secondary); }

  .sd-card-footer {
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 12px; border-top: 1px solid var(--border-color, rgba(0,0,0,.07));
  }
  .sd-cols-text { font-size: 11.5px; color: var(--text-secondary); }
  .sd-action-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 8px; border: none;
    background: rgba(99,102,241,.1); color: #6366f1;
    font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
    transition: background .13s;
  }
  .sd-action-btn:hover { background: rgba(99,102,241,.2); }

  /* Empty state */
  .sd-empty {
    text-align: center; padding: 48px 24px;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .sd-empty-icon {
    width: 64px; height: 64px; border-radius: 16px;
    background: rgba(99,102,241,.08); border: 1px solid rgba(99,102,241,.15);
    display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
  }
  .sd-empty-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
  .sd-empty-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; max-width: 280px; }

  /* Error */
  .sd-error {
    display: flex; align-items: center; gap: 9px;
    padding: 12px 14px; border-radius: 10px; margin-bottom: 16px;
    background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2);
    color: #f87171; font-size: 13px;
  }

  @media (max-width: 480px) {
    .sd-grid { grid-template-columns: 1fr; }
    .sd-section { padding: 16px; }
  }
`;

export default function SharedDatasets({ onOpenDataset }) {
  const token = localStorage.getItem('token');
  const { setActiveDataset, setCurrentView } = useStore();

  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [spinning, setSpinning] = useState(false);

  const fetchShared = async (spin = false) => {
    if (spin) setSpinning(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/collaborators/shared`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDatasets(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load shared datasets.');
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  };

  useEffect(() => { fetchShared(); }, []);

  const handleOpen = (item) => {
    // Build a dataset object compatible with the store
    const dataset = {
      id: item.dataset_id,
      name: item.dataset_name,
      columns: item.columns,
      user_id: null, // It's shared, not owned
      role: item.role,
      isShared: true,
    };
    setActiveDataset(dataset);
    setCurrentView('overview');
    if (onOpenDataset) onOpenDataset(dataset);
  };

  const avatarFor = (name) => (name || '?').slice(0, 2).toUpperCase();

  const colCount = (columns) => {
    try { return Array.isArray(columns) ? columns.length : Object.keys(JSON.parse(columns || '{}')).length; }
    catch { return '—'; }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="sd-section">
        {/* Header */}
        <div className="sd-header">
          <div className="sd-title-group">
            <div className="sd-icon"><Users size={18} color="#fff" /></div>
            <div>
              <div className="sd-title">Shared with me</div>
              <div className="sd-subtitle">Datasets others have invited you to collaborate on</div>
            </div>
          </div>
          <button
            className={`sd-refresh-btn ${spinning ? 'spinning' : ''}`}
            onClick={() => fetchShared(true)}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="sd-error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* Empty */}
        {!loading && !error && datasets.length === 0 && (
          <div className="sd-empty">
            <div className="sd-empty-icon">
              <Database size={28} color="#6366f1" />
            </div>
            <div className="sd-empty-title">No shared datasets yet</div>
            <div className="sd-empty-desc">
              When someone invites you to collaborate on a dataset, it will appear here.
            </div>
          </div>
        )}

        {/* Dataset Cards */}
        {!loading && datasets.length > 0 && (
          <div className="sd-grid">
            {datasets.map((item) => (
              <div
                key={item.collab_id}
                className="sd-card"
                onClick={() => handleOpen(item)}
              >
                <div className="sd-card-glow" />

                <div className="sd-card-top">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
                    <div className="sd-db-icon">
                      <Database size={18} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="sd-card-name">{item.dataset_name}</div>
                    </div>
                  </div>
                  <span className={`sd-role-badge ${item.role === 'editor' ? 'sd-role-editor' : 'sd-role-viewer'}`}>
                    {item.role === 'editor' ? <Shield size={10} /> : <Eye size={10} />}
                    {item.role}
                  </span>
                </div>

                <div className="sd-owner-row">
                  <div className="sd-owner-avatar">{avatarFor(item.owner_name)}</div>
                  <span className="sd-owner-text">
                    By <strong>{item.owner_name || item.owner_email}</strong>
                  </span>
                </div>

                <div className="sd-card-footer">
                  <span className="sd-cols-text">
                    {colCount(item.columns)} columns · Shared {new Date(item.invited_at).toLocaleDateString()}
                  </span>
                  <button className="sd-action-btn" onClick={(e) => { e.stopPropagation(); handleOpen(item); }}>
                    <BarChart2 size={11} /> Analyse <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
