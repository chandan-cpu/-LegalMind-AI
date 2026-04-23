import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, CheckCircle2 } from 'lucide-react';
import { lawyerAPI } from '../api/axios';
import { useToast } from '../components/toastContext';
import './Auth.css';

export default function LawyerLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await lawyerAPI.login(form.email, form.password);
      localStorage.setItem('legalmind_lawyer_token', res.data.token);
      localStorage.setItem('legalmind_lawyer_name', res.data.name);
      addToast('Lawyer login successful', 'success');
      navigate('/lawyer/dashboard');
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'Login failed';
      const rejectionReason = err.response?.data?.rejectionReason;
      const finalMessage = rejectionReason ? `${serverMessage}: ${rejectionReason}` : serverMessage;
      setError(finalMessage);
      addToast(finalMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page login-page">
      <div className="auth-bg-orb auth-orb-1" />
      <div className="auth-bg-orb auth-orb-2" />

      <div className="login-shell glass-card animate-fade-in">
        <section className="login-visual">
          <img
            src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80"
            alt="Modern legal workspace"
            className="login-visual-image"
          />
          <div className="login-visual-overlay" />
          <div className="login-visual-content">
            <p className="login-visual-kicker">Professional Legal Network</p>
            <h2>Connect with Clients Through AI-Powered Legal Platform</h2>
            <p>
              Manage consultations, provide expert advice, and grow your legal practice with verified clients.
            </p>
            <div className="login-feature-list">
              <div className="login-feature-item">
                <CheckCircle2 size={16} />
                <span>Secure client consultations and document review</span>
              </div>
              <div className="login-feature-item">
                <CheckCircle2 size={16} />
                <span>AI-assisted case analysis and insights</span>
              </div>
              <div className="login-feature-item">
                <CheckCircle2 size={16} />
                <span>Professional dashboard for case management</span>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-card login-auth-card">
          <div className="auth-brand" onClick={() => navigate('/')}>
            <Shield size={28} className="auth-brand-icon" />
            <span>LegalMind<span className="brand-ai">AI</span></span>
          </div>

          <h1 className="auth-title">Lawyer Login</h1>
          <p className="auth-subtitle">Sign in to access your lawyer dashboard</p>

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
            New lawyer? <Link to="/lawyer/register">Sign Up</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
