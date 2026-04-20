import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Shield } from 'lucide-react';
import { authAPI } from '../api/axios';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = () => {
    const p = form.password;
    if (!p) return { level: 0, text: '', color: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const levels = [
      { level: 25, text: 'Weak', color: 'var(--coral)' },
      { level: 50, text: 'Fair', color: 'var(--amber)' },
      { level: 75, text: 'Good', color: 'var(--info)' },
      { level: 100, text: 'Strong', color: 'var(--teal)' },
    ];
    return levels[score - 1] || { level: 0, text: '', color: '' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.register({ name: form.name, email: form.email, password: form.password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-orb-1" />
      <div className="auth-bg-orb auth-orb-2" />

      <div className="auth-card glass-card animate-fade-in">
        <div className="auth-brand" onClick={() => navigate('/')}>
          <Shield size={28} className="auth-brand-icon" />
          <span>LegalMind<span className="brand-ai">AI</span></span>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join the future of legal intelligence</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <User size={18} className="input-icon" />
            <input
              type="text"
              className="input-field input-with-icon"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

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

          {form.password && (
            <div className="password-strength">
              <div className="strength-bar">
                <div className="strength-fill" style={{ width: `${strength.level}%`, background: strength.color }} />
              </div>
              <span className="strength-text" style={{ color: strength.color }}>{strength.text}</span>
            </div>
          )}

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              className="input-field input-with-icon"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </div>

          <label className="remember-me" style={{ marginBottom: 8 }}>
            <input type="checkbox" required />
            <span>I agree to the <a href="#">Terms & Conditions</a></span>
          </label>

          <button type="submit" className="gradient-btn auth-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
