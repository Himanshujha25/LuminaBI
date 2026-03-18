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
    <div style={{ padding: '40px 0', minHeight: '100%', background: 'transparent', transition: 'all 0.3s' }}>
      
      {/* ── PROFESSIONAL HEADER ── */}
      <div style={{ padding: '0 60px', marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--st-text-1)', margin: 0, letterSpacing: '-1px' }}>
             Saved Dashboards
            </h1>
            <p style={{ color: 'var(--st-text-3)', fontSize: 15, marginTop: 4 }}>Manage and revisit your AI-generated insights.</p>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={searchContainerStyle}>
              <Search size={18} style={{ opacity: 0.4 }} />
              <input 
                placeholder="Search workspaces..." 
                style={searchInputStyle}
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
      <div 
        ref={scrollRef}
        style={sliderWrapperStyle}
        className="no-scrollbar"
      >
        {filtered.length === 0 ? (
          <div style={emptyStateStyle}>
            <Layout size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <p>No dashboards found matching "{searchTerm}"</p>
          </div>
        ) : (
          filtered.map((board) => (
            <div 
              key={board.id} 
              style={cardStyle}
              onClick={() => navigate(`/dashboard/view/${board.id}`)}
              className="gallery-card"
            >
              
              {/* ── DYNAMIC PREVIEW IMAGE ── */}
<div style={{
  height: '180px',
  width: '100%',
  background: 'linear-gradient(180deg, #161c2d 0%, #0b0f19 100%)',
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: '0 24px 20px 24px',
  gap: '6px',
  overflow: 'hidden',
  borderBottom: '1px solid var(--st-border)'
}}>
  {/* Modern Data Bars - With fallback logic */}
  {[...Array(8)].map((_, i) => {
    // Fallback height if board.name is missing, otherwise unique per dashboard
    const nameLen = board?.name?.length || 10; 
    const h = (nameLen * (i + 1)) % 60 + 20;

    return (
      <div key={i} style={{
        flex: 1,
        height: `${h}%`,
        background: i % 3 === 0 ? '#6366f1' : 'rgba(255,255,255,0.1)',
        borderRadius: '4px 4px 1px 1px',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: `pulseHeight 2s ease-in-out ${i * 0.1}s infinite alternate`
      }} />
    );
  })}

  {/* Floating "Live" Badge */}
  <div style={{
    position: 'absolute',
    top: '16px',
    left: '16px',
    padding: '4px 10px',
    background: 'rgba(99, 102, 241, 0.15)',
    backdropFilter: 'blur(8px)',
    borderRadius: '6px',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    fontSize: '10px',
    fontWeight: 700,
    color: '#818cf8',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    zIndex: 2
  }}>
    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
    DASHBOARD
  </div>
  
  <div style={{
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, transparent, #161c2d)',
    zIndex: 1
  }} />
</div>

              {/* ── CONTENT ── */}
              <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
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

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .gallery-card:hover {
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 30px 60px -12px rgba(0,0,0,0.25);
          border-color: var(--st-nav-active-clr);
        }
        .gallery-card:hover .explore-link { color: var(--st-nav-active-clr); transform: translateX(4px); }
      `}</style>
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