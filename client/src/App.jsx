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

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import useStore from './store/useStore';
import Header from './components/Header';
import UploadModal from './components/UploadModal';
import ManageModal from './components/ManageModal';
import MainDashboard from './components/MainDashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgetPassword';
import ResetPassword from './pages/ResetPassword';
import DynamicBoardPage from './pages/DynamicBoardPage';
import SharedReport from './pages/SharedReport.jsx';
import Sidebar from './components/Sidebar';
import SupportPage from './pages/Support';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import SettingsPage from './pages/Setting';
import SavedDashboards from './pages/SavedDashboards';
import DashboardViewer from './components/DashboardViewer'; 

const DashboardWrapper = () => {
  const { 
    token, currentView, toast, setToast 
  } = useStore();

  if (!token) return <Navigate to="/login" />;

  return (
    <div className="layout-container" style={{ flexDirection: 'row', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
      </div>

      <UploadModal />
      <ManageModal />

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
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<DashboardWrapper />} />
        <Route path="/analytics/:datasetName/:datasetId/:slug" element={<DynamicBoardPage />} />
        <Route path="/view-report/:id" element={<SharedReport />} />
        <Route path="/dashboard/view/:id" element={<DashboardViewer />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
export default App;