import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import { documentsAPI, lawyerAPI } from '../api/axios';
import { useToast } from '../components/ToastProvider';
import { playNotificationTone, startTitleBlink } from '../utils/realtimeNotify';
import { UserCheck, Send, Clock } from 'lucide-react';
import './ConnectLawyer.css';

export default function ConnectLawyerPage() {
  const navigate = useNavigate();
  const [lawyers, setLawyers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedLawyerId, setSelectedLawyerId] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [issueSummary, setIssueSummary] = useState('');
  const [preferredMode, setPreferredMode] = useState('chat');
  const [preferredTime, setPreferredTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const { addToast } = useToast();
  const blinkStopRef = useRef(null);

  const selectedLawyer = useMemo(
    () => lawyers.find((item) => item._id === selectedLawyerId),
    [lawyers, selectedLawyerId]
  );

  const redirectToWhatsApp = (lawyer, summary, timeValue) => {
    const rawPhone = lawyer?.whatsappNumber || lawyer?.phone || '';
    const digitsOnly = String(rawPhone).replace(/\D/g, '');

    if (!digitsOnly) {
      addToast('Lawyer WhatsApp number is missing, cannot open WhatsApp.', 'error');
      return;
    }

    const whatsappNumber = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;
    const text = `Hi ${lawyer?.name || 'Lawyer'}, I sent a consultation request on LegalMind. Issue: ${summary}${timeValue ? ` | Preferred time: ${timeValue}` : ''}`;
    const link = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.location.href = link;
  };

  const openCallDialer = (lawyer) => {
    const rawPhone = lawyer?.phone || lawyer?.whatsappNumber || '';
    const digitsOnly = String(rawPhone).replace(/\D/g, '');

    if (!digitsOnly) {
      addToast('Lawyer phone number is missing, cannot start call.', 'error');
      return;
    }

    const dialNumber = digitsOnly.length === 10 ? `+91${digitsOnly}` : `+${digitsOnly}`;
    window.location.href = `tel:${dialNumber}`;
  };

  const openWhatsAppForRequest = (request) => {
    const lawyer = request?.lawyerId || {};
    const summary = request?.issueSummary || 'Legal consultation follow-up';
    const timeValue = request?.preferredTime || '';
    redirectToWhatsApp(lawyer, summary, timeValue);
  };

  useEffect(() => {
    const token = localStorage.getItem('legalmind_token');
    if (!token) return undefined;

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketBase = import.meta.env.VITE_SOCKET_URL || apiBase.replace(/\/api\/?$/, '');

    const socket = io(socketBase, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('consultation:status-updated', (payload) => {
      const consultationId = payload?.consultationId;
      const nextStatus = payload?.status;
      if (!consultationId || !nextStatus) return;

      const matchedRequest = myRequests.find((item) => item._id === consultationId);
      const isChatMode = matchedRequest?.preferredMode === 'chat';

      setMyRequests((prev) => prev.map((item) => (
        item._id === consultationId
          ? { ...item, status: nextStatus, lawyerResponseNote: payload?.lawyerResponseNote || item.lawyerResponseNote }
          : item
      )));

      if (nextStatus === 'accepted' || nextStatus === 'in-progress') {
        playNotificationTone();
        if (document.hidden && !blinkStopRef.current) {
          blinkStopRef.current = startTitleBlink('Lawyer accepted your request');
        }
        if (isChatMode) {
          addToast('Lawyer accepted your request. Chat opened.', 'success');
          navigate(`/consultation-chat/${consultationId}`);
        } else {
          addToast(`Lawyer accepted your ${matchedRequest?.preferredMode || 'consultation'} request.`, 'success');
        }
      }
    });

    socket.on('consultation:message', (payload) => {
      const consultationId = payload?.consultationId;
      if (!consultationId || payload?.senderType !== 'lawyer') return;

      playNotificationTone();
      if (document.hidden && !blinkStopRef.current) {
        blinkStopRef.current = startTitleBlink('New lawyer message');
      }

      setMyRequests((prev) => prev.map((item) => (
        item._id === consultationId
          ? { ...item, unreadCount: (item.unreadCount || 0) + 1 }
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
  }, [addToast, myRequests, navigate]);

  const loadData = async () => {
    try {
      const [availableRes, requestsRes, docsRes] = await Promise.all([
        lawyerAPI.listAvailable(),
        lawyerAPI.myRequests(),
        documentsAPI.getAll(),
      ]);
      setLawyers(availableRes.data || []);
      setMyRequests(requestsRes.data || []);
      setDocuments(docsRes.data || []);
      if (!selectedLawyerId && availableRes.data?.length) {
        setSelectedLawyerId(availableRes.data[0]._id);
      }
    } catch (error) {
      const finalMessage = error.response?.data?.message || 'Unable to load lawyers right now';
      setMessage(finalMessage);
      addToast(finalMessage, 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRequest = async () => {
    if (!selectedLawyerId || !issueSummary.trim()) {
      setMessage('Please select lawyer and add issue summary');
      addToast('Please select lawyer and add issue summary', 'error');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const modeToUse = preferredMode;
      const summaryValue = issueSummary.trim();
      const timeValue = preferredTime;

      await lawyerAPI.connect({
        lawyerId: selectedLawyerId,
        documentId: selectedDocumentId || undefined,
        issueSummary: summaryValue,
        preferredMode: modeToUse,
        preferredTime,
      });
      setIssueSummary('');
      setPreferredMode('chat');
      setPreferredTime('');
      setSelectedDocumentId('');
      setMessage('Consultation request submitted successfully');
      addToast('Consultation request submitted successfully', 'success');
      await loadData();

      if (modeToUse === 'whatsapp') {
        redirectToWhatsApp(selectedLawyer, summaryValue, timeValue);
      }
    } catch (error) {
      const finalMessage = error.response?.data?.message || 'Failed to submit request';
      setMessage(finalMessage);
      addToast(finalMessage, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-header">
          <div>
            <h1 className="page-title">Connect Verified Lawyer</h1>
            <p className="page-subtitle">Raise a request if AI answer is not enough</p>
          </div>
        </div>

        <div className="connect-grid">
          <section className="glass-card connect-card">
            <h2 className="section-heading">Create Consultation Request</h2>

            <label className="input-label">Select Lawyer</label>
            <select className="input-field" value={selectedLawyerId} onChange={(e) => setSelectedLawyerId(e.target.value)}>
              <option value="">Select one</option>
              {lawyers.map((lawyer) => (
                <option key={lawyer._id} value={lawyer._id}>
                  {lawyer.name} | {lawyer.city || 'NA'} | Fee: {lawyer.consultationFee || 0}
                </option>
              ))}
            </select>

            {selectedLawyer && (
              <div className="selected-lawyer-box">
                <div className="selected-row">
                  <UserCheck size={16} /> {selectedLawyer.name}
                </div>
                <p className="selected-meta">
                  Specialization: {(selectedLawyer.specialization || []).join(', ') || 'General'}
                </p>
                <p className="selected-meta">Status: {selectedLawyer.availabilityStatus}</p>
              </div>
            )}

            <label className="input-label">Issue Summary</label>
            <textarea
              className="input-field"
              rows={4}
              placeholder="Explain your legal issue in short"
              value={issueSummary}
              onChange={(e) => setIssueSummary(e.target.value)}
            />

            <label className="input-label">Attach PDF (Optional)</label>
            <select
              className="input-field"
              value={selectedDocumentId}
              onChange={(e) => setSelectedDocumentId(e.target.value)}
            >
              <option value="">No document</option>
              {documents.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.title}
                </option>
              ))}
            </select>

            <div className="row-2">
              <div>
                <label className="input-label">Preferred Mode</label>
                <select className="input-field" value={preferredMode} onChange={(e) => setPreferredMode(e.target.value)}>
                  <option value="chat">Chat</option>
                  <option value="call">Call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="in-person">In Person</option>
                </select>
              </div>
              <div>
                <label className="input-label">Preferred Time</label>
                <input
                  className="input-field"
                  placeholder="e.g. Tomorrow 5PM"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                />
              </div>
            </div>

            <button className="gradient-btn" onClick={handleCreateRequest} disabled={busy}>
              <Send size={16} /> {busy ? 'Submitting...' : 'Submit Request'}
            </button>
            {message && <p className="status-text">{message}</p>}
          </section>

          <section className="glass-card connect-card">
            <h2 className="section-heading">My Consultation Requests</h2>
            <div className="requests-list">
              {myRequests.length === 0 && <p className="empty-text">No consultation requests yet.</p>}
              {myRequests.map((item) => (
                <div className="request-item" key={item._id}>
                  <div className="request-title">
                    {item.lawyerId?.name || 'Lawyer'} | {item.status}
                    {item.unreadCount > 0 && <span className="unread-pill">{item.unreadCount} new</span>}
                  </div>
                  <p className="request-summary">{item.issueSummary}</p>
                  <div className="request-meta">
                    <span><Clock size={14} /> {new Date(item.createdAt).toLocaleString()}</span>
                    <span>Mode: {item.preferredMode}</span>
                  </div>
                  {item.documentId?.title && (
                    <p className="request-doc">Attached PDF: {item.documentId.title}</p>
                  )}
                  {item.lawyerResponseNote && (
                    <p className="request-note">Lawyer Note: {item.lawyerResponseNote}</p>
                  )}
                  {(item.status === 'accepted' || item.status === 'in-progress') && (
                    <div className="request-actions">
                      {item.preferredMode === 'chat' && (
                        <button
                          className="outline-btn action-btn"
                          onClick={() => navigate(`/consultation-chat/${item._id}`)}
                        >
                          Open Chat
                        </button>
                      )}
                      {item.preferredMode === 'call' && (
                        <button
                          className="outline-btn action-btn"
                          onClick={() => openCallDialer(item.lawyerId)}
                        >
                          Call Now
                        </button>
                      )}
                      {item.preferredMode === 'whatsapp' && (
                        <button
                          className="outline-btn action-btn"
                          onClick={() => openWhatsAppForRequest(item)}
                        >
                          WhatsApp Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
