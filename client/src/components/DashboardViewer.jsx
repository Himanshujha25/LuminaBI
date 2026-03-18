import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ArrowLeft } from 'lucide-react';
import { API_URL } from '../config';
import useStore from '../store/useStore';
import DynamicDashboard from './DynamicDashboard';

export default function DashboardViewer() {
  const { id } = useParams(); // Gets the ID from the URL
  const navigate = useNavigate();
  const { token, isDark } = useStore();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${API_URL}/dashboards/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Ensure layout and charts are parsed properly if PostgreSQL returned them as strings
        const data = res.data;
        if (typeof data.layout === 'string') data.layout = JSON.parse(data.layout);
        if (typeof data.charts === 'string') data.charts = JSON.parse(data.charts);
        
        setDashboardData(data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError("Could not load this dashboard. It may have been deleted.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [id, token]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#0d0d0c' : '#f4f4f2', color: isDark ? '#fff' : '#000' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isDark ? '#0d0d0c' : '#f4f4f2', color: isDark ? '#fff' : '#000' }}>
        <h2>Oops!</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 20, padding: '10px 20px', borderRadius: 8, border: '1px solid var(--dd-border)', background: 'var(--dd-surface)', color: 'var(--dd-text-1)', cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      {/* We reuse your amazing DynamicDashboard, but pass the saved data into it! */}
      <DynamicDashboard 
        charts={dashboardData.charts} 
        initialLayout={dashboardData.layout} 
        dashboardName={dashboardData.name}
        onClose={() => navigate(-1)} // Clicking Back returns to the list
      />
    </div>
  );
}