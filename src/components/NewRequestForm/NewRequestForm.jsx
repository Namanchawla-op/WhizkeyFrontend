import React, { useEffect, useState } from 'react';
import './NewRequestForm.css';
import { api } from '../../utils/api';

const ORG_ID = Number(process.env.REACT_APP_ORG_ID || 1);

export default function NewRequestForm({ onCreated }) {
  const [me, setMe] = useState(null);
  const [newRequest, setNewRequest] = useState({
    employeeName: '',
    department: 'Engineering',
    role: '',                 // kept for UI; backend model doesn’t store this yet
    joiningDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(false);

  const departments = ['Engineering', 'Marketing', 'Finance', 'Operations', 'HR', 'Sales'];

  // Load current user to attach user_id
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.get('/api/user/me');
        if (!cancelled) setMe(r?.data || null);
      } catch (e) {
        if (!cancelled) setMe(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!me?.id) {
      setErr('User not loaded yet. Try again in a second.');
      return;
    }

    setLoading(true);
    setErr(null);
    setOk(false);

    try {
      // Map fields to backend model
      const payload = {
        user_id: me.id,
        organization_id: ORG_ID,
        employeeName: newRequest.employeeName.trim(),
        department: newRequest.department,
        joiningDate: newRequest.joiningDate
      };

      // POST /api/hr/onboarding  → creates DB row
      const r = await api.post('/api/hr/onboarding', payload);

      setOk(true);
      setNewRequest({
        employeeName: '',
        department: 'Engineering',
        role: '',
        joiningDate: ''
      });

      // Brief success message, optionally notify parent to refresh
      if (typeof onCreated === 'function') {
        try { onCreated(r?.data?.request || null); } catch {}
      }
      setTimeout(() => setOk(false), 3000);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.response?.data?.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="new-request-form" onSubmit={handleSubmit}>
      <h3>Add New Onboarding Request</h3>

      {err && <div className="error-message">{err}</div>}
      {ok && <div className="success-message">Request created successfully!</div>}

      <div className="form-group">
        <label>Employee Name</label>
        <input
          type="text"
          value={newRequest.employeeName}
          onChange={(e) => setNewRequest({ ...newRequest, employeeName: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label>Department</label>
        <select
          value={newRequest.department}
          onChange={(e) => setNewRequest({ ...newRequest, department: e.target.value })}
          required
          disabled={loading}
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Role (optional)</label>
        <input
          type="text"
          value={newRequest.role}
          onChange={(e) => setNewRequest({ ...newRequest, role: e.target.value })}
          placeholder="e.g., Backend Engineer"
          disabled={loading}
        />
        <small style={{ color: '#6c757d' }}>
          Note: stored with the request in a future update. Not persisted in current backend model.
        </small>
      </div>

      <div className="form-group">
        <label>Joining Date</label>
        <input
          type="date"
          value={newRequest.joiningDate}
          onChange={(e) => setNewRequest({ ...newRequest, joiningDate: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        className="submit-button"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Add Request'}
      </button>
    </form>
  );
}
