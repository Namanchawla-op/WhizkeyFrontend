import React, { useEffect, useState } from 'react';
import './StatsPanel.css';
import { sup } from '../../utils/supervisorApi';

const ORG_ID = Number(process.env.REACT_APP_ORG_ID || 1);

export default function StatsPanel({ role }) {
  const [stats, setStats] = useState({ pending: 0, completed: 0, delayed: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await sup.stats(role, ORG_ID);
      const s = res?.data || {};
      setStats({
        pending: Number(s.pending || 0),
        completed: Number(s.completed || 0),
        delayed: Number(s.delayed || 0),
      });
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || 'Failed to load statistics');
      setStats({ pending: 0, completed: 0, delayed: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (loading) return <div className="stats-panel loading">Loading statistics...</div>;
  if (err) return <div className="stats-panel error">{err}</div>;

  return (
    <div className="stats-panel">
      <div className="stats-card">
        <div className="stats-title">Pending</div>
        <div className="stats-value">{stats.pending}</div>
      </div>
      <div className="stats-card">
        <div className="stats-title">Completed</div>
        <div className="stats-value">{stats.completed}</div>
      </div>
      <div className="stats-card">
        <div className="stats-title">Delayed</div>
        <div className="stats-value">{stats.delayed}</div>
      </div>
    </div>
  );
}
