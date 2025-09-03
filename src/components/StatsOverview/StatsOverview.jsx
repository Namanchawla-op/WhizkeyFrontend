import React, { useMemo } from 'react';
import './StatsOverview.css';

/**
 * Expects the aggregated stats shape from MasterDashboard:
 * {
 *   totals:    { total, pending, approved, rejected, delayed },
 *   hr:        { ...same keys },
 *   finance:   { ...same keys },
 *   logistics: { ...same keys },
 *   updatedAt: ISO string
 * }
 *
 * We render only what we can prove from backend-derived data (no dummies).
 */
const StatsOverview = ({ stats }) => {
  const safe = useMemo(() => {
    const s = stats || {};
    const z = { total: 0, pending: 0, approved: 0, rejected: 0, delayed: 0 };
    return {
      totals:    { ...z, ...(s.totals || {}) },
      hr:        { ...z, ...(s.hr || {}) },
      finance:   { ...z, ...(s.finance || {}) },
      logistics: { ...z, ...(s.logistics || {}) },
      updatedAt: s.updatedAt || null,
      uptime:    s.uptime || null, // if your /api/admin/system-stats provides it later
    };
  }, [stats]);

  const timeAgo = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const diff = Math.max(0, Date.now() - d.getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const cards = [
    { icon: '📦', label: 'Total Requests',   value: safe.totals.total },
    { icon: '⏳', label: 'Pending',          value: safe.totals.pending },
    { icon: '⚠️', label: 'Delayed',          value: safe.totals.delayed },
    { icon: '✅', label: 'Approved',         value: safe.totals.approved },
    { icon: '❌', label: 'Rejected',         value: safe.totals.rejected },
    { icon: '🕒', label: 'Last Updated',     value: timeAgo(safe.updatedAt) },
  ];

  // If we truly got nothing, show a tiny placeholder
  const nothing =
    !stats ||
    (typeof stats === 'object' &&
      !Array.isArray(stats) &&
      Object.keys(stats).length === 0);

  if (nothing) {
    return <div className="stats-overview loading">Loading statistics...</div>;
  }

  return (
    <div className="stats-overview">
      <div className="stats-header">
        <h2>System Overview</h2>
        <div className="stats-sub">
          HR: {safe.hr.pending} pending • Finance: {safe.finance.pending} pending • Logistics: {safe.logistics.pending} pending
        </div>
      </div>

      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <div className="stat-icon" aria-hidden>{c.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{c.value ?? '—'}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsOverview;
