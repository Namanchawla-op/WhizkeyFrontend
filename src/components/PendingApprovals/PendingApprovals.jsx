import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../ChatBot/ChatBot';
import './PendingApprovals.css';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// normalize whatever the backend sends into a neat array of approvals
const pickApprovalsArray = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.approvals)) return d.approvals;
  if (Array.isArray(d?.data)) return d.data;
  return [];
};

const PendingApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        // This endpoint exists in your backend: GET /api/approvals/pending
        const res = await client.get('/api/approvals/pending');
        const list = pickApprovalsArray(res);
        if (!cancelled) setApprovals(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('Approvals fetch error:', e?.message, e?.response?.data);
        if (!cancelled) setErr(e?.response?.data?.message || 'Not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const handleApprove = async (id) => {
    try {
      await client.post(`/api/approvals/${id}/approve`);
      setApprovals((prev) => prev.filter((x) => (x.id ?? x._id) !== id));
    } catch (e) {
      setErr(e?.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await client.post(`/api/approvals/${id}/reject`);
      setApprovals((prev) => prev.filter((x) => (x.id ?? x._id) !== id));
    } catch (e) {
      setErr(e?.response?.data?.message || 'Rejection failed');
    }
  };

  // safe array to map
  const list = Array.isArray(approvals) ? approvals : [];

  return (
    <div className="pending-approvals">
      <h2>Pending Approvals</h2>

      {loading ? (
        <div className="loading">Loading approvals...</div>
      ) : err ? (
        <div className="error">{err}</div>
      ) : list.length === 0 ? (
        <div className="empty">No pending approvals</div>
      ) : (
        <ul className="approvals-list">
          {list.map((approval) => {
            const id = approval.id ?? approval._id ?? `${approval.title}-${approval.createdAt}`;
            const status = (approval.status || 'Pending').toString();
            const createdAt = approval.createdAt || approval.created_at || new Date().toISOString();
            const type = approval.type || 'General';

            return (
              <li key={id} className="approval-item">
                <div className="approval-header">
                  <h3>{approval.title || type}</h3>
                  <span className={`status ${status.toLowerCase()}`}>{status}</span>
                </div>

                <div className="approval-details">
                  <p>{approval.description || '—'}</p>
                  <div className="approval-meta">
                    <span>Requested on: {new Date(createdAt).toLocaleDateString()}</span>
                    <span>Type: {type}</span>
                  </div>
                </div>

                <div className="approval-actions">
                  <button
                    onClick={() => handleApprove(id)}
                    className="approve-button"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(id)}
                    className="reject-button"
                  >
                    Reject
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PendingApprovals;
