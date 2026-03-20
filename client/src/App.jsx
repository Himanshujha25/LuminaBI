import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useStore from './store/useStore';
import Header from './components/Header';
import UploadModal from './components/UploadModal';
import ManageModal from './components/ManageModal';
import MainDashboard from './components/MainDashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DynamicBoardPage from './pages/DynamicBoardPage';
import SharedReport from './pages/SharedReport.jsx';
import Sidebar from './components/Sidebar';
import SupportPage from './pages/Support';
import { CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import SettingsPage from './pages/Setting';
import SavedDashboards from './pages/SavedDashboards';
import DashboardViewer from './components/DashboardViewer';
import { API_URL } from './config';

/* ── Invite Accept Page ────────────────────────────────────────── */
const InviteAcceptPage = () => {
  const { token: inviteToken } = useParams();
  const { token: authToken, fetchDatasets, setActiveDataset } = useStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authToken) {
      // Not logged in — store the token and redirect to login
      sessionStorage.setItem('pendingInviteToken', inviteToken);
      navigate('/login');
      return;
    }

    axios
      .get(`${API_URL}/invite/accept/${inviteToken}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then(async (res) => {
        setStatus('success');
        setMessage(`You've joined "${res.data.dataset?.name}"! Redirecting…`);
        await fetchDatasets();
        setTimeout(() => navigate('/dashboard'), 2000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Invalid or expired invite link.');
      });
  }, [inviteToken, authToken]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-color, #f8fafc)', padding: 24,
    }}>
      <div style={{
        background: 'var(--surface-color, #fff)', borderRadius: 18,
        border: '1px solid var(--border-color, rgba(0,0,0,.1))',
        padding: '40px 36px', maxWidth: 440, width: '100%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,.12)',
      }}>
        {status === 'loading' && (
          <>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#6366f1', marginBottom: 16 }} />
            <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: 14 }}>Accepting your invite…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={40} color="#10b981" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>You're in! 🎉</h2>
            <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: 14 }}>{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle size={40} color="#ef4444" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Invite Failed</h2>
            <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: 14, marginBottom: 20 }}>{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
                fontWeight: 700, fontSize: 14,
              }}
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
};

/* ── Protected Layout ──────────────────────────────────────────── */
const ProtectedLayout = ({ children }) => {
  const { token, toast, setToast } = useStore();
  if (!token) return <Navigate to="/login" />;

  return (
    <div className="layout-container" style={{ flexDirection: 'row', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>

      <UploadModal />
      <ManageModal />

      {toast && (
        <div className="toast-notification glass-panel animate-slide-up">
          <div className="toast-icon">
            {toast.type === 'success'
              ? <CheckCircle color="#10b981" size={20} />
              : <AlertCircle color="#ef4444" size={20} />}
          </div>
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            <div className="toast-message">{toast.message}</div>
          </div>
          <button className="toast-close" onClick={() => setToast(null)}><X size={16} /></button>
        </div>
      )}
    </div>
  );
};

/* ── Dashboard Wrapper ─────────────────────────────────────────── */
const DashboardWrapper = () => {
  const { currentView } = useStore();
  return (
    <>
      <Header />
      <main className="main-content" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {currentView === 'support' ? (
          <SupportPage />
        ) : currentView === 'settings' ? (
          <SettingsPage />
        ) : currentView === 'dashboards' ? (
          <SavedDashboards />
        ) : (
          <MainDashboard />
        )}
      </main>
    </>
  );
};

/* ── Root App ──────────────────────────────────────────────────── */
function App() {
  const { token, fetchDatasets, fetchUser } = useStore();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    if (token) {
      fetchDatasets();
      fetchUser();
    }
  }, [token, fetchDatasets, fetchUser]);

  return (
    <Router>
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/signup"    element={<Signup />} />

        {/* Invite accept link — works for logged-in users */}
        <Route path="/invite/accept/:token" element={<InviteAcceptPage />} />

        <Route path="/dashboard" element={<ProtectedLayout><DashboardWrapper /></ProtectedLayout>} />
        <Route path="/analytics/:datasetName/:datasetId/:slug" element={<ProtectedLayout><DynamicBoardPage /></ProtectedLayout>} />
        <Route path="/view-report/:id"   element={<SharedReport />} />
        <Route path="/dashboard/view/:id" element={<DashboardViewer />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;