import React, { useEffect, useMemo, useState } from 'react';
import './RequestsTable.css';
import { supervisorApi } from '../../utils/supervisorApi';

const DELAY_DAYS = Number(process.env.REACT_APP_DELAY_DAYS || 3);

// ---- helpers ---------------------------------------------------------------
const pickArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const get = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
};

const toIso = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const isPending   = (s) => String(s || 'Pending').toLowerCase() === 'pending';
const isApproved  = (s) => String(s || '').toLowerCase() === 'approved';
const isRejected  = (s) => String(s || '').toLowerCase() === 'rejected';
const isDelayed   = (iso, days) => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return (Date.now() - t) > days * 24 * 60 * 60 * 1000;
};

const cap = (s='') => s.charAt(0).toUpperCase() + s.slice(1);

// ---- normalize server payloads into one shape ------------------------------
/**
 * Normalized shape used by the table:
 * {
 *   key: string,            // unique key in UI
 *   source: 'expense'|'travel'|'stationery'|'onboarding',
 *   rawId: string|number,   // id to use with the backend
 *   employeeName: string,
 *   department: string,
 *   roleText: string,
 *   status: 'Pending'|'Approved'|'Rejected'|...,
 *   createdAt: ISO string,
 *   // optional per-role:
 *   amount?: number,
 *   items?: string[],       // displayable list
 *   joiningDate?: ISO string
 * }
 */
const normalizeFinance = (list) =>
  list.map((e) => {
    const id = get(e, 'id', '_id');
    return {
      key: `expense-${id}`,
      source: 'expense',
      rawId: id,
      employeeName: get(e, 'employeeName', 'employee', 'user_name', 'name', 'createdBy') ?? '—',
      department:   get(e, 'department', 'dept') ?? '—',
      roleText:     get(e, 'role', 'designation') ?? '—',
      status:       get(e, 'status') ?? 'Pending',
      amount:       Number(get(e, 'amount') ?? 0),
      createdAt:    toIso(get(e, 'createdAt', 'created_at', 'created_on', 'date', 'timestamp')) || new Date().toISOString(),
    };
  });

const normalizeLogisticsTravel = (list) =>
  list.map((t) => {
    const id = get(t, 'id', '_id');
    const destination = get(t, 'destination') ?? '—';
    const purpose     = get(t, 'purpose') ?? '';
    return {
      key: `travel-${id}`,
      source: 'travel',
      rawId: id,
      employeeName: get(t, 'employeeName', 'employee', 'user_name', 'name', 'createdBy') ?? '—',
      department:   get(t, 'department', 'dept') ?? '—',
      roleText:     get(t, 'role', 'designation') ?? '—',
      status:       get(t, 'status') ?? 'Pending',
      items:        [`${destination}${purpose ? ` (${purpose})` : ''}`],
      createdAt:    toIso(get(t, 'createdAt', 'created_at', 'created_on', 'date', 'timestamp')) || new Date().toISOString(),
    };
  });

const normalizeLogisticsStationery = (list) =>
  list.map((s) => {
    const id = get(s, 'id', '_id');
    let items = get(s, 'items');
    // items might be JSON string or array
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch { /* ignore */ }
    }
    const display = Array.isArray(items)
      ? items.map((i) => `${i.name ?? 'Item'}×${Number(i.qty ?? 1)}`)
      : [String(items ?? '—')];

    return {
      key: `stationery-${id}`,
      source: 'stationery',
      rawId: id,
      employeeName: get(s, 'employeeName', 'employee', 'user_name', 'name', 'createdBy') ?? '—',
      department:   get(s, 'department', 'dept') ?? '—',
      roleText:     get(s, 'role', 'designation') ?? '—',
      status:       get(s, 'status') ?? 'Pending',
      items:        display,
      createdAt:    toIso(get(s, 'createdAt', 'created_at', 'created_on', 'date', 'timestamp')) || new Date().toISOString(),
    };
  });

const normalizeHROnboarding = (list) =>
  list.map((o) => {
    const id = get(o, 'id', '_id');
    const join = toIso(get(o, 'joiningDate', 'joining_date', 'expected_joining_date', 'startDate'));
    return {
      key: `onboarding-${id}`,
      source: 'onboarding',
      rawId: id,
      employeeName: get(o, 'employeeName', 'candidateName', 'name') ?? '—',
      department:   get(o, 'department', 'dept') ?? '—',
      roleText:     get(o, 'role', 'designation') ?? '—',
      status:       get(o, 'status') ?? 'Pending',
      joiningDate:  join,
      createdAt:    toIso(get(o, 'createdAt', 'created_at', 'created_on', 'date', 'timestamp')) || new Date().toISOString(),
    };
  });

// ---- component -------------------------------------------------------------
export default function RequestsTable({ role, filter = 'all', refreshTick = 0 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Fetch only on role/refresh change (filter is client-side)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setErr(null);

        if (role === 'finance') {
          const r  = await supervisorApi.finance.listExpenses();
          const xs = normalizeFinance(pickArray(r?.data ?? r));
          if (!cancelled) setRows(xs.sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
        } else if (role === 'logistics') {
          const [t, s] = await Promise.all([
            supervisorApi.logistics.listTravel(),
            supervisorApi.logistics.listStationery(),
          ]);
          const travel = normalizeLogisticsTravel(pickArray(t?.data ?? t));
          const stat   = normalizeLogisticsStationery(pickArray(s?.data ?? s));
          const xs     = [...travel, ...stat].sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          if (!cancelled) setRows(xs);
        } else {
          // HR
          const r  = await supervisorApi.hr.listOnboarding();
          const xs = normalizeHROnboarding(pickArray(r?.data ?? r));
          if (!cancelled) setRows(xs.sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
        }
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.message || e.message || 'Failed to load requests');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [role, refreshTick]);

  // Client-side filtering
  const filtered = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    if (filter === 'all') return rows;

    if (filter === 'today') {
      const today = new Date().toISOString().slice(0,10);
      return rows.filter((r) => (r.createdAt || '').slice(0,10) === today);
    }

    if (filter === 'delayed') {
      if (role === 'hr') {
        // HR delayed: not approved and joining date already passed
        return rows.filter((r) => !isApproved(r.status) && r.joiningDate && new Date(r.joiningDate) < new Date());
      }
      // others delayed: pending and createdAt older than DELAY_DAYS
      return rows.filter((r) => isPending(r.status) && isDelayed(r.createdAt, DELAY_DAYS));
    }

    return rows;
  }, [rows, filter, role]);

  // Actions (only Finance + Logistics have approve/reject in your backend)
  const handleAction = async (row, action) => {
    try {
      if (row.source === 'expense') {
        await supervisorApi.finance.setExpenseStatus(row.rawId, action === 'approved' ? 'Approved' : 'Rejected');
      } else if (row.source === 'travel') {
        await supervisorApi.logistics.setTravelStatus(row.rawId, action === 'approved' ? 'Approved' : 'Rejected');
      } else if (row.source === 'stationery') {
        await supervisorApi.logistics.setStationeryStatus(row.rawId, action === 'approved' ? 'Approved' : 'Rejected');
      } else {
        // onboarding (HR) has no approve/reject endpoint in your current backend — view only
        return;
      }

      // Optimistic UI update
      setRows((prev) =>
        prev.map((r) => (r.key === row.key ? { ...r, status: action === 'approved' ? 'Approved' : 'Rejected' } : r))
      );
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Action failed');
    }
  };

  // Columns per role
  const columns = useMemo(() => {
    if (role === 'finance')   return ['Employee', 'Department', 'Role', 'Amount', 'Status', 'Actions'];
    if (role === 'logistics') return ['Employee', 'Department', 'Role', 'Items',  'Status', 'Actions'];
    return ['Employee', 'Department', 'Role', 'Joining Date', 'Status', 'Actions']; // HR
  }, [role]);

  const gridCols = `repeat(${columns.length}, 1fr)`;

  if (loading) return <div className="requests-table loading">Loading requests...</div>;
  if (err)     return <div className="requests-table error">{err}</div>;

  return (
    <div className="requests-table">
      <div className="table-header table-grid" style={{ ['--cols']: gridCols }}>
        {columns.map((c) => <div key={c}>{c}</div>)}
      </div>

      {filtered.length > 0 ? (
        filtered.map((r) => (
          <div key={r.key} className={`table-row table-grid ${String(r.status).toLowerCase()}`} style={{ ['--cols']: gridCols }}>
            <div>{r.employeeName}</div>
            <div>{r.department}</div>
            <div>{r.roleText}</div>

            {role === 'finance' && <div>₹{Number.isFinite(r.amount) ? r.amount.toFixed(2) : '0.00'}</div>}
            {role === 'logistics' && <div className="items-cell">{Array.isArray(r.items) ? r.items.join(', ') : '—'}</div>}
            {role === 'hr' && <div>{r.joiningDate ? new Date(r.joiningDate).toLocaleDateString() : '—'}</div>}

            <div>
              <span className={`status-badge ${String(r.status).toLowerCase()}`}>{cap(String(r.status))}</span>
            </div>

            <div className="action-buttons">
              {(role === 'finance' || role === 'logistics') && !isApproved(r.status) && (
                <button className="approve-button" onClick={() => handleAction(r, 'approved')}>Approve</button>
              )}
              {(role === 'finance' || role === 'logistics') && !isRejected(r.status) && (
                <button className="reject-button" onClick={() => handleAction(r, 'rejected')}>Reject</button>
              )}
              {role === 'hr' && <span className="view-only">View only</span>}
            </div>
          </div>
        ))
      ) : (
        <div className="no-requests">No requests match your filters</div>
      )}
    </div>
  );
}
