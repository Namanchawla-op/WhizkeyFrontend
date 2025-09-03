// src/components/AdminSystemHealth/AdminSystemHealth.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../utils/api";
import "./AdminSystemHealth.css";

/**
 * No native /api/admin/system-health in your backend, so we compute
 * a pragmatic health snapshot by timing a few real endpoints:
 * - /api/approvals/pending
 * - /api/activity/recent
 * - /api/expense/list
 */
async function timeGet(path) {
  const t0 = performance.now();
  try {
    await api.get(path);
    const t1 = performance.now();
    return { ok: true, ms: Math.round(t1 - t0) };
  } catch {
    return { ok: false, ms: null };
  }
}

export default function AdminSystemHealth({ refreshKey = 0 }) {
  const [latency, setLatency] = useState(0);
  const [dbOnline, setDbOnline] = useState(false);
  const [cpu, setCpu] = useState(null);       // unknown (no backend)
  const [mem, setMem] = useState(null);       // unknown (no backend)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const results = await Promise.all([
          timeGet("/api/approvals/pending"),
          timeGet("/api/activity/recent"),
          timeGet("/api/expense/list"),
        ]);
        const oks = results.filter(r => r.ok);
        const avg = oks.length ? Math.round(oks.reduce((s, r) => s + (r.ms || 0), 0) / oks.length) : 0;
        if (!cancelled) {
          setLatency(avg);
          setDbOnline(oks.length > 0);
          // CPU/MEM not available -> null leaves the bars empty
        }
      } catch (e) {
        if (!cancelled) setErr("Failed to sample system health");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (loading) return <div className="system-health loading">Loading system health...</div>;
  if (err) return <div className="system-health error">{err}</div>;

  const latencyPct = Math.min(100, (latency || 0) / 10); // 0–100 for bar (10ms = 1%)
  const latencyBad = (latency || 0) > 500;

  return (
    <div className="system-health">
      <h3>System Health</h3>
      <div className="health-metrics">
        <div className="metric">
          <div className="metric-label">API Response</div>
          <div className="metric-value">{latency ? `${latency}ms` : "—"}</div>
          <div className="metric-bar">
            <div
              className="metric-fill"
              style={{
                width: `${latency ? latencyPct : 0}%`,
                backgroundColor: latencyBad ? "#ff6b6b" : "#51cf66",
              }}
            />
          </div>
        </div>

        <div className="metric">
          <div className="metric-label">Database</div>
          <div className="metric-value">{dbOnline ? "Online" : "Offline"}</div>
          <div className={`status-indicator ${dbOnline ? "online" : "offline"}`} />
        </div>

        <div className="metric">
          <div className="metric-label">Server CPU</div>
          <div className="metric-value">{cpu ?? "N/A"}</div>
          <div className="metric-bar">
            <div className="metric-fill" style={{ width: "0%" }} />
          </div>
        </div>

        <div className="metric">
          <div className="metric-label">Memory</div>
          <div className="metric-value">{mem ?? "N/A"}</div>
          <div className="metric-bar">
            <div className="metric-fill" style={{ width: "0%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
