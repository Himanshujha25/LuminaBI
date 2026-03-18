import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AUTH_URL, BASE_URL } from '../config';
import { BarChart2, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import './Auth.css';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
 
  // Pre-warm the backend to wake up Render (cold start)
  React.useEffect(() => {
    axios.get(`${BASE_URL}/health`).catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${AUTH_URL}/login`, { email, password });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Background Decorations */}
      <div className="auth-bg-decor">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
      </div>

      <Link to="/" className="auth-logo">
        <div className="logo-icon-small"><BarChart2 size={24} color="#fff" /></div>
        <span className="logo-text">Lumina<span className="gradient-text">BI</span></span>
      </Link>
      
      <div className="auth-card animate-slide-up">
        <h2>Welcome back</h2>
        <p className="text-secondary">Enter your details to access your dashboard.</p>
        
        {error && (
            <div className="auth-error animate-shake" style={{marginTop: '24px', marginBottom: 0}}>
                <AlertCircle size={18} />
                <span>{error}</span>
            </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={20} />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="name@email.com" 
                className="premium-input" 
              />
            </div>
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={20} />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
                className="premium-input" 
              />
            </div>
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading} style={{width: '100%', marginTop: '12px', padding: '16px'}}>
            {loading ? 'Authenticating...' : <><span style={{marginRight: '8px'}}>Sign In</span> <ArrowRight size={18} /></>}
          </button>
        </form>
        
        <p className="auth-footer text-secondary">
          New to LuminaBI? <Link to="/signup">Create account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
