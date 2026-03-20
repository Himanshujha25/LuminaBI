import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import {
  X, UserPlus, Mail, Shield, ChevronDown, Check,
  Trash2, Copy, AlertCircle, Loader2, Users
} from 'lucide-react';

/* ── Inline styles ──────────────────────────────────────────────── */
const CSS = `
  .inv-overlay {
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,.55);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    animation: inv-fade-in .18s ease;
  }
  @keyframes inv-fade-in { from { opacity:0 } to { opacity:1 } }

  .inv-panel {
    background: var(--inv-bg, #fff);
    border: 1px solid var(--inv-bdr, rgba(0,0,0,.09));
    border-radius: 20px;
    width: 100%; max-width: 520px;
    box-shadow: 0 32px 80px rgba(0,0,0,.22), 0 0 0 .5px rgba(0,0,0,.06);
    overflow: hidden;
    animation: inv-slide-up .22s cubic-bezier(.22,1,.36,1);
    max-height: 90vh;
    display: flex; flex-direction: column;
  }
  @keyframes inv-slide-up {
    from { opacity:0; transform: translateY(20px) scale(.97) }
    to   { opacity:1; transform: translateY(0)    scale(1)   }
  }

  [data-theme="dark"] .inv-panel {
    --inv-bg: #0b0f1a;
    --inv-bdr: rgba(255,255,255,.08);
    --inv-text: #f1f5f9;
    --inv-sub: rgba(255,255,255,.4);
    --inv-divider: rgba(255,255,255,.07);
    --inv-input-bg: rgba(255,255,255,.05);
    --inv-input-bdr: rgba(255,255,255,.1);
    --inv-input-text: #f1f5f9;
    --inv-input-ph: rgba(255,255,255,.28);
    --inv-label: rgba(255,255,255,.55);
    --inv-role-bg: rgba(255,255,255,.04);
    --inv-role-bdr: rgba(255,255,255,.08);
    --inv-role-hover: rgba(255,255,255,.07);
    --inv-collab-bg: rgba(255,255,255,.03);
    --inv-collab-bdr: rgba(255,255,255,.06);
    --inv-copy-bg: rgba(255,255,255,.06);
  }
  :not([data-theme="dark"]) .inv-panel {
    --inv-bg: #fff;
    --inv-bdr: rgba(0,0,0,.09);
    --inv-text: #0f172a;
    --inv-sub: rgba(0,0,0,.4);
    --inv-divider: rgba(0,0,0,.07);
    --inv-input-bg: rgba(0,0,0,.03);
    --inv-input-bdr: rgba(0,0,0,.1);
    --inv-input-text: #0f172a;
    --inv-input-ph: rgba(0,0,0,.28);
    --inv-label: rgba(0,0,0,.5);
    --inv-role-bg: rgba(0,0,0,.03);
    --inv-role-bdr: rgba(0,0,0,.08);
    --inv-role-hover: rgba(0,0,0,.05);
    --inv-collab-bg: rgba(0,0,0,.02);
    --inv-collab-bdr: rgba(0,0,0,.07);
    --inv-copy-bg: rgba(0,0,0,.05);
  }

  .inv-header {
    padding: 22px 24px 18px;
    border-bottom: 1px solid var(--inv-divider);
    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .inv-header-icon {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 14px rgba(99,102,241,.35);
  }
  .inv-header-text { flex: 1; min-width: 0; }
  .inv-title {
    font-size: 17px; font-weight: 700; color: var(--inv-text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .inv-sub { font-size: 12.5px; color: var(--inv-sub); margin-top: 3px; }
  .inv-close {
    width: 30px; height: 30px; border-radius: 8px; border: none;
    background: transparent; cursor: pointer; color: var(--inv-sub);
    display: flex; align-items: center; justify-content: center;
    transition: background .13s, color .13s; flex-shrink: 0;
  }
  .inv-close:hover { background: var(--inv-role-hover); color: var(--inv-text); }

  .inv-body { padding: 20px 24px; overflow-y: auto; flex: 1; }

  .inv-field { margin-bottom: 14px; }
  .inv-field-label {
    display: block; font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .07em;
    color: var(--inv-label); margin-bottom: 6px;
  }

  .inv-input {
    width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1px solid var(--inv-input-bdr);
    background: var(--inv-input-bg);
    color: var(--inv-input-text);
    font-size: 14px; font-family: inherit; outline: none;
    transition: border-color .13s, box-shadow .13s;
    box-sizing: border-box;
  }
  .inv-input:focus {
    border-color: rgba(99,102,241,.5);
    box-shadow: 0 0 0 3px rgba(99,102,241,.12);
  }
  .inv-input::placeholder { color: var(--inv-input-ph); }
  .inv-input:disabled { opacity: .5; cursor: not-allowed; }

  /* Role selector */
  .inv-role-row {
    display: flex; gap: 10px;
  }
  .inv-role-btn {
    flex: 1; padding: 11px 14px; border-radius: 11px;
    border: 1.5px solid var(--inv-role-bdr);
    background: var(--inv-role-bg);
    cursor: pointer; text-align: left;
    transition: all .15s; position: relative;
    font-family: inherit;
  }
  .inv-role-btn:hover { border-color: rgba(99,102,241,.3); }
  .inv-role-btn.selected {
    border-color: #6366f1;
    background: rgba(99,102,241,.08);
    box-shadow: 0 0 0 3px rgba(99,102,241,.1);
  }
  .inv-role-title {
    font-size: 13px; font-weight: 600; color: var(--inv-text);
    display: flex; align-items: center; gap: 6px;
  }
  .inv-role-desc { font-size: 11.5px; color: var(--inv-sub); margin-top: 3px; line-height: 1.5; }
  .inv-role-check {
    position: absolute; top: 9px; right: 9px;
    width: 18px; height: 18px; border-radius: 50%;
    background: #6366f1;
    display: flex; align-items: center; justify-content: center;
  }

  /* Alert */
  .inv-alert {
    display: flex; align-items: flex-start; gap: 9px;
    padding: 10px 12px; border-radius: 10px; margin-bottom: 14px;
    font-size: 12.5px; line-height: 1.55;
  }
  .inv-alert-error { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.25); color: #ef4444; }
  .inv-alert-success { background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.25); color: #10b981; }

  /* Invite link copy box */
  .inv-link-box {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 12px; border-radius: 10px;
    background: var(--inv-copy-bg);
    border: 1px solid var(--inv-collab-bdr);
    margin-bottom: 14px; font-size: 12px;
    color: var(--inv-sub); word-break: break-all;
  }
  .inv-copy-btn {
    flex-shrink: 0; padding: 5px 10px; border-radius: 7px;
    border: 1px solid var(--inv-role-bdr);
    background: transparent; cursor: pointer;
    font-size: 11.5px; font-weight: 600; color: #6366f1;
    font-family: inherit; white-space: nowrap;
    transition: background .12s;
  }
  .inv-copy-btn:hover { background: rgba(99,102,241,.1); }

  /* Collaborator list */
  .inv-collab-list { margin-top: 18px; }
  .inv-collab-title {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .07em; color: var(--inv-label); margin-bottom: 8px;
    display: flex; align-items: center; gap: 6px;
  }
  .inv-collab-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 11px; border-radius: 10px;
    background: var(--inv-collab-bg);
    border: 1px solid var(--inv-collab-bdr);
    margin-bottom: 6px;
  }
  .inv-collab-avatar {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff;
  }
  .inv-collab-info { flex: 1; min-width: 0; }
  .inv-collab-email {
    font-size: 13px; font-weight: 500; color: var(--inv-text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .inv-collab-meta { font-size: 11.5px; color: var(--inv-sub); margin-top: 1px; }
  .inv-badge {
    padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .06em; flex-shrink: 0;
  }
  .inv-badge-editor { background: rgba(99,102,241,.12); color: #6366f1; }
  .inv-badge-viewer { background: rgba(16,185,129,.1);  color: #10b981; }
  .inv-badge-pending { background: rgba(251,191,36,.1); color: #f59e0b; }
  .inv-remove-btn {
    width: 26px; height: 26px; border-radius: 7px; border: none;
    background: transparent; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    color: var(--inv-sub); transition: background .12s, color .12s;
  }
  .inv-remove-btn:hover { background: rgba(239,68,68,.1); color: #ef4444; }

  /* Footer */
  .inv-footer {
    padding: 16px 24px; border-top: 1px solid var(--inv-divider);
    display: flex; gap: 10px; align-items: center; flex-shrink: 0;
  }
  .inv-btn-primary {
    flex: 1; padding: 11px 18px; border-radius: 11px; border: none;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; font-size: 14px; font-weight: 600; font-family: inherit;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px;
    box-shadow: 0 4px 14px rgba(99,102,241,.35);
    transition: opacity .15s, transform .12s;
  }
  .inv-btn-primary:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
  .inv-btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  .inv-btn-ghost {
    padding: 11px 16px; border-radius: 11px;
    border: 1px solid var(--inv-role-bdr);
    background: transparent; color: var(--inv-sub);
    font-size: 14px; font-weight: 500; font-family: inherit; cursor: pointer;
    transition: background .13s, color .13s;
  }
  .inv-btn-ghost:hover { background: var(--inv-role-hover); color: var(--inv-text); }

  @media (max-width: 480px) {
    .inv-panel { border-radius: 14px; }
    .inv-header { padding: 16px 16px 14px; }
    .inv-body { padding: 14px 16px; }
    .inv-footer { padding: 12px 16px; }
    .inv-role-row { flex-direction: column; }
  }
`;

const ROLES = [
  {
    id: 'editor',
    icon: <Shield size={13} />,
    title: 'Editor',
    desc: 'Can query, analyse, and modify shared dataset views.',
  },
  {
    id: 'viewer',
    icon: <Mail size={13} />,
    title: 'Viewer',
    desc: 'Read-only access. Can view data and charts only.',
  },
];

export default function InviteModal({ dataset, onClose }) {
  const token = localStorage.getItem('token');
  const [email, setEmail]       = useState('');
  const [role, setRole]         = useState('viewer');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied]         = useState(false);

  const [collaborators, setCollaborators] = useState([]);
  const [loadingCollabs, setLoadingCollabs] = useState(true);

  const emailRef = useRef(null);

  // Fetch existing collaborators
  useEffect(() => {
    if (!dataset?.id) return;
    setLoadingCollabs(true);
    axios
      .get(`${API_URL}/collaborators/dataset/${dataset.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setCollaborators(res.data))
      .catch(() => {})
      .finally(() => setLoadingCollabs(false));
  }, [dataset?.id]);

  // Focus email on open
  useEffect(() => {
    setTimeout(() => emailRef.current?.focus(), 80);
  }, []);

  // Close on Escape
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const handleInvite = async () => {
    setError(''); setSuccess(''); setInviteLink('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      emailRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/collaborators/invite`,
        { dataset_id: dataset.id, collaborator_email: email.trim().toLowerCase(), role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const invToken = res.data.invite_token;
      const link = `${window.location.origin}/invite/accept/${invToken}`;
      setInviteLink(link);
      setSuccess(res.data.message || 'Invite sent!');
      setEmail('');
      // Refresh collaborator list
      const list = await axios.get(`${API_URL}/collaborators/dataset/${dataset.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCollaborators(list.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await axios.delete(`${API_URL}/collaborators/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCollaborators(prev => prev.filter(c => c.id !== id));
    } catch {
      setError('Failed to remove collaborator.');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const avatarFor = email => email?.slice(0, 2).toUpperCase() || '??';

  return (
    <>
      <style>{CSS}</style>
      <div className="inv-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="inv-panel" role="dialog" aria-modal="true" aria-label="Invite collaborator">

          {/* Header */}
          <div className="inv-header">
            <div className="inv-header-icon">
              <UserPlus size={20} color="#fff" />
            </div>
            <div className="inv-header-text">
              <div className="inv-title">Invite to "{dataset?.name}"</div>
              <div className="inv-sub">Collaborate on this dataset with your team</div>
            </div>
            <button className="inv-close" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="inv-body">

            {/* Email Field */}
            <div className="inv-field">
              <label className="inv-field-label">Collaborator Email</label>
              <input
                ref={emailRef}
                type="email"
                className="inv-input"
                placeholder="colleague@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); setSuccess(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleInvite(); }}
                disabled={loading}
              />
            </div>

            {/* Role selector */}
            <div className="inv-field">
              <label className="inv-field-label">Access Level</label>
              <div className="inv-role-row">
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    className={`inv-role-btn ${role === r.id ? 'selected' : ''}`}
                    onClick={() => setRole(r.id)}
                  >
                    {role === r.id && (
                      <span className="inv-role-check">
                        <Check size={10} color="#fff" />
                      </span>
                    )}
                    <div className="inv-role-title">
                      {r.icon} {r.title}
                    </div>
                    <div className="inv-role-desc">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="inv-alert inv-alert-error">
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}
            {success && (
              <div className="inv-alert inv-alert-success">
                <Check size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {success}
              </div>
            )}

            {/* Invite Link */}
            {inviteLink && (
              <div className="inv-link-box">
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {inviteLink}
                </span>
                <button className="inv-copy-btn" onClick={copyLink}>
                  {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
                </button>
              </div>
            )}

            {/* Existing Collaborators */}
            {!loadingCollabs && collaborators.length > 0 && (
              <div className="inv-collab-list">
                <div className="inv-collab-title">
                  <Users size={12} />
                  Team Members ({collaborators.length})
                </div>
                {collaborators.map(c => (
                  <div key={c.id} className="inv-collab-item">
                    <div className="inv-collab-avatar">{avatarFor(c.collaborator_email)}</div>
                    <div className="inv-collab-info">
                      <div className="inv-collab-email">{c.collaborator_email}</div>
                      <div className="inv-collab-meta">
                        Invited {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={`inv-badge ${
                        c.status === 'pending'
                          ? 'inv-badge-pending'
                          : c.role === 'editor'
                          ? 'inv-badge-editor'
                          : 'inv-badge-viewer'
                      }`}
                    >
                      {c.status === 'pending' ? 'Pending' : c.role}
                    </span>
                    <button
                      className="inv-remove-btn"
                      title="Remove collaborator"
                      onClick={() => handleRemove(c.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {loadingCollabs && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', color: 'var(--inv-sub)' }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="inv-footer">
            <button className="inv-btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="inv-btn-primary"
              onClick={handleInvite}
              disabled={loading || !email.trim()}
            >
              {loading
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
                : <><UserPlus size={14} /> Send Invite</>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
