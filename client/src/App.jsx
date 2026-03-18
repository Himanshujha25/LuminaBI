// In DashboardWrapper — replace the <main> block with this pattern:
//
//  <main className="main-content">
//    {currentView === 'support' ? (
//      <SupportPage />
//    ) : (
//      <MainDashboard
//        activeDataset={activeDataset}
//        datasets={datasets}
//        setActiveDataset={setActiveDataset}
//        toggleTheme={toggleTheme}
//        isDark={isDark}
//        onAnalyticsClick={handleAnalyticsClick}
//        onUploadClick={() => setIsUploadOpen(true)}
//      />
//    )}
//  </main>
//
// The Sidebar already receives all the required props:
//   activeTab={currentView}
//   onSupportClick={() => setCurrentView('support')}
//   onOverviewClick={() => setCurrentView('overview')}
//   onManageClick={() => { setIsManageOpen(true); setCurrentView('datasets'); }}
//   onAnalyticsClick={() => { handleAnalyticsClick(); setCurrentView('analytics'); }}

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import axios from 'axios';
import { API_URL } from './config';

const DashboardWrapper = ({
  token, isDark, toggleTheme, handleLogout, activeDataset, setActiveDataset,
  datasets, isUploadOpen, setIsUploadOpen, isManageOpen, setIsManageOpen, globalUploadState,
  handleUploadSuccess, setGlobalUploadState, handleDeleteDataset, toast, setToast
}) => {
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [currentView, setCurrentView] = useState('overview');

  const handleAnalyticsClick = () => {
    if (!activeDataset) return;
    const slugName = activeDataset.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    navigate(`/analytics/${slugName}/${activeDataset.id}/lumina_25`);
    setCurrentView('analytics');
  };

  if (!token) return <Navigate to="/login" />;

  return (
    <div className="layout-container" style={{ flexDirection: 'row', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        activeDataset={activeDataset}
        datasets={datasets}
        setActiveDataset={setActiveDataset}
        activeTab={currentView}
        onSupportClick={() => setCurrentView('support')}
        onOverviewClick={() => setCurrentView('overview')}
        onUploadClick={() => setIsUploadOpen(true)}
        onManageClick={() => {
          setIsManageOpen(true);
          setCurrentView('datasets');
        }}
        onAnalyticsClick={handleAnalyticsClick}
        isVisible={isSidebarVisible}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onUploadClick={() => setIsUploadOpen(true)}
          onManageClick={() => setIsManageOpen(true)}
          toggleTheme={toggleTheme}
          isDark={isDark}
          onLogout={handleLogout}
          uploadState={globalUploadState}
          isSidebarVisible={isSidebarVisible}
          setIsSidebarVisible={setIsSidebarVisible}
        />
        <main className="main-content" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {currentView === 'support' ? (
            <SupportPage />
          ) : (
            <MainDashboard
              activeDataset={activeDataset}
              datasets={datasets}
              setActiveDataset={setActiveDataset}
              toggleTheme={toggleTheme}
              isDark={isDark}
              onAnalyticsClick={handleAnalyticsClick}
              onUploadClick={() => setIsUploadOpen(true)}
            />
          )}
        </main>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        onGlobalSync={setGlobalUploadState}
      />
      <ManageModal
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        datasets={datasets}
        onDelete={handleDeleteDataset}
      />

      {toast && (
        <div className="toast-notification glass-panel animate-slide-up">
          <div className="toast-icon">
            {toast.type === 'success' ? <CheckCircle color="#10b981" size={20} /> : <AlertCircle color="#ef4444" size={20} />}
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

function App() {
  const [isDark, setIsDark] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);
  const [globalUploadState, setGlobalUploadState] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchDatasets();
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  const fetchDatasets = async () => {
    try {
      const res = await axios.get(`${API_URL}/datasets`);
      setDatasets(res.data);
      if (res.data.length > 0 && !activeDataset) setActiveDataset(res.data[0]);
    } catch (err) {
      console.error('Failed to load datasets', err);
    }
  };

  const handleUploadSuccess = (newDataset) => {
    setDatasets([newDataset, ...datasets]);
    setActiveDataset(newDataset);
    setToast({ title: 'Success', message: `Dataset "${newDataset.name}" is now ready!`, type: 'success' });
  };

  const handleDeleteDataset = async (id) => {
    try {
      await axios.delete(`${API_URL}/datasets/${id}`);
      const updated = datasets.filter(d => d.id !== id);
      setDatasets(updated);
      if (activeDataset?.id === id) setActiveDataset(updated[0] ?? null);
    } catch (err) {
      console.error('Failed to delete dataset', err);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/signup" element={<Signup setToken={setToken} />} />
        <Route
          path="/dashboard"
          element={
            <DashboardWrapper
              token={token} isDark={isDark} toggleTheme={toggleTheme} handleLogout={handleLogout}
              activeDataset={activeDataset} setActiveDataset={setActiveDataset}
              datasets={datasets}
              isUploadOpen={isUploadOpen} setIsUploadOpen={setIsUploadOpen}
              isManageOpen={isManageOpen} setIsManageOpen={setIsManageOpen}
              globalUploadState={globalUploadState} handleUploadSuccess={handleUploadSuccess}
              setGlobalUploadState={setGlobalUploadState} handleDeleteDataset={handleDeleteDataset}
              toast={toast} setToast={setToast}
            />
          }
        />
        <Route path="/analytics/:datasetName/:datasetId/:slug" element={<DynamicBoardPage isDark={isDark} toggleTheme={toggleTheme} />} />
        <Route path="/view-report/:id" element={<SharedReport />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;