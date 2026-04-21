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
        <span style={S.logoText}>Dash<span style={S.logoBi}>Talk</span></span>
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
    background: '#030712',
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
      linear-gradient(rgba(34,211,238,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(34,211,238,.04) 1px, transparent 1px)
    `,
    backgroundSize: '52px 52px',
    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
  },
  logo: {
    position: 'relative', zIndex: 1,
    display: 'flex', alignItems: 'center', gap: 9,
    textDecoration: 'none', marginBottom: 36,
  },
  logoIcon: {
    width: 34, height: 34, borderRadius: 10,
    background: 'linear-gradient(135deg, #0891b2, #22d3ee)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 20px rgba(34,211,238,0.35)',
  },
  logoText: {
    fontSize: 17, fontWeight: 700, color: '#e8f4f8',
    letterSpacing: '-.3px',
  },
  logoBi: {
    background: 'linear-gradient(90deg, #22d3ee, #f472b6)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  card: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 400,
    background: 'rgba(7,13,26,0.92)',
    border: '1px solid rgba(34,211,238,0.12)',
    borderRadius: 20,
    padding: '36px 36px 32px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,211,238,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px)',
  },
  cardHead: { marginBottom: 24 },
  heading: {
    fontSize: 22, fontWeight: 800,
    color: '#e8f4f8', margin: 0, letterSpacing: '-.5px',
  },
  sub: {
    fontSize: 13.5, color: 'rgba(232,244,248,.42)',
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
    fontSize: 11.5, fontWeight: 700,
    letterSpacing: '.06em', textTransform: 'uppercase',
    color: 'rgba(232,244,248,.38)',
  },
  input: {
    width: '100%', padding: '10px 13px',
    borderRadius: 10, fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    background: 'rgba(34,211,238,0.04)',
    border: '1px solid rgba(34,211,238,0.12)',
    color: '#e8f4f8', outline: 'none',
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
    fontSize: 12, color: 'rgba(34,211,238,.75)',
    textDecoration: 'none', fontWeight: 600,
  },
  submitBtn: {
    marginTop: 6,
    width: '100%', padding: '12px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 10, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #0891b2, #22d3ee)',
    color: '#030712', fontSize: 14, fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 20px rgba(34,211,238,0.35)',
    transition: 'opacity .15s, transform .12s',
    letterSpacing: '-0.01em',
  },
  submitBtnDisabled: { opacity: 0.55, cursor: 'not-allowed' },
  footer: {
    marginTop: 22, textAlign: 'center',
    fontSize: 13, color: 'rgba(232,244,248,.36)',
  },
  footerLink: {
    color: 'rgba(34,211,238,.90)', fontWeight: 600,
    textDecoration: 'none',
  },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  @keyframes auth-card-in {
    from { opacity: 0; transform: translateY(18px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
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

  .auth-card-in { animation: auth-card-in .35s cubic-bezier(.22,1,.36,1) both; }
  .auth-shake   { animation: auth-shake .38s ease; }
  .auth-spin    { animation: auth-spin .65s linear infinite; }

  .auth-input:focus {
    border-color: rgba(34,211,238,.60) !important;
    box-shadow: 0 0 0 3px rgba(34,211,238,.14) !important;
  }
  .auth-input::placeholder { color: rgba(232,244,248,.20); }

  .auth-submit:hover:not(:disabled) {
    opacity: .90;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(34,211,238,0.45) !important;
  }
  .auth-submit:active:not(:disabled) {
    transform: translateY(0) scale(.98);
  }
`;

export default Login;
