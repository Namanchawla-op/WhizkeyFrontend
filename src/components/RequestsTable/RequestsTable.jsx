import React, { useEffect, useMemo, useState } from 'react';
import './RequestsTable.css';
import { sup } from '../../utils/supervisorApi'; // ✅ unified API helper

const ORG_ID = Number(process.env.REACT_APP_ORG_ID || 1);

const normalize = (row, role) => {
  const status = String(row.status || 'Pending').toLowerCase();

  // Attempt to extract a human name
  const employeeName =
    row.employeeName ||
    row.employee_name ||
    row.user?.name ||
    row.requester?.name ||
    (row.user_id ? `User #${row.user_id}` : '—');

  // Department best-effort
  const department = row.department || row.dept || row.team || '—';

  // Role/Type label for the row itself (not supervisor role)
  const roleText =
    row.role ||
    row.position ||
    (role === 'finance' ? 'Expense' : role === 'logistics' ? 'Request' : 'Onboarding');

  // Amount/items for finance/logistics
  const amount = row.amount ?? row.total ?? null;
  const itemsArray =
    row.items ||
    row.request_items ||
    (Array.isArray(row.details) ? row.details : null) ||
    null;

  const items =
    Array.isArray(itemsArray)
      ? itemsArray
          .map((i) =>
            typeof i === 'string'
              ? i
              : i?.name
              ? `${i.name}${i.qty ? `×${i.qty}` : ''}`
              : JSON.stringify(i)
          )
          .join(', ')
      : null;

  // joining date (if onboarding) – fall back to createdAt to avoid DB errors
  const joiningDate = row.joiningDate || row.join_date || row.createdAt || null;

  return {
    id: row.id ?? row._id ?? row.request_id ?? Math.random().toString(36).slice(2),
    employeeName,
    department,
    roleText,
    joiningDate,
    amount,
    items,
    status,
    raw: row,
  };
};

export default function RequestsTable({ role, filter = 'all' }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const fetchList = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await sup.listRequests(role, ORG_ID);
      const list = Array.isArray(res?.data) ? res.data : res?.data?.requests || [];
      setRequests(list.map((r) => normalize(r, role)));
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, filter]);

  const approve = async (id) => {
    try {
      await sup.approve(role, id);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
      );
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || 'Approve failed');
    }
  };

  const reject = async (id) => {
    try {
      await sup.reject(role, id);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r))
      );
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || 'Reject failed');
    }
  };

  // simple filter: today vs delayed vs all (delayed = pending older than 3 days by createdAt)
  const filtered = useMemo(() => {
    if (filter === 'all') return requests;
    const todayStr = new Date().toISOString().slice(0, 10);
    if (filter === 'today') {
      return requests.filter((r) =>
        (r.raw?.createdAt || '').slice(0, 10) === todayStr
      );
    }
    if (filter === 'delayed') {
      const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
      return requests.filter(
        (r) => r.status === 'pending' && new Date(r.raw?.createdAt || 0).getTime() < cutoff
      );
    }
    return requests;
  }, [requests, filter]);

  if (loading) return <div className="requests-table loading">Loading requests...</div>;
  if (err) return <div className="requests-table error">{err}</div>;

  return (
    <div className="requests-table">
      <div className="table-header">
        <div>Employee</div>
        <div>Department</div>
        <div>Role</div>
        {role === 'hr' && <div>Joining / Created</div>}
        {role === 'finance' && <div>Amount</div>}
        {role === 'logistics' && <div>Items</div>}
        <div>Status</div>
        <div>Actions</div>
      </div>

      {filtered.length > 0 ? (
        filtered.map((r) => (
          <div key={r.id} className={`table-row ${r.status}`}>
            <div>{r.employeeName}</div>
            <div>{r.department}</div>
            <div>{r.roleText}</div>

            {role === 'hr' && (
              <div>
                {r.joiningDate ? new Date(r.joiningDate).toLocaleDateString() : '—'}
              </div>
            )}
            {role === 'finance' && <div>{r.amount != null ? `₹${r.amount}` : '—'}</div>}
            {role === 'logistics' && <div>{r.items || '—'}</div>}

            <div>
              <span className={`status-badge ${r.status}`}>
                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
              </span>
            </div>

            <div className="action-buttons">
              {r.status !== 'approved' && (
                <button className="approve-button" onClick={() => approve(r.id)}>
                  Approve
                </button>
              )}
              {r.status !== 'rejected' && (
                <button className="reject-button" onClick={() => reject(r.id)}>
                  Reject
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="no-requests">No requests match your filters</div>
      )}
    </div>
  );
}
