import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Layers, Trash2, ExternalLink, Loader2, 
  Calendar, ChevronLeft, ChevronRight, Search,BarChart3,
  Filter, MoreVertical, Layout
} from 'lucide-react';
import { API_URL } from '../config';
import useStore from '../store/useStore';

export default function SavedDashboards() {
  const navigate = useNavigate();
  const { token, isDark } = useStore();
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => { fetchDashboards(); }, []);

  const fetchDashboards = async () => {
    try {
      const res = await axios.get(`${API_URL}/dashboards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboards(res.data);
    } catch (error) { console.error("Fetch failed", error); }
    finally { setLoading(false); }
  };

  const filtered = dashboards.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scroll = (dir) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const move = dir === 'left' ? -clientWidth / 1.2 : clientWidth / 1.2;
      scrollRef.current.scrollTo({ left: scrollLeft + move, behavior: 'smooth' });
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Loader2 className="animate-spin" size={40} color="#6366f1" />
    </div>
  );

  return (
    <div className="sd-page">
      <style>{`
        .sd-page { padding: 40px 0; min-height: 100%; background: transparent; transition: all 0.3s; }
        .sd-header { padding: 0 60px; margin-bottom: 40px; }
        .sd-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .sd-title { font-size: 32px; font-weight: 900; color: var(--st-text-1); margin: 0; letter-spacing: -1px; }
        .sd-sub { color: var(--st-text-3); font-size: 15px; margin-top: 4px; }
        
        .sd-actions { display: flex; gap: 12px; }
        .sd-search { display: flex; align-items: center; gap: 10px; background: var(--st-card); border: 1px solid var(--st-border); padding: 0 16px; border-radius: 14px; width: 260px; height: 44px; }
        .sd-search input { background: none; border: none; color: var(--st-text-1); font-size: 14px; outline: none; width: 100%; }
        
        .sd-slider { display: flex; gap: 30px; overflow-x: auto; padding: 10px 60px 60px 60px; scroll-snap-type: x mandatory; transition: all 0.4s; }
        .sd-slider::-webkit-scrollbar { display: none; }
        
        .sd-card {
          min-width: 320px; width: 320px; height: 420px;
          background: var(--st-card); border: 1px solid var(--st-border); border-radius: 28px;
          display: flex; flexDirection: column; cursor: pointer; scroll-snap-align: start;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); overflow: hidden; position: relative;
        }
        .sd-card:hover { transform: translateY(-10px) scale(1.02); box-shadow: 0 30px 60px -12px rgba(0,0,0,0.25); border-color: var(--st-nav-active-clr); }
        .sd-card:hover .explore-link { color: var(--st-nav-active-clr); transform: translateX(4px); }
        
        .sd-card-banner {
          height: 180px; width: 100%; background: linear-gradient(180deg, #161c2d 0%, #0b0f19 100%);
          position: relative; display: flex; align-items: flex-end; justify-content: center;
          padding: 0 24px 20px 24px; gap: 6px; overflow: hidden; border-bottom: 1px solid var(--st-border);
        }
        
        .sd-card-content { padding: 20px 24px; flex: 1; display: flex; flex-direction: column; }
        
        @media (max-width: 768px) {
          .sd-page { padding: 16px 0; }
          .sd-header { padding: 0 16px; margin-bottom: 24px; }
          .sd-top-row { flex-direction: column; align-items: flex-start; gap: 16px; }
          .sd-title { font-size: 26px; }
          .sd-sub { font-size: 13.5px; opacity: .7; }
          .sd-actions { width: 100%; gap: 8px; justify-content: flex-start; }
          .sd-search { width: 100%; flex: 1; height: 40px; border-radius: 12px; }
          .sd-slider { padding: 8px 16px 32px 16px; gap: 14px; }
          .sd-card { min-width: 280px; width: 280px; height: 360px; border-radius: 20px; }
          .sd-card-banner { height: 140px; }
        }
      `}</style>
      
      {/* ── PROFESSIONAL HEADER ── */}
      <div className="sd-header">
        <div className="sd-top-row">
          <div>
            <h1 className="sd-title">Saved Dashboards</h1>
            <p className="sd-sub">Manage and revisit your AI-generated insights.</p>
          </div>
          
          <div className="sd-actions">
            <div className="sd-search">
              <Search size={18} style={{ opacity: 0.4 }} />
              <input 
                placeholder="Search..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => scroll('left')} style={navButtonStyle}><ChevronLeft size={20} /></button>
            <button onClick={() => scroll('right')} style={navButtonStyle}><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      {/* ── SLIDER AREA ── */}
      <div ref={scrollRef} className="sd-slider">
        {filtered.length === 0 ? (
          <div style={emptyStateStyle}>
            <Layout size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <p>No dashboards found matching "{searchTerm}"</p>
          </div>
        ) : (
          filtered.map((board) => (
            <div key={board.id} className="sd-card" onClick={() => navigate(`/dashboard/view/${board.id}`)}>
              {/* ── DYNAMIC PREVIEW IMAGE ── */}
              <div className="sd-card-banner">
                {[...Array(8)].map((_, i) => {
                  const nameLen = board?.name?.length || 10; 
                  const h = (nameLen * (i + 1)) % 60 + 20;
                  return (
                    <div key={i} style={{
                      flex: 1, height: `${h}%`,
                      background: i % 3 === 0 ? '#6366f1' : 'rgba(255,255,255,0.1)',
                      borderRadius: '4px 4px 1px 1px',
                      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      animation: `pulseHeight 2s ease-in-out ${i * 0.1}s infinite alternate`
                    }} />
                  );
                })}

                <div style={{
                  position: 'absolute', top: 16, left: 16, padding: '4px 10px',
                  background: 'rgba(99, 102, 241, 0.15)', backdropFilter: 'blur(8px)',
                  borderRadius: 6, border: '1px solid rgba(99, 102, 241, 0.3)',
                  fontSize: 10, fontWeight: 700, color: '#818cf8',
                  display: 'flex', alignItems: 'center', gap: 6, zIndex: 2
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
                  DASHBOARD
                </div>
                
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, #161c2d)', zIndex: 1 }} />
              </div>

              {/* ── CONTENT ── */}
              <div className="sd-card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={badgeStyle}>BI WORKSPACE</span>
                  <button onClick={(e) => { e.stopPropagation(); /* delete logic */ }} style={actionBtnStyle}>
                    <MoreVertical size={16} />
                  </button>
                </div>

                <h3 style={titleStyle}>{board.name}</h3>
                
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--st-text-3)', fontSize: 12 }}>
                    <Calendar size={14} />
                    {new Date(board.created_at).toLocaleDateString()}
                  </div>
                  <div className="explore-link" style={exploreLinkStyle}>
                    Open <ExternalLink size={14} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── STYLES ──

const sliderWrapperStyle = {
  display: 'flex',
  gap: 30,
  overflowX: 'auto',
  padding: '10px 60px 60px 60px',
  scrollSnapType: 'x mandatory',
  transition: 'all 0.4s'
};

const cardStyle = {
  minWidth: '320px',
  width: '320px',
  height: '420px',
  background: 'var(--st-card)',
  border: '1px solid var(--st-border)',
  borderRadius: '28px',
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  scrollSnapAlign: 'start',
  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  overflow: 'hidden',
  position: 'relative'
};

const previewContainerStyle = {
  height: '50%',
  width: '100%',
  background: 'var(--st-page)',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: '1px solid var(--st-border)'
};

const abstractGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 12,
  width: '70%',
  height: '50%',
  alignItems: 'end'
};

const overlayGradientStyle = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to bottom, transparent, var(--st-card))',
  opacity: 0.5
};

const searchContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: 'var(--st-card)',
  border: '1px solid var(--st-border)',
  padding: '0 16px',
  borderRadius: '14px',
  width: '260px',
  height: '44px'
};

const searchInputStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--st-text-1)',
  fontSize: '14px',
  outline: 'none',
  width: '100%'
};

const navButtonStyle = {
  width: 44, height: 44, borderRadius: '14px', border: '1px solid var(--st-border)',
  background: 'var(--st-card)', color: 'var(--st-text-1)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
};

const badgeStyle = {
  fontSize: '10px', fontWeight: 800, color: 'var(--st-nav-active-clr)',
  letterSpacing: '1px', background: 'var(--st-nav-active-bg)',
  padding: '4px 10px', borderRadius: '8px'
};

const titleStyle = {
  fontSize: '22px', fontWeight: 800, color: 'var(--st-text-1)',
  margin: '0', lineHeight: 1.2, letterSpacing: '-0.5px'
};

const exploreLinkStyle = {
  display: 'flex', alignItems: 'center', gap: 6, fontSize: '14px',
  fontWeight: 700, color: 'var(--st-text-3)', transition: 'all 0.3s'
};

const emptyStateStyle = {
  width: '100%', textAlign: 'center', padding: '100px 0',
  color: 'var(--st-text-3)', fontSize: '16px'
};

const actionBtnStyle = {
  background: 'none', border: 'none', color: 'var(--st-text-3)', cursor: 'pointer'
};