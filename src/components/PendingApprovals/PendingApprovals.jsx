import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../ChatBot/ChatBot';
import './PendingApprovals.css';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default function PendingApprovals({ userId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await client.get('/api/approvals/mine', { params: { userId } });
        const list = Array.isArray(r?.data?.approvals) ? r.data.approvals : [];
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.error || 'Failed to load approvals');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) return <div className="loading">Loading approvals…</div>;
  if (err) return <div className="error">{err}</div>;
  if (!items.length) return <div className="empty">No pending approvals</div>;

  return (
    <div className="pending-approvals">
      <h2>Pending Approvals</h2>
      <ul className="approvals-list">
        {items.map(a => (
          <li key={a.id} className="approval-item">
            <div className="approval-header">
              <h3>{a.title}</h3>
              <span className={`status ${String(a.status || 'Pending').toLowerCase()}`}>{a.status || 'Pending'}</span>
            </div>
            <div className="approval-details">
              <p>{a.description || '—'}</p>
              {/* No dates; no action buttons */}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
