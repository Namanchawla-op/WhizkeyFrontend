import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './RecentActivity.css';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'http://ec2-13-60-104-32.eu-north-1.compute.amazonaws.com:3001';

const RecentActivity = () => {
  const [items, setItems]   = useState([]);   // always keep an array
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchActivity = async () => {
      try {
        setLoad(true);
        setError(null);

        // Adjust the path later if you prefer another route name
        const res = await axios.get(`${API_BASE_URL}/api/activity/recent`);

        // Accept multiple possible shapes and ALWAYS store an array
        const raw =
          res?.data?.activities ??   // { activities: [...] }
          res?.data?.data ??         // { data: [...] }
          res?.data ??               // [ ... ]
          [];

        if (!cancelled) setItems(Array.isArray(raw) ? raw : []);
      } catch (e) {
        console.error('RecentActivity fetch error:', e?.message, e?.response?.data);
        if (!cancelled) {
          setError(e?.response?.data?.message || 'Failed to fetch recent activity');
          setItems([]); // keep it an array so .map is safe
        }
      } finally {
        if (!cancelled) setLoad(false);
      }
    };

    fetchActivity();
    return () => { cancelled = true; };
  }, []);

  const list = Array.isArray(items) ? items : []; // safety net

  if (loading) return <div className="loading">Loading recent activity…</div>;
  if (error)   return <div className="error">{error}</div>;
  if (list.length === 0) return <div className="empty">No recent activity</div>;

  return (
    <ul className="activity-list">
      {list.map((a) => (
        <li key={a.id || a.timestamp} className="activity-item">
          <div className="activity-icon">
            {a.type === 'clockIn'   && '⏰'}
            {a.type === 'expense'   && '💳'}
            {a.type === 'stationery'&& '🖊️'}
            {a.type === 'approval'  && '✅'}
          </div>

          <div className="activity-content">
            <p>{a.message}</p>
            <span className="activity-time">
              {a.timestamp
                ? new Date(a.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '—'}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default RecentActivity;
