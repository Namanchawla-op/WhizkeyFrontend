import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./RecentActivity.css";

// Resolve API base once
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://ec2-13-60-104-32.eu-north-1.compute.amazonaws.com:3001" ||
  "http://localhost:3001";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ---- Normalizers ------------------------------------------------------------
const safe = (v, d = "") => (v === undefined || v === null ? d : v);

const mkItem = ({
  id,
  kind, // 'expense' | 'stationery' | 'onboarding' | 'approval' | 'attendance' | 'system'
  title,
  message,
  status, // 'approved' | 'rejected' | 'pending' | 'created' | 'present' | 'absent' | etc.
  at, // ISO date string
  meta = {},
}) => ({
  id: String(id ?? `${kind}-${Math.random().toString(36).slice(2)}`),
  kind,
  title: safe(title, "Update"),
  message: safe(message, ""),
  status: safe(status, "info"),
  at: at ? new Date(at).toISOString() : new Date().toISOString(),
  meta,
});

const iconFor = (kind, status) => {
  if (kind === "expense") {
    if (status === "approved") return "✅";
    if (status === "rejected") return "❌";
    return "💸";
  }
  if (kind === "stationery") {
    if (status === "approved") return "✅";
    if (status === "rejected") return "❌";
    return "📦";
  }
  if (kind === "onboarding") {
    if (status === "approved") return "✅";
    if (status === "rejected") return "❌";
    return "🆘";
  }
  if (kind === "approval") {
    if (status === "approved") return "✅";
    if (status === "rejected") return "❌";
    return "📝";
  }
  if (kind === "attendance") {
    if (status === "present") return "⏰";
    if (status === "absent") return "🚫";
    return "⏱️";
  }
  return "ℹ️";
};

// ---- Fetchers ---------------------------------------------------------------
// 1) Preferred: unified feed if backend exposes it
const fetchUnifiedFeed = async (userId) => {
  // try path param, then query param
  try {
    const r = await client.get(`/api/activity/user/${userId}`);
    const arr = Array.isArray(r?.data?.activities) ? r.data.activities : r?.data || [];
    return arr.map((a, i) =>
      mkItem({
        id: a.id ?? a._id ?? `unified-${i}`,
        kind: a.kind ?? a.type ?? "system",
        title: a.title ?? a.summary ?? "Update",
        message: a.message ?? a.detail ?? "",
        status: (a.status ?? a.state ?? "info").toString().toLowerCase(),
        at: a.timestamp ?? a.at ?? a.createdAt ?? a.date,
        meta: a,
      })
    );
  } catch {
    // second attempt with query param
    try {
      const r2 = await client.get(`/api/activity/user`, { params: { userId } });
      const arr = Array.isArray(r2?.data?.activities) ? r2.data.activities : r2?.data || [];
      return arr.map((a, i) =>
        mkItem({
          id: a.id ?? a._id ?? `unifiedq-${i}`,
          kind: a.kind ?? a.type ?? "system",
          title: a.title ?? a.summary ?? "Update",
          message: a.message ?? a.detail ?? "",
          status: (a.status ?? a.state ?? "info").toString().toLowerCase(),
          at: a.timestamp ?? a.at ?? a.createdAt ?? a.date,
          meta: a,
        })
      );
    } catch {
      return null; // no unified endpoint
    }
  }
};

// 2) Fallback: build feed from each domain
const fetchExpenses = async () => {
  const urls = ["/api/expense/mine", "/api/expense/my", "/api/expense/user"];
  for (const u of urls) {
    try {
      const r = await client.get(u);
      const arr = Array.isArray(r?.data?.claims) ? r.data.claims : r?.data || [];
      return arr.map((c, i) =>
        mkItem({
          id: c.id ?? c._id ?? `exp-${i}`,
          kind: "expense",
          title: "Expense",
          message: `${c.category ?? "expense"} – ₹${c.amount ?? c.total ?? "0"} (${(c.description ?? "").toString()})`,
          status: (c.status ?? "pending").toString().toLowerCase(),
          at: c.updatedAt ?? c.createdAt ?? c.date,
          meta: c,
        })
      );
    } catch {}
  }
  return [];
};

const fetchStationery = async () => {
  const urls = ["/api/stationery/mine", "/api/stationery/my", "/api/stationery/user"];
  for (const u of urls) {
    try {
      const r = await client.get(u);
      const arr = Array.isArray(r?.data?.requests) ? r.data.requests : r?.data || [];
      return arr.map((s, i) =>
        mkItem({
          id: s.id ?? s._id ?? `stat-${i}`,
          kind: "stationery",
          title: "Stationery",
          message:
            Array.isArray(s.items)
              ? s.items.map((it) => `${it.name}×${it.qty ?? 1}`).join(", ")
              : s.description ?? "Items requested",
          status: (s.status ?? "pending").toString().toLowerCase(),
          at: s.updatedAt ?? s.createdAt ?? s.date,
          meta: s,
        })
      );
    } catch {}
  }
  return [];
};

const fetchOnboarding = async () => {
  const urls = ["/api/onboarding/mine", "/api/onboarding/my", "/api/onboarding/user"];
  for (const u of urls) {
    try {
      const r = await client.get(u);
      const arr = Array.isArray(r?.data?.tickets) ? r.data.tickets : r?.data || [];
      return arr.map((t, i) =>
        mkItem({
          id: t.id ?? t._id ?? `onb-${i}`,
          kind: "onboarding",
          title: "Onboarding",
          message: t.question ?? t.title ?? t.description ?? "Help request",
          status: (t.status ?? "pending").toString().toLowerCase(),
          at: t.updatedAt ?? t.createdAt ?? t.date,
          meta: t,
        })
      );
    } catch {}
  }
  return [];
};

const fetchApprovalsAboutMe = async () => {
  // approvals associated to the current employee (if backend exposes it)
  const urls = ["/api/approvals/mine", "/api/approvals/user", "/api/approvals/history"];
  for (const u of urls) {
    try {
      const r = await client.get(u);
      const arr = Array.isArray(r?.data?.approvals) ? r.data.approvals : r?.data || [];
      return arr.map((a, i) =>
        mkItem({
          id: a.id ?? a._id ?? `appr-${i}`,
          kind: "approval",
          title: a.title ?? a.type ?? "Approval",
          message: a.reason ?? a.description ?? "Approval update",
          status: (a.status ?? "pending").toString().toLowerCase(),
          at: a.updatedAt ?? a.createdAt ?? a.date,
          meta: a,
        })
      );
    } catch {}
  }
  return [];
};

const fetchAttendance = async (userId) => {
  // totally optional; ignore if missing
  const urls = [
    `/api/attendance/history?user_id=${encodeURIComponent(userId)}`,
    `/api/attendance/my?user_id=${encodeURIComponent(userId)}`,
  ];
  for (const u of urls) {
    try {
      const r = await client.get(u);
      const arr = Array.isArray(r?.data?.records) ? r.data.records : r?.data || [];
      return arr
        .slice(-5) // keep it short if backend returns many
        .map((rec, i) =>
          mkItem({
            id: rec.id ?? rec._id ?? `att-${i}`,
            kind: "attendance",
            title: "Attendance",
            message: rec.clock_out
              ? `Clocked out at ${new Date(rec.clock_out).toLocaleTimeString()}`
              : rec.clock_in
              ? `Clocked in at ${new Date(rec.clock_in).toLocaleTimeString()}`
              : "Attendance update",
            status: (rec.status ?? "present").toString().toLowerCase(),
            at: rec.updatedAt ?? rec.clock_out ?? rec.clock_in ?? rec.date,
            meta: rec,
          })
        );
    } catch {}
  }
  return [];
};

// ---- Component --------------------------------------------------------------
export default function RecentActivity({ userId }) {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(true);
  const timerRef = useRef(null);

  const load = async () => {
    if (!userId) return;
    setBusy(true);
    setErr(null);
    try {
      // 1) unified feed if available
      const unified = await fetchUnifiedFeed(userId);
      if (unified && unified.length) {
        setItems(unified.sort((a, b) => new Date(b.at) - new Date(a.at)));
        return;
      }
      // 2) stitch from modules
      const [exps, stat, onb, appr, att] = await Promise.all([
        fetchExpenses(),
        fetchStationery(),
        fetchOnboarding(),
        fetchApprovalsAboutMe(),
        fetchAttendance(userId),
      ]);
      const merged = [...exps, ...stat, ...onb, ...appr, ...att].sort(
        (a, b) => new Date(b.at) - new Date(a.at)
      );
      setItems(merged);
    } catch (e) {
      console.error("RecentActivity error:", e?.message, e?.response?.data);
      setErr(e?.response?.data?.message || "Could not load activity");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // poll every 12s so approvals done elsewhere show up
    timerRef.current = setInterval(load, 12000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const list = useMemo(() => (Array.isArray(items) ? items.slice(0, 30) : []), [items]);

  return (
    <div className="recent-activity-card">
      <h2>Recent Activity</h2>

      {busy ? (
        <div className="ra-loading">Loading…</div>
      ) : err ? (
        <div className="ra-error">{err}</div>
      ) : list.length === 0 ? (
        <div className="ra-empty">
          No recent activity yet. Submit an expense, make a request, or clock in — updates will show here.
        </div>
      ) : (
        <ul className="ra-list">
          {list.map((it) => (
            <li key={it.id} className="ra-item">
              <div className={`ra-badge ${it.kind}-${it.status}`}>{iconFor(it.kind, it.status)}</div>
              <div className="ra-main">
                <div className="ra-title">
                  <span className="ra-kind">{it.title}</span>
                  {it.status && (
                    <span className={`ra-status ${it.status}`}>{it.status.replace(/^\w/, (c) => c.toUpperCase())}</span>
                  )}
                </div>
                <div className="ra-msg">{it.message}</div>
                <div className="ra-time">{new Date(it.at).toLocaleString()}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
