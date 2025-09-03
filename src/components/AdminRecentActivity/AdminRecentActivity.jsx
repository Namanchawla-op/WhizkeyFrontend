// src/components/AdminRecentActivity/AdminRecentActivity.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../utils/api";
import "./AdminRecentActivity.css";

function listOf(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.activities)) return d.activities;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

export default function AdminRecentActivity({ refreshKey = 0 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const r = await api.get("/api/activity/recent");
        const arr = listOf(r);
        if (!cancelled) setItems(arr);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.message || "Failed to load activities");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const fmt = (ds) => new Date(ds).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) return <div className="recent-activity loading">Loading activities...</div>;
  if (err) return <div className="recent-activity error">{err}</div>;

  return (
    <div className="recent-activity">
      <h3>Recent System Activity</h3>
      {items.length ? (
        <ul className="activity-list">
          {items.map((a, i) => (
            <li key={a.id || i} className="activity-item">
              <div className="activity-icon">
                {a.type === "login" && "🔐"}
                {a.type === "approval" && "✅"}
                {a.type === "expense" && "💸"}
                {a.type === "stationery" && "🖊️"}
                {a.type === "onboarding" && "🆘"}
                {a.type === "clockIn" && "⏰"}
                {!["login","approval","expense","stationery","onboarding","clockIn"].includes(a.type) && "⚙️"}
              </div>
              <div className="activity-content">
                <p>{a.message || a.text || "—"}</p>
                <span className="activity-time">{fmt(a.timestamp || a.createdAt || new Date())}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-activities">No recent activities</div>
      )}
    </div>
  );
}
