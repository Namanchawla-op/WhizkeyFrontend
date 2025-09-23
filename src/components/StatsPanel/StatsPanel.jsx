import React, { useEffect, useState } from 'react';
import './StatsPanel.css';
import { supervisorApi } from '../../utils/supervisorApi';

/**
 * Delayed threshold:
 * - Any item with status Pending and createdAt older than N days counts as "Delayed"
 * - Configure via REACT_APP_DELAY_DAYS (default 3)
 */
const DELAY_DAYS = Number(process.env.REACT_APP_DELAY_DAYS || 3);

// normalize any array-ish payload: [], {data:[]}, {items:[]}
const pickArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

// best-effort createdAt extraction
const getCreatedAt = (row) => {
  return (
    row?.createdAt ||
    row?.created_at ||
    row?.created_on ||
    row?.date ||
    row?.timestamp ||
    null
  );
};

const isPending = (status) => String(status || 'Pending').toLowerCase() === 'pending';
const isApproved = (status) => String(status || '').toLowerCase() === 'approved';
const isRejected = (status) => String(status || '').toLowerCase() === 'rejected';

const olderThanDays = (iso, days) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;
    const ageMs = Date.now() - d.getTime();
    return ageMs > days * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

export default function StatsPanel({ role, refreshTick }) {
  const [stats, setStats] = useState({ pending: 0, completed: 0, delayed: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const computeStats = (list) => {
      const pending = list.filter((x) => isPending(x.status)).length;
      // treat "completed" as Approved (for supervisors); Rejected is not "completed"
      const approved = list.filter((x) => isApproved(x.status)).length;

      const delayed = list.filter((x) => {
        if (!isPending(x.status)) return false;
        const when = getCreatedAt(x);
        return when && olderThanDays(when, DELAY_DAYS);
      }).length;

      return { pending, completed: approved, delayed };
    };

    const load = async () => {
      try {
        setLoading(true);
        setErr(null);

        if (role === 'finance') {
          // Expenses only
          const r = await supervisorApi.finance.listExpenses();
          const expenses = pickArray(r?.data ?? r);
          if (!cancelled) setStats(computeStats(expenses));
        } else if (role === 'logistics') {
          // Travel + Stationery combined
          const [t, s] = await Promise.all([
            supervisorApi.logistics.listTravel(),
            supervisorApi.logistics.listStationery(),
          ]);
          const travel = pickArray(t?.data ?? t);
          const stationery = pickArray(s?.data ?? s);
          const combined = [...travel, ...stationery];
          if (!cancelled) setStats(computeStats(combined));
        } else {
          // HR: use onboarding requests for the same Pending/Completed/Delayed buckets
          const onb = await supervisorApi.hr.listOnboarding();
          const onboarding = pickArray(onb?.data ?? onb);
          if (!cancelled) setStats(computeStats(onboarding));
        }
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.message || e.message || 'Failed to load statistics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [role, refreshTick]);

  if (loading) {
    return <div className="stats-panel loading">Loading statistics...</div>;
  }
  if (err) {
    return <div className="stats-panel error">{err}</div>;
  }

  return (
    <div className="stats-panel">
      <div className="stats-card">
        <div className="stats-title">Pending</div>
        <div className="stats-value">{stats.pending}</div>
      </div>
      <div className="stats-card">
        <div className="stats-title">Completed</div>
        <div className="stats-value">{stats.completed}</div>
      </div>
      <div className="stats-card">
        <div className="stats-title">Delayed ({DELAY_DAYS}d+)</div>
        <div className="stats-value">{stats.delayed}</div>
      </div>
    </div>
  );
}
