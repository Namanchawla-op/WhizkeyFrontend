// src/pages/EmployerPage.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

import EmployerHeader from '../components/EmployerHeader/EmployerHeader';
import Sidebar from '../components/Sidebar/Sidebar';
import StatsPanel from '../components/StatsPanel/StatsPanel';
import RequestsTable from '../components/RequestsTable/RequestsTable';
import NewRequestForm from '../components/NewRequestForm/NewRequestForm';
import AIPanel from '../components/AIPanel/AIPanel';
import AttendanceView from '../components/AttendanceView/AttendanceView';

import '../styles/EmployerPage.css';

const EmployerPage = () => {
  // views: 'dashboard' | 'attendance' | 'reports'
  const [currentView, setCurrentView] = useState('dashboard');

  // role coming from backend user record; default safely to 'hr'
  const [role, setRole] = useState('hr');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAIPanel, setShowAIPanel] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // local UI filters
  const [filter, setFilter] = useState('all'); // 'all' | 'today' | 'delayed'
  const [refreshTick, setRefreshTick] = useState(0); // bump to force child reloads

  // Reload children whenever the role changes (HR / Finance / Logistics)
  useEffect(() => {
    setRefreshTick(t => t + 1);
  }, [role]);

  // Load the signed-in user so we can infer role + show name/avatar etc.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/user/me');
        if (!cancelled) {
          setUser(res.data);
          // trust backend if it returns a role; otherwise keep default 'hr'
          const r = (res.data?.role || '').toString().toLowerCase();
          if (r === 'hr' || r === 'finance' || r === 'logistics') {
            setRole(r);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
            err?.message ||
            'Failed to load user data'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="loading-page">Loading dashboard...</div>;
  if (error)   return <div className="error-page">{error}</div>;
  if (!user)   return <div className="error-page">User data not available</div>;

  const panelTitle =
    role === 'hr'        ? 'Onboarding Requests' :
    role === 'finance'   ? 'Expense Approvals'   :
    role === 'logistics' ? 'Resource Requests'   :
    'Requests';

  return (
    <div className="employer-page">
      {/* Mobile toggle */}
      <button
        className="sidebar-trigger"
        aria-label="Toggle menu"
        onClick={() => setSidebarCollapsed(s => !s)}
      >
        ≡
      </button>

      {/* Click-away backdrop (mobile) */}
      {!sidebarCollapsed && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        currentView={currentView}
        setCurrentView={setCurrentView}
        role={role}
        setRole={setRole}
        user={user}
      />

      <div className="main-content">
        <EmployerHeader
          showAIPanel={showAIPanel}
          setShowAIPanel={setShowAIPanel}
          user={user}
        />

        <div className="dashboard-content">
          {/* DASHBOARD */}
          {currentView === 'dashboard' && (
            <div className="request-panel">
              <div className="panel-header">
                <div className="panel-title">{panelTitle}</div>
                <div className="panel-actions">
                  <button
                    className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className={`filter-button ${filter === 'today' ? 'active' : ''}`}
                    onClick={() => setFilter('today')}
                  >
                    Today
                  </button>
                  <button
                    className={`filter-button ${filter === 'delayed' ? 'active' : ''}`}
                    onClick={() => setFilter('delayed')}
                  >
                    Delayed
                  </button>

                  <button
                    className="refresh-button"
                    title="Refresh"
                    onClick={() => setRefreshTick(t => t + 1)}
                    aria-label="Refresh"
                  >
                    🔄
                  </button>
                </div>
              </div>

              <StatsPanel role={role} refreshTick={refreshTick} />

              {/* Only HR can create new requests from this screen */}
              {role === 'hr' && (
                <NewRequestForm onCreated={() => setRefreshTick(t => t + 1)} />
              )}

              <RequestsTable role={role} filter={filter} refreshTick={refreshTick} />
            </div>
          )}

          {/* ATTENDANCE */}
          {currentView === 'attendance' && (
            <AttendanceView role={role} refreshTick={refreshTick} />
          )}

          {/* REPORTS (placeholder) */}
          {currentView === 'reports' && (
            <div className="reports-view">
              <h2>Reports &amp; Analytics</h2>
              <p>Reports view will be implemented here with charts and data visualizations.</p>
            </div>
          )}

          {/* AI panel */}
          {showAIPanel && (
            <AIPanel
              showAIPanel={showAIPanel}
              setShowAIPanel={setShowAIPanel}
              role={role}
              userId={user.id}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerPage;
