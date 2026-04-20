import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { authAPI } from '../api/axios';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
           const res = await authAPI.login(form.email, form.password);
      localStorage.setItem('legalmind_token', res.data.token);
      localStorage.setItem('legalmind_name', res.data.name);     // <-- ADDED
      localStorage.setItem('legalmind_email', res.data.email);   // <-- ADDED

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-orb-1" />
      <div className="auth-bg-orb auth-orb-2" />

      <div className="auth-card glass-card animate-fade-in">
        <div className="auth-brand" onClick={() => navigate('/')}>
          <Shield size={28} className="auth-brand-icon" />
          <span>LegalMind<span className="brand-ai">AI</span></span>
        </div>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to continue your legal research</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              className="input-field input-with-icon"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type={showPass ? 'text' : 'password'}
              className="input-field input-with-icon"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="auth-extras">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-link">Forgot Password?</a>
          </div>

          <button type="submit" className="gradient-btn auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
