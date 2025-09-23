import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../ChatBot/ChatBot';
import './RecentActivity.css';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const normalize = (data) => {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
};

export default function RecentActivity() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const r = await client.get('/api/activity/recent'); // /api/activity/recent
        const list = normalize(r?.data);
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setErr('Failed to load activity');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    // light polling to keep it fresh without heavy reflows
    const id = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (loading) return <div className="loading">Loading activity…</div>;
  if (err) return <div className="error">{err}</div>;
  if (!items.length) return <div className="empty">No recent activity</div>;

  return (
    <div className="recent-activity">
      <h2>Recent Activity</h2>
      <ul className="activity-list">
        {items.map((a, i) => (
          <li key={i} className="activity-item">
            <div className="activity-avatar" />
            <div className="activity-body">
              <div className="activity-text">{a.message || a.text || a.type}</div>
              {/* Intentionally no date/time */}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
