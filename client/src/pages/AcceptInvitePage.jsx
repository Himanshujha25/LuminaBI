import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import {
  CheckCircle, XCircle, Loader2, UserPlus,
  BarChart2, ArrowRight, Shield, Eye
} from 'lucide-react';

/* ── Styles ──────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .accept-page {
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 24px;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* Background layers */
  .accept-bg-dark {
    background: linear-gradient(135deg, #080a12 0%, #0d1123 100%);
  }
  .accept-bg-light {
    background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
  }

  .accept-blob {
    position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
    filter: blur(100px); opacity: .15;
  }
  .accept-blob-1 { width: 600px; height: 600px; top: -200px; left: -100px; background: #6366f1; }
  .accept-blob-2 { width: 400px; height: 400px; bottom: 0; right: -80px; background: #8b5cf6; opacity: .1; }

  .accept-card {
    position: relative; z-index: 1;
    width: 100%; max-width: 420px;
    border-radius: 24px; padding: 36px 32px;
    animation: accept-slide-up .3s cubic-bezier(.22,1,.36,1);
  }
  @keyframes accept-slide-up {
    from { opacity:0; transform: translateY(24px) }
    to   { opacity:1; transform: translateY(0) }
  }

  .accept-card-dark {
    background: rgba(15,18,32,.9);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,.1);
    box-shadow: 0 32px 80px rgba(0,0,0,.6), 0 0 0 .5px rgba(255,255,255,.06);
  }
  .accept-card-light {
    background: rgba(255,255,255,.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0,0,0,.08);
    box-shadow: 0 20px 60px rgba(0,0,0,.1);
  }

  .accept-logo {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 32px; justify-content: center;
  }
  .accept-logo-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #4f52e8, #7c5cf6);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 14px rgba(79,82,232,.4);
  }
  .accept-logo-text-dark { font-size: 18px; font-weight: 700; color: #f1f5f9; }
  .accept-logo-text-light { font-size: 18px; font-weight: 700; color: #0f172a; }

  .accept-icon-wrap {
    width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 20px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(0,0,0,.2);
  }
  .accept-icon-success { background: linear-gradient(135deg, #059669, #10b981); }
  .accept-icon-error   { background: linear-gradient(135deg, #dc2626, #ef4444); }
  .accept-icon-pending { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
  .accept-icon-loading { background: rgba(99,102,241,.15); border: 1.5px solid rgba(99,102,241,.3); }

  .accept-status-title-dark  { font-size: 22px; font-weight: 800; color: #f1f5f9; text-align: center; margin-bottom: 10px; }
  .accept-status-title-light { font-size: 22px; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 10px; }
  .accept-status-desc-dark   { font-size: 14px; color: rgba(255,255,255,.5); text-align: center; line-height: 1.6; margin-bottom: 24px; }
  .accept-status-desc-light  { font-size: 14px; color: rgba(0,0,0,.45); text-align: center; line-height: 1.6; margin-bottom: 24px; }

  /* Dataset info chip */
  .accept-info-chip {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 12px; margin-bottom: 20px;
  }
  .accept-chip-dark  { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); }
  .accept-chip-light { background: rgba(99,102,241,.06); border: 1px solid rgba(99,102,241,.15); }
  .accept-chip-icon {
    width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
  }
  .accept-chip-text { flex: 1; min-width: 0; }
  .accept-chip-name-dark  { font-size: 13px; font-weight: 600; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .accept-chip-name-light { font-size: 13px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .accept-chip-meta-dark  { font-size: 11.5px; color: rgba(255,255,255,.4); margin-top: 2px; }
  .accept-chip-meta-light { font-size: 11.5px; color: rgba(0,0,0,.4); margin-top: 2px; }
  .accept-role-badge {
    padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .06em; flex-shrink: 0;
    display: flex; align-items: center; gap: 4px;
  }
  .accept-role-editor { background: rgba(99,102,241,.15); color: #818cf8; }
  .accept-role-viewer { background: rgba(16,185,129,.12); color: #34d399; }

  /* Buttons */
  .accept-btn-primary {
    width: 100%; padding: 13px 20px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; font-size: 15px; font-weight: 700; font-family: 'Inter', sans-serif;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 6px 20px rgba(99,102,241,.4);
    transition: opacity .15s, transform .12s;
    text-decoration: none;
    margin-bottom: 10px;
  }
  .accept-btn-primary:hover { opacity: .9; transform: translateY(-1px); }

  .accept-btn-ghost-dark {
    width: 100%; padding: 12px 20px; border-radius: 12px;
    border: 1px solid rgba(255,255,255,.12);
    background: transparent; color: rgba(255,255,255,.6);
    font-size: 14px; font-weight: 500; font-family: 'Inter', sans-serif;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background .13s, color .13s;
    text-decoration: none;
  }
  .accept-btn-ghost-dark:hover { background: rgba(255,255,255,.05); color: #f1f5f9; }

  .accept-btn-ghost-light {
    width: 100%; padding: 12px 20px; border-radius: 12px;
    border: 1px solid rgba(0,0,0,.1);
    background: transparent; color: rgba(0,0,0,.45);
    font-size: 14px; font-weight: 500; font-family: 'Inter', sans-serif;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background .13s, color .13s;
    text-decoration: none;
  }
  .accept-btn-ghost-light:hover { background: rgba(0,0,0,.04); color: #0f172a; }

  @keyframes spin { to { transform: rotate(360deg); } }
`;

const STATUS = {
  LOADING: 'loading',
  SHOW_INFO: 'show_info',
  ACCEPTING: 'accepting',
  SUCCESS: 'success',
  ERROR: 'error',
  ALREADY: 'already',
};

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  const [status, setStatus]     = useState(STATUS.LOADING);
  const [info, setInfo]         = useState(null);   // invite info (before accepting)
  const [result, setResult]     = useState(null);   // result after accepting
  const [errorMsg, setErrorMsg] = useState('');

  const authToken = localStorage.getItem('token');
  const isLoggedIn = Boolean(authToken);

  // Step 1: peek at invite info (public endpoint)
  useEffect(() => {
    axios
      .get(`${API_URL}/collaborators/invite-info/${token}`)
      .then(res => {
        setInfo(res.data);
        if (res.data.status === 'accepted') {
          setStatus(STATUS.ALREADY);
        } else {
          setStatus(STATUS.SHOW_INFO);
        }
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.error || 'Invalid or expired invite link.');
        setStatus(STATUS.ERROR);
      });
  }, [token]);

  // Step 2: Accept (requires login)
  const handleAccept = async () => {
    if (!isLoggedIn) {
      // Persist token in sessionStorage so we can auto-accept after login
      sessionStorage.setItem('pending_invite_token', token);
      navigate(`/login?redirect=/invite/accept/${token}`);
      return;
    }
    setStatus(STATUS.ACCEPTING);
    try {
      const res = await axios.get(`${API_URL}/collaborators/accept/${token}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setResult(res.data);
      setStatus(STATUS.SUCCESS);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to accept invite. Please try again.');
      setStatus(STATUS.ERROR);
    }
  };

  // Auto-accept if user just logged in and came from the invite page
  useEffect(() => {
    if (!isLoggedIn) return;
    const pendingToken = sessionStorage.getItem('pending_invite_token');
    if (pendingToken === token && status === STATUS.SHOW_INFO) {
      sessionStorage.removeItem('pending_invite_token');
      handleAccept();
    }
  }, [status, isLoggedIn]);

  const card = isDark ? 'accept-card-dark' : 'accept-card-light';
  const bg   = isDark ? 'accept-bg-dark'   : 'accept-bg-light';
  const logoText = isDark ? 'accept-logo-text-dark' : 'accept-logo-text-light';
  const statusTitle = isDark ? 'accept-status-title-dark' : 'accept-status-title-light';
  const statusDesc  = isDark ? 'accept-status-desc-dark'  : 'accept-status-desc-light';
  const chip     = isDark ? 'accept-chip-dark'      : 'accept-chip-light';
  const chipName = isDark ? 'accept-chip-name-dark' : 'accept-chip-name-light';
  const chipMeta = isDark ? 'accept-chip-meta-dark' : 'accept-chip-meta-light';
  const btnGhost = isDark ? 'accept-btn-ghost-dark' : 'accept-btn-ghost-light';
  const gradText = { background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' };

  const renderBody = () => {
    if (status === STATUS.LOADING) {
      return (
        <>
          <div className="accept-icon-wrap accept-icon-loading">
            <Loader2 size={28} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
          <div className={statusTitle}>Loading invite…</div>
          <div className={statusDesc}>Fetching your invitation details.</div>
        </>
      );
    }

    if (status === STATUS.ERROR) {
      return (
        <>
          <div className="accept-icon-wrap accept-icon-error">
            <XCircle size={32} color="#fff" />
          </div>
          <div className={statusTitle}>Invite Error</div>
          <div className={statusDesc}>{errorMsg}</div>
          <button className="accept-btn-primary" onClick={() => navigate('/')}>
            <ArrowRight size={16} /> Back to Home
          </button>
        </>
      );
    }

    if (status === STATUS.ALREADY) {
      return (
        <>
          <div className="accept-icon-wrap accept-icon-success">
            <CheckCircle size={32} color="#fff" />
          </div>
          <div className={statusTitle}>Already Accepted</div>
          <div className={statusDesc}>
            You already have access to <strong>"{info?.dataset_name}"</strong>.
          </div>
          <button className="accept-btn-primary" onClick={() => navigate('/dashboard')}>
            <BarChart2 size={16} /> Go to Dashboard
          </button>
        </>
      );
    }

    if (status === STATUS.SHOW_INFO) {
      return (
        <>
          <div className="accept-icon-wrap accept-icon-pending">
            <UserPlus size={28} color="#fff" />
          </div>
          <div className={statusTitle}>
            You've been invited
          </div>
          <div className={statusDesc}>
            <strong style={{ color: isDark ? '#c7d2fe' : '#4338ca' }}>{info?.owner_name || info?.owner_email}</strong>
            {' '}has invited you to collaborate on a dataset.
          </div>

          {/* Dataset Chip */}
          <div className={`accept-info-chip ${chip}`}>
            <div className="accept-chip-icon">
              <BarChart2 size={16} color="#fff" />
            </div>
            <div className="accept-chip-text">
              <div className={chipName}>{info?.dataset_name}</div>
              <div className={chipMeta}>Shared by {info?.owner_email}</div>
            </div>
            <span className={`accept-role-badge ${info?.role === 'editor' ? 'accept-role-editor' : 'accept-role-viewer'}`}>
              {info?.role === 'editor' ? <Shield size={10} /> : <Eye size={10} />}
              {info?.role}
            </span>
          </div>

          {!isLoggedIn && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13,
              background: isDark ? 'rgba(251,191,36,.08)' : 'rgba(251,191,36,.1)',
              border: `1px solid rgba(251,191,36,.25)`, color: isDark ? '#fbbf24' : '#d97706',
              lineHeight: 1.55,
            }}>
              You need to <strong>log in or sign up</strong> to accept this invite.
            </div>
          )}

          <button className="accept-btn-primary" onClick={handleAccept}>
            <CheckCircle size={16} />
            {isLoggedIn ? 'Accept & Join Dataset' : 'Log in to Accept'}
          </button>
          <button className={btnGhost} onClick={() => navigate('/')}>
            Maybe later
          </button>
        </>
      );
    }

    if (status === STATUS.ACCEPTING) {
      return (
        <>
          <div className="accept-icon-wrap accept-icon-loading">
            <Loader2 size={28} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
          <div className={statusTitle}>Joining dataset…</div>
          <div className={statusDesc}>Please wait while we grant your access.</div>
        </>
      );
    }

    if (status === STATUS.SUCCESS) {
      return (
        <>
          <div className="accept-icon-wrap accept-icon-success">
            <CheckCircle size={32} color="#fff" />
          </div>
          <div className={statusTitle}>
            <span style={gradText}>Access Granted!</span>
          </div>
          <div className={statusDesc}>
            {result?.message}
          </div>

          {/* Dataset Chip */}
          <div className={`accept-info-chip ${chip}`}>
            <div className="accept-chip-icon">
              <BarChart2 size={16} color="#fff" />
            </div>
            <div className="accept-chip-text">
              <div className={chipName}>{result?.dataset_name}</div>
              <div className={chipMeta}>Shared by {result?.owner_email}</div>
            </div>
            <span className={`accept-role-badge ${result?.role === 'editor' ? 'accept-role-editor' : 'accept-role-viewer'}`}>
              {result?.role === 'editor' ? <Shield size={10} /> : <Eye size={10} />}
              {result?.role}
            </span>
          </div>

          <button className="accept-btn-primary" onClick={() => navigate('/dashboard')}>
            <BarChart2 size={16} /> Open Dashboard
          </button>
          <button className={btnGhost} onClick={() => navigate('/')}>
            Back to home
          </button>
        </>
      );
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className={`accept-page ${bg}`}>
        <div className="accept-blob accept-blob-1" />
        <div className="accept-blob accept-blob-2" />

        <div className={`accept-card ${card}`}>
          {/* Logo */}
          <div className="accept-logo">
            <div className="accept-logo-icon">
              <BarChart2 size={18} color="#fff" />
            </div>
            <span className={logoText}>
              Lumina<span style={gradText}>BI</span>
            </span>
          </div>

          {renderBody()}
        </div>
      </div>
    </>
  );
}
