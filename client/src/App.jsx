import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import UploadModal from './components/UploadModal';
import ManageModal from './components/ManageModal';
import MainDashboard from './components/MainDashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DynamicBoardPage from './pages/DynamicBoardPage';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import axios from 'axios';
import { API_URL } from './config';

function App() {
  const [isDark, setIsDark] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);
  const [globalUploadState, setGlobalUploadState] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [toast, setToast] = useState(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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

  const handleDeleteDataset = async (id) => {
    try {
      await axios.delete(`${API_URL}/datasets/${id}`);
      const updated = datasets.filter(d => d.id !== id);
      setDatasets(updated);
      if (activeDataset && activeDataset.id === id) {
        setActiveDataset(updated.length > 0 ? updated[0] : null);
      }
    } catch (err) {
      console.error("Failed to delete dataset", err);
    }
  };

  const fetchDatasets = async () => {
    try {
      const res = await axios.get(`${API_URL}/datasets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDatasets(res.data);
      if (res.data.length > 0 && !activeDataset) {
        setActiveDataset(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load datasets", err);
    }
  };

  const handleUploadSuccess = (newDataset) => {
    setDatasets([newDataset, ...datasets]);
    setActiveDataset(newDataset);
    setToast({ 
      title: "Success", 
      message: `Dataset "${newDataset.name}" is now ready!`,
      type: "success"
    });
  };

  /* Removed inner component that breaks reconciliation */

  /* Unmounted from inner func */

  return (
    <Router>
       <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/signup" element={<Signup setToken={setToken} />} />
          <Route 
             path="/dashboard" 
             element={
               token ? (
                  <div className="layout-container">
                    <Header 
                      onUploadClick={() => setIsUploadOpen(true)} 
                      onManageClick={() => setIsManageOpen(true)}
                      toggleTheme={toggleTheme} 
                      isDark={isDark}
                      onLogout={handleLogout}
                      uploadState={globalUploadState}
                    />
                    <main className="main-content">
                      <MainDashboard 
                        activeDataset={activeDataset} 
                        datasets={datasets}
                        setActiveDataset={setActiveDataset}
                        toggleTheme={toggleTheme}
                        isDark={isDark}
                      />
                    </main>
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

                    {/* Modern Toast Notification */}
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
               ) : (
                  <Navigate to="/login" />
               )
             } 
          />
          <Route 
            path="/analytics/:datasetName/:datasetId/:slug" 
            element={<DynamicBoardPage isDark={isDark} toggleTheme={toggleTheme} />} 
          />
          <Route path="*" element={<Navigate to="/" />} />
       </Routes>
    </Router>
  );
}

export default App;