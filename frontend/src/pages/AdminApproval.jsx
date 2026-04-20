import { useEffect, useState } from 'react';
import { superAdminAPI } from '../api/axios';
import { useToast } from '../components/ToastProvider';
import './AdminApproval.css';

export default function AdminApprovalPage() {
  const [email, setEmail] = useState('admin@legalmind.ai');
  const [password, setPassword] = useState('admin12345');
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('legalmind_admin_token'));
  const [lawyers, setLawyers] = useState([]);
  const [message, setMessage] = useState('');
  const [actionLawyerId, setActionLawyerId] = useState('');
  const { addToast } = useToast();

  const loadLawyers = async () => {
    try {
      const res = await superAdminAPI.getAllLawyers();
      setLawyers(res.data || []);
    } catch (error) {
      const finalMessage = error.response?.data?.message || 'Failed to load lawyers';
      setMessage(finalMessage);
      addToast(finalMessage, 'error');
    }
  };

  useEffect(() => {
    if (loggedIn) {
      loadLawyers();
    }
  }, [loggedIn]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const res = await superAdminAPI.login(email, password);
      localStorage.setItem('legalmind_admin_token', res.data.token);
      setLoggedIn(true);
      addToast('Super admin login successful', 'success');
    } catch (error) {
      const finalMessage = error.response?.data?.message || 'Login failed';
      setMessage(finalMessage);
      addToast(finalMessage, 'error');
    }
  };

  const handleVerify = async (lawyerId, action) => {
    const rejectionReason = action === 'reject' ? window.prompt('Reason for rejection?') || 'Rejected by super-admin' : undefined;
    try {
      setActionLawyerId(lawyerId);
      await superAdminAPI.verifyLawyer(lawyerId, action, rejectionReason);
      addToast(`Lawyer ${action}d successfully`, 'success');
      await loadLawyers();
    } catch (error) {
      const finalMessage = error.response?.data?.message || 'Verification update failed';
      setMessage(finalMessage);
      addToast(finalMessage, 'error');
    } finally {
      setActionLawyerId('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('legalmind_admin_token');
    setLoggedIn(false);
    setLawyers([]);
    addToast('Super admin logged out', 'info');
  };

  if (!loggedIn) {
    return (
      <div className="admin-shell">
        <form className="glass-card admin-login-card" onSubmit={handleLogin}>
          <h1 className="auth-title">Super Admin Approval</h1>
          <p className="auth-subtitle">Approve or reject lawyer registrations</p>
          <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="gradient-btn auth-btn" type="submit">Login</button>
          {message && <p className="auth-error">{message}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-header">
        <div>
          <h1 className="page-title">Lawyer Verification Queue</h1>
          <p className="page-subtitle">Pending lawyers must be approved before going live</p>
        </div>
        <button className="outline-btn" onClick={handleLogout}>Logout</button>
      </div>

      {message && <p className="status-text">{message}</p>}

      <div className="admin-grid">
        {lawyers.length === 0 && <p className="empty-text">No lawyers found</p>}
        {lawyers.map((lawyer) => (
          <div className="glass-card admin-lawyer-card" key={lawyer._id}>
            <h3>{lawyer.name}</h3>
            <p>{lawyer.email}</p>
            <p>City: {lawyer.city || 'NA'}</p>
            <p>Status: <b>{lawyer.verificationStatus}</b></p>
            <p>Specialization: {(lawyer.specialization || []).join(', ') || 'General'}</p>
            {lawyer.rejectionReason && <p>Reason: {lawyer.rejectionReason}</p>}
            {lawyer.verificationStatus === 'pending' ? (
              <div className="admin-actions">
                <button className="gradient-btn" onClick={() => handleVerify(lawyer._id, 'approve')} disabled={actionLawyerId === lawyer._id}>Approve</button>
                <button className="outline-btn" onClick={() => handleVerify(lawyer._id, 'reject')} disabled={actionLawyerId === lawyer._id}>Reject</button>
              </div>
            ) : (
              <p className="admin-locked">Action closed</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
