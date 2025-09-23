import React, { useState } from 'react';
import './AdminQuickActions.css';
import { api } from '../../utils/api';

const ACTIONS = [
  { id: 'add-user',        label: 'Add New User',     icon: '👥' },
  { id: 'system-settings', label: 'Reload Settings',  icon: '⚙️' },
  { id: 'backup',          label: 'Create Backup',    icon: '💾' },
  { id: 'audit-log',       label: 'View Audit Log',   icon: '📋' },
];

// Helpers to try multiple endpoints without guessing exact route names
async function tryPostSequential(paths, body) {
  let lastErr;
  for (const p of paths) {
    try { return await api.post(p, body); } catch (e) { lastErr = e; }
  }
  throw lastErr;
}
async function tryGetSequential(paths, params) {
  let lastErr;
  for (const p of paths) {
    try { return await api.get(p, { params }); } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

const AdminQuickActions = () => {
  const [busyId, setBusyId] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const handleAddUser = async () => {
    const name  = window.prompt('Full name of the new user:');
    if (!name) return;
    const email = window.prompt('Email address:');
    if (!email) return;
    const role  = (window.prompt('Role (employee/hr/finance/logistics/admin):', 'employee') || 'employee').toLowerCase();

    setBusyId('add-user'); setStatusMsg(null); setErrorMsg(null);
    try {
      const res = await tryPostSequential(
        ['/api/admin/users', '/api/users', '/api/user/create'],
        { name, email, role }
      );
      const created = res?.data || {};
      setStatusMsg(`✅ User created: ${created.name || name} (${created.email || email})`);
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || e?.message || 'Failed to create user');
    } finally {
      setBusyId(null);
    }
  };

  const handleReloadSettings = async () => {
    setBusyId('system-settings'); setStatusMsg(null); setErrorMsg(null);
    try {
      await tryPostSequential(
        ['/api/admin/settings/reload', '/api/settings/reload', '/api/admin/settings/sync'],
        {}
      );
      setStatusMsg('✅ Settings reloaded successfully');
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || e?.message || 'Failed to reload settings');
    } finally {
      setBusyId(null);
    }
  };

  const handleBackup = async () => {
    setBusyId('backup'); setStatusMsg(null); setErrorMsg(null);
    try {
      const r = await tryPostSequential(
        ['/api/admin/backup', '/api/admin/maintenance/backup'],
        {}
      );
      const file = r?.data?.filename || r?.data?.file || 'backup';
      setStatusMsg(`✅ Backup created (${file})`);
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || e?.message || 'Backup failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleAuditLog = async () => {
    setBusyId('audit-log'); setStatusMsg(null); setErrorMsg(null);
    try {
      const r = await tryGetSequential(
        ['/api/admin/audit-log', '/api/audit/logs', '/api/admin/audit'],
        { limit: 30 }
      );
      const list = Array.isArray(r?.data) ? r.data
                 : Array.isArray(r?.data?.logs) ? r.data.logs
                 : Array.isArray(r?.data?.data) ? r.data.data
                 : [];
      const norm = list.map((x, i) => ({
        id: x.id ?? x._id ?? i,
        when: x.timestamp || x.createdAt || x.created_at || x.time || null,
        type: x.type || x.event || 'log',
        message: x.message || x.action || x.detail || JSON.stringify(x),
      }));
      setAuditLogs(norm);
      setStatusMsg(`📋 Loaded ${norm.length} log entries`);
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || e?.message || 'Failed to load audit log');
    } finally {
      setBusyId(null);
    }
  };

  const doAction = async (id) => {
    if (id === 'add-user')        return handleAddUser();
    if (id === 'system-settings') return handleReloadSettings();
    if (id === 'backup')          return handleBackup();
    if (id === 'audit-log')       return handleAuditLog();
  };

  return (
    <div className="admin-quick-actions">
      <h3>Quick Actions</h3>

      <div className="actions-grid">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            className="qa-action-button"
            onClick={() => doAction(a.id)}
            disabled={busyId === a.id}
            aria-busy={busyId === a.id}
          >
            <span className="action-icon" aria-hidden>{a.icon}</span>
            <span className="action-label">
              {busyId === a.id ? 'Working…' : a.label}
            </span>
          </button>
        ))}
      </div>

      {(statusMsg || errorMsg) && (
        <div className="qa-status-area" role="status" aria-live="polite">
          {statusMsg && <div className="qa-ok">{statusMsg}</div>}
          {errorMsg && <div className="qa-err">{errorMsg}</div>}
        </div>
      )}

      {auditLogs.length > 0 && (
        <div className="qa-audit-panel">
          <div className="qa-audit-header">Recent Audit Log</div>
          <ul className="qa-audit-list">
            {auditLogs.map((row) => (
              <li key={row.id} className="qa-audit-item">
                <div className="qa-audit-line">
                  <span className="qa-audit-type">{row.type}</span>
                  <span className="qa-audit-time">
                    {row.when ? new Date(row.when).toLocaleString() : '—'}
                  </span>
                </div>
                <div className="qa-audit-msg">{row.message}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminQuickActions;
