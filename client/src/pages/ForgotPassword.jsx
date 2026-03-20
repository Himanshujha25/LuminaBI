import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AUTH_URL } from '../config';
import { BarChart2, Mail, Lock, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${AUTH_URL}/forgot-password`, { email });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${AUTH_URL}/reset-password`, { email, otp, newPassword });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP or reset failed.');
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
        <div style={S.cardHead}>
          <h1 style={S.heading}>{step === 1 ? 'Forgot Password' : 'Reset Password'}</h1>
          <p style={S.sub}>
            {step === 1 ? 'Enter your email to receive a 6-digit OTP code.' : 'Please enter the code sent to your email and your new password.'}
          </p>
        </div>

        {error && (
          <div style={S.errorBox} className="auth-shake">
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {message && !error && (
          <div style={S.successBox}>
            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
            <span>{message}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} style={S.form}>
            <div style={S.fieldWrap}>
              <label style={S.label}>Email Address</label>
              <div style={S.inputInner}>
                <Mail size={16} style={S.inputIcon} />
                <input
                  style={S.input}
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} style={S.submitBtn} className="auth-submit">
              {loading ? <Loader2 size={15} className="auth-spin" /> : 'Send OTP Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={S.form}>
            <div style={S.fieldWrap}>
              <label style={S.label}>OTP Code</label>
                <input
                  className="auth-input"
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                  placeholder="000000"
                  style={{ ...S.input, letterSpacing: '8px', textAlign: 'center', fontSize: '18px', fontWeight: 700, paddingLeft: 13 }}
                />
            </div>
            <div style={S.fieldWrap}>
              <label style={S.label}>New Password</label>
              <div style={S.inputInner}>
                <Lock size={16} style={S.inputIcon} />
                <input
                  style={S.input}
                  className="auth-input"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="At least 8 characters"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} style={S.submitBtn} className="auth-submit">
              {loading ? <Loader2 size={15} className="auth-spin" /> : 'Reset Password'}
            </button>
            <button type="button" onClick={() => setStep(1)} style={S.backBtn}>Change Email</button>
          </form>
        )}

        <p style={S.footer}>
          Back to <Link to="/login" style={S.footerLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

const S = {
  page: { minHeight: '100vh', background: '#0d0f1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' },
  gridBg: { position: 'absolute', inset: 0, zIndex: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)' },
  logo: { position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginBottom: 36 },
  logoIcon: { width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #4f52e8, #7c5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 17, fontWeight: 700, color: '#e8eaf5', letterSpacing: '-.3px' },
  logoBi: { background: 'linear-gradient(90deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  card: { position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, background: '#13161f', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, padding: '36px 36px 32px', boxShadow: '0 24px 64px rgba(0,0,0,.5)' },
  cardHead: { marginBottom: 24 },
  heading: { fontSize: 22, fontWeight: 700, color: '#e8eaf5', margin: 0 },
  sub: { fontSize: 13.5, color: 'rgba(232,234,245,.42)', marginTop: 5 },
  errorBox: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', borderRadius: 9, background: 'rgba(240,96,96,.10)', border: '1px solid rgba(240,96,96,.24)', color: '#f08080', fontSize: 13, marginBottom: 18 },
  successBox: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', borderRadius: 9, background: 'rgba(16,185,129,.10)', border: '1px solid rgba(16,185,129,.24)', color: '#10b981', fontSize: 13, marginBottom: 18 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'rgba(232,234,245,.38)', letterSpacing: '.04em' },
  inputInner: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(232,234,245,.3)' },
  input: { width: '100%', padding: '11px 13px 11px 38px', borderRadius: 9, fontSize: 14, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', color: '#e8eaf5', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, #4f52e8, #7c5cf6)', color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' },
  backBtn: { background: 'none', border: 'none', color: 'rgba(232,234,245,.4)', fontSize: 12, cursor: 'pointer', marginTop: 4 },
  footer: { marginTop: 22, textAlign: 'center', fontSize: 13, color: 'rgba(232,234,245,.36)' },
  footerLink: { color: 'rgba(129,140,248,.85)', fontWeight: 600, textDecoration: 'none' },
};

const CSS = `
  @keyframes auth-card-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  .auth-card-in { animation: auth-card-in 0.3s ease both; }
  .auth-spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .auth-input:focus { border-color: rgba(129,140,248,0.5) !important; box-shadow: 0 0 0 3px rgba(79,82,232,0.2) !important; }
`;

export default ForgotPassword;
