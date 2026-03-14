import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart2, User, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import './Auth.css';

const Signup = ({ setToken }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post('https://luminabi.onrender.com/api/auth/register', { name, email, password });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Link to="/" className="auth-logo">
        <div className="logo-icon-small"><BarChart2 size={24} color="#fff" /></div>
        <span className="logo-text">Lumina<span className="gradient-text">BI</span></span>
      </Link>
      
      <div className="auth-card glass-panel animate-slide-up">
        <h2>Create an account</h2>
        <p className="text-secondary">Start getting instant AI insights from your data.</p>

        {error && (
            <div className="upload-error" style={{marginTop: '20px', marginBottom: 0}}>
                <AlertCircle size={18} />
                <span>{error}</span>
            </div>
        )}

        <form onSubmit={handleSignup} className="auth-form">
          <div className="input-group">
            <label>Full Name</label>
            <div className="input-with-icon">
              <User className="input-icon" size={18} />
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Doe" className="premium-input" />
            </div>
          </div>
          
          <div className="input-group">
            <label>Email ID</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" className="premium-input" />
            </div>
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" className="premium-input" />
            </div>
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading} style={{width: '100%', marginTop: '8px'}}>
            {loading ? 'Creating account...' : <><span style={{marginRight: '8px'}}>Sign up</span> <ArrowRight size={18} /></>}
          </button>
        </form>
        
        <p className="auth-footer text-secondary">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
