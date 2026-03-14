import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BarChart2, Zap, Shield, ChevronRight } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      {/* Animated Background Orbs */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      
      {/* Navbar for Landing */}
      <nav className="home-nav glass-panel">
        <div className="home-logo">
          <div className="logo-icon-small">
            <BarChart2 size={20} color="#fff" />
          </div>
          <span className="logo-text">Lumina<span className="gradient-text">BI</span></span>
        </div>
        <div className="home-nav-links">
          <Link to="/login" className="btn-secondary">Log in</Link>
          <Link to="/signup" className="btn-primary">Sign up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero-section">
        <div className="hero-content">
          <div className="badge animate-slide-up"><Sparkles size={14} color="var(--accent-blue)" /> Powered by Gemini AI</div>
          <h1 className="hero-title animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Chat with your data. <br />
            <span className="gradient-text">Get instant insights.</span>
          </h1>
          <p className="hero-subtitle text-secondary animate-slide-up" style={{ animationDelay: '0.2s' }}>
            LuminaBI connects directly to your CSVs. Ask natural language questions and generate beautiful, highly accurate dashboards instantly—no SQL or coding required.
          </p>
          
          <div className="hero-cta animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/signup" className="btn-primary btn-large">
              Get Started for Free <ChevronRight size={18} />
            </Link>
            <p className="credit text-tertiary">No credit card required. Setup in 30 seconds.</p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="features-grid animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="feature-card glass-panel">
            <div className="feature-icon"><BarChart2 size={24} color="var(--accent-blue)" /></div>
            <h3>Dynamic Visualizations</h3>
            <p className="text-secondary">Instantly renders Bar, Line, Area, Pie, and Scatter charts based on the context of your questions.</p>
          </div>
          <div className="feature-card glass-panel">
             <div className="feature-icon"><Zap size={24} color="#8b5cf6" /></div>
             <h3>Blazing Fast</h3>
             <p className="text-secondary">Our optimized Postgres batch ingestion engine handles huge datasets smoothly.</p>
          </div>
          <div className="feature-card glass-panel">
             <div className="feature-icon"><Shield size={24} color="#10b981" /></div>
             <h3>High Accuracy</h3>
             <p className="text-secondary">Fine-tuned prompt engineering prevents AI hallucinations and maps aggregations perfectly.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
