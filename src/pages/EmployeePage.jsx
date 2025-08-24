import React, { useEffect, useState } from 'react';
import axios from 'axios';

import Header from '../components/Header/Header';
import ChatBot, { API_BASE_URL } from '../components/ChatBot/ChatBot';
import ActionButtons from '../components/ActionButtons/ActionButtons';
import PendingApprovals from '../components/PendingApprovals/PendingApprovals';
import RecentActivity from '../components/RecentActivity/RecentActivity';
import QuickActions from '../components/QuickActions/QuickActions';

import '../styles/EmployeePage.css';

// one axios client that respects the same base URL as ChatBot
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const EmployeePage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // load the signed-in (or demo) user
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await client.get('/api/user/me');
        // backend returns: { id: 1, name: "Demo User", role: "employee" }
        const data = res?.data || {};
        if (!cancelled) {
          setUser({
            id: data.id ?? data._id ?? 'demo-user',
            name: data.name ?? 'Demo User',
            role: data.role ?? 'employee',
            avatar: (data.initials || data.name?.charAt(0) || 'U').toUpperCase(),
          });
        }
      } catch (e) {
        console.error('❌ /api/user/me failed', e?.message, e?.response?.data);
        if (!cancelled) setError(e?.response?.data?.message || 'Failed to load user');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // Optional: you can use this to react to completed actions (toast/log)
  const handleActionComplete = (actionType, payload) => {
    // no-op for now; ChatBot handles commands typed by user
    // console.log(`${actionType} completed`, payload);
  };

  if (loading) return <div className="loading-page">Loading dashboard...</div>;
  if (error) return <div className="error-page">{error}</div>;
  if (!user) return <div className="error-page">User data not available</div>;

  return (
    <div className="employee-dashboard">
      <div className="dashboard-header">
        <Header user={user} currentTime={currentTime} />
      </div>

      <div className="dashboard-content">
        <div className="left-panel">
          <div className="greeting-section">
            <h1>Hello {user.name} 👋</h1>
            <p>Welcome to your WhizKey dashboard</p>
          </div>

          <div className="chat-section">
            {/* ChatBot already knows how to hit the backend and handle commands */}
            <ChatBot userId={user.id} />
          </div>

          <div className="actions-section">
            {/* keep your existing component — it can stay exactly as-is */}
            <ActionButtons onActionComplete={handleActionComplete} />
          </div>
        </div>

        <div className="right-panel">
          <div className="approvals-section">
            <PendingApprovals />
          </div>

          <div className="activity-section">
            {/* make sure your RecentActivity.jsx is defensive with Array.isArray */}
            <RecentActivity />
          </div>

          <div className="quick-actions-section">
            <QuickActions onAction={handleActionComplete} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePage;
