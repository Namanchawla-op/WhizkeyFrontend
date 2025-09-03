import React, { useEffect, useMemo, useState } from 'react';
import './AdminUserManagement.css';
import { api } from '../../utils/api';

// ---------- helpers ----------
const safeArray = (d) => {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.users)) return d.users;
  if (Array.isArray(d?.data)) return d.data;
  return [];
};

const normalizeUser = (u) => ({
  id: u?.id ?? u?._id ?? u?.user_id ?? String(Math.random()),
  name: u?.name ?? `${u?.first_name ?? ''} ${u?.last_name ?? ''}`.trim() || '—',
  email: u?.email ?? u?.username ?? '—',
  department: u?.department ?? u?.dept ?? null,
  role: (u?.role || 'employee').toString().toLowerCase(),
  status: (u?.status || 'active').toString().toLowerCase(),
});

const ROLE_OPTIONS = [
  { value: 'employee',  label: 'Employee' },
  { value: 'hr',        label: 'HR Manager' },
  { value: 'finance',   label: 'Finance Manager' },
  { value: 'logistics', label: 'Logistics Manager' },
  { value: 'admin',     label: 'Administrator' },
];

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Active' },
  { value: 'inactive',  label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

// Prefer admin endpoints; fall back to generic ones if admin routes aren’t present
async function fetchUsersReal() {
  try {
    const r = await api.get('/api/admin/users');
    return safeArray(r?.data).map(normalizeUser);
  } catch {
    const r2 = await api.get('/api/users');
    return safeArray(r2?.data).map(normalizeUser);
  }
}

async function updateRole(userId, role) {
  const body = { role };
  try {
    return await api.put(`/api/admin/users/${userId}/role`, body);
  } catch {
    try {
      return await api.put(`/api/users/${userId}/role`, body);
    } catch {
      return await api.put(`/api/users/${userId}`, body);
    }
  }
}

async function updateStatus(userId, status) {
  const body = { status };
  try {
    return await api.put(`/api/admin/users/${userId}/status`, body);
  } catch {
    try {
      return await api.put(`/api/users/${userId}/status`, body);
    } catch {
      return await api.put(`/api/users/${userId}`, body);
    }
  }
}

// ---------- component ----------
const AdminUserManagement = ({ refreshTick = 0 }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState({ id: null, field: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const list = await fetchUsersReal();
        if (!cancelled) setUsers(list);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.message || e?.message || 'Failed to load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshTick]);

  const filtered = useMemo(() => {
    const lowerQ = q.toLowerCase();
    return (Array.isArray(users) ? users : []).filter((u) => {
      const roleOk = filter === 'all' || u.role === filter;
      const name = (u.name || '').toString().toLowerCase();
      const email = (u.email || '').toString().toLowerCase();
      const searchOk = !lowerQ || name.includes(lowerQ) || email.includes(lowerQ);
      return roleOk && searchOk;
    });
  }, [users, filter, q]);

  const onRoleChange = async (uid, newRole) => {
    setBusy({ id: uid, field: 'role' });
    try {
      await updateRole(uid, newRole);
      setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, role: newRole } : u)));
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Role update failed');
    } finally {
      setBusy({ id: null, field: null });
    }
  };

  const onStatusChange = async (uid, newStatus) => {
    setBusy({ id: uid, field: 'status' });
    try {
      await updateStatus(uid, newStatus);
      setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, status: newStatus } : u)));
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Status update failed');
    } finally {
      setBusy({ id: null, field: null });
    }
  };

  if (loading) return <div className="admin-user-management loading">Loading users...</div>;
  if (err) return <div className="admin-user-management error">{err}</div>;

  return (
    <div className="admin-user-management">
      <div className="user-header">
        <h2>User Management</h2>
        <div className="user-controls">
          <input
            type="text"
            placeholder="Search users..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="search-input"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Users</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="users-table">
        <div className="table-header">
          <div>Name</div>
          <div>Email</div>
          <div>Department</div>
          <div>Role</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {filtered.length > 0 ? (
          filtered.map((u) => (
            <div key={u.id} className="table-row">
              <div className="cell-ellipsis" title={u.name}>{u.name}</div>
              <div className="cell-ellipsis" title={u.email}>{u.email}</div>
              <div className="cell-ellipsis" title={u.department || '-'}>
                {u.department || '-'}
              </div>

              <div>
                <select
                  value={u.role}
                  onChange={(e) => onRoleChange(u.id, e.target.value)}
                  className="role-select"
                  disabled={busy.id === u.id && busy.field === 'role'}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={u.status}
                  onChange={(e) => onStatusChange(u.id, e.target.value)}
                  className="status-select"
                  disabled={busy.id === u.id && busy.field === 'status'}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="user-actions">
                <button className="edit-button" type="button">Edit</button>
                <button className="view-button" type="button">View</button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-users">No users found</div>
        )}
      </div>
    </div>
  );
};

export default AdminUserManagement;
