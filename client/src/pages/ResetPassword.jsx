import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AUTH_URL } from '../config';
import { BarChart2, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');
  const navigate = useNavigate();

  const [email, setEmail] = useState(emailParam || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const handleVerifyOtp = async () => {
    setError(null);

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setVerifyingOtp(true);

    try {
      await axios.post(`${AUTH_URL}/verify-otp`, { email, otp });
      setOtpVerified(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setResendingOtp(true);

    try {
      await axios.post(`${AUTH_URL}/forgot-password`, { email });
      setOtp('');
      setResendTimer(60);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setResendingOtp(false);
    }
  };

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!otpVerified) {
      setError('Please verify OTP first.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${AUTH_URL}/reset-password`, { email, otp, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. OTP may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <style>{CSS}</style>
      <div style={S.gridBg} />

      <Link to="/" style={S.logo}>
        <div style={S.logoIcon}><BarChart2 size={18} color="#fff" /></div>
        <span style={S.logoText}>Lumina<span style={S.logoBi}>BI</span></span>
      </Link>

      <div style={S.card} className="auth-card-in">
        {!success ? (
          <>
            <div style={S.cardHead}>
              <h1 style={S.heading}>Reset password</h1>
              <p style={S.sub}>Enter the OTP sent to your email and set a new password.</p>
            </div>

            {error && (
              <div style={S.errorBox} className="auth-shake">
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
                {error.includes('No account found') && (
                  <Link to="/register" style={S.errorLink}>Create account</Link>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} style={S.form} noValidate>
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
                  disabled={otpVerified}
                />
              </div>

              <div style={S.fieldWrap}>
                <label style={S.label}>OTP Code</label>
                <div style={S.otpWrap}>
                  <input
                    style={{ ...S.input, letterSpacing: '4px', fontSize: 16, textAlign: 'center' }}
                    className="auth-input"
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="000000"
                    maxLength={6}
                    autoComplete="off"
                    disabled={otpVerified}
                  />
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || !email || otp.length !== 6}
                      style={{ ...S.verifyBtn, ...(verifyingOtp || !email || otp.length !== 6 ? S.verifyBtnDisabled : {}) }}
                    >
                      {verifyingOtp ? (
                        <>
                          <Loader2 size={14} className="auth-spin" />
                          Verifying
                        </>
                      ) : (
                        'Verify'
                      )}
                    </button>
                  )}
                  {otpVerified && (
                    <div style={S.verifiedBadge}>
                      <CheckCircle size={14} />
                      Verified
                    </div>
                  )}
                </div>
                {!otpVerified && (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendingOtp || resendTimer > 0 || !email}
                    style={S.resendLink}
                  >
                    {resendingOtp ? (
                      <>
                        <Loader2 size={12} className="auth-spin" />
                        Resending...
                      </>
                    ) : resendTimer > 0 ? (
                      `Resend OTP in ${resendTimer}s`
                    ) : (
                      'Resend OTP'
                    )}
                  </button>
                )}
              </div>

              <div style={S.fieldWrap}>
                <label style={S.label}>New Password</label>
                <div style={S.pwWrap}>
                  <input
                    style={{ ...S.input, paddingRight: 42 }}
                    className="auth-input"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    style={S.eyeBtn}
                    onClick={() => setShowPw(p => !p)}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={S.fieldWrap}>
                <label style={S.label}>Confirm Password</label>
                <input
                  style={S.input}
                  className="auth-input"
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !otpVerified || !password || !confirmPassword}
                style={{ ...S.submitBtn, ...(loading || !otpVerified || !password || !confirmPassword ? S.submitBtnDisabled : {}) }}
                className="auth-submit"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="auth-spin" />
                    Resetting…
                  </>
                ) : (
                  <>
                    Reset password
                  </>
                )}
              </button>
            </form>

            <Link to="/forgot-password" style={S.backLink}>
              <ArrowLeft size={14} />
              Back to forgot password
            </Link>
          </>
        ) : (
          <div style={S.successBox}>
            <div style={S.successIcon}>
              <CheckCircle size={32} color="#3dd68c" />
            </div>
            <h2 style={S.successHeading}>Password reset!</h2>
            <p style={S.successText}>
              Your password has been successfully reset.
            </p>
            <p style={S.successSub}>
              Redirecting to sign in...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

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
    flexWrap: 'wrap',
  },
  errorLink: {
    marginLeft: 'auto',
    padding: '4px 10px',
    borderRadius: 6,
    background: 'rgba(129,140,248,.15)',
    border: '1px solid rgba(129,140,248,.3)',
    color: '#818cf8',
    fontSize: 12,
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all .15s',
    whiteSpace: 'nowrap',
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
  otpWrap: { 
    position: 'relative',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  verifyBtn: {
    padding: '10px 18px',
    borderRadius: 9,
    border: 'none',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #4f52e8, #7c5cf6)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'opacity .15s',
    whiteSpace: 'nowrap',
  },
  verifyBtnDisabled: {
    opacity: 0.55,
    cursor: 'not-allowed',
  },
  verifiedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    borderRadius: 9,
    background: 'rgba(61,214,140,.15)',
    border: '1px solid rgba(61,214,140,.3)',
    color: '#3dd68c',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  pwWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(232,234,245,.35)', display: 'flex', alignItems: 'center',
    padding: 2, borderRadius: 4, transition: 'color .12s',
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
  backLink: {
    marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontSize: 13, color: 'rgba(129,140,248,.75)', textDecoration: 'none', fontWeight: 500,
  },
  resendLink: {
    marginTop: 8,
    background: 'none',
    border: 'none',
    color: 'rgba(129,140,248,.75)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: 0,
    fontFamily: "'DM Sans', sans-serif",
    transition: 'color .15s',
  },
  successBox: {
    textAlign: 'center', padding: '20px 0',
  },
  successIcon: {
    marginBottom: 20,
  },
  successHeading: {
    fontSize: 20, fontWeight: 700, color: '#e8eaf5', margin: '0 0 12px',
  },
  successText: {
    fontSize: 14, color: 'rgba(232,234,245,.65)', lineHeight: 1.6, marginBottom: 8,
  },
  successSub: {
    fontSize: 12.5, color: 'rgba(232,234,245,.38)', lineHeight: 1.5,
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

export default ResetPassword;