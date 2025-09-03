// src/components/AdminUserManagement/AdminUserManagement.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../utils/api";
import "./AdminUserManagement.css";

const normalizeUser = (u = {}) => {
  const nameGuess = `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim();
  const safeName = (u?.name ?? nameGuess) || "—";
  return {
    id: u?.id ?? u?._id ?? u?.user_id ?? String(Math.random()),
    name: safeName,
    email: u?.email ?? u?.username ?? "—",
    department: u?.department ?? u?.dept ?? null,
    role: (u?.role || "employee").toString().toLowerCase(),
    status: (u?.status || "active").toString().toLowerCase(),
  };
};

async function tryGetArrays(paths) {
  for (const p of paths) {
    try {
      const r = await api.get(p);
      const d = r?.data;
      const arr =
        Array.isArray(d) ? d :
        Array.isArray(d?.users) ? d.users :
        Array.isArray(d?.data) ? d.data :
        null;
      if (arr) return arr;
    } catch (_) {}
  }
  return null;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Try several likely endpoints. If none exist, fallback to /api/user/me
        const arr =
          await tryGetArrays(["/api/admin/users", "/api/users", "/api/user/all", "/api/user/list"]) ||
          (await (async () => {
            try {
              const me = await api.get("/api/user/me");
              return [me?.data].filter(Boolean);
            } catch {
              return null;
            }
          })());

        const normalized = (arr || []).map(normalizeUser);
        if (!cancelled) setUsers(normalized);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.message || "Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = users.filter((u) => {
    const roleOk = filter === "all" || u.role === filter;
    const term = search.trim().toLowerCase();
    const text = `${u.name} ${u.email}`.toLowerCase();
    const searchOk = !term || text.includes(term);
    return roleOk && searchOk;
  });

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/api/admin/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (e) {
      setErr(e?.response?.data?.message || "Role update failed (endpoint missing?)");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/api/admin/users/${id}/status`, { status });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    } catch (e) {
      setErr(e?.response?.data?.message || "Status update failed (endpoint missing?)");
    }
  };

  if (loading) return <div className="user-management loading">Loading users...</div>;
  if (err) return <div className="user-management error">{err}</div>;

  return (
    <div className="user-management">
      <div className="user-header">
        <h2>User Management</h2>
        <div className="user-controls">
          <input
            type="text"
            placeholder="Search users..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Users</option>
            <option value="employee">Employees</option>
            <option value="hr">HR Managers</option>
            <option value="finance">Finance Managers</option>
            <option value="logistics">Logistics Managers</option>
            <option value="admin">Administrators</option>
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

        {filtered.length ? (
          filtered.map((u) => (
            <div key={u.id} className="table-row">
              <div>{u.name}</div>
              <div>{u.email}</div>
              <div>{u.department || "—"}</div>
              <div>
                <select className="role-select" value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                  <option value="employee">Employee</option>
                  <option value="hr">HR Manager</option>
                  <option value="finance">Finance Manager</option>
                  <option value="logistics">Logistics Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <select className="status-select" value={u.status} onChange={(e) => handleStatusChange(u.id, e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="user-actions">
                <button className="edit-button">Edit</button>
                <button className="view-button">View</button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-users">No users found (or users endpoint not wired)</div>
        )}
      </div>
    </div>
  );
}
