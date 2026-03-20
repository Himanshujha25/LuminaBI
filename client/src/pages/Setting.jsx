import React, { useState, useEffect, useCallback, useRef} from 'react';
import {
  User, Lock, Bell, Palette, Shield, CreditCard,
  Trash2, CheckCircle2, AlertCircle, Eye, EyeOff,
  Sun, Moon, Monitor, LogOut, Key, Zap, Save,
  Info, X, Copy, Check, RefreshCw, Sparkles,
  BrainCircuit, Globe, ShieldCheck, ExternalLink,
  ChevronDown, Search, ArrowUpRight
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { API_URL } from '../config';

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --page:        #f3f4f8;
    --surface:     #ffffff;
    --surface-2:   #f8f8fb;
    --border:      rgba(0,0,0,.08);
    --border-md:   rgba(0,0,0,.13);
    --border-str:  rgba(0,0,0,.20);
    --text-1:      #0d0e14;
    --text-2:      rgba(13,14,20,.52);
    --text-3:      rgba(13,14,20,.34);
    --text-4:      rgba(13,14,20,.22);
    --field:       rgba(0,0,0,.025);
    --field-bdr:   rgba(0,0,0,.10);
    --hover:       rgba(0,0,0,.035);
    --accent:      #3b3fce;
    --accent-dim:  rgba(59,63,206,.10);
    --accent-bdr:  rgba(59,63,206,.22);
    --accent-txt:  #3b3fce;
    --danger:      #d42b2b;
    --danger-dim:  rgba(212,43,43,.07);
    --danger-bdr:  rgba(212,43,43,.20);
    --success:     #0d7a4e;
    --success-dim: rgba(13,122,78,.07);
    --success-bdr: rgba(13,122,78,.20);
    --warn-dim:    rgba(180,120,0,.08);
    --warn-bdr:    rgba(180,120,0,.22);
    --warn-txt:    #8a5c00;
    --nav-active:  rgba(59,63,206,.08);
    --nav-clr:     rgba(13,14,20,.44);
    --toggle-off:  rgba(0,0,0,.16);
    --toggle-on:   #3b3fce;
    --av-bg:       rgba(59,63,206,.10);
    --av-txt:      #3b3fce;
    --shadow-sm:   0 1px 2px rgba(0,0,0,.05), 0 0 0 1px rgba(0,0,0,.04);
    --shadow-md:   0 4px 12px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.04);
    --shadow-lg:   0 12px 32px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.05);
    --r-sm:        6px;
    --r-md:        9px;
    --r-lg:        13px;
    --r-xl:        16px;
  }

  [data-theme="dark"] {
    --page:        #0a0b12;
    --surface:     #111320;
    --surface-2:   #161829;
    --border:      rgba(255,255,255,.07);
    --border-md:   rgba(255,255,255,.12);
    --border-str:  rgba(255,255,255,.18);
    --text-1:      #e8eaf5;
    --text-2:      rgba(232,234,245,.50);
    --text-3:      rgba(232,234,245,.30);
    --text-4:      rgba(232,234,245,.17);
    --field:       rgba(255,255,255,.04);
    --field-bdr:   rgba(255,255,255,.09);
    --hover:       rgba(255,255,255,.05);
    --accent:      #5a5fff;
    --accent-dim:  rgba(90,95,255,.12);
    --accent-bdr:  rgba(90,95,255,.28);
    --accent-txt:  #8a8fff;
    --danger:      #f06060;
    --danger-dim:  rgba(240,96,96,.09);
    --danger-bdr:  rgba(240,96,96,.24);
    --success:     #3dd68c;
    --success-dim: rgba(61,214,140,.09);
    --success-bdr: rgba(61,214,140,.24);
    --warn-dim:    rgba(255,190,50,.08);
    --warn-bdr:    rgba(255,190,50,.22);
    --warn-txt:    #e8a020;
    --nav-active:  rgba(90,95,255,.12);
    --nav-clr:     rgba(232,234,245,.40);
    --toggle-off:  rgba(255,255,255,.16);
    --toggle-on:   #5a5fff;
    --av-bg:       rgba(90,95,255,.14);
    --av-txt:      #9a9fff;
    --shadow-sm:   0 1px 3px rgba(0,0,0,.30);
    --shadow-md:   0 4px 16px rgba(0,0,0,.35);
    --shadow-lg:   0 16px 40px rgba(0,0,0,.45);
  }

  .sw { font-family:'DM Sans',sans-serif; background:var(--page); color:var(--text-1); min-height:100vh; }
  .sw-mono { font-family:'DM Mono',monospace; }

  .sw-field {
    width:100%; padding:9px 12px; font-size:13.5px; font-family:'DM Sans',sans-serif;
    border-radius:var(--r-md); background:var(--field);
    border:1px solid var(--field-bdr); color:var(--text-1);
    outline:none; transition:border-color .15s, box-shadow .15s;
  }
  .sw-field:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-dim); }
  .sw-field::placeholder { color:var(--text-4); }
  .sw-field:disabled { opacity:.38; cursor:not-allowed; }
  textarea.sw-field { resize:vertical; line-height:1.65; }

  .sw-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:8px 16px; border-radius:var(--r-md);
    border:1px solid var(--border-md); background:var(--surface);
    color:var(--text-1); font-size:13px; font-weight:500;
    font-family:'DM Sans',sans-serif; cursor:pointer;
    transition:all .14s; white-space:nowrap; flex-shrink:0;
    box-shadow:var(--shadow-sm);
  }
  .sw-btn:hover { background:var(--hover); border-color:var(--border-str); }
  .sw-btn:active { transform:scale(.98); }
  .sw-btn.primary { background:var(--accent); border-color:transparent; color:#fff; box-shadow:0 2px 8px rgba(59,63,206,.30); }
  .sw-btn.primary:hover { opacity:.90; }
  .sw-btn.danger { background:var(--danger-dim); border-color:var(--danger-bdr); color:var(--danger); box-shadow:none; }
  .sw-btn.danger:hover { opacity:.82; }
  .sw-btn:disabled { opacity:.38; cursor:not-allowed; pointer-events:none; }
  .sw-btn.ghost { background:transparent; border-color:transparent; box-shadow:none; color:var(--text-2); }
  .sw-btn.ghost:hover { background:var(--hover); color:var(--text-1); }
  .sw-btn.link { background:transparent; border:none; box-shadow:none; color:var(--accent-txt); padding:0; font-size:12px; font-weight:500; display:inline-flex; align-items:center; gap:3px; }
  .sw-btn.link:hover { opacity:.72; }

  .sw-nav-btn {
    display:flex; align-items:center; gap:9px; padding:8px 10px;
    border-radius:var(--r-md); border:none; background:transparent;
    color:var(--nav-clr); font-size:12.5px; font-weight:500;
    font-family:'DM Sans',sans-serif; cursor:pointer;
    transition:all .12s; width:100%; text-align:left;
  }
  .sw-nav-btn:hover { background:var(--hover); color:var(--text-1); }
  .sw-nav-btn.active { background:var(--nav-active); color:var(--accent-txt); font-weight:600; }
  .sw-nav-btn.dnav { color:var(--danger); }
  .sw-nav-btn.dnav:hover { background:var(--danger-dim); }

  .sw-toggle {
    position:relative; display:inline-flex; align-items:center;
    width:36px; height:20px; border-radius:999px; cursor:pointer;
    background:var(--toggle-off); transition:background .2s; border:none; flex-shrink:0;
  }
  .sw-toggle.on { background:var(--toggle-on); }
  .sw-toggle::after {
    content:''; position:absolute; left:3px; width:14px; height:14px;
    border-radius:50%; background:#fff; transition:transform .2s;
    box-shadow:0 1px 4px rgba(0,0,0,.30);
  }
  .sw-toggle.on::after { transform:translateX(16px); }

  .sw-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:13px 0; border-bottom:1px solid var(--border);
  }
  .sw-row:last-child { border-bottom:none; padding-bottom:0; }
  .sw-row:first-child { padding-top:0; }

  .sw-card {
    background:var(--surface); border:1px solid var(--border);
    border-radius:var(--r-xl); padding:20px 22px; margin-bottom:12px;
    box-shadow:var(--shadow-sm);
  }

  .sw-lbl {
    display:block; font-size:11px; font-weight:600;
    letter-spacing:.05em; text-transform:uppercase;
    color:var(--text-3); margin-bottom:6px;
  }
  .sw-sec-title {
    font-size:10.5px; font-weight:700; letter-spacing:.08em;
    text-transform:uppercase; color:var(--text-3); margin-bottom:16px;
  }

  .sw-alert {
    display:flex; align-items:flex-start; gap:9px; padding:11px 14px;
    border-radius:var(--r-md); font-size:13px; line-height:1.55; margin-bottom:14px;
  }
  .sw-alert.info   { background:var(--accent-dim);  border:1px solid var(--accent-bdr);  color:var(--accent-txt); }
  .sw-alert.danger { background:var(--danger-dim);  border:1px solid var(--danger-bdr);  color:var(--danger); }
  .sw-alert.success{ background:var(--success-dim); border:1px solid var(--success-bdr); color:var(--success); }

  .sw-badge {
    display:inline-flex; align-items:center; gap:4px;
    padding:2px 9px; border-radius:999px; font-size:11px; font-weight:600;
  }
  .sw-badge.accent  { background:var(--accent-dim);  border:1px solid var(--accent-bdr);  color:var(--accent-txt); }
  .sw-badge.success { background:var(--success-dim); border:1px solid var(--success-bdr); color:var(--success); }
  .sw-badge.warn    { background:var(--warn-dim);    border:1px solid var(--warn-bdr);    color:var(--warn-txt); }

  .sw-avatar {
    display:flex; align-items:center; justify-content:center;
    border-radius:50%; background:var(--av-bg); color:var(--av-txt);
    font-weight:700; letter-spacing:.02em; flex-shrink:0;
    border:1.5px solid var(--accent-bdr);
  }

  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .sw-skel {
    border-radius:var(--r-sm);
    background:linear-gradient(90deg, var(--field) 25%, var(--hover) 50%, var(--field) 75%);
    background-size:800px 100%; animation:shimmer 1.5s infinite;
  }

  @keyframes sw-spin { to { transform:rotate(360deg) } }
  .sw-spin {
    width:13px; height:13px; border-radius:50%;
    border:2px solid rgba(255,255,255,.25); border-top-color:#fff;
    animation:sw-spin .6s linear infinite; display:inline-block; flex-shrink:0;
  }

  .sw-theme-btn {
    flex:1; display:flex; flex-direction:column; align-items:center; gap:6px;
    padding:12px 8px; border-radius:var(--r-md);
    border:1px solid var(--border-md); background:var(--field);
    cursor:pointer; font-family:'DM Sans',sans-serif;
    font-size:11.5px; font-weight:500; color:var(--text-2); transition:all .13s;
  }
  .sw-theme-btn:hover { border-color:var(--accent-bdr); color:var(--text-1); }
  .sw-theme-btn.active { border-color:var(--accent); background:var(--accent-dim); color:var(--accent-txt); }

  .sw-prog-track { height:5px; border-radius:999px; background:var(--field); overflow:hidden; }
  .sw-prog-fill  { height:100%; border-radius:999px; transition:width .4s; }

  .sw-fwrap { position:relative; }
  .sw-fwrap .sw-ficon {
    position:absolute; right:10px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer; color:var(--text-3);
    display:flex; align-items:center; padding:2px; border-radius:4px; transition:color .12s;
  }
  .sw-fwrap .sw-ficon:hover { color:var(--text-1); }

  .sw-dropdown {
    position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:200;
    background:var(--surface); border:1px solid var(--border-md);
    border-radius:var(--r-lg); box-shadow:var(--shadow-lg); overflow:hidden;
  }
  .sw-drop-search { padding:10px 10px 8px; border-bottom:1px solid var(--border); }
  .sw-drop-list   { max-height:236px; overflow-y:auto; padding:6px; }
  .sw-drop-item {
    display:flex; align-items:center; gap:11px; padding:9px 10px;
    border-radius:var(--r-md); cursor:pointer; transition:background .1s;
  }
  .sw-drop-item:hover { background:var(--hover); }
  .sw-drop-item.sel { background:var(--accent-dim); }

  .sw-picon {
    width:32px; height:32px; border-radius:8px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    border:1px solid rgba(0,0,0,.07);
    font-size:11.5px; font-weight:700; font-family:'DM Sans',sans-serif;
  }
  [data-theme="dark"] .sw-picon { border-color:rgba(255,255,255,.08); }

  .sw-key-box {
    padding:16px 18px; border-radius:var(--r-lg);
    background:var(--surface-2); border:1px solid var(--border);
  }

  .sw-hr { border:none; border-top:1px solid var(--border); margin:16px 0; }
  .no-scrollbar::-webkit-scrollbar { display: none; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
  .sw-fadein { animation:fadeIn .16s ease; }
  .sw-fadeup { animation:fadeUp .18s ease; }

  /* Responsive Settings Layout */
  .sw-layout {
    display: grid;
    grid-template-columns: 192px 1fr;
    gap: 20px;
    align-items: start;
  }
  .sw-wrapper { padding: 32px 24px; }
  
  .sw-sidebar-nav {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-xl); padding: 8px;
    position: sticky; top: 16px; box-shadow: var(--shadow-sm);
  }

  @media (max-width: 768px) {
    .sw-wrapper { padding: 12px 10px; }
    .sw-layout {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .sw-sidebar-nav {
      position: relative; top: 0;
      display: flex; gap: 4px; overflow-x: auto;
      padding: 6px; border-radius: var(--r-md);
      -webkit-overflow-scrolling: touch;
    }
    .sw-nav-btn {
      white-space: nowrap; flex: 0 0 auto; width: auto;
      padding: 6px 12px; font-size: 12px;
    }
    .sw-hr { display: none; }
    .sw-card { padding: 16px; border-radius: var(--r-lg); }
  }
`;

/* ─────────────────────────────────────────────
   NAV
───────────────────────────────────────────── */
const NAV = [
  { id: 'profile',       label: 'Profile',        Icon: User       },
  { id: 'security',      label: 'Security',        Icon: Lock       },
  { id: 'appearance',    label: 'Appearance',      Icon: Palette    },
  { id: 'notifications', label: 'Notifications',   Icon: Bell       },
  { id: 'ai',            label: 'AI Engine',       Icon: Sparkles   },
  { id: 'billing',       label: 'Billing',         Icon: CreditCard },
  { id: 'danger',        label: 'Danger Zone',     Icon: Shield     },
];

/* ─────────────────────────────────────────────
   PROVIDER REGISTRY  (real "Get key" links)
───────────────────────────────────────────── */
const PROVIDERS = [
  {
    id: 'gemini',      name: 'Google Gemini',    model: 'Gemini 2.5 Flash',
    tag: 'Free tier',              bg: '#e8f0fe', fg: '#1a73e8', initials: 'GG',
    isDefault: true,
    keyUrl: 'https://aistudio.google.com/app/apikey',
    keyDomain: 'aistudio.google.com',
  },
  {
    id: 'openai',      name: 'OpenAI',           model: 'GPT-4o / o1',
    tag: 'High reasoning',         bg: '#d1fae5', fg: '#065f46', initials: 'OA',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyDomain: 'platform.openai.com',
  },
  {
    id: 'claude',      name: 'Anthropic',        model: 'Claude 3.7 Sonnet',
    tag: 'Coding & analysis',      bg: '#fde8e0', fg: '#7c2d12', initials: 'AN',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyDomain: 'console.anthropic.com',
  },
  {
    id: 'grok',        name: 'xAI',              model: 'Grok 3',
    tag: 'Real-time knowledge',    bg: '#e5e7eb', fg: '#111827', initials: 'XA',
    keyUrl: 'https://console.x.ai/',
    keyDomain: 'console.x.ai',
  },
  {
    id: 'deepseek',    name: 'DeepSeek',         model: 'DeepSeek R2',
    tag: 'Mathematical reasoning', bg: '#e0e7ff', fg: '#1e1b4b', initials: 'DS',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    keyDomain: 'platform.deepseek.com',
  },
  {
    id: 'mistral',     name: 'Mistral AI',       model: 'Mistral Large',
    tag: 'Open weights',           bg: '#fef3c7', fg: '#78350f', initials: 'MI',
    keyUrl: 'https://console.mistral.ai/api-keys/',
    keyDomain: 'console.mistral.ai',
  },
  {
    id: 'perplexity',  name: 'Perplexity',       model: 'Sonar Pro',
    tag: 'Online search AI',       bg: '#d1fae5', fg: '#064e3b', initials: 'PP',
    keyUrl: 'https://www.perplexity.ai/settings/api',
    keyDomain: 'perplexity.ai',
  },
];

/* ─────────────────────────────────────────────
   SHARED HELPERS
───────────────────────────────────────────── */
const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label className="sw-lbl">{label}</label>}
    {children}
    {hint && <p style={{ marginTop: 5, fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5 }}>{hint}</p>}
  </div>
);

const ToggleRow = ({ label, desc, checked, onChange }) => (
  <div className="sw-row">
    <div style={{ paddingRight: 16 }}>
      <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)' }}>{label}</p>
      {desc && <p style={{ marginTop: 2, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</p>}
    </div>
    <button type="button" className={`sw-toggle${checked ? ' on' : ''}`} onClick={() => onChange(!checked)} />
  </div>
);

const Skel = ({ w = '100%', h = 14, mb = 0 }) => (
  <div className="sw-skel" style={{ width: w, height: h, marginBottom: mb }} />
);

const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = useCallback((type, text, ms = 3200) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), ms);
  }, []);
  return { toast, show };
};

const Toast = ({ toast }) => {
  if (!toast) return null;
  const map = {
    success: { bg: 'var(--success-dim)', bdr: 'var(--success-bdr)', clr: 'var(--success)', Icon: CheckCircle2 },
    danger:  { bg: 'var(--danger-dim)',  bdr: 'var(--danger-bdr)',  clr: 'var(--danger)',  Icon: AlertCircle  },
    info:    { bg: 'var(--accent-dim)',  bdr: 'var(--accent-bdr)',  clr: 'var(--accent-txt)', Icon: Info     },
  };
  const s = map[toast.type] || map.info;
  return (
    <div className="sw-fadeup" style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 9,
      padding: '11px 18px', borderRadius: 12,
      background: s.bg, border: `1px solid ${s.bdr}`, color: s.clr,
      fontSize: 13, fontWeight: 500, boxShadow: 'var(--shadow-lg)', maxWidth: 340,
    }}>
      <s.Icon size={14} style={{ flexShrink: 0 }} />
      {toast.text}
    </div>
  );
};

/* ─── Provider icon chip ─── */
const PIcon = ({ p, size = 32 }) => (
  <div className="sw-picon" style={{
    width: size, height: size, background: p.bg, color: p.fg,
    borderRadius: size <= 32 ? 8 : 10, fontSize: size <= 32 ? 11 : 13,
  }}>
    {p.initials}
  </div>
);

/* ─────────────────────────────────────────────
   PROFILE
───────────────────────────────────────────── */
const ProfileSection = ({ user, loading, onSave }) => {
  const [name, setName] = useState('');
  const [bio, setBio]   = useState('');
  const [saving, setSaving] = useState(false);
  const { toast, show } = useToast();

  useEffect(() => {
    if (user) { setName(user.name || ''); setBio(user.bio || ''); }
  }, [user]);

  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/auth/profile`, { name, bio }, { headers: { Authorization: `Bearer ${token}` } });
      onSave?.({ name, bio });
      show('success', 'Profile saved successfully');
    } catch (e) {
      show('danger', e.response?.data?.error || 'Failed to save profile');
    } finally { setSaving(false); }
  };

  return (
    <>
      <Toast toast={toast} />
      <div className="sw-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="sw-avatar" style={{ width: 54, height: 54, fontSize: 17 }}>
          {loading ? '?' : initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading
            ? <><Skel w={150} h={15} mb={7} /><Skel w={210} h={11} /></>
            : <>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>{name || 'Your name'}</p>
                <p style={{ marginTop: 2, fontSize: 12, color: 'var(--text-3)' }}>{user?.email}</p>
              </>
          }
        </div>
        <span className="sw-badge accent">Free plan</span>
      </div>

      <div className="sw-card">
        <p className="sw-sec-title">Personal info</p>
        <Field label="Full name">
          {loading ? <Skel h={38} /> : <input className="sw-field" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />}
        </Field>
        <Field label="Email address" hint="Contact support to change your email address.">
          {loading ? <Skel h={38} /> : <input className="sw-field" value={user?.email || ''} disabled />}
        </Field>
        <Field label="Bio" hint="A brief description shown to your teammates.">
          {loading ? <Skel h={78} /> : <textarea className="sw-field" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell your team about yourself…" />}
        </Field>
        <button className="sw-btn primary" onClick={save} disabled={saving || loading}>
          {saving ? <><span className="sw-spin" /> Saving…</> : <><Save size={13} /> Save changes</>}
        </button>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────
   SECURITY
───────────────────────────────────────────── */
const SecuritySection = () => {
  const [cur, setCur] = useState('');
  const [nw, setNw]   = useState('');
  const [cnf, setCnf] = useState('');
  const [vis, setVis] = useState(false);
  const [saving, setSaving] = useState(false);
  const [twoFA, setTwoFA]   = useState(false);
  const { toast, show } = useToast();

  const changePw = async () => {
    if (nw !== cnf)     return show('danger', 'Passwords do not match.');
    if (nw.length < 8)  return show('danger', 'Minimum 8 characters required.');
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/auth/password`, { currentPassword: cur, newPassword: nw }, { headers: { Authorization: `Bearer ${token}` } });
      show('success', 'Password updated successfully');
      setCur(''); setNw(''); setCnf('');
    } catch (e) { show('danger', e.response?.data?.error || 'Failed to update password.'); }
    finally { setSaving(false); }
  };

  const t = vis ? 'text' : 'password';
  const EyeBtn = () => (
    <button type="button" className="sw-ficon" onClick={() => setVis(p => !p)}>
      {vis ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );

  return (
    <>
      <Toast toast={toast} />
      <div className="sw-card">
        <p className="sw-sec-title">Change password</p>
        <Field label="Current password">
          <div className="sw-fwrap">
            <input className="sw-field" type={t} value={cur} onChange={e => setCur(e.target.value)} placeholder="Current password" style={{ paddingRight: 38 }} />
            <EyeBtn />
          </div>
        </Field>
        <Field label="New password" hint="At least 8 characters.">
          <input className="sw-field" type={t} value={nw} onChange={e => setNw(e.target.value)} placeholder="New password" />
        </Field>
        <Field label="Confirm new password">
          <input className="sw-field" type={t} value={cnf} onChange={e => setCnf(e.target.value)} placeholder="Confirm new password" />
        </Field>
        <button className="sw-btn primary" onClick={changePw} disabled={saving || !cur || !nw || !cnf}>
          {saving ? <><span className="sw-spin" /> Updating…</> : <><Lock size={13} /> Update password</>}
        </button>
      </div>

      <div className="sw-card">
        <p className="sw-sec-title">Two-factor authentication</p>
        <ToggleRow label="Enable 2FA" desc="Require a verification code on every sign-in." checked={twoFA} onChange={setTwoFA} />
        {twoFA && (
          <div className="sw-alert info" style={{ marginTop: 12, marginBottom: 0 }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            QR code setup will be available in the next release.
          </div>
        )}
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────
   APPEARANCE
───────────────────────────────────────────── */
const AppearanceSection = ({ isDark, toggleTheme }) => {
  const [mode, setMode] = useState(isDark ? 'dark' : 'light');
  const apply = m => {
    setMode(m);
    if (m === 'dark'  && !isDark) toggleTheme?.();
    if (m === 'light' && isDark)  toggleTheme?.();
  };
  return (
    <div className="sw-card">
      <p className="sw-sec-title">Interface theme</p>
      <div style={{ display: 'flex', gap: 10 }}>
        {[{ id:'light',label:'Light',Icon:Sun },{ id:'dark',label:'Dark',Icon:Moon },{ id:'system',label:'System',Icon:Monitor }].map(({ id, label, Icon: Ic }) => (
          <button key={id} type="button" className={`sw-theme-btn${mode === id ? ' active' : ''}`} onClick={() => apply(id)}>
            <Ic size={17} />{label}
            {mode === id && <CheckCircle2 size={11} style={{ marginTop: 1 }} />}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   NOTIFICATIONS
───────────────────────────────────────────── */
const NotificationsSection = () => {
  const [p, setP] = useState({ eu:true, eb:true, eu2:false, au:true, aa:true, ae:true });
  const s = k => v => setP(x => ({ ...x, [k]: v }));
  const { toast, show } = useToast();
  const save = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/auth/notifications`, p, { headers: { Authorization: `Bearer ${token}` } });
      show('success', 'Preferences saved');
    } catch { show('danger', 'Failed to save preferences'); }
  };
  return (
    <>
      <Toast toast={toast} />
      <div className="sw-card">
        <p className="sw-sec-title">Email</p>
        <ToggleRow label="Dataset uploads"    desc="Email when a CSV finishes processing."      checked={p.eu}  onChange={s('eu')} />
        <ToggleRow label="Billing & invoices" desc="Payment receipts and subscription changes." checked={p.eb}  onChange={s('eb')} />
        <ToggleRow label="Product updates"    desc="New features and announcements."            checked={p.eu2} onChange={s('eu2')} />
      </div>
      <div className="sw-card">
        <p className="sw-sec-title">In-app</p>
        <ToggleRow label="Upload alerts"  desc="Toast notification when a dataset loads."     checked={p.au} onChange={s('au')} />
        <ToggleRow label="AI query done"  desc="Notify when a long-running query completes."  checked={p.aa} onChange={s('aa')} />
        <ToggleRow label="Error alerts"   desc="Show errors from failed queries or exports."  checked={p.ae} onChange={s('ae')} />
      </div>
      <button className="sw-btn primary" onClick={save}><Save size={13} /> Save preferences</button>
    </>
  );
};

/* ─────────────────────────────────────────────
   AI ENGINE  — fully redesigned + real links
───────────────────────────────────────────── */
const AiSection = ({ user, onSave }) => {
  const [keys, setKeys]         = useState(user?.ai_keys || {});
  const [provider, setProvider] = useState(user?.preferred_provider || 'gemini');
  const [search, setSearch]     = useState('');
  const [open, setOpen]         = useState(false);
  const [showKey, setShowKey]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const dropRef = useRef(null);
  const { toast, show } = useToast();

  const active   = PROVIDERS.find(p => p.id === provider) || PROVIDERS[0];
  const filtered = PROVIDERS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const configured = Object.entries(keys).filter(([, v]) => v);

  useEffect(() => {
    const fn = e => {
      if (open && dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false); setSearch('');
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  const pick = id => { setProvider(id); setOpen(false); setSearch(''); setShowKey(false); setSaved(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`${API_URL}/auth/keys`,
        { ai_keys: keys, preferred_provider: provider },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSave?.(res.data.user);
      setSaved(true);
      show('success', 'AI engine configuration saved');
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      show('danger', e.response?.data?.error || 'Failed to save configuration');
    } finally { setSaving(false); }
  };

  return (
    <>
      <Toast toast={toast} />

      {/* Status banner */}
      <div className="sw-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: 'var(--accent-dim)', border: '1px solid var(--accent-bdr)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-txt)',
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>AI Engine Registry</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Choose which AI model powers your workspace analyses.</p>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '5px 13px', borderRadius: 999,
          background: 'var(--success-dim)', border: '1px solid var(--success-bdr)',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--success)' }}>{active.name} · active</span>
        </div>
      </div>

      {/* Selector + key */}
      <div className="sw-card">
        <p className="sw-sec-title">Active provider</p>

        {/* Dropdown trigger */}
        <div ref={dropRef} style={{ position: 'relative', marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => { setOpen(o => !o); setSearch(''); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 'var(--r-md)',
              background: 'var(--field)', border: `1px solid ${open ? 'var(--accent)' : 'var(--field-bdr)'}`,
              cursor: 'pointer', transition: 'border-color .15s, box-shadow .15s',
              boxShadow: open ? '0 0 0 3px var(--accent-dim)' : 'none',
            }}
          >
            <PIcon p={active} size={32} />
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{active.name}</p>
              <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: 0 }}>{active.model}</p>
            </div>
            <span className="sw-badge accent" style={{ fontSize: 10.5 }}>{active.tag}</span>
            <ChevronDown size={15} color="var(--text-3)" style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
          </button>

          {open && (
            <div className="sw-dropdown sw-fadein">
              <div className="sw-drop-search">
                <div className="sw-fwrap">
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input autoFocus className="sw-field" placeholder="Search providers…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, fontSize: 13 }} />
                </div>
              </div>
              <div className="sw-drop-list">
                {filtered.length === 0 && (
                  <p style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>No providers found</p>
                )}
                {filtered.map(p => (
                  <div key={p.id} className={`sw-drop-item${p.id === provider ? ' sel' : ''}`} onClick={() => pick(p.id)}>
                    <PIcon p={p} size={32} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{p.name}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: 0 }}>{p.model} · {p.tag}</p>
                    </div>
                    {p.id === provider
                      ? <CheckCircle2 size={14} color="var(--accent-txt)" />
                      : p.isDefault
                      ? <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--success)', background: 'var(--success-dim)', padding: '1px 7px', borderRadius: 999, border: '1px solid var(--success-bdr)' }}>Free</span>
                      : null
                    }
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Key area */}
        {active.isDefault ? (
          <div className="sw-key-box" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <PIcon p={active} size={36} />
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>Using Lumina system key</p>
              <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 10 }}>
                {active.model} is active on our shared key. Add your own for higher rate limits and priority access.
              </p>
              <a href={active.keyUrl} target="_blank" rel="noopener noreferrer" className="sw-btn link">
                Get a personal key at {active.keyDomain} <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
        ) : (
          <div className="sw-key-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label className="sw-lbl" style={{ margin: 0 }}>{active.name} API key</label>
              <a href={active.keyUrl} target="_blank" rel="noopener noreferrer" className="sw-btn link">
                Get key at {active.keyDomain} <ArrowUpRight size={11} />
              </a>
            </div>
            <div className="sw-fwrap">
              <input
                className="sw-field sw-mono"
                type={showKey ? 'text' : 'password'}
                value={keys[provider] || ''}
                onChange={e => setKeys(k => ({ ...k, [provider]: e.target.value }))}
                placeholder={`Paste your ${active.name} secret key…`}
                style={{ paddingRight: 38, fontSize: 13 }}
              />
              <button type="button" className="sw-ficon" onClick={() => setShowKey(p => !p)}>
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <ShieldCheck size={12} color="var(--success)" />
              <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Encrypted at rest — never stored in plain text.</span>
            </div>
          </div>
        )}

        <hr className="sw-hr" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Changes apply to all future AI queries in this workspace.</p>
          <button className="sw-btn primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><span className="sw-spin" /> Saving…</>
              : saved
              ? <><CheckCircle2 size={13} /> Saved</>
              : <><Save size={13} /> Save configuration</>
            }
          </button>
        </div>
      </div>

      {/* Configured keys list */}
      {configured.length > 0 && (
        <div className="sw-card">
          <p className="sw-sec-title">Configured keys</p>
          {configured.map(([id, val]) => {
            const p = PROVIDERS.find(x => x.id === id);
            if (!p) return null;
            return (
              <div key={id} className="sw-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <PIcon p={p} size={28} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{p.name}</p>
                    <code className="sw-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {val.slice(0, 8)}{'•'.repeat(10)}
                    </code>
                  </div>
                </div>
                <button className="sw-btn danger" style={{ padding: '5px 10px', fontSize: 11.5 }}
                  onClick={() => setKeys(k => { const n = { ...k }; delete n[id]; return n; })}>
                  <Trash2 size={11} /> Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

/* ─────────────────────────────────────────────
   BILLING
───────────────────────────────────────────── */
const BillingSection = ({ user }) => {
  const isPro = user?.plan === 'pro';
  const usage = [
    { label: 'Datasets uploaded', used: 8,   limit: isPro ? 100 : 20,   unit: '' },
    { label: 'Storage',           used: 234, limit: isPro ? 5000 : 500,  unit: ' MB' },
    { label: 'AI queries',        used: 142, limit: isPro ? 2000 : 500,  unit: '' },
  ];
  return (
    <div>
      <div className="sw-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
            <span className={`sw-badge ${isPro ? 'warn' : 'accent'}`}>{isPro ? <><Zap size={9} /> Pro</> : 'Free'}</span>
            <span className="sw-badge success">Active</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {isPro ? '$19 / month · renews April 18, 2025' : 'Limited to 20 datasets · 500 MB storage'}
          </p>
        </div>
        {isPro
          ? <div style={{ display: 'flex', gap: 8 }}><button className="sw-btn">Manage billing</button><button className="sw-btn danger">Cancel plan</button></div>
          : <button className="sw-btn primary"><Zap size={13} /> Upgrade to Pro</button>
        }
      </div>

      <div className="sw-card">
        <p className="sw-sec-title">Usage this month</p>
        {usage.map(item => {
          const pct = Math.min(100, (item.used / item.limit) * 100);
          return (
            <div key={item.label} style={{ marginBottom: 15 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{item.label}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)' }}>
                  {item.used}{item.unit}<span style={{ color: 'var(--text-3)', fontWeight: 400 }}> / {item.limit}{item.unit}</span>
                </span>
              </div>
              <div className="sw-prog-track">
                <div className="sw-prog-fill" style={{ width: `${pct}%`, background: pct > 80 ? '#d97706' : 'var(--accent)' }} />
              </div>
            </div>
          );
        })}
      </div>

      {isPro && (
        <div className="sw-card">
          <p className="sw-sec-title">Payment method</p>
          <div className="sw-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 27, borderRadius: 5, background: 'var(--field)', border: '1px solid var(--border-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={14} color="var(--text-2)" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>Visa ending in 4242</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Expires 09 / 2027</p>
              </div>
            </div>
            <button className="sw-btn" style={{ fontSize: 12, padding: '6px 12px' }}>Update</button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   DANGER ZONE
───────────────────────────────────────────── */
const DangerSection = () => {
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const { setToken, setUser, token } = useStore();

  const handleDeleteAccount = async () => {
    if (confirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/auth/delete-account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.clear();
      setToken(null);
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Account deletion failed.');
      setDeleting(false);
    }
  };

  const handleSignOutEverywhere = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const isReady = confirm === 'DELETE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Sign out */}
      <div className="sw-card">
        <p className="sw-sec-title">Session management</p>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)', marginBottom: 3 }}>
              Sign out everywhere
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Immediately invalidates all active sessions across every device. You'll be redirected to the login page.
            </p>
          </div>
          <button
            className="sw-btn"
            onClick={handleSignOutEverywhere}
            style={{ flexShrink: 0, marginTop: 2 }}
          >
            <LogOut size={13} />
            Sign out everywhere
          </button>
        </div>
      </div>

      {/* Delete account */}
      <div
        className="sw-card"
        style={{ borderColor: 'var(--danger-bdr)' }}
      >
        {/* Section label */}
        <p className="sw-sec-title" style={{ color: 'var(--danger)', opacity: 0.75 }}>
          Danger zone
        </p>

        {/* Warning block */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '13px 15px', borderRadius: 'var(--r-md)',
          background: 'var(--danger-dim)', border: '1px solid var(--danger-bdr)',
          marginBottom: 18,
        }}>
          <AlertCircle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--danger)', marginBottom: 3 }}>
              Permanently delete this account
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--danger)', opacity: 0.75, lineHeight: 1.55 }}>
              All SQL tables, saved queries, charts, and account history will be permanently erased.
              This action cannot be undone and cannot be recovered.
            </p>
          </div>
        </div>

        {/* Confirm input */}
        <div style={{ marginBottom: 14 }}>
          <label className="sw-lbl">
            Type <span style={{
              fontFamily: "'DM Mono', monospace",
              fontWeight: 500, color: 'var(--text-1)',
              background: 'var(--field)', padding: '0px 6px',
              borderRadius: 4, border: '1px solid var(--border-md)',
              fontSize: 11,
            }}>DELETE</span> to confirm
          </label>
          <input
            className="sw-field"
            value={confirm}
            onChange={e => setConfirm(e.target.value.toUpperCase())}
            placeholder="Type here…"
            style={{
              borderColor: isReady ? 'var(--danger-bdr)' : undefined,
              boxShadow: isReady ? '0 0 0 3px var(--danger-dim)' : undefined,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: confirm ? '.06em' : 0,
              transition: 'border-color .15s, box-shadow .15s',
            }}
          />
          {confirm && !isReady && (
            <p style={{ marginTop: 5, fontSize: 11.5, color: 'var(--text-3)' }}>
              Keep typing — type the full word DELETE
            </p>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={handleDeleteAccount}
          disabled={!isReady || deleting}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '9px 16px', borderRadius: 'var(--r-md)',
            border: `1px solid ${isReady ? 'var(--danger)' : 'var(--danger-bdr)'}`,
            background: isReady ? 'var(--danger)' : 'var(--danger-dim)',
            color: isReady ? '#fff' : 'var(--danger)',
            fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            cursor: isReady && !deleting ? 'pointer' : 'not-allowed',
            opacity: !isReady || deleting ? 0.55 : 1,
            transition: 'all .15s',
          }}
        >
          {deleting ? (
            <>
              <span style={{
                width: 13, height: 13, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
                border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff',
                animation: 'sw-spin .6s linear infinite',
              }} />
              Wiping data…
            </>
          ) : (
            <>
              <Trash2 size={13} />
              Permanently delete my account
            </>
          )}
        </button>

        {/* Fine print */}
        {isReady && !deleting && (
          <p style={{
            marginTop: 10, fontSize: 11.5, color: 'var(--danger)', opacity: 0.6,
            textAlign: 'center', lineHeight: 1.5,
          }}>
            Clicking the button above will immediately begin deletion. There is no confirmation step.
          </p>
        )}
      </div>

    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN SETTINGS
───────────────────────────────────────────── */
const Settings = ({ isDark, toggleTheme, onLogout }) => {
  const [active, setActive]     = useState('profile');
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [fetchErr, setFetchErr] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true); setFetchErr(false);
    try {
      const token = localStorage.getItem('token');
      const stored = localStorage.getItem('user');
      if (stored) { try { setUser(JSON.parse(stored)); setLoading(false); } catch {} }
      const res = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.user) { setUser(res.data.user); localStorage.setItem('user', JSON.stringify(res.data.user)); }
    } catch { setFetchErr(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const sections = {
    profile:       <ProfileSection user={user} loading={loading} onSave={u => setUser(p => ({ ...p, ...u }))} />,
    security:      <SecuritySection />,
    appearance:    <AppearanceSection isDark={isDark} toggleTheme={toggleTheme} />,
    notifications: <NotificationsSection />,
    ai:            <AiSection user={user} onSave={u => setUser(p => ({ ...p, ...u }))} />,
    billing:       <BillingSection user={user} />,
    danger:        <DangerSection onLogout={onLogout} />,
  };

  const nav = NAV.find(n => n.id === active);

  return (
    <div className="sw">
      <style>{STYLES}</style>
      <div className="sw-wrapper">
        <div style={{ maxWidth: 880, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-.4px' }}>Settings</h1>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 3 }}>
                {loading ? 'Loading…' : user ? `Signed in as ${user.email}` : 'Manage your account and preferences.'}
              </p>
            </div>
            {fetchErr && (
              <button className="sw-btn" onClick={fetchUser} style={{ fontSize: 12 }}>
                <RefreshCw size={12} /> Retry
              </button>
            )}
          </div>

          <div className="sw-layout">

            {/* Sidebar nav */}
            <nav className="sw-sidebar-nav no-scrollbar">
              {NAV.map(({ id, label, Icon }) => (
                <button key={id} type="button" className={`sw-nav-btn${active === id ? ' active' : ''}`} onClick={() => setActive(id)}>
                  <Icon size={14} style={{ flexShrink: 0 }} />{label}
                </button>
              ))}
              <hr className="sw-hr" style={{ margin: '6px 0' }} />
              <button type="button" className="sw-nav-btn dnav" onClick={onLogout}>
                <LogOut size={14} />Sign out
              </button>
            </nav>

            {/* Main content */}
            <div>
              <h2 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16, letterSpacing: '-.2px' }}>
                {nav?.label}
              </h2>
              <div key={active} className="sw-fadein">
                {sections[active]}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;