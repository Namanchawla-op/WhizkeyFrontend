import React, { useEffect, useState } from 'react';
import axios from 'axios';

import Header from '../components/Header/Header';
import ChatBot, { API_BASE_URL } from '../components/ChatBot/ChatBot';
import ActionButtons from '../components/ActionButtons/ActionButtons';
import PendingApprovals from '../components/PendingApprovals/PendingApprovals';
import RecentActivity from '../components/RecentActivity/RecentActivity';
import QuickActions from '../components/QuickActions/QuickActions';

import '../styles/EmployeePage.css';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default function EmployeePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await client.get('/api/user/me');
        const d = res?.data || {};
        if (!cancelled) {
          setUser({
            id: d.id ?? d._id ?? 1,
            name: d.name ?? 'Demo User',
            role: d.role ?? 'employee',
            avatar: (d.initials || d.name?.charAt(0) || 'U').toUpperCase(),
          });
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || 'Failed to load user');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (loading) return <div className="loading-page">Loading dashboard...</div>;
  if (error) return <div className="error-page">{error}</div>;
  if (!user) return <div className="error-page">User data not available</div>;

  return (
    <div className="employee-dashboard">
      <div className="dashboard-header">
        {/* If your Header shows a date element, hide it via CSS (below) */}
        <Header user={user} currentTime={currentTime} />
      </div>

      <div className="dashboard-content">
        <div className="left-panel">
          <div className="greeting-section">
            <h1>Hello {user.name} 👋</h1>
            <p>Welcome to your WhizKey dashboard</p>
          </div>

          <div className="chat-section">
            <ChatBot userId={user.id} />
          </div>

          <div className="actions-section">
            <ActionButtons />
          </div>
        </div>

        <div className="right-panel">
          <div className="approvals-section">
            <PendingApprovals userId={user.id} />
          </div>

          <div className="activity-section">
            <RecentActivity />
          </div>

          <div className="quick-actions-section">
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}
