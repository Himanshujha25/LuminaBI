import React, { useState, useRef, useEffect } from 'react';
import {
  User, Mail, Lock, Bell, Palette, Database, Shield,
  CreditCard, Trash2, CheckCircle2, AlertCircle, Eye,
  EyeOff, Sun, Moon, Monitor, ChevronRight, LogOut,
  Download, Upload, Key, Globe, Zap, Save, Camera,
  ToggleLeft, ToggleRight, Info
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

/* ─── Token styles ─────────────────────────────────────────────────────────── */
const STYLES = `
  :root, [data-theme="dark"] {
    --st-page:      #09090b;
    --st-card:      #111113;
    --st-border:    rgba(255,255,255,.08);
    --st-border-2:  rgba(255,255,255,.14);
    --st-text-1:    #f1f5f9;
    --st-text-2:    rgba(255,255,255,.5);
    --st-text-3:    rgba(255,255,255,.28);
    --st-field-bg:  rgba(255,255,255,.04);
    --st-field-bdr: rgba(255,255,255,.1);
    --st-hover:     rgba(255,255,255,.05);
    --st-nav-active-bg:  rgba(99,102,241,.12);
    --st-nav-active-clr: #818cf8;
    --st-nav-clr:        rgba(255,255,255,.45);
    --st-danger-bg:  rgba(239,68,68,.08);
    --st-danger-bdr: rgba(239,68,68,.22);
    --st-danger-txt: #f87171;
    --st-success-bg: rgba(16,185,129,.08);
    --st-success-bdr:rgba(16,185,129,.22);
    --st-success-txt:#34d399;
    --st-badge-bg:   rgba(99,102,241,.12);
    --st-badge-bdr:  rgba(99,102,241,.25);
    --st-badge-txt:  #818cf8;
    --st-toggle-off: rgba(255,255,255,.15);
    --st-toggle-on:  #6366f1;
    --st-avatar-bg:  rgba(99,102,241,.15);
    --st-avatar-txt: #818cf8;
  }
  [data-theme="light"] {
    --st-page:      #f4f4f6;
    --st-card:      #ffffff;
    --st-border:    rgba(0,0,0,.08);
    --st-border-2:  rgba(0,0,0,.14);
    --st-text-1:    #0f0f12;
    --st-text-2:    rgba(0,0,0,.5);
    --st-text-3:    rgba(0,0,0,.35);
    --st-field-bg:  rgba(0,0,0,.03);
    --st-field-bdr: rgba(0,0,0,.1);
    --st-hover:     rgba(0,0,0,.04);
    --st-nav-active-bg:  rgba(99,102,241,.08);
    --st-nav-active-clr: #4f46e5;
    --st-nav-clr:        rgba(0,0,0,.45);
    --st-danger-bg:  rgba(239,68,68,.06);
    --st-danger-bdr: rgba(239,68,68,.2);
    --st-danger-txt: #dc2626;
    --st-success-bg: rgba(16,185,129,.06);
    --st-success-bdr:rgba(16,185,129,.2);
    --st-success-txt:#059669;
    --st-badge-bg:   rgba(99,102,241,.07);
    --st-badge-bdr:  rgba(99,102,241,.2);
    --st-badge-txt:  #4f46e5;
    --st-toggle-off: rgba(0,0,0,.15);
    --st-toggle-on:  #6366f1;
    --st-avatar-bg:  rgba(99,102,241,.1);
    --st-avatar-txt: #4f46e5;
  }

  .st-field {
    width:100%;padding:9px 12px;font-size:13px;font-family:inherit;
    border-radius:8px;background:var(--st-field-bg);
    border:.5px solid var(--st-field-bdr);color:var(--st-text-1);
    outline:none;transition:border-color .12s;box-sizing:border-box;
  }
  .st-field:focus { border-color:rgba(99,102,241,.55); }
  .st-field::placeholder { color:var(--st-text-3); }
  .st-field:disabled { opacity:.45; cursor:not-allowed; }

  select.st-field { appearance:none; cursor:pointer; }

  .st-btn {
    display:inline-flex;align-items:center;gap:7px;
    padding:8px 16px;border-radius:8px;border:.5px solid var(--st-border-2);
    background:var(--st-field-bg);color:var(--st-text-1);
    font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;
    transition:background .12s,border-color .12s,opacity .12s;
    white-space:nowrap;
  }
  .st-btn:hover { background:var(--st-hover); }
  .st-btn.primary {
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    border-color:transparent;color:#fff;
  }
  .st-btn.primary:hover { opacity:.88; }
  .st-btn.danger { background:var(--st-danger-bg);border-color:var(--st-danger-bdr);color:var(--st-danger-txt); }
  .st-btn.danger:hover { opacity:.8; }
  .st-btn:disabled { opacity:.4;cursor:not-allowed; }

  .st-nav-item {
    display:flex;align-items:center;gap:10px;
    padding:8px 12px;border-radius:8px;border:none;
    background:transparent;color:var(--st-nav-clr);
    font-size:13px;font-weight:500;font-family:inherit;
    cursor:pointer;transition:background .12s,color .12s;
    width:100%;text-align:left;
  }
  .st-nav-item:hover { background:var(--st-hover);color:var(--st-text-1); }
  .st-nav-item.active { background:var(--st-nav-active-bg);color:var(--st-nav-active-clr);font-weight:600; }

  .st-toggle {
    position:relative;display:inline-flex;align-items:center;
    width:36px;height:20px;border-radius:10px;cursor:pointer;
    background:var(--st-toggle-off);transition:background .2s;border:none;
    flex-shrink:0;
  }
  .st-toggle.on { background:var(--st-toggle-on); }
  .st-toggle::after {
    content:'';position:absolute;left:3px;width:14px;height:14px;
    border-radius:50%;background:#fff;transition:transform .2s;
    box-shadow:0 1px 3px rgba(0,0,0,.3);
  }
  .st-toggle.on::after { transform:translateX(16px); }

  .st-row {
    display:flex;align-items:center;justify-content:space-between;
    padding:14px 0;border-bottom:.5px solid var(--st-border);
  }
  .st-row:last-child { border-bottom:none; }

  .st-section-title {
    font-size:11px;font-weight:700;letter-spacing:.06em;
    text-transform:uppercase;color:var(--st-text-3);
    margin:0 0 12px;
  }

  .st-label {
    display:block;font-size:11px;font-weight:600;
    letter-spacing:.04em;text-transform:uppercase;
    color:var(--st-text-2);margin-bottom:5px;
  }

  .st-card {
    background:var(--st-card);border:.5px solid var(--st-border);
    border-radius:12px;padding:20px 22px;margin-bottom:16px;
  }

  .st-alert {
    display:flex;align-items:flex-start;gap:10px;
    padding:12px 14px;border-radius:8px;font-size:13px;line-height:1.5;
    margin-bottom:16px;
  }
  .st-alert.info { background:var(--st-badge-bg);border:.5px solid var(--st-badge-bdr);color:var(--st-badge-txt); }
  .st-alert.danger { background:var(--st-danger-bg);border:.5px solid var(--st-danger-bdr);color:var(--st-danger-txt); }
  .st-alert.success { background:var(--st-success-bg);border:.5px solid var(--st-success-bdr);color:var(--st-success-txt); }

  .st-theme-btn {
    flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;
    padding:12px 8px;border-radius:9px;border:.5px solid var(--st-border);
    background:var(--st-field-bg);cursor:pointer;font-family:inherit;
    font-size:11px;font-weight:600;color:var(--st-text-2);
    transition:all .12s;
  }
  .st-theme-btn:hover { border-color:rgba(99,102,241,.4);color:var(--st-text-1); }
  .st-theme-btn.active {
    border-color:rgba(99,102,241,.55);background:rgba(99,102,241,.1);
    color:var(--st-nav-active-clr);
  }

  .st-plan-badge {
    display:inline-flex;align-items:center;gap:4px;
    padding:3px 9px;border-radius:999px;
    background:var(--st-badge-bg);border:.5px solid var(--st-badge-bdr);
    color:var(--st-badge-txt);font-size:11px;font-weight:600;
  }
  .st-plan-badge.pro {
    background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.25);
    color:#d97706;
  }

  @keyframes st-spin { to { transform:rotate(360deg); } }
  .st-spinner {
    width:14px;height:14px;border-radius:50%;
    border:2px solid rgba(255,255,255,.2);
    border-top-color:#fff;
    animation:st-spin .65s linear infinite;
    display:inline-block;flex-shrink:0;
  }
`;

/* ─── Nav items ────────────────────────────────────────────────────────────── */
const NAV = [
  { id: 'profile',       label: 'Profile',           Icon: User      },
  { id: 'account',       label: 'Account & security', Icon: Lock      },
  { id: 'appearance',    label: 'Appearance',         Icon: Palette   },
  { id: 'notifications', label: 'Notifications',      Icon: Bell      },
  { id: 'data',          label: 'Data & exports',     Icon: Database  },
  { id: 'api',           label: 'API keys',           Icon: Key       },
  { id: 'billing',       label: 'Billing & plan',     Icon: CreditCard},
  { id: 'danger',        label: 'Danger zone',        Icon: Shield    },
];

/* ─── Toggle row ───────────────────────────────────────────────────────────── */
const ToggleRow = ({ label, desc, checked, onChange }) => (
  <div className="st-row">
    <div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--st-text-1)' }}>{label}</p>
      {desc && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--st-text-3)' }}>{desc}</p>}
    </div>
    <button type="button" className={`st-toggle${checked ? ' on' : ''}`} onClick={() => onChange(!checked)} />
  </div>
);

/* ─── Field group ──────────────────────────────────────────────────────────── */
const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label className="st-label">{label}</label>
    {children}
    {hint && <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--st-text-3)' }}>{hint}</p>}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SECTION COMPONENTS                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ── Profile ── */
const ProfileSection = ({ user, onSave }) => {
  const [name, setName]   = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio]     = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/auth/profile`, { name, bio }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSave?.({ name, email, bio });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="st-card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--st-avatar-bg)', border: '.5px solid rgba(99,102,241,.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, color: 'var(--st-avatar-txt)',
          flexShrink: 0, letterSpacing: '.04em',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--st-text-1)' }}>{name || 'Your name'}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--st-text-3)' }}>{email}</p>
        </div>
        <span className="st-plan-badge">Free plan</span>
      </div>

      <div className="st-card">
        <p className="st-section-title">Personal info</p>
        <Field label="Full name">
          <input className="st-field" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
        </Field>
        <Field label="Email address" hint="Contact support to change your email.">
          <input className="st-field" value={email} disabled />
        </Field>
        <Field label="Bio" hint="A short description shown to your team.">
          <textarea className="st-field" rows={3} value={bio} onChange={e => setBio(e.target.value)}
            placeholder="Tell your team a bit about yourself…"
            style={{ resize: 'vertical', lineHeight: 1.6 }} />
        </Field>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="st-btn primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="st-spinner" /> : <Save size={13} />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--st-success-txt)' }}>
              <CheckCircle2 size={13} /> Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Account & Security ── */
const AccountSection = () => {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState(null);
  const [twoFA, setTwoFA]         = useState(false);
  const [sessions, setSessions]   = useState([
    { id: 1, device: 'Chrome · macOS',  location: 'Mumbai, IN',   active: true,  time: 'Now'        },
    { id: 2, device: 'Safari · iPhone', location: 'Delhi, IN',    active: false, time: '2 days ago' },
  ]);

  const handleChangePw = async () => {
    if (newPw !== confirmPw) return setMsg({ type: 'danger', text: 'Passwords do not match.' });
    if (newPw.length < 8)     return setMsg({ type: 'danger', text: 'Password must be at least 8 characters.' });
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/auth/password`, { currentPassword: currentPw, newPassword: newPw }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e) {
      setMsg({ type: 'danger', text: e.response?.data?.error || 'Failed to update password.' });
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="st-card">
        <p className="st-section-title">Change password</p>
        {msg && (
          <div className={`st-alert ${msg.type}`}>
            {msg.type === 'danger' ? <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
            {msg.text}
          </div>
        )}
        <Field label="Current password">
          <div style={{ position: 'relative' }}>
            <input className="st-field" type={showPw ? 'text' : 'password'}
              value={currentPw} onChange={e => setCurrentPw(e.target.value)}
              placeholder="Enter current password" style={{ paddingRight: 38 }} />
            <button type="button" onClick={() => setShowPw(p => !p)} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--st-text-3)',
            }}>
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </Field>
        <Field label="New password" hint="Minimum 8 characters.">
          <input className="st-field" type={showPw ? 'text' : 'password'}
            value={newPw} onChange={e => setNewPw(e.target.value)}
            placeholder="New password" />
        </Field>
        <Field label="Confirm new password">
          <input className="st-field" type={showPw ? 'text' : 'password'}
            value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
            placeholder="Re-enter new password" />
        </Field>
        <button className="st-btn primary" onClick={handleChangePw} disabled={saving || !currentPw || !newPw || !confirmPw}>
          {saving ? <><span className="st-spinner" /> Updating…</> : <><Lock size={13} /> Update password</>}
        </button>
      </div>

      <div className="st-card">
        <p className="st-section-title">Two-factor authentication</p>
        <ToggleRow
          label="Enable 2FA"
          desc="Require a verification code on every login."
          checked={twoFA}
          onChange={setTwoFA}
        />
        {twoFA && (
          <div className="st-alert info" style={{ marginTop: 12, marginBottom: 0 }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            2FA setup requires scanning a QR code. This feature will be available in the next release.
          </div>
        )}
      </div>

      <div className="st-card">
        <p className="st-section-title">Active sessions</p>
        {sessions.map(s => (
          <div key={s.id} className="st-row">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: s.active ? 'rgba(16,185,129,.1)' : 'var(--st-field-bg)',
                border: `.5px solid ${s.active ? 'rgba(16,185,129,.25)' : 'var(--st-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Monitor size={15} color={s.active ? '#34d399' : 'var(--st-text-3)'} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--st-text-1)' }}>
                  {s.device}
                  {s.active && <span style={{ marginLeft: 7, fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(16,185,129,.1)', padding: '1px 7px', borderRadius: 999 }}>Current</span>}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--st-text-3)' }}>{s.location} · {s.time}</p>
              </div>
            </div>
            {!s.active && (
              <button className="st-btn danger" style={{ padding: '5px 10px', fontSize: 11 }}
                onClick={() => setSessions(p => p.filter(x => x.id !== s.id))}>
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Appearance ── */
const AppearanceSection = ({ isDark, toggleTheme }) => {
  const [density, setDensity]   = useState('comfortable');
  const [fontSize, setFontSize] = useState('medium');
  const [colorMode, setColorMode] = useState(isDark ? 'dark' : 'light');

  const applyTheme = mode => {
    setColorMode(mode);
    if (mode === 'dark'  && !isDark)  toggleTheme?.();
    if (mode === 'light' && isDark)   toggleTheme?.();
  };

  return (
    <div>
      <div className="st-card">
        <p className="st-section-title">Theme</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { id: 'light', label: 'Light', Icon: Sun   },
            { id: 'dark',  label: 'Dark',  Icon: Moon  },
            { id: 'system',label: 'System',Icon: Monitor},
          ].map(({ id, label, Icon: I }) => (
            <button key={id} type="button" className={`st-theme-btn${colorMode === id ? ' active' : ''}`}
              onClick={() => applyTheme(id)}>
              <I size={18} />
              {label}
              {colorMode === id && <CheckCircle2 size={11} />}
            </button>
          ))}
        </div>
      </div>

      <div className="st-card">
        <p className="st-section-title">Layout density</p>
        {[
          { id: 'compact',      label: 'Compact',      desc: 'More data per screen, tighter spacing.' },
          { id: 'comfortable',  label: 'Comfortable',  desc: 'Balanced spacing. Recommended.' },
          { id: 'spacious',     label: 'Spacious',     desc: 'Extra breathing room between elements.' },
        ].map(opt => (
          <div key={opt.id} className="st-row" onClick={() => setDensity(opt.id)} style={{ cursor: 'pointer' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--st-text-1)' }}>{opt.label}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--st-text-3)' }}>{opt.desc}</p>
            </div>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: `.5px solid ${density === opt.id ? 'rgba(99,102,241,.6)' : 'var(--st-border-2)'}`,
              background: density === opt.id ? 'rgba(99,102,241,.15)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {density === opt.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />}
            </div>
          </div>
        ))}
      </div>

      <div className="st-card">
        <p className="st-section-title">Chart default font size</p>
        <Field label="Size">
          <select className="st-field" value={fontSize} onChange={e => setFontSize(e.target.value)}>
            <option value="small">Small (11px)</option>
            <option value="medium">Medium (13px) — Recommended</option>
            <option value="large">Large (15px)</option>
          </select>
        </Field>
      </div>
    </div>
  );
};

/* ── Notifications ── */
const NotificationsSection = () => {
  const [prefs, setPrefs] = useState({
    email_uploads:    true,
    email_exports:    false,
    email_billing:    true,
    email_updates:    false,
    browser_uploads:  true,
    browser_ai:       true,
    browser_errors:   true,
  });

  const set = key => val => setPrefs(p => ({ ...p, [key]: val }));

  return (
    <div>
      <div className="st-card">
        <p className="st-section-title">Email notifications</p>
        <ToggleRow label="Dataset uploads complete"  desc="Get an email when a CSV finishes processing."     checked={prefs.email_uploads}  onChange={set('email_uploads')} />
        <ToggleRow label="Export ready"              desc="Email when a PDF or PPT export is ready."         checked={prefs.email_exports}  onChange={set('email_exports')} />
        <ToggleRow label="Billing & invoices"        desc="Payment receipts and subscription changes."       checked={prefs.email_billing}  onChange={set('email_billing')} />
        <ToggleRow label="Product updates"           desc="New features, changelogs, and announcements."     checked={prefs.email_updates}  onChange={set('email_updates')} />
      </div>

      <div className="st-card">
        <p className="st-section-title">In-app notifications</p>
        <ToggleRow label="Upload & processing alerts" desc="Toast when a dataset finishes loading."           checked={prefs.browser_uploads} onChange={set('browser_uploads')} />
        <ToggleRow label="AI query complete"          desc="Notify when a long-running query finishes."       checked={prefs.browser_ai}      onChange={set('browser_ai')} />
        <ToggleRow label="Error alerts"               desc="Show errors from failed queries or exports."      checked={prefs.browser_errors}  onChange={set('browser_errors')} />
      </div>
    </div>
  );
};

/* ── Data & Exports ── */
const DataSection = () => {
  const [autoDelete, setAutoDelete] = useState('never');
  const [exporting, setExporting]   = useState(false);

  const handleExportAll = async () => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 1500));
    setExporting(false);
    alert('Data export queued. You will receive an email with the download link within 5 minutes.');
  };

  return (
    <div>
      <div className="st-card">
        <p className="st-section-title">Export your data</p>
        <div className="st-alert info">
          <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          Exports include all your datasets, charts, and chat history in JSON + CSV format.
        </div>
        <button className="st-btn" onClick={handleExportAll} disabled={exporting}>
          {exporting ? <><span className="st-spinner" style={{ borderColor: 'rgba(0,0,0,.15)', borderTopColor: 'var(--st-text-1)' }} /> Preparing…</> : <><Download size={13} /> Export all data</>}
        </button>
      </div>

      <div className="st-card">
        <p className="st-section-title">Auto-delete old datasets</p>
        <Field label="Delete datasets older than" hint="Helps keep your workspace clean and within storage limits.">
          <select className="st-field" value={autoDelete} onChange={e => setAutoDelete(e.target.value)}>
            <option value="never">Never (keep everything)</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
        </Field>
        <button className="st-btn primary"><Save size={13} /> Save preference</button>
      </div>

      <div className="st-card">
        <p className="st-section-title">Default export format</p>
        {[
          { id: 'pdf',  label: 'PDF Report',        desc: 'Best for sharing with stakeholders.' },
          { id: 'pptx', label: 'PowerPoint (PPTX)', desc: 'Best for presentations.' },
          { id: 'csv',  label: 'CSV',               desc: 'Raw data for further analysis.' },
        ].map(opt => (
          <div key={opt.id} className="st-row">
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--st-text-1)' }}>{opt.label}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--st-text-3)' }}>{opt.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── API Keys ── */
const ApiSection = () => {
  const [keys, setKeys] = useState([
    { id: 1, name: 'Production',  key: 'lum_prod_••••••••••••••••••4f2a', created: 'Mar 1, 2025',  last_used: 'Today' },
    { id: 2, name: 'Development', key: 'lum_dev_••••••••••••••••••9c11',  created: 'Jan 14, 2025', last_used: '5 days ago' },
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating]     = useState(false);
  const [newKeyVal, setNewKeyVal]   = useState(null);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    await new Promise(r => setTimeout(r, 900));
    const fake = `lum_${newKeyName.toLowerCase().replace(/\s+/, '_')}_${Math.random().toString(36).slice(2, 18)}`;
    setNewKeyVal(fake);
    setKeys(p => [...p, { id: Date.now(), name: newKeyName, key: fake.slice(0, 12) + '••••••••••••', created: 'Just now', last_used: 'Never' }]);
    setNewKeyName('');
    setCreating(false);
  };

  return (
    <div>
      {newKeyVal && (
        <div className="st-alert success">
          <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>Key created — copy it now. It won't be shown again.</p>
            <code style={{ fontSize: 12, fontFamily: 'monospace', display: 'block', marginTop: 4, wordBreak: 'break-all' }}>{newKeyVal}</code>
            <button onClick={() => { navigator.clipboard.writeText(newKeyVal); }} style={{ marginTop: 6, fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--st-success-txt)', padding: 0 }}>
              Copy to clipboard
            </button>
          </div>
        </div>
      )}

      <div className="st-card">
        <p className="st-section-title">Your API keys</p>
        {keys.map(k => (
          <div key={k.id} className="st-row">
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--st-text-1)' }}>{k.name}</p>
              <code style={{ fontSize: 11, color: 'var(--st-text-3)', fontFamily: 'monospace' }}>{k.key}</code>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--st-text-3)' }}>Created {k.created} · Last used {k.last_used}</p>
            </div>
            <button className="st-btn danger" style={{ padding: '5px 10px', fontSize: 11 }}
              onClick={() => setKeys(p => p.filter(x => x.id !== k.id))}>
              <Trash2 size={11} /> Revoke
            </button>
          </div>
        ))}
      </div>

      <div className="st-card">
        <p className="st-section-title">Create new key</p>
        <Field label="Key name" hint="e.g. 'Production', 'Analytics bot'">
          <input className="st-field" value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
            placeholder="Key name" onKeyDown={e => e.key === 'Enter' && createKey()} />
        </Field>
        <button className="st-btn primary" onClick={createKey} disabled={creating || !newKeyName.trim()}>
          {creating ? <><span className="st-spinner" /> Creating…</> : <><Key size={13} /> Create key</>}
        </button>
      </div>
    </div>
  );
};

/* ── Billing ── */
const BillingSection = () => (
  <div>
    <div className="st-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span className="st-plan-badge pro"><Zap size={10} /> Pro plan</span>
          <span style={{ fontSize: 11, color: 'var(--st-success-txt)', background: 'var(--st-success-bg)', border: '.5px solid var(--st-success-bdr)', padding: '2px 8px', borderRadius: 999 }}>Active</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--st-text-2)' }}>$19 / month · renews April 18, 2025</p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="st-btn">Manage billing</button>
        <button className="st-btn danger">Cancel plan</button>
      </div>
    </div>

    <div className="st-card">
      <p className="st-section-title">Usage this month</p>
      {[
        { label: 'Datasets uploaded', used: 8,   limit: 20,  unit: ''     },
        { label: 'Storage used',      used: 234, limit: 500, unit: ' MB'  },
        { label: 'AI queries',        used: 142, limit: 500, unit: ''     },
        { label: 'PDF exports',       used: 6,   limit: 20,  unit: ''     },
      ].map(item => (
        <div key={item.label} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: 'var(--st-text-2)' }}>{item.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--st-text-1)' }}>
              {item.used}{item.unit} <span style={{ color: 'var(--st-text-3)', fontWeight: 400 }}>/ {item.limit}{item.unit}</span>
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 999, background: 'var(--st-field-bg)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              width: `${Math.min(100, (item.used / item.limit) * 100)}%`,
              background: item.used / item.limit > 0.8 ? '#f59e0b' : '#6366f1',
              transition: 'width .3s',
            }} />
          </div>
        </div>
      ))}
    </div>

    <div className="st-card">
      <p className="st-section-title">Payment method</p>
      <div className="st-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 28, borderRadius: 5, background: 'var(--st-field-bg)', border: '.5px solid var(--st-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={14} color="var(--st-text-2)" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--st-text-1)' }}>Visa ending in 4242</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--st-text-3)' }}>Expires 09 / 2027</p>
          </div>
        </div>
        <button className="st-btn" style={{ fontSize: 11, padding: '5px 10px' }}>Update</button>
      </div>
    </div>
  </div>
);

/* ── Danger Zone ── */
const DangerSection = ({ onLogout }) => {
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm !== 'DELETE') return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/auth/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.clear();
      onLogout?.();
    } catch (e) {
      alert('Failed to delete account. Please contact support@lumina.bi');
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="st-card">
        <p className="st-section-title">Sign out all devices</p>
        <p style={{ fontSize: 13, color: 'var(--st-text-2)', margin: '0 0 14px', lineHeight: 1.6 }}>
          This will immediately invalidate all active sessions. You'll need to sign in again.
        </p>
        <button className="st-btn danger" onClick={onLogout}>
          <LogOut size={13} /> Sign out everywhere
        </button>
      </div>

      <div className="st-card" style={{ borderColor: 'rgba(239,68,68,.2)' }}>
        <p className="st-section-title" style={{ color: 'var(--st-danger-txt)' }}>Delete account</p>
        <div className="st-alert danger">
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          This is permanent. All datasets, charts, exports, and history will be erased. There is no undo.
        </div>
        <Field label="Type DELETE to confirm">
          <input className="st-field" value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder='Type "DELETE"' style={{ borderColor: confirm === 'DELETE' ? 'var(--st-danger-bdr)' : undefined }} />
        </Field>
        <button className="st-btn danger" onClick={handleDelete}
          disabled={confirm !== 'DELETE' || deleting}>
          {deleting ? <><span className="st-spinner" style={{ borderColor: 'rgba(239,68,68,.2)', borderTopColor: '#f87171' }} /> Deleting…</> : <><Trash2 size={13} /> Delete my account</>}
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN SETTINGS PAGE                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */
const Settings = ({ isDark, toggleTheme, onLogout }) => {
  const [active, setActive] = useState('profile');
  const [user, setUser]     = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch {}
    };
    fetchUser();
  }, []);

  const SECTIONS = {
    profile:       <ProfileSection user={user} onSave={u => setUser(prev => ({ ...prev, ...u }))} />,
    account:       <AccountSection />,
    appearance:    <AppearanceSection isDark={isDark} toggleTheme={toggleTheme} />,
    notifications: <NotificationsSection />,
    data:          <DataSection />,
    api:           <ApiSection />,
    billing:       <BillingSection />,
    danger:        <DangerSection onLogout={onLogout} />,
  };

  const activeNav = NAV.find(n => n.id === active);

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      background: 'var(--st-page)',
      padding: '28px 24px 48px',
      minHeight: '100vh',
    }}>
      <style>{STYLES}</style>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--st-text-1)', margin: 0, letterSpacing: '-.3px' }}>Settings</h1>
          <p style={{ fontSize: 13, color: 'var(--st-text-3)', margin: '4px 0 0' }}>Manage your account, preferences, and workspace.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, alignItems: 'start' }}>

          {/* Sidebar nav */}
          <nav style={{
            background: 'var(--st-card)',
            border: '.5px solid var(--st-border)',
            borderRadius: 12, padding: 8,
            position: 'sticky', top: 16,
          }}>
            {NAV.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={`st-nav-item${active === id ? ' active' : ''}`}
                onClick={() => setActive(id)}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div>
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--st-text-1)', margin: 0 }}>
                {activeNav?.label}
              </h2>
            </div>
            {SECTIONS[active]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;