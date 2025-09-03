import React, { useEffect, useMemo, useState } from 'react';
import './AttendanceView.css';
import { supervisorApi } from '../../utils/supervisorApi';

const ORG_ID = Number(process.env.REACT_APP_ORG_ID || 1);

const toISO = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const fmtTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const hoursBetween = (a, b) => {
  const A = a ? new Date(a).getTime() : NaN;
  const B = b ? new Date(b).getTime() : NaN;
  if (Number.isNaN(A) || Number.isNaN(B) || B < A) return null;
  const h = (B - A) / (1000 * 60 * 60);
  return Math.round(h * 10) / 10;
};

const stripDate = (iso) => (iso ? iso.slice(0, 10) : '');

const startOfWeek = (d = new Date()) => {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
};

const AttendanceView = ({ role = 'hr', refreshTick = 0 }) => {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setErr(null);

        // GET /api/hr/attendance?organization_id=#
        const r = await supervisorApi.hr.listAttendance(ORG_ID);
        const list = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : [];

        const norm = list
          .map((rec) => {
            const clock_in  = toISO(rec.clock_in || rec.check_in || rec.clockIn);
            const clock_out = toISO(rec.clock_out || rec.check_out || rec.clockOut);
            const createdAt = toISO(rec.createdAt || rec.created_at || rec.timestamp || clock_in);
            const status    = String(rec.status || 'Pending');
            const exemption_requested = !!rec.exemption_requested;

            return {
              id: rec.id ?? rec._id ?? `${rec.user_id}-${createdAt || Math.random()}`,
              user_id: rec.user_id,
              employeeName: rec.employeeName || rec.name || `User ${rec.user_id}`,
              department: rec.department || '—',
              clock_in, clock_out, createdAt,
              hours: hoursBetween(clock_in, clock_out),
              status,
              exemption_requested,
            };
          })
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        if (!cancelled) setRows(norm);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.error || e?.message || 'Failed to load attendance data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [refreshTick, role]);

  const todayISO = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7); // yyyy-mm
  const weekStart = startOfWeek();

  const filtered = useMemo(() => {
    if (filter === 'today') {
      return rows.filter((r) => stripDate(r.clock_in || r.createdAt) === todayISO);
    }
    if (filter === 'week') {
      return rows.filter((r) => {
        const t = new Date(r.clock_in || r.createdAt);
        return !Number.isNaN(t.getTime()) && t >= weekStart;
      });
    }
    if (filter === 'month') {
      return rows.filter((r) => (r.clock_in || r.createdAt || '').startsWith(thisMonth));
    }
    return rows;
  }, [rows, filter, todayISO, thisMonth, weekStart]);

  const approveExemption = async (id, approved) => {
    try {
      // PUT /api/hr/attendance/exemption  { id, approved }
      await supervisorApi.hr.approveExemption(id, approved);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: approved ? 'Approved' : 'Rejected' } : r)));
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || 'Approval failed');
    }
  };

  const derivedStatusBadge = (r) => {
    // Present if clocked in; Late if after 10:15; else Absent (derived from real timestamps)
    if (r.clock_in) {
      const d = new Date(r.clock_in);
      const lateCutoff = new Date(r.clock_in);
      lateCutoff.setHours(10, 15, 0, 0);
      const late = d > lateCutoff;
      return <span className={`status-badge ${late ? 'late' : 'present'}`}>{late ? 'Late' : 'Present'}</span>;
    }
    return <span className="status-badge absent">Absent</span>;
  };

  if (loading) return <div className="attendance-view loading">Loading attendance data...</div>;
  if (err)     return <div className="attendance-view error">{err}</div>;

  return (
    <div className="attendance-view">
      <div className="view-header">
        <h2>Employee Attendance</h2>
        <div className="view-filters">
          <button className={`filter-button ${filter === 'today' ? 'active' : ''}`} onClick={() => setFilter('today')}>Today</button>
          <button className={`filter-button ${filter === 'week' ? 'active' : ''}`} onClick={() => setFilter('week')}>This Week</button>
          <button className={`filter-button ${filter === 'month' ? 'active' : ''}`} onClick={() => setFilter('month')}>This Month</button>
        </div>
      </div>

      <div className="attendance-table">
        <div className="table-header">
          <div>Employee</div>
          <div>Department</div>
          <div>Clock In</div>
          <div>Clock Out</div>
          <div>Hours</div>
          <div>Status</div>
          {role === 'hr' && <div>Actions</div>}
        </div>

        {filtered.length > 0 ? (
          filtered.map((r) => (
            <div key={r.id} className="table-row">
              <div>{r.employeeName}</div>
              <div>{r.department}</div>
              <div>{fmtTime(r.clock_in)}</div>
              <div>{fmtTime(r.clock_out)}</div>
              <div>{typeof r.hours === 'number' ? `${r.hours}h` : '-'}</div>
              <div>
                {derivedStatusBadge(r)}
                {r.exemption_requested && (
                  <span className={`status-badge exemption-${String(r.status).toLowerCase()}`}>
                    {`Exemption ${r.status}`}
                  </span>
                )}
              </div>

              {role === 'hr' ? (
                <div className="action-buttons">
                  {r.exemption_requested && String(r.status).toLowerCase() === 'pending' ? (
                    <>
                      <button className="approve-button" onClick={() => approveExemption(r.id, true)}>Approve</button>
                      <button className="reject-button"  onClick={() => approveExemption(r.id, false)}>Reject</button>
                    </>
                  ) : (
                    <span className="view-only">—</span>
                  )}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="no-data">No attendance records found</div>
        )}
      </div>
    </div>
  );
};

export default AttendanceView;
