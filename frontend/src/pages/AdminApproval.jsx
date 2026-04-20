import { useEffect, useState } from 'react';
import { superAdminAPI } from '../api/axios';
import { useToast } from '../components/ToastProvider';
import './AdminApproval.css';

export default function AdminApprovalPage() {
  const [email, setEmail] = useState('admin@legalmind.ai');
  const [password, setPassword] = useState('admin12345');
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('legalmind_admin_token'));

  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [actionLawyerId, setActionLawyerId] = useState('');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const { addToast } = useToast();

  const loadLawyers = async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getAllLawyers();
      setLawyers(res.data || []);
    } catch (error) {
      const finalMessage = error.response?.data?.message || 'Failed to load lawyers';
      setMessage(finalMessage);
      addToast(finalMessage, 'error');
    } finally {
      setLoading(false);
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
    const rejectionReason =
      action === 'reject'
        ? window.prompt('Reason for rejection?') || 'Rejected by super-admin'
        : undefined;

    try {
      setActionLawyerId(lawyerId);
      await superAdminAPI.verifyLawyer(lawyerId, action, rejectionReason);
      addToast(`Lawyer ${action}d successfully`, 'success');
      await loadLawyers();
    } catch (error) {
      const finalMessage =
        error.response?.data?.message || 'Verification update failed';
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

  // 🔍 Filter logic
  const filteredLawyers = lawyers.filter((lawyer) => {
    const matchesSearch =
      lawyer.name.toLowerCase().includes(search.toLowerCase()) ||
      lawyer.email.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === 'all' || lawyer.verificationStatus === filter;

    return matchesSearch && matchesFilter;
  });

  if (!loggedIn) {
    return (
      <div className="admin-shell">
        <form className="glass-card admin-login-card" onSubmit={handleLogin}>
          <h1 className="auth-title">Super Admin Approval</h1>
          <p className="auth-subtitle">
            Approve or reject lawyer registrations
          </p>

          <input
            className="input-field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="input-field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="gradient-btn auth-btn" type="submit">
            Login
          </button>

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
          <p className="page-subtitle">
            Pending lawyers must be approved before going live
          </p>
        </div>
        <button className="outline-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* 🔍 Controls */}
      <div className="admin-controls">
        <input
          type="text"
          placeholder="Search lawyers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading && <p className="status-text">Loading lawyers...</p>}
      {message && <p className="status-text">{message}</p>}

      <div className="admin-grid">
        {filteredLawyers.length === 0 && (
          <p className="empty-text">No lawyers found</p>
        )}

        {filteredLawyers.map((lawyer) => (
          <div
            className="glass-card admin-lawyer-card"
            key={lawyer._id}
            onClick={() =>
              setExpandedId(expandedId === lawyer._id ? null : lawyer._id)
            }
          >
            <h3>{lawyer.name}</h3>
            <p>{lawyer.email}</p>
            <p>City: {lawyer.city || 'NA'}</p>

            <p>
              Status:{' '}
              <span className={`status-badge ${lawyer.verificationStatus}`}>
                {lawyer.verificationStatus}
              </span>
            </p>

            {/* Expand */}
            {expandedId === lawyer._id && (
              <div className="extra-info">
                <p>
                  Specialization:{' '}
                  {(lawyer.specialization || []).join(', ') || 'General'}
                </p>
                {lawyer.rejectionReason && (
                  <p>Reason: {lawyer.rejectionReason}</p>
                )}
              </div>
            )}

            {lawyer.verificationStatus === 'pending' ? (
              <div className="admin-actions">
                <button
                  className="gradient-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVerify(lawyer._id, 'approve');
                  }}
                  disabled={actionLawyerId === lawyer._id}
                >
                  {actionLawyerId === lawyer._id
                    ? 'Processing...'
                    : 'Approve'}
                </button>

                <button
                  className="outline-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVerify(lawyer._id, 'reject');
                  }}
                  disabled={actionLawyerId === lawyer._id}
                >
                  Reject
                </button>
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