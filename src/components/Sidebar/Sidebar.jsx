import React from 'react';
import './Sidebar.css';

const Sidebar = ({ collapsed, setCollapsed, currentView, setCurrentView, role, setRole, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard',         icon: '📊' },
    { id: 'attendance', label: 'Attendance',       icon: '⏰' },
    { id: 'reports',    label: 'Reports',          icon: '📈' },
    { id: 'team',       label: 'Team Management',  icon: '👥' },
    { id: 'settings',   label: 'Settings',         icon: '⚙️' }
  ];

  const roles = [
    { id: 'hr',        label: 'HR Supervisor' },
    { id: 'finance',   label: 'Finance Supervisor' },
    { id: 'logistics', label: 'Logistics Supervisor' }
  ];

  const initials = (user?.name || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  // optional: keep unknown views from blanking page
  const safeSetView = (id) => {
    const allowed = ['dashboard', 'attendance', 'reports'];
    setCurrentView(allowed.includes(id) ? id : 'dashboard');
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">Whiz<span>Key</span></div>
        <button
          className="toggle-sidebar"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
        >
          ≡
        </button>
      </div>

      <div className="role-selector">
        <div className="role-label">Current Role</div>
        <div className="role-select-wrap">
          <select
            className="role-dropdown"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <div className="role-icon">▼</div>
        </div>
      </div>

      <div className="nav-menu">
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => safeSetView(item.id)}
            role="button"
            tabIndex={0}
          >
            <div className="nav-icon">{item.icon}</div>
            <div className="nav-text">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{roles.find(r => r.id === role)?.label || 'Supervisor'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
