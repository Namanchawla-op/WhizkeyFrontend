// src/components/AdminPendingApprovals/AdminPendingApprovals.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../utils/api";
import "./AdminPendingApprovals.css";

function pickApprovals(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.approvals)) return d.approvals;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

export default function AdminPendingApprovals({ refreshKey = 0 }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const r = await api.get("/api/approvals/pending");
        const arr = pickApprovals(r);
        if (!cancelled) setList(Array.isArray(arr) ? arr : []);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.message || "Failed to load approvals");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (loading) return <div className="pending-approvals loading">Loading approvals...</div>;
  if (err) return <div className="pending-approvals error">{err}</div>;

  return (
    <div className="pending-approvals">
      <h3>Pending Approvals</h3>
      {list.length ? (
        <ul className="approvals-list">
          {list.map((a) => {
            const id = a.id ?? a._id ?? a.approval_id ?? a.request_id ?? Math.random().toString(36).slice(2);
            const status = (a.status || "Pending").toString();
            const dept = a.department || a.dept || "—";
            const who = a.employeeName || a.user_name || a.requester || a.user_id || "—";
            const type = a.type || a.category || a.kind || "General";
            const amount = a.amount || a.total || null;
            const details = a.description || a.reason || null;
            return (
              <li className="approval-item" key={id}>
                <div className="approval-header">
                  <h4>{type} Request</h4>
                  <span className={`status ${status.toLowerCase()}`}>{status}</span>
                </div>
                <div className="approval-details">
                  <p><strong>From:</strong> {who}</p>
                  <p><strong>Department:</strong> {dept}</p>
                  {details && <p>{details}</p>}
                  {amount ? <p><strong>Amount:</strong> ₹{amount}</p> : null}
                </div>
                {/* Admin approve/reject (optional) — enable if your /api/approvals/:id/* routes are ready
                <div className="approval-actions">
                  <button onClick={async () => { await api.post(`/api/approvals/${id}/approve`); }} className="approve-button">Approve</button>
                  <button onClick={async () => { await api.post(`/api/approvals/${id}/reject`); }} className="reject-button">Reject</button>
                </div>
                */}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="no-approvals">No pending approvals</div>
      )}
    </div>
  );
}
