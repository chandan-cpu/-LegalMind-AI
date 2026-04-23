import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { lawyerAPI } from '../api/axios';
import { useToast } from '../components/toastContext';
import { playNotificationTone, startTitleBlink } from '../utils/realtimeNotify';
import { CheckCircle2, XCircle, Search, Clock3, CircleCheckBig, BriefcaseBusiness } from 'lucide-react';
import './LawyerDashboard.css';

export default function LawyerDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [updatingRequestId, setUpdatingRequestId] = useState('');
  const [requestFilter, setRequestFilter] = useState('all');
  const [requestQuery, setRequestQuery] = useState('');
  const { addToast } = useToast();
  const blinkStopRef = useRef(null);

  const [profilePayload, setProfilePayload] = useState({
    city: '',
    whatsappNumber: '',
    consultationFee: '',
    bio: '',
    specialization: '',
    languages: '',
    availabilityStatus: 'offline',
  });

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes, requestsRes] = await Promise.all([
        lawyerAPI.adminProfile(),
        lawyerAPI.adminStats(),
        lawyerAPI.adminRequests(),
      ]);

      const profileData = profileRes.data;
      setProfile(profileData);
      setStats(statsRes.data);
      setRequests(requestsRes.data || []);

      setProfilePayload({
        city: profileData.city || '',
        whatsappNumber: profileData.whatsappNumber || '',
        consultationFee: profileData.consultationFee || '',
        bio: profileData.bio || '',
        specialization: (profileData.specialization || []).join(', '),
        languages: (profileData.languages || []).join(', '),
        availabilityStatus: profileData.availabilityStatus || 'offline',
      });
    } catch (error) {
      const finalMessage = error.response?.data?.message || 'Unable to load dashboard';
      setMessage(finalMessage);
      addToast(finalMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const token = localStorage.getItem('legalmind_lawyer_token');
    if (!token) return undefined;

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketBase = import.meta.env.VITE_SOCKET_URL || apiBase.replace(/\/api\/?$/, '');

    const socket = io(socketBase, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('consultation:message', (payload) => {
      const consultationId = payload?.consultationId;
      if (!consultationId || payload?.senderType !== 'user') return;

      playNotificationTone();
      if (document.hidden && !blinkStopRef.current) {
        blinkStopRef.current = startTitleBlink('New client message');
      }

      setRequests((prev) => prev.map((item) => (
        item._id === consultationId
          ? { ...item, unreadCount: (item.unreadCount || 0) + 1 }
          : item
      )));
    });

    socket.on('consultation:status-updated', (payload) => {
      const consultationId = payload?.consultationId;
      const nextStatus = payload?.status;
      if (!consultationId || !nextStatus) return;

      setRequests((prev) => prev.map((item) => (
        item._id === consultationId
          ? { ...item, status: nextStatus, lawyerResponseNote: payload?.lawyerResponseNote || item.lawyerResponseNote }
          : item
      )));
    });

    return () => {
      if (blinkStopRef.current) {
        blinkStopRef.current();
        blinkStopRef.current = null;
      }
      socket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('legalmind_lawyer_token');
    localStorage.removeItem('legalmind_lawyer_name');
    addToast('Logged out successfully', 'info');
    navigate('/lawyer/login');
  };

  const handleProfileUpdate = async () => {
    setMessage('');
    try {
      await lawyerAPI.updateAdminProfile({
        ...profilePayload,
        specialization: profilePayload.specialization,
        languages: profilePayload.languages,
      });
      setMessage('Profile updated');
      addToast('Profile updated', 'success');
      await loadDashboard();
    } catch (error) {
      const finalMessage = error.response?.data?.message || 'Profile update failed';
      setMessage(finalMessage);
      addToast(finalMessage, 'error');
    }
  };

  const handleRequestStatus = async (requestId, status) => {
    try {
      const currentRequest = requests.find((item) => item._id === requestId);
      setUpdatingRequestId(requestId);
      await lawyerAPI.updateRequestStatus(requestId, { status });
      addToast(`Request ${status}`, 'success');
      await loadDashboard();
      if ((status === 'accepted' || status === 'in-progress') && currentRequest?.preferredMode === 'chat') {
        navigate(`/lawyer/consultation-chat/${requestId}`);
      }
    } catch (error) {
      const finalMessage = error.response?.data?.message || 'Failed to update request';
      setMessage(finalMessage);
      addToast(finalMessage, 'error');
    } finally {
      setUpdatingRequestId('');
    }
  };

  const openRequestPdf = (requestItem) => {
    const pdfUrl = requestItem?.documentId?.fileUrl;
    if (!pdfUrl) {
      addToast('No PDF attached for this request', 'info');
      return;
    }
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const filteredRequests = useMemo(() => {
    const normalizedQuery = requestQuery.trim().toLowerCase();

    return requests.filter((item) => {
      if (requestFilter === 'pending' && item.status !== 'pending') return false;
      if (requestFilter === 'active' && !['accepted', 'in-progress'].includes(item.status)) return false;
      if (requestFilter === 'closed' && !['completed', 'rejected', 'cancelled'].includes(item.status)) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        item.userId?.name,
        item.issueSummary,
        item.preferredMode,
        item.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [requestFilter, requestQuery, requests]);

  const getStatusTone = (status) => {
    if (['accepted', 'in-progress'].includes(status)) return 'status-pill-active';
    if (status === 'pending') return 'status-pill-pending';
    return 'status-pill-closed';
  };

  if (loading) {
    return (
      <div className="lawyer-shell">
        <div className="glass-card lawyer-card">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="lawyer-shell">
      <div className="lawyer-header">
        <div className="lawyer-header-left">
          <h1 className="page-title">Lawyer Dashboard</h1>
          <p className="page-subtitle">Welcome {profile?.name || localStorage.getItem('legalmind_lawyer_name') || 'Lawyer'}</p>
          <div className={`availability-pill availability-${profilePayload.availabilityStatus}`}>
            Availability: {profilePayload.availabilityStatus}
          </div>
        </div>
        <button className="outline-btn" onClick={handleLogout}>Logout</button>
      </div>

      {message && <p className="status-text">{message}</p>}

      <div className="lawyer-stats-grid">
        <div className="glass-card lawyer-card stat-card stat-all"><h3><BriefcaseBusiness size={16} /> Total Requests</h3><p>{stats?.totalRequests || 0}</p></div>
        <div className="glass-card lawyer-card stat-card stat-pending"><h3><Clock3 size={16} /> Pending</h3><p>{stats?.pendingRequests || 0}</p></div>
        <div className="glass-card lawyer-card stat-card stat-active"><h3><CheckCircle2 size={16} /> Accepted</h3><p>{stats?.acceptedRequests || 0}</p></div>
        <div className="glass-card lawyer-card stat-card stat-complete"><h3><CircleCheckBig size={16} /> Completed</h3><p>{stats?.completedRequests || 0}</p></div>
      </div>

      <div className="lawyer-grid">
        <section className="glass-card lawyer-card">
          <h2 className="section-heading">Profile & Availability</h2>
          <div className="form-grid">
            <input className="input-field" placeholder="City" value={profilePayload.city} onChange={(e) => setProfilePayload((p) => ({ ...p, city: e.target.value }))} />
            <input className="input-field" placeholder="WhatsApp Number" value={profilePayload.whatsappNumber} onChange={(e) => setProfilePayload((p) => ({ ...p, whatsappNumber: e.target.value }))} />
            <input className="input-field" placeholder="Consultation Fee" value={profilePayload.consultationFee} onChange={(e) => setProfilePayload((p) => ({ ...p, consultationFee: e.target.value }))} />
            <input className="input-field" placeholder="Specialization (comma separated)" value={profilePayload.specialization} onChange={(e) => setProfilePayload((p) => ({ ...p, specialization: e.target.value }))} />
            <input className="input-field" placeholder="Languages (comma separated)" value={profilePayload.languages} onChange={(e) => setProfilePayload((p) => ({ ...p, languages: e.target.value }))} />
            <select className="input-field" value={profilePayload.availabilityStatus} onChange={(e) => setProfilePayload((p) => ({ ...p, availabilityStatus: e.target.value }))}>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="busy">Busy</option>
            </select>
            <textarea className="input-field" rows={4} placeholder="Bio" value={profilePayload.bio} onChange={(e) => setProfilePayload((p) => ({ ...p, bio: e.target.value }))} />
          </div>
          <button className="gradient-btn" onClick={handleProfileUpdate}>Update Profile</button>
        </section>

        <section className="glass-card lawyer-card">
          <div className="requests-head">
            <h2 className="section-heading">Consultation Requests</h2>
            <div className="request-filter-row">
              <button className={`filter-chip ${requestFilter === 'all' ? 'chip-active' : ''}`} onClick={() => setRequestFilter('all')}>All</button>
              <button className={`filter-chip ${requestFilter === 'pending' ? 'chip-active' : ''}`} onClick={() => setRequestFilter('pending')}>Pending</button>
              <button className={`filter-chip ${requestFilter === 'active' ? 'chip-active' : ''}`} onClick={() => setRequestFilter('active')}>Active</button>
              <button className={`filter-chip ${requestFilter === 'closed' ? 'chip-active' : ''}`} onClick={() => setRequestFilter('closed')}>Closed</button>
            </div>
            <label className="request-search-wrap" htmlFor="request-search">
              <Search size={15} />
              <input
                id="request-search"
                className="request-search"
                placeholder="Search by client, status, mode..."
                value={requestQuery}
                onChange={(e) => setRequestQuery(e.target.value)}
              />
            </label>
          </div>
          <div className="requests-list">
            {filteredRequests.length === 0 && <p className="empty-text">No requests found for selected filter</p>}
            {filteredRequests.map((item) => (
              <div className="request-item" key={item._id}>
                <p className="request-title">
                  {item.userId?.name || 'User'}
                  <span className={`status-pill ${getStatusTone(item.status)}`}>{item.status}</span>
                  {item.unreadCount > 0 && <span className="unread-pill">{item.unreadCount} new</span>}
                </p>
                <p className="request-summary">{item.issueSummary}</p>
                <p className="request-meta">Preferred: {item.preferredMode} | {item.preferredTime || 'Any time'}</p>
                {item.documentId?.title && (
                  <div className="request-doc-row">
                    <span className="request-doc-label">PDF: {item.documentId.title}</span>
                    <button
                      className="outline-btn action-btn"
                      onClick={() => openRequestPdf(item)}
                    >
                      View PDF
                    </button>
                  </div>
                )}
                <div className="request-actions">
                  {item.status === 'pending' && (
                    <>
                      <button className="outline-btn action-btn" onClick={() => handleRequestStatus(item._id, 'accepted')} disabled={updatingRequestId === item._id}><CheckCircle2 size={16} /> Accept</button>
                      <button className="outline-btn action-btn" onClick={() => handleRequestStatus(item._id, 'rejected')} disabled={updatingRequestId === item._id}><XCircle size={16} /> Reject</button>
                    </>
                  )}
                  {(item.status === 'accepted' || item.status === 'in-progress') && (
                    <>
                      <button className="outline-btn action-btn" onClick={() => handleRequestStatus(item._id, 'completed')} disabled={updatingRequestId === item._id}>Mark Complete</button>
                      {item.preferredMode === 'chat' && (
                        <button
                          className="outline-btn action-btn"
                          onClick={() => navigate(`/lawyer/consultation-chat/${item._id}`)}
                          disabled={updatingRequestId === item._id}
                        >
                          Open Chat
                        </button>
                      )}
                    </>
                  )}
                  {['completed', 'rejected', 'cancelled'].includes(item.status) && (
                    <span className="request-locked">Action closed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
