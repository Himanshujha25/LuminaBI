import React, { useState, useEffect, useRef } from 'react';
import {
  X, UserPlus, Users, Trash2, Mail, Shield, Eye, Clock,
  CheckCircle, AlertCircle, Loader2, Crown
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import useStore from '../store/useStore';

const STYLES = `
  .inv-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,.55); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px; animation: inv-fade .18s ease;
  }
  @keyframes inv-fade { from { opacity:0 } to { opacity:1 } }

  .inv-modal {
    background: var(--surface-color, #fff);
    border: 1px solid var(--border-color, rgba(0,0,0,.1));
    border-radius: 18px;
    width: 100%; max-width: 480px; max-height: 90vh;
    overflow: hidden; display: flex; flex-direction: column;
    box-shadow: 0 24px 64px rgba(0,0,0,.25);
    animation: inv-pop .2s cubic-bezier(.2,.8,.3,1);
  }
  @keyframes inv-pop { from { transform: scale(.95) translateY(8px); opacity:0 } to { transform: scale(1) translateY(0); opacity:1 } }

  [data-theme="dark"] .inv-modal {
    background: #0f1117;
    border-color: rgba(255,255,255,.08);
  }

  .inv-header {
    display: flex; align-items: center; gap: 12px;
    padding: 20px 22px 16px;
    border-bottom: 1px solid var(--border-color, rgba(0,0,0,.08));
  }
  .inv-header-icon {
    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
    background: linear-gradient(135deg,#6366f1,#8b5cf6);
    display: flex; align-items: center; justify-content: center;
  }
  .inv-header-title { font-size: 15px; font-weight: 800; color: var(--text-primary, #0f172a); }
  .inv-header-sub { font-size: 11.5px; color: var(--text-tertiary, #94a3b8); margin-top: 1px; }
  .inv-close {
    margin-left: auto; background: none; border: none; cursor: pointer;
    color: var(--text-tertiary, #94a3b8); padding: 6px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    transition: background .12s, color .12s;
  }
  .inv-close:hover { background: rgba(239,68,68,.08); color: #f87171; }

  .inv-body { padding: 18px 22px; flex: 1; overflow-y: auto; }

  /* Invite form */
  .inv-form { display: flex; flex-direction: column; gap: 10px; margin-bottom: 22px; }
  .inv-row { display: flex; gap: 8px; }
  .inv-input {
    flex: 1; height: 40px; padding: 0 13px;
    background: var(--bg-color, #f8fafc);
    border: 1px solid var(--border-color, rgba(0,0,0,.1));
    border-radius: 10px; outline: none;
    font-size: 13px; color: var(--text-primary, #0f172a);
    font-family: inherit; transition: border-color .15s;
  }
  .inv-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.12); }
  [data-theme="dark"] .inv-input { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.09); color: #f1f5f9; }
  .inv-select {
    height: 40px; padding: 0 10px;
    background: var(--bg-color, #f8fafc);
    border: 1px solid var(--border-color, rgba(0,0,0,.1));
    border-radius: 10px; outline: none; cursor: pointer;
    font-size: 13px; color: var(--text-primary, #0f172a);
    font-family: inherit;
  }
  [data-theme="dark"] .inv-select { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.09); color: #f1f5f9; }
  .inv-btn {
    height: 40px; padding: 0 18px; border: none; border-radius: 10px; cursor: pointer;
    font-size: 13px; font-weight: 700; font-family: inherit;
    background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff;
    display: flex; align-items: center; gap: 6px; white-space: nowrap;
    transition: opacity .12s, transform .12s;
  }
  .inv-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .inv-btn:disabled { opacity: .45; cursor: not-allowed; }

  .inv-feedback {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 13px; border-radius: 9px; font-size: 12.5px; font-weight: 500;
    margin-bottom: 14px;
  }
  .inv-feedback.success { background: rgba(16,185,129,.1); color: #059669; border: 1px solid rgba(16,185,129,.2); }
  .inv-feedback.error   { background: rgba(239,68,68,.08); color: #dc2626; border: 1px solid rgba(239,68,68,.15); }

  /* Collaborators list */
  .inv-section-title {
    font-size: 10px; font-weight: 800; letter-spacing: .08em;
    text-transform: uppercase; color: var(--text-tertiary, #94a3b8);
    margin-bottom: 8px;
  }
  .inv-collab-list { display: flex; flex-direction: column; gap: 6px; }
  .inv-collab-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px;
    background: var(--bg-color, #f8fafc);
    border: 1px solid var(--border-color, rgba(0,0,0,.07));
  }
  [data-theme="dark"] .inv-collab-item { background: rgba(255,255,255,.03); border-color: rgba(255,255,255,.06); }
  .inv-collab-avatar {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
  }
  .inv-collab-info { flex: 1; min-width: 0; }
  .inv-collab-name { font-size: 13px; font-weight: 600; color: var(--text-primary, #0f172a); }
  .inv-collab-email { font-size: 11px; color: var(--text-tertiary, #94a3b8); }
  .inv-collab-badge {
    font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px;
    text-transform: uppercase; letter-spacing: .05em; flex-shrink: 0;
  }
  .inv-collab-badge.viewer { background: rgba(14,165,233,.1); color: #0284c7; }
  .inv-collab-badge.editor { background: rgba(99,102,241,.1); color: #4f46e5; }
  .inv-collab-badge.pending { background: rgba(245,158,11,.1); color: #d97706; }
  .inv-remove-btn {
    background: none; border: none; cursor: pointer; padding: 5px; border-radius: 6px;
    color: var(--text-tertiary, #94a3b8); display: flex; align-items: center; justify-content: center;
    transition: background .12s, color .12s; flex-shrink: 0;
  }
  .inv-remove-btn:hover { background: rgba(239,68,68,.08); color: #f87171; }
  .inv-empty {
    text-align: center; padding: 20px; font-size: 13px;
    color: var(--text-tertiary, #94a3b8);
  }
`;

const AVATAR_COLORS = [
  ['#312e81','#c7d2fe'], ['#1e3a5f','#bae6fd'], ['#1a2e1a','#bbf7d0'],
  ['#3b1f1f','#fecaca'], ['#2d1b4e','#e9d5ff'],
];
const getAvatarStyle = (id) => {
  const [bg, fg] = AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
  return { background: bg, color: fg };
};
const getInitials = (name) => (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

export default function InviteModal({ datasetId, datasetName, onClose }) {
  const { token, user } = useStore();
  const [email, setEmail]         = useState('');
  const [role, setRole]           = useState('viewer');
  const [loading, setLoading]     = useState(false);
  const [feedback, setFeedback]   = useState(null); // { type, msg }
  const [collabs, setCollabs]     = useState([]);
  const [loadingCollabs, setLoadingCollabs] = useState(true);
  const inputRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  // Fetch current collaborators
  const fetchCollabs = async () => {
    try {
      setLoadingCollabs(true);
      const res = await axios.get(`${API_URL}/datasets/${datasetId}/collaborators`, { headers });
      setCollabs(res.data);
    } catch { /* ignore */ } finally { setLoadingCollabs(false); }
  };

  useEffect(() => { fetchCollabs(); }, [datasetId]);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const sendInvite = async () => {
    if (!email.trim()) return;
    setLoading(true); setFeedback(null);
    try {
      await axios.post(`${API_URL}/datasets/${datasetId}/invite`, { email: email.trim(), role }, { headers });
      setFeedback({ type: 'success', msg: `Invite sent to ${email.trim()}!` });
      setEmail('');
      fetchCollabs();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.error || 'Failed to send invite.' });
    } finally { setLoading(false); }
  };

  const removeCollab = async (collabId) => {
    try {
      await axios.delete(`${API_URL}/datasets/${datasetId}/collaborators/${collabId}`, { headers });
      setCollabs(c => c.filter(x => x.id !== collabId));
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.error || 'Failed to remove.' });
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="inv-overlay" onClick={onClose}>
        <div className="inv-modal" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="inv-header">
            <div className="inv-header-icon"><UserPlus size={16} color="#fff" /></div>
            <div>
              <div className="inv-header-title">Invite Collaborators</div>
              <div className="inv-header-sub">{datasetName}</div>
            </div>
            <button className="inv-close" onClick={onClose}><X size={16} /></button>
          </div>

          {/* Body */}
          <div className="inv-body">

            {/* Feedback */}
            {feedback && (
              <div className={`inv-feedback ${feedback.type}`}>
                {feedback.type === 'success'
                  ? <CheckCircle size={14} />
                  : <AlertCircle size={14} />}
                {feedback.msg}
              </div>
            )}

            {/* Invite form */}
            <div className="inv-form">
              <div className="inv-row">
                <input
                  ref={inputRef}
                  type="email"
                  className="inv-input"
                  placeholder="teammate@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendInvite()}
                />
                <select
                  className="inv-select"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
              <button className="inv-btn" onClick={sendInvite} disabled={loading || !email.trim()}>
                {loading
                  ? <Loader2 size={13} className="inv-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  : <Mail size={13} />}
                Send Invite
              </button>
            </div>

            {/* Collaborators */}
            <div className="inv-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={10} /> Team Members
            </div>

            {loadingCollabs ? (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
              </div>
            ) : collabs.length === 0 ? (
              <div className="inv-empty">No collaborators yet — invite your team!</div>
            ) : (
              <div className="inv-collab-list">
                {collabs.map(c => (
                  <div key={c.id} className="inv-collab-item">
                    <div className="inv-collab-avatar" style={getAvatarStyle(c.user_id)}>
                      {c.status === 'pending'
                        ? <Clock size={14} />
                        : getInitials(c.user_name)}
                    </div>
                    <div className="inv-collab-info">
                      <div className="inv-collab-name">
                        {c.user_name || 'Pending…'}
                      </div>
                      <div className="inv-collab-email">{c.user_email || 'Awaiting signup'}</div>
                    </div>
                    <span className={`inv-collab-badge ${c.status === 'pending' ? 'pending' : c.role}`}>
                      {c.status === 'pending' ? 'Pending' : c.role}
                    </span>
                    <button className="inv-remove-btn" onClick={() => removeCollab(c.id)} title="Remove">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </>
  );
}
