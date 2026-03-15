import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BarChart2, Zap, Shield, ChevronRight, Database, MessageSquare, Cpu, Layers, LayoutDashboard } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      {/* Animated Background Orbs */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>
      
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
            LuminaBI connects directly to your CSVs. Ask natural language questions and generate beautiful, highly accurate dashboards instantly—no SQL or coding required. Perfect for modern data teams and executives.
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
            <div className="feature-icon"><LayoutDashboard size={24} color="var(--accent-blue)" /></div>
            <h3>Dynamic Visualizations</h3>
            <p className="text-secondary">Instantly renders fully responsive Bar, Line, Area, Pie, and Scatter charts perfectly tailored to the context of your specific questions.</p>
          </div>
          <div className="feature-card glass-panel">
             <div className="feature-icon"><Zap size={24} color="#8b5cf6" /></div>
             <h3>Blazing Fast Postgres</h3>
             <p className="text-secondary">Our optimized backend batch-ingestion engine safely handles your datasets and stores them in indexed PostgreSQL tables for zero latency querying.</p>
          </div>
          <div className="feature-card glass-panel">
             <div className="feature-icon"><Shield size={24} color="#10b981" /></div>
             <h3>Enterprise Accuracy</h3>
             <p className="text-secondary">Fine-tuned system prompts and strict schema mapping completely eliminate AI hallucinations, ensuring business-grade aggregation accuracy.</p>
          </div>
        </div>

        {/* System Architecture Section */}
        <section className="architecture-section animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="section-header">
            <h2>How LuminaBI Works</h2>
            <p className="text-secondary">A highly optimized data pipeline turning raw CSV uploads into interactive intelligence.</p>
          </div>
          
          <div className="architecture-flow">
            <div className="arch-step glass-panel">
              <div className="arch-icon-box"><Database size={24} color="#3b82f6" /></div>
              <div className="arch-step-content">
                <h4>1. Data Upload</h4>
                <p className="text-secondary">CSVs are parsed and ingested into a dedicated PostgreSQL schema.</p>
              </div>
            </div>
            
            <div className="arch-connector"><ChevronRight size={32} className="connector-icon" /></div>
            
            <div className="arch-step glass-panel">
              <div className="arch-icon-box"><MessageSquare size={24} color="#8b5cf6" /></div>
              <div className="arch-step-content">
                <h4>2. Natural Language</h4>
                <p className="text-secondary">Ask questions. We link your intent with the specific dataset schema.</p>
              </div>
            </div>
            
            <div className="arch-connector"><ChevronRight size={32} className="connector-icon" /></div>

            <div className="arch-step glass-panel">
               <div className="arch-icon-box"><Cpu size={24} color="#f59e0b" /></div>
               <div className="arch-step-content">
                 <h4>3. AI SQL Generation</h4>
                 <p className="text-secondary">Gemini processes the schema and returns highly accurate PostgreSQL.</p>
               </div>
            </div>

            <div className="arch-connector"><ChevronRight size={32} className="connector-icon" /></div>
            
            <div className="arch-step glass-panel">
              <div className="arch-icon-box"><BarChart2 size={24} color="#10b981" /></div>
              <div className="arch-step-content">
                <h4>4. Visualization</h4>
                <p className="text-secondary">The SQL is executed and sent to Recharts in a gorgeous glass UI.</p>
              </div>
            </div>
          </div>
        </section>

      </main>
      
      {/* Simple Footer */}
      <footer className="home-footer">
        <p className="text-tertiary">© 2026 LuminaBI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
