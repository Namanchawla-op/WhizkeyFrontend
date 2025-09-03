// src/components/AdminStatsOverview/AdminStatsOverview.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../utils/api";
import "./AdminStatsOverview.css";

/**
 * We aggregate "real" stats from the endpoints your backend exposes:
 * - Pending approvals:     GET /api/approvals/pending
 * - Expense claims list:   GET /api/expense/list?organization_id=1
 * - Stationery requests:   GET /api/stationery?organization_id=1  (fallback /api/stationery/requests)
 * - Travel requests:       GET /api/travel/requests?organization_id=1
 * - Onboarding requests:   GET /api/onboarding/all?organization_id=1
 * - Attendance (active):   GET /api/hr/attendance?organization_id=1  (fallbacks applied)
 * - Users (best-effort):   GET /api/admin/users OR /api/users OR fallback to 1 via /api/user/me
 */

const ORG_ID = Number(process.env.REACT_APP_ORG_ID || 1);

async function tryGet(pathsWithParams = []) {
  for (const entry of pathsWithParams) {
    try {
      const r = await api.get(entry.path, { params: entry.params || {} });
      if (r?.status >= 200 && r?.status < 300) return r;
    } catch (_) {}
  }
  return null;
}

function arr(val) {
  if (Array.isArray(val)) return val;
  if (Array.isArray(val?.data)) return val.data;
  if (Array.isArray(val?.items)) return val.items;
  if (Array.isArray(val?.approvals)) return val.approvals;
  if (Array.isArray(val?.requests)) return val.requests;
  return [];
}

export default function AdminStatsOverview({ refreshKey = 0 }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    activeSessions: 0,
    requestsToday: 0,
    totalExpenses: 0,
    uptime: "—",
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [approvalsR, expenseR, stationR, travelR, onboardR, attendR, usersR, meR] =
          await Promise.all([
            tryGet([{ path: "/api/approvals/pending" }]),
            tryGet([
              { path: "/api/expense/list", params: { organization_id: ORG_ID } },
              { path: "/api/expense" },
            ]),
            tryGet([
              { path: "/api/stationery", params: { organization_id: ORG_ID } },
              { path: "/api/stationery/requests" },
            ]),
            tryGet([{ path: "/api/travel/requests", params: { organization_id: ORG_ID } }]),
            tryGet([{ path: "/api/onboarding/all", params: { organization_id: ORG_ID } }]),
            tryGet([
              { path: "/api/hr/attendance", params: { organization_id: ORG_ID } },
              { path: "/api/attendance" },
            ]),
            tryGet([
              { path: "/api/admin/users" },
              { path: "/api/users" },
              { path: "/api/user/all" },
              { path: "/api/user/list" },
            ]),
            tryGet([{ path: "/api/user/me" }]),
          ]);

        const approvals = arr(approvalsR?.data);
        const expenses = arr(expenseR?.data);
        const stationery = arr(stationR?.data);
        const travels = arr(travelR?.data);
        const onboard = arr(onboardR?.data);
        const attendance = arr(attendR?.data);
        const usersArr = arr(usersR?.data);

        const todayISO = new Date().toISOString().slice(0, 10);
        const isToday = (d) => {
          if (!d) return false;
          const iso = new Date(d).toISOString().slice(0, 10);
          return iso === todayISO;
        };

        const requestsToday =
          expenses.filter((x) => isToday(x.createdAt || x.created_at)).length +
          stationery.filter((x) => isToday(x.createdAt || x.created_at)).length +
          travels.filter((x) => isToday(x.createdAt || x.created_at)).length +
          onboard.filter((x) => isToday(x.createdAt || x.created_at)).length;

        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

        // "Active sessions" = attendance entries with a check-in today and either no check-out yet or still "present"
        const activeSessions = attendance.filter((a) => {
          const inToday = isToday(a.clock_in || a.clockIn || a.createdAt);
          const outEmpty = !a.clock_out && !a.clockOut;
          const status = (a.status || "").toString().toLowerCase();
          return inToday && (outEmpty || status === "present");
        }).length;

        let totalUsers = 0;
        if (usersArr.length) totalUsers = usersArr.length;
        else if (meR?.data) totalUsers = 1; // fallback if only /me is available

        const next = {
          totalUsers,
          pendingApprovals: approvals.length,
          activeSessions,
          requestsToday,
          totalExpenses,
          uptime: "N/A", // No native endpoint; leave as N/A to avoid dummy numbers
        };

        if (!cancelled) setStats(next);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.message || "Failed to load statistics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [refreshKey]);

  if (loading) return <div className="stats-overview loading">Loading statistics...</div>;
  if (err) return <div className="stats-overview error">{err}</div>;

  return (
    <div className="stats-overview">
      <h2>System Overview</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingApprovals}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeSessions}</div>
            <div className="stat-label">Active Sessions</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.requestsToday}</div>
            <div className="stat-label">Requests Today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">₹{Number(stats.totalExpenses).toFixed(0)}</div>
            <div className="stat-label">Total Expenses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <div className="stat-value">{stats.uptime}</div>
            <div className="stat-label">System Uptime</div>
          </div>
        </div>
      </div>
    </div>
  );
}
