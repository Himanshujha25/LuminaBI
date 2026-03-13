import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import UploadModal from './components/UploadModal';
import ManageModal from './components/ManageModal';
import MainDashboard from './components/MainDashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import axios from 'axios';

function App() {
  const [isDark, setIsDark] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

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
      await axios.delete(`http://localhost:5000/api/datasets/${id}`);
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
      const res = await axios.get('http://localhost:5000/api/datasets');
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
  };

  const ProtectedRoute = ({ children }) => {
    if (!token) return <Navigate to="/login" />;
    return children;
  };

  const DashboardLayout = () => (
    <div className="layout-container">
      <Header 
        onUploadClick={() => setIsUploadOpen(true)} 
        onManageClick={() => setIsManageOpen(true)}
        toggleTheme={toggleTheme} 
        isDark={isDark}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <MainDashboard 
          activeDataset={activeDataset} 
          datasets={datasets}
          setActiveDataset={setActiveDataset}
        />
      </main>
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={handleUploadSuccess}
      />
      <ManageModal 
        isOpen={isManageOpen} 
        onClose={() => setIsManageOpen(false)} 
        datasets={datasets}
        onDelete={handleDeleteDataset}
      />
    </div>
  );

  return (
    <Router>
       <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/signup" element={<Signup setToken={setToken} />} />
          <Route 
             path="/dashboard" 
             element={
               <ProtectedRoute>
                  <DashboardLayout />
               </ProtectedRoute>
             } 
          />
          <Route path="*" element={<Navigate to="/" />} />
       </Routes>
    </Router>
  );
}

export default App;