import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AUTH_URL, HEALTH_URL } from '../config';
import { BarChart2, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import useStore from '../store/useStore';

const Login = () => {
  const { setToken, setCurrentView, setIsAiPanelOpen } = useStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    axios.get(HEALTH_URL).catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${AUTH_URL}/login`, { email, password });
      setToken(res.data.token);
      setCurrentView('overview');
      setIsAiPanelOpen(false);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* Subtle grid background */}
      <div style={S.gridBg} />

      {/* Logo */}
      <Link to="/" style={S.logo}>
        <div style={S.logoIcon}><BarChart2 size={18} color="#fff" /></div>
        <span style={S.logoText}>Lumina<span style={S.logoBi}>BI</span></span>
      </Link>

      {/* Card */}
      <div style={S.card} className="auth-card-in">

        <div style={S.cardHead}>
          <h1 style={S.heading}>Sign in</h1>
          <p style={S.sub}>Good to have you back.</p>
        </div>

        {error && (
          <div style={S.errorBox} className="auth-shake">
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={S.form} noValidate>

          {/* Email */}
          <div style={S.fieldWrap}>
            <label style={S.label}>Email</label>
            <input
              style={S.input}
              className="auth-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@gmail.com"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div style={S.fieldWrap}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label style={S.label}>Password</label>
              <Link to="/forgot-password" style={S.forgotLink}>Forgot password?</Link>
            </div>
            <div style={S.pwWrap}>
              <input
                style={{ ...S.input, paddingRight: 42 }}
                className="auth-input"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                style={S.eyeBtn}
                onClick={() => setShowPw(p => !p)}
                tabIndex={-1}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...S.submitBtn, ...(loading ? S.submitBtnDisabled : {}) }}
            className="auth-submit"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="auth-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight size={15} />
              </>
            )}
          </button>

        </form>

        <p style={S.footer}>
          Don't have an account?{' '}
          <Link to="/signup" style={S.footerLink}>Create one</Link>
        </p>

      </div>
    </div>
  );
};

/* ─── Styles ─── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#0d0f1a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    fontFamily: "'DM Sans', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  gridBg: {
    position: 'absolute', inset: 0, zIndex: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px',
    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
  },
  logo: {
    position: 'relative', zIndex: 1,
    display: 'flex', alignItems: 'center', gap: 9,
    textDecoration: 'none', marginBottom: 36,
  },
  logoIcon: {
    width: 34, height: 34, borderRadius: 9,
    background: 'linear-gradient(135deg, #4f52e8, #7c5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontSize: 17, fontWeight: 700, color: '#e8eaf5',
    letterSpacing: '-.3px',
  },
  logoBi: {
    background: 'linear-gradient(90deg, #818cf8, #a78bfa)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  card: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 400,
    background: '#13161f',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 18,
    padding: '36px 36px 32px',
    boxShadow: '0 24px 64px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04)',
  },
  cardHead: { marginBottom: 24 },
  heading: {
    fontSize: 22, fontWeight: 700,
    color: '#e8eaf5', margin: 0, letterSpacing: '-.4px',
  },
  sub: {
    fontSize: 13.5, color: 'rgba(232,234,245,.42)',
    marginTop: 5,
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 13px', borderRadius: 9,
    background: 'rgba(240,96,96,.10)',
    border: '1px solid rgba(240,96,96,.24)',
    color: '#f08080', fontSize: 13, marginBottom: 18,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 12, fontWeight: 600,
    letterSpacing: '.04em', textTransform: 'uppercase',
    color: 'rgba(232,234,245,.38)',
  },
  input: {
    width: '100%', padding: '10px 13px',
    borderRadius: 9, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.09)',
    color: '#e8eaf5', outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s, box-shadow .15s',
  },
  pwWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(232,234,245,.35)', display: 'flex', alignItems: 'center',
    padding: 2, borderRadius: 4, transition: 'color .12s',
  },
  forgotLink: {
    fontSize: 12, color: 'rgba(129,140,248,.75)',
    textDecoration: 'none', fontWeight: 500,
  },
  submitBtn: {
    marginTop: 6,
    width: '100%', padding: '11px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 9, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #4f52e8, #7c5cf6)',
    color: '#fff', fontSize: 14, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: '0 2px 12px rgba(79,82,232,.35)',
    transition: 'opacity .15s, transform .12s',
  },
  submitBtnDisabled: { opacity: 0.55, cursor: 'not-allowed' },
  footer: {
    marginTop: 22, textAlign: 'center',
    fontSize: 13, color: 'rgba(232,234,245,.36)',
  },
  footerLink: {
    color: 'rgba(129,140,248,.85)', fontWeight: 600,
    textDecoration: 'none',
  },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

  @keyframes auth-card-in {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes auth-shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-5px); }
    40%     { transform: translateX(5px); }
    60%     { transform: translateX(-3px); }
    80%     { transform: translateX(3px); }
  }
  @keyframes auth-spin {
    to { transform: rotate(360deg); }
  }

  .auth-card-in { animation: auth-card-in .3s ease both; }
  .auth-shake   { animation: auth-shake .38s ease; }
  .auth-spin    { animation: auth-spin .65s linear infinite; }

  .auth-input:focus {
    border-color: rgba(129,140,248,.55) !important;
    box-shadow: 0 0 0 3px rgba(79,82,232,.18) !important;
  }
  .auth-input::placeholder { color: rgba(232,234,245,.20); }

  .auth-submit:hover:not(:disabled) {
    opacity: .88;
    transform: translateY(-1px);
  }
  .auth-submit:active:not(:disabled) {
    transform: translateY(0) scale(.98);
  }
`;

export default Login;
