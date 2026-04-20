import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { lawyerAPI } from '../api/axios';
import { useToast } from '../components/ToastProvider';
import './LawyerLogin.css';

export default function LawyerLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await lawyerAPI.login(email, password);
      localStorage.setItem('legalmind_lawyer_token', res.data.token);
      localStorage.setItem('legalmind_lawyer_name', res.data.name);
      addToast('Lawyer login successful', 'success');
      navigate('/lawyer/dashboard');
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Login failed';
      const rejectionReason = error.response?.data?.rejectionReason;
      const finalMessage = rejectionReason ? `${serverMessage}: ${rejectionReason}` : serverMessage;
      setMessage(finalMessage);
      addToast(finalMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <form className="glass-card auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">Lawyer Admin Login</h1>
        <p className="auth-subtitle">Login after super-admin approval</p>

        <input
          className="input-field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="gradient-btn auth-btn" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : 'Login'}
        </button>

        {message && <p className="auth-error">{message}</p>}
        <p className="auth-subtitle" style={{ marginTop: 4 }}>
          New lawyer? <Link to="/lawyer/register">Sign up here</Link>
        </p>
      </form>
    </div>
  );
}
