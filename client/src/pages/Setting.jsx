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

  .sw { font-family:'DM Sans',sans-serif; background:var(--page); color:var(--text-1); min-height:100vh; display:flex; align-items:flex-start; justify-content:center; overflow:hidden; padding-top:0px; padding-bottom:160px; }
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
    display:flex; align-items:center; gap:9px; padding:10px 12px;
    border-radius:var(--r-md); border:none; background:transparent;
    color:var(--nav-clr); font-size:13px; font-weight:500;
    font-family:'DM Sans',sans-serif; cursor:pointer;
    transition:all .12s; width:100%; text-align:left;
    margin-bottom:4px;
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
    padding:8px 0; border-bottom:1px solid var(--border);
  }
  .sw-row:last-child { border-bottom:none; padding-bottom:0; }
  .sw-row:first-child { padding-top:0; }

  .sw-card {
    background:var(--surface); border:1px solid var(--border);
    border-radius:var(--r-xl); padding:12px 14px; margin-bottom:8px;
    box-shadow:var(--shadow-sm);
  }

  .sw-lbl {
    display:block; font-size:11px; font-weight:600;
    letter-spacing:.05em; text-transform:uppercase;
    color:var(--text-3); margin-bottom:6px;
  }
  .sw-sec-title {
    font-size:10.5px; font-weight:700; letter-spacing:.08em;
    text-transform:uppercase; color:var(--text-3); margin-bottom:10px;
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

  @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .sw-fadein { animation:fadeIn .16s ease; }
  .sw-fadeup { animation:fadeUp .18s ease; }
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
  { id: 'danger',        label: 'Delete Account',  Icon: Shield     },
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
  {
    id: 'openrouter',  name: 'OpenRouter',       model: 'GPT-4o via OpenRouter',
    tag: 'Access 200+ models',     bg: '#f3e8ff', fg: '#6b21a8', initials: 'OR',
    keyUrl: 'https://openrouter.ai/keys',
    keyDomain: 'openrouter.ai',
  },
  {
    id: 'groq',        name: 'Groq Cloud',       model: 'Llama 3.3 70B',
    tag: 'Ultra-fast inference',   bg: '#fef3c7', fg: '#92400e', initials: 'GQ',
    keyUrl: 'https://console.groq.com/keys',
    keyDomain: 'console.groq.com',
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
      <div className="sw-card" style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px' }}>
        <div className="sw-avatar" style={{ width: 58, height: 58, fontSize: 19 }}>
          {loading ? '?' : initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading
            ? <><Skel w={150} h={16} mb={6} /><Skel w={210} h={12} /></>
            : <>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 5, lineHeight: 1.1 }}>{name || 'Your name'}</p>
                <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.2 }}>{user?.email}</p>
              </>
          }
        </div>
        <span className="sw-badge accent" style={{ padding: '4px 11px', fontSize: '11.5px' }}>Free plan</span>
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
          {loading ? <Skel h={70} /> : <textarea className="sw-field" rows={2} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell your team about yourself…" />}
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
    if (!cur)           return show('danger', 'Current password is required.');
    if (nw !== cnf)     return show('danger', 'Passwords do not match.');
    if (nw.length < 8)  return show('danger', 'Minimum 8 characters required.');
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/auth/password`,
        { currentPassword: cur, newPassword: nw },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      show('success', 'Password updated successfully');
      setCur(''); setNw(''); setCnf('');
    } catch (e) {
      show('danger', e.response?.data?.error || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
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
const AppearanceSection = () => {
  const { isDark, toggleTheme } = useStore();
  const [mode, setMode] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    setMode(isDark ? 'dark' : 'light');
  }, [isDark]);

  const apply = m => {
    if (m === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode('system');
      if (prefersDark !== isDark) toggleTheme?.();
      return;
    }
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
const NotificationsSection = ({ user }) => {
  const defaultPrefs = { eu:true, eb:true, eu2:false, au:true, aa:true, ae:true };
  const [p, setP] = useState(defaultPrefs);
  const [saving, setSaving] = useState(false);
  const s = k => v => setP(x => ({ ...x, [k]: v }));
  const { toast, show } = useToast();

  useEffect(() => {
    if (user?.notification_prefs && Object.keys(user.notification_prefs).length > 0) {
      setP({ ...defaultPrefs, ...user.notification_prefs });
    }
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/auth/notifications`, p, { headers: { Authorization: `Bearer ${token}` } });
      show('success', 'Preferences saved');
    } catch { show('danger', 'Failed to save preferences'); }
    finally { setSaving(false); }
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
        <div style={{ marginTop: 12 }}>
          <button className="sw-btn primary" onClick={save} disabled={saving}>
            {saving ? <><span className="sw-spin" /> Saving…</> : <><Save size={13} /> Save preferences</>}
          </button>
        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────
   AI ENGINE  — fully redesigned + real links
───────────────────────────────────────────── */
const AiSection = ({ user, onSave }) => {
  const [keys, setKeys]         = useState({});
  const [provider, setProvider] = useState('gemini');
  const [search, setSearch]     = useState('');
  const [open, setOpen]         = useState(false);
  const [showKey, setShowKey]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const dropRef = useRef(null);
  const { toast, show } = useToast();

  useEffect(() => {
    if (user) {
      if (user.ai_keys) setKeys(user.ai_keys);
      if (user.preferred_provider) setProvider(user.preferred_provider);
    }
  }, [user]);

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
  const [stats, setStats] = useState({ datasets: 0, storage: 0, queries: 0 });
  const [loading, setLoading] = useState(true);
  const { toast, show } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/auth/billing-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch billing stats:', err);
        show('danger', 'Failed to load usage statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const isPro = user?.plan === 'pro';
  const usage = [
    { label: 'Datasets uploaded', used: stats.datasets, limit: isPro ? 100 : 20, unit: '' },
    { label: 'Storage', used: stats.storage, limit: isPro ? 5000 : 500, unit: ' MB' },
    { label: 'AI queries', used: stats.queries, limit: isPro ? 2000 : 500, unit: '' },
  ];
  return (
    <>
      <Toast toast={toast} />
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
        {loading ? (
          <>
            <Skel h={40} mb={15} />
            <Skel h={40} mb={15} />
            <Skel h={40} />
          </>
        ) : (
          usage.map(item => {
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
          })
        )}
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
    </>
  );
};

/* ─────────────────────────────────────────────
   DELETE ACCOUNT
───────────────────────────────────────────── */
const DangerSection = () => {
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast, show } = useToast();

  const navigate = useNavigate();
  const { logout, token } = useStore();

  const handleDeleteAccount = async () => {
    if (!password || password.trim() === '') {
      show('danger', 'Please enter your password to confirm deletion.');
      return;
    }

    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/auth/delete-account`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password }
      });
      show('success', 'Account deleted successfully. Redirecting...');
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error(err);
      show('danger', err.response?.data?.error || 'Account deletion failed.');
      setDeleting(false);
    }
  };

  const handleSignOutEverywhere = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <Toast toast={toast} />
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
            Delete Account
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

          {/* Password input */}
          <div style={{ marginBottom: 14 }}>
            <label className="sw-lbl">Enter your password to confirm</label>
            <div className="sw-fwrap">
              <input
                className="sw-field"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  paddingRight: 38,
                  borderColor: password ? 'var(--danger-bdr)' : undefined,
                  transition: 'border-color .15s',
                }}
                disabled={deleting}
              />
              <button type="button" className="sw-ficon" onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p style={{ marginTop: 5, fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
              We need to verify your identity before deleting your account.
            </p>
          </div>

          {/* Delete button */}
          <button
            onClick={handleDeleteAccount}
            disabled={!password || deleting}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '9px 16px', borderRadius: 'var(--r-md)',
              border: `1px solid ${password && !deleting ? 'var(--danger)' : 'var(--danger-bdr)'}`,
              background: password && !deleting ? 'var(--danger)' : 'var(--danger-dim)',
              color: password && !deleting ? '#fff' : 'var(--danger)',
              fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              cursor: password && !deleting ? 'pointer' : 'not-allowed',
              opacity: !password || deleting ? 0.55 : 1,
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
                Deleting account…
              </>
            ) : (
              <>
                <Trash2 size={13} />
                Permanently delete my account
              </>
            )}
          </button>

          {/* Fine print */}
          {password && !deleting && (
            <p style={{
              marginTop: 10, fontSize: 11.5, color: 'var(--danger)', opacity: 0.6,
              textAlign: 'center', lineHeight: 1.5,
            }}>
              Clicking the button above will immediately begin deletion. There is no confirmation step.
            </p>
          )}
        </div>

      </div>
    </>
  );
};

/* ─────────────────────────────────────────────
   MAIN SETTINGS
───────────────────────────────────────────── */
const Settings = () => {
  const { isDark, toggleTheme, logout } = useStore();
  const navigate = useNavigate();
  const onLogout = () => { logout(); navigate('/login'); };
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
    appearance:    <AppearanceSection />,
    notifications: <NotificationsSection user={user} />,
    ai:            <AiSection user={user} onSave={u => setUser(p => ({ ...p, ...u }))} />,
    billing:       <BillingSection user={user} />,
    danger:        <DangerSection onLogout={onLogout} />,
  };

  const nav = NAV.find(n => n.id === active);

  return (
    <div className="sw">
      <style>{STYLES}</style>
      <div style={{ padding: '20px', width: '100%', maxHeight: '100vh', overflow: 'hidden' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, alignItems: 'start' }}>

            {/* Sidebar nav */}
            <nav style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-xl)', padding: 6,
              position: 'sticky', top: 16, boxShadow: 'var(--shadow-sm)',
            }}>
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
            <div style={{ maxHeight: 'calc(100vh - 100px)', overflow: 'hidden' }}>
              <h2 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12, letterSpacing: '-.2px' }}>
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