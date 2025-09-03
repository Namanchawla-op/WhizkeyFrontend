// src/pages/MasterDashboard.jsx
import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import AdminHeader from "../components/AdminHeader/AdminHeader";
import AdminSidebar from "../components/AdminSidebar/AdminSidebar";
import AdminStatsOverview from "../components/AdminStatsOverview/AdminStatsOverview";
import AdminRecentActivity from "../components/AdminRecentActivity/AdminRecentActivity";
import AdminPendingApprovals from "../components/AdminPendingApprovals/AdminPendingApprovals";
import AdminSystemHealth from "../components/AdminSystemHealth/AdminSystemHealth";
import AdminUserManagement from "../components/AdminUserManagement/AdminUserManagement";
import AdminQuickActions from "../components/AdminQuickActions/AdminQuickActions";
import "../styles/MasterDashboard.css";

const MasterDashboard = () => {
  const [currentView, setCurrentView] = useState("overview");
  const [user, setUser] = useState(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const r = await api.get("/api/user/me");
        if (!cancelled) setUser(r?.data || null);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.message || "Failed to load user");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="loading-page">Loading dashboard...</div>;
  if (err) return <div className="error-page">{err}</div>;
  if (!user) return <div className="error-page">User data not available</div>;

  return (
    <div className="master-dashboard">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
      />

      <div className="main-content">
        <AdminHeader
          showAIPanel={showAIPanel}
          setShowAIPanel={setShowAIPanel}
          user={user}
          onRefresh={() => setRefreshTick(t => t + 1)}
        />

        <div className="dashboard-content">
          {currentView === "overview" && (
            <>
              <AdminStatsOverview refreshKey={refreshTick} />
              <div className="dashboard-grid">
                <div className="grid-column">
                  <AdminRecentActivity refreshKey={refreshTick} />
                  <AdminPendingApprovals refreshKey={refreshTick} />
                </div>
                <div className="grid-column">
                  <AdminSystemHealth refreshKey={refreshTick} />
                  <AdminQuickActions />
                </div>
              </div>
            </>
          )}

          {currentView === "users" && <AdminUserManagement />}

          {currentView === "reports" && (
            <div className="reports-view">
              <h2>Reports & Analytics</h2>
              <div className="reports-grid">
                <div className="report-card">
                  <h3>Attendance Reports</h3>
                  <p>View and export attendance data</p>
                  <button className="report-button">Generate Report</button>
                </div>
                <div className="report-card">
                  <h3>Expense Reports</h3>
                  <p>View and export expense data</p>
                  <button className="report-button">Generate Report</button>
                </div>
                <div className="report-card">
                  <h3>Performance Metrics</h3>
                  <p>View system performance metrics</p>
                  <button className="report-button">Generate Report</button>
                </div>
              </div>
            </div>
          )}

          {showAIPanel && (
            // If/when you add AdminAIPanel, render it here
            <></>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterDashboard;
