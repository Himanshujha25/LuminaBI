import React, { useState, useRef, useEffect } from 'react';
import {
  LifeBuoy, Send, UploadCloud, X, AlertCircle, CheckCircle,
  HelpCircle, ChevronDown, MessageSquare, Zap, CreditCard, Check
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

/* ─── Issue types ─────────────────────────────────────────────────────────── */
const ISSUE_TYPES = [
  { value: 'bug',      label: 'Bug / error',      Icon: AlertCircle,   color: 'danger'   },
  { value: 'feature',  label: 'Feature request',  Icon: Zap,           color: 'warning'  },
  { value: 'billing',  label: 'Billing inquiry',  Icon: CreditCard,    color: 'success'  },
  { value: 'question', label: 'General question', Icon: HelpCircle,    color: 'info'     },
  { value: 'other',    label: 'Other',            Icon: MessageSquare, color: 'neutral'  },
];

/* All colors use CSS vars — both themes defined in the <style> block below */
const COLOR = {
  danger:  { bg: 'var(--sp-danger-bg)',  border: 'var(--sp-danger-border)',  text: 'var(--sp-danger-text)'  },
  warning: { bg: 'var(--sp-warning-bg)', border: 'var(--sp-warning-border)', text: 'var(--sp-warning-text)' },
  success: { bg: 'var(--sp-success-bg)', border: 'var(--sp-success-border)', text: 'var(--sp-success-text)' },
  info:    { bg: 'var(--sp-info-bg)',    border: 'var(--sp-info-border)',    text: 'var(--sp-info-text)'    },
  neutral: { bg: 'var(--sp-neutral-bg)', border: 'var(--sp-neutral-border)', text: 'var(--sp-neutral-text)' },
};

/* ─── CSS token block (injected once) ────────────────────────────────────── */
const THEME_CSS = `
  /* ── Dark (default) ── */
  :root, [data-theme="dark"] {
    --sp-page-bg:     #09090b;
    --sp-card-bg:     #111113;
    --sp-card-border: rgba(255,255,255,.08);
    --sp-top-border:  rgba(255,255,255,.06);

    --sp-text-primary:   #f1f5f9;
    --sp-text-secondary: rgba(255,255,255,.45);
    --sp-text-tertiary:  rgba(255,255,255,.28);

    --sp-field-bg:     rgba(255,255,255,.04);
    --sp-field-border: rgba(255,255,255,.1);
    --sp-field-text:   #f1f5f9;

    --sp-menu-bg:      #111113;
    --sp-menu-hover:   rgba(255,255,255,.05);
    --sp-menu-divider: rgba(255,255,255,.06);
    --sp-menu-text:    #f1f5f9;

    --sp-drop-bg:      rgba(255,255,255,.02);
    --sp-drop-icon-bg: rgba(255,255,255,.04);
    --sp-drop-icon-border: rgba(255,255,255,.08);
    --sp-drop-icon-color: rgba(255,255,255,.35);

    --sp-count-bg:     rgba(255,255,255,.04);
    --sp-count-border: rgba(255,255,255,.08);
    --sp-count-text:   rgba(255,255,255,.28);

    --sp-footer-border: rgba(255,255,255,.06);
    --sp-footer-hint:   rgba(255,255,255,.18);

    --sp-btn-bg:    rgba(255,255,255,.9);
    --sp-btn-text:  #09090b;
    --sp-btn-busy-bg:   rgba(255,255,255,.07);
    --sp-btn-busy-text: rgba(255,255,255,.3);

    --sp-icon-bg:     rgba(99,102,241,.1);
    --sp-icon-border: rgba(99,102,241,.2);

    --sp-preview-bg:     #1a1a1f;
    --sp-preview-border: rgba(255,255,255,.1);

    --sp-crumb-text:   rgba(255,255,255,.3);

    --sp-danger-bg:      rgba(239,68,68,.08);  --sp-danger-border:  rgba(239,68,68,.22);  --sp-danger-text:  #f87171;
    --sp-warning-bg:     rgba(245,158,11,.08); --sp-warning-border: rgba(245,158,11,.22); --sp-warning-text: #fbbf24;
    --sp-success-bg:     rgba(16,185,129,.08); --sp-success-border: rgba(16,185,129,.22); --sp-success-text: #34d399;
    --sp-info-bg:        rgba(99,102,241,.08); --sp-info-border:    rgba(99,102,241,.22); --sp-info-text:    #818cf8;
    --sp-neutral-bg:     rgba(255,255,255,.05);--sp-neutral-border: rgba(255,255,255,.12);--sp-neutral-text: rgba(255,255,255,.45);

    --sp-err-banner-bg:  rgba(239,68,68,.07);  --sp-err-banner-bdr: rgba(239,68,68,.2);  --sp-err-banner-text: #f87171;
    --sp-ok-banner-bg:   rgba(16,185,129,.07); --sp-ok-banner-bdr:  rgba(16,185,129,.2); --sp-ok-banner-text:  #34d399;
  }

  /* ── Light ── */
  [data-theme="light"] {
    --sp-page-bg:     #f4f4f6;
    --sp-card-bg:     #ffffff;
    --sp-card-border: rgba(0,0,0,.08);
    --sp-top-border:  rgba(0,0,0,.06);

    --sp-text-primary:   #0f0f12;
    --sp-text-secondary: rgba(0,0,0,.52);
    --sp-text-tertiary:  rgba(0,0,0,.35);

    --sp-field-bg:     rgba(0,0,0,.03);
    --sp-field-border: rgba(0,0,0,.1);
    --sp-field-text:   #0f0f12;

    --sp-menu-bg:      #ffffff;
    --sp-menu-hover:   rgba(0,0,0,.04);
    --sp-menu-divider: rgba(0,0,0,.06);
    --sp-menu-text:    #0f0f12;

    --sp-drop-bg:          rgba(0,0,0,.02);
    --sp-drop-icon-bg:     rgba(0,0,0,.04);
    --sp-drop-icon-border: rgba(0,0,0,.08);
    --sp-drop-icon-color:  rgba(0,0,0,.3);

    --sp-count-bg:     rgba(0,0,0,.04);
    --sp-count-border: rgba(0,0,0,.08);
    --sp-count-text:   rgba(0,0,0,.35);

    --sp-footer-border: rgba(0,0,0,.07);
    --sp-footer-hint:   rgba(0,0,0,.28);

    --sp-btn-bg:    #0f0f12;
    --sp-btn-text:  #ffffff;
    --sp-btn-busy-bg:   rgba(0,0,0,.06);
    --sp-btn-busy-text: rgba(0,0,0,.3);

    --sp-icon-bg:     rgba(99,102,241,.07);
    --sp-icon-border: rgba(99,102,241,.18);

    --sp-preview-bg:     #f0f0f2;
    --sp-preview-border: rgba(0,0,0,.1);

    --sp-crumb-text:   rgba(0,0,0,.32);

    --sp-danger-bg:      rgba(239,68,68,.07);  --sp-danger-border:  rgba(239,68,68,.22);  --sp-danger-text:  #dc2626;
    --sp-warning-bg:     rgba(245,158,11,.07); --sp-warning-border: rgba(245,158,11,.22); --sp-warning-text: #b45309;
    --sp-success-bg:     rgba(16,185,129,.07); --sp-success-border: rgba(16,185,129,.22); --sp-success-text: #059669;
    --sp-info-bg:        rgba(99,102,241,.07); --sp-info-border:    rgba(99,102,241,.22); --sp-info-text:    #4338ca;
    --sp-neutral-bg:     rgba(0,0,0,.04);      --sp-neutral-border: rgba(0,0,0,.1);       --sp-neutral-text: rgba(0,0,0,.45);

    --sp-err-banner-bg:  rgba(239,68,68,.06);  --sp-err-banner-bdr: rgba(239,68,68,.2);  --sp-err-banner-text: #b91c1c;
    --sp-ok-banner-bg:   rgba(16,185,129,.06); --sp-ok-banner-bdr:  rgba(16,185,129,.2); --sp-ok-banner-text:  #047857;
  }

  @keyframes sp-spin { to { transform: rotate(360deg); } }

  .sp-drop-zone { transition: border-color .12s, background .12s; }
  .sp-drop-zone:hover {
    border-color: rgba(99,102,241,.45) !important;
    background: rgba(99,102,241,.03) !important;
  }
  .sp-field:focus {
    border-color: rgba(99,102,241,.55) !important;
    outline: none;
  }
  .sp-menu-item { transition: background .1s; }
  .sp-menu-item:hover { background: var(--sp-menu-hover) !important; }
  .sp-submit:hover:not(:disabled) { opacity: .88; }
`;

/* ─── Shared style objects ────────────────────────────────────────────────── */
const labelStyle = {
  display: 'block',
  fontSize: 11, fontWeight: 600,
  letterSpacing: '.05em', textTransform: 'uppercase',
  color: 'var(--sp-text-secondary)',
  marginBottom: 5,
};

const fieldStyle = {
  width: '100%', padding: '9px 12px',
  fontSize: 13, fontFamily: 'inherit',
  borderRadius: 8,
  background: 'var(--sp-field-bg)',
  border: '.5px solid var(--sp-field-border)',
  color: 'var(--sp-field-text)',
  outline: 'none',
  transition: 'border-color .12s',
  boxSizing: 'border-box',
};

/* ─── CustomSelect ────────────────────────────────────────────────────────── */
const CustomSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = ISSUE_TYPES.find(t => t.value === value);
  const { Icon } = selected;
  const clr = COLOR[selected.color];

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          ...fieldStyle,
          display: 'flex', alignItems: 'center', gap: 8,
          paddingRight: 32, cursor: 'pointer',
          borderColor: open ? 'rgba(99,102,241,.55)' : 'var(--sp-field-border)',
          borderRadius: open ? '8px 8px 0 0' : 8,
        }}
      >
        <Icon size={14} color={clr.text} strokeWidth={2} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, color: clr.text, fontWeight: 500 }}>
          {selected.label}
        </span>
        <ChevronDown
          size={13} strokeWidth={2}
          style={{
            position: 'absolute', right: 10, top: '50%',
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: 'transform .15s',
            color: 'var(--sp-text-tertiary)',
          }}
        />
      </div>

      {/* Dropdown menu */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--sp-menu-bg)',
          border: '.5px solid rgba(99,102,241,.45)',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,.12)',
        }}>
          {ISSUE_TYPES.map((t, i) => {
            const { Icon: OIcon } = t;
            const oclr = COLOR[t.color];
            const isActive = t.value === value;
            return (
              <div
                key={t.value}
                className="sp-menu-item"
                onClick={() => { onChange(t.value); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', cursor: 'pointer', fontSize: 13,
                  background: isActive ? 'var(--sp-menu-hover)' : 'transparent',
                  borderTop: i > 0 ? '.5px solid var(--sp-menu-divider)' : 'none',
                }}
              >
                <OIcon size={14} color={oclr.text} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--sp-menu-text)', fontWeight: isActive ? 500 : 400 }}>
                  {t.label}
                </span>
                {isActive && (
                  <Check size={13} strokeWidth={2.5} color={oclr.text} style={{ flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Support page ────────────────────────────────────────────────────────── */
const Support = () => {
  const [email, setEmail]               = useState('');
  const [issueType, setIssueType]       = useState('bug');
  const [description, setDescription]   = useState('');
  const [files, setFiles]               = useState([]);
  const [previewUrls, setPreviewUrls]   = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus]             = useState({ type: '', message: '' });
  const [isDragging, setIsDragging]     = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => () => previewUrls.forEach(URL.revokeObjectURL), []);

  const addFiles = incoming => {
    const valid = incoming.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    const remaining = 3 - files.length;
    if (remaining <= 0) return setStatus({ type: 'error', message: 'Maximum of 3 screenshots reached.' });
    const batch = valid.slice(0, remaining);
    if (batch.length < incoming.length)
      setStatus({ type: 'error', message: 'Some files skipped — images only, max 5 MB each.' });
    else setStatus({ type: '', message: '' });
    setFiles(p => [...p, ...batch]);
    setPreviewUrls(p => [...p, ...batch.map(f => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = i => {
    URL.revokeObjectURL(previewUrls[i]);
    setFiles(p => p.filter((_, idx) => idx !== i));
    setPreviewUrls(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!email || !description)
      return setStatus({ type: 'error', message: 'Please fill in all required fields.' });
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });
    const formData = new FormData();
    formData.append('email', email);
    formData.append('issueType', issueType);
    formData.append('description', description);
    files.forEach((file, i) => formData.append(`screenshot_${i}`, file));
    try {
      await axios.post(`${API_URL}/support`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setStatus({ type: 'success', message: "Report sent! We'll get back to you within 24 hours." });
      previewUrls.forEach(URL.revokeObjectURL);
      setEmail(''); setDescription(''); setIssueType('bug'); setFiles([]); setPreviewUrls([]);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to send. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selected = ISSUE_TYPES.find(t => t.value === issueType);
  const { Icon: TypeIcon } = selected;
  const clr = COLOR[selected.color];

  const isErr = status.type === 'error';

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--sp-page-bg)', padding: '8px 24px 48px' }}>
      <style>{THEME_CSS}</style>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: 28, paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
  
  <div style={{
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'var(--sp-icon-bg)',
    border: '.5px solid var(--sp-icon-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <LifeBuoy size={18} color="var(--sp-info-text)" />
  </div>

  <h1 style={{
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '-.3px',
    color: 'var(--sp-text-primary)',
    margin: 0
  }}>
    Support & feedback
  </h1>

</div>
          
          <p style={{ fontSize: 13, color: 'var(--sp-text-secondary)', lineHeight: 1.6 }}>
            Having an issue or a feature idea? Fill in the form and we'll respond promptly.
          </p>
        </div>

        {/* ── Card ── */}
        <div style={{
          background: 'var(--sp-card-bg)',
          border: '.5px solid var(--sp-card-border)',
          borderRadius: 18, overflow: 'visible',
          boxShadow: '0 10px 30px rgba(0,0,0,.08)',
        }}>
          {/* Top bar */}
          <div style={{
            padding: '11px 20px',
            borderBottom: '.5px solid var(--sp-top-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, color: 'var(--sp-crumb-text)' }}>New report</span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 999,
              background: clr.bg, border: `.5px solid ${clr.border}`,
            }}>
              <TypeIcon size={11} color={clr.text} strokeWidth={2} />
              <span style={{ fontSize: 11, fontWeight: 500, color: clr.text }}>{selected.label}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ padding: '20px 20px 0' }}>

              {/* Status banner */}
              {status.message && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '11px 14px', borderRadius: 8, marginBottom: 18,
                  fontSize: 13, lineHeight: 1.5,
                  background: isErr ? 'var(--sp-err-banner-bg)' : 'var(--sp-ok-banner-bg)',
                  border: `.5px solid ${isErr ? 'var(--sp-err-banner-bdr)' : 'var(--sp-ok-banner-bdr)'}`,
                  color: isErr ? 'var(--sp-err-banner-text)' : 'var(--sp-ok-banner-text)',
                }}>
                  {isErr
                    ? <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                    : <CheckCircle  size={14} style={{ marginTop: 1, flexShrink: 0 }} />}
                  {status.message}
                </div>
              )}

              {/* Email + type */}
              <div className="sp-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Email <span style={{ color: 'var(--sp-danger-text)' }}>*</span></label>
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="sp-field"
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Issue type</label>
                  <CustomSelect value={issueType} onChange={setIssueType} />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Description <span style={{ color: 'var(--sp-danger-text)' }}>*</span></label>
                <textarea
                  required rows={4} value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail. Steps to reproduce are very helpful."
                  className="sp-field"
                  style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6, minHeight: 110 }}
                />
              </div>

              {/* Screenshots */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    Screenshots{' '}
                    <span style={{ textTransform: 'none', fontWeight: 400, fontSize: 11, color: 'var(--sp-text-tertiary)', letterSpacing: 0 }}>
                      (optional)
                    </span>
                  </label>
                  <span style={{
                    fontSize: 11, color: 'var(--sp-count-text)',
                    background: 'var(--sp-count-bg)', padding: '2px 8px',
                    borderRadius: 999, border: '.5px solid var(--sp-count-border)',
                  }}>
                    {files.length} / 3
                  </span>
                </div>

                {/* Drop zone */}
                {files.length < 3 && (
                  <div
                    className="sp-drop-zone"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
                    style={{
                      border: `.5px dashed ${isDragging ? 'rgba(99,102,241,.55)' : 'var(--sp-field-border)'}`,
                      borderRadius: 8, padding: '20px 16px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      cursor: 'pointer',
                      background: isDragging ? 'rgba(99,102,241,.04)' : 'var(--sp-drop-bg)',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'var(--sp-drop-icon-bg)',
                      border: '.5px solid var(--sp-drop-icon-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <UploadCloud size={15} color="var(--sp-drop-icon-color)" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--sp-text-secondary)' }}>
                      Drop files or click to browse
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--sp-text-tertiary)' }}>
                      PNG, JPG, WEBP — max 5 MB each
                    </span>
                    <input
                      type="file" ref={fileInputRef}
                      onChange={e => addFiles(Array.from(e.target.files))}
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      multiple style={{ display: 'none' }}
                    />
                  </div>
                )}

                {/* Previews */}
                {previewUrls.length > 0 && (
                  <div className="sp-preview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 10 }}>
                    {previewUrls.map((url, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'relative', borderRadius: 8, overflow: 'hidden',
                          border: '.5px solid var(--sp-preview-border)',
                          aspectRatio: '16/9', background: 'var(--sp-preview-bg)',
                        }}
                        onMouseEnter={e => e.currentTarget.querySelector('.sp-ov').style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.querySelector('.sp-ov').style.opacity = '0'}
                      >
                        <img src={url} alt={`Screenshot ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div className="sp-ov" style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(0,0,0,.5)', opacity: 0, transition: 'opacity .12s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <button
                            type="button" onClick={() => removeFile(i)}
                            style={{
                              width: 26, height: 26, borderRadius: '50%',
                              background: 'rgba(239,68,68,.15)',
                              border: '.5px solid rgba(239,68,68,.3)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: '#f87171',
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          padding: '3px 7px',
                          background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent)',
                        }}>
                          <p style={{ fontSize: 10, color: 'rgba(255,255,255,.8)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {files[i]?.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer / submit */}
            <div className="sp-footer-row" style={{
              padding: '13px 20px',
              borderTop: '.5px solid var(--sp-footer-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 11, color: 'var(--sp-footer-hint)' }}>support@lumina.bi</span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="sp-submit"
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 18px', borderRadius: 8, border: 'none',
                  background: isSubmitting ? 'var(--sp-btn-busy-bg)' : 'var(--sp-btn-bg)',
                  color: isSubmitting ? 'var(--sp-btn-busy-text)' : 'var(--sp-btn-text)',
                  fontSize: 13, fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'opacity .12s', fontFamily: 'inherit',
                }}
              >
                {isSubmitting ? (
                  <>
                    <span style={{
                      width: 13, height: 13, borderRadius: '50%',
                      border: '1.5px solid rgba(128,128,128,.25)',
                      borderTopColor: 'rgba(128,128,128,.7)',
                      animation: 'sp-spin .65s linear infinite',
                      display: 'inline-block', flexShrink: 0,
                    }} />
                    Sending…
                  </>
                ) : (
                  <><Send size={13} /> Send report</>
                )}
              </button>
            </div>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--sp-text-tertiary)' }}>
          Typical response time: &lt; 24 hours
        </p>
      </div>
      <style>{`
        @media (max-width: 720px) {
          .sp-fields-grid {
            grid-template-columns: 1fr !important;
          }
          .sp-preview-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .sp-footer-row {
            flex-direction: column;
            align-items: stretch !important;
            gap: 12px;
          }
          .sp-footer-row button {
            width: 100%;
            min-height: 44px;
            justify-content: center;
          }
        }
        @media (max-width: 560px) {
          .sp-preview-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Support;
