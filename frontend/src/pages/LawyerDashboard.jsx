import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { lawyerAPI } from '../api/axios';
import { useToast } from '../components/ToastProvider';
import { playNotificationTone, startTitleBlink } from '../utils/realtimeNotify';
import { CheckCircle2, XCircle } from 'lucide-react';
import './LawyerDashboard.css';

export default function LawyerDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [updatingRequestId, setUpdatingRequestId] = useState('');
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

  const loadDashboard = async () => {
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
  };

  useEffect(() => {
    loadDashboard();
  }, []);

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
        <div>
          <h1 className="page-title">Lawyer Dashboard</h1>
          <p className="page-subtitle">Welcome {profile?.name || localStorage.getItem('legalmind_lawyer_name') || 'Lawyer'}</p>
        </div>
        <button className="outline-btn" onClick={handleLogout}>Logout</button>
      </div>

      {message && <p className="status-text">{message}</p>}

      <div className="lawyer-stats-grid">
        <div className="glass-card lawyer-card"><h3>Total Requests</h3><p>{stats?.totalRequests || 0}</p></div>
        <div className="glass-card lawyer-card"><h3>Pending</h3><p>{stats?.pendingRequests || 0}</p></div>
        <div className="glass-card lawyer-card"><h3>Accepted</h3><p>{stats?.acceptedRequests || 0}</p></div>
        <div className="glass-card lawyer-card"><h3>Completed</h3><p>{stats?.completedRequests || 0}</p></div>
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
          <h2 className="section-heading">Consultation Requests</h2>
          <div className="requests-list">
            {requests.length === 0 && <p className="empty-text">No requests found</p>}
            {requests.map((item) => (
              <div className="request-item" key={item._id}>
                <p className="request-title">
                  {item.userId?.name || 'User'} | {item.status}
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
