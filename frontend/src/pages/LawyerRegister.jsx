import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { lawyerAPI } from '../api/axios';
import { useToast } from '../components/ToastProvider';
import './LawyerLogin.css';

export default function LawyerRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    whatsappNumber: '',
    specialization: '',
    barCouncilId: '',
    city: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await lawyerAPI.register(form);
      setMessage('Registration submitted. Please wait for super-admin approval, then login.');
      addToast('Lawyer registration submitted for approval', 'success');
      setTimeout(() => navigate('/lawyer/login'), 1200);
    } catch (err) {
      const finalMessage = err.response?.data?.message || 'Registration failed';
      setError(finalMessage);
      addToast(finalMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <form className="glass-card auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Shield size={24} className="auth-brand-icon" />
          <span>LegalMind<span className="brand-ai">AI</span></span>
        </div>

        <h1 className="auth-title">Lawyer Sign Up</h1>
        <p className="auth-subtitle">Create lawyer account for verification</p>

        <input className="input-field" type="text" placeholder="Full Name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
        <input className="input-field" type="email" placeholder="Email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required />
        <input className="input-field" type="password" placeholder="Password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} required />
        <input className="input-field" type="text" placeholder="Phone" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
        <input className="input-field" type="text" placeholder="WhatsApp Number" value={form.whatsappNumber} onChange={(e) => handleChange('whatsappNumber', e.target.value)} />
        <input className="input-field" type="text" placeholder="Specialization (comma separated)" value={form.specialization} onChange={(e) => handleChange('specialization', e.target.value)} />
        <input className="input-field" type="text" placeholder="Bar Council ID" value={form.barCouncilId} onChange={(e) => handleChange('barCouncilId', e.target.value)} />
        <input className="input-field" type="text" placeholder="City" value={form.city} onChange={(e) => handleChange('city', e.target.value)} />

        <button className="gradient-btn auth-btn" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Register as Lawyer'}
        </button>

        {message && <p className="status-text">{message}</p>}
        {error && <p className="auth-error">{error}</p>}

        <p className="auth-subtitle" style={{ marginTop: 4 }}>
          Already registered? <Link to="/lawyer/login">Lawyer Login</Link>
        </p>
      </form>
    </div>
  );
}
