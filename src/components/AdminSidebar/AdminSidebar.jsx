import React from 'react';
import './AdminSidebar.css';

const AdminSidebar = ({ collapsed, setCollapsed, currentView, setCurrentView, user }) => {
  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: '📊' },
    { id: 'users',    label: 'User Management',    icon: '👥' },
    { id: 'reports',  label: 'Reports & Analytics',icon: '📈' },
    { id: 'settings', label: 'System Settings',    icon: '⚙️' }
  ];

  const initials =
    (user?.name || 'Admin User')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="admin-sidebar-header">
        <div className="admin-logo">Whiz<span>Key</span> Admin</div>
        <button
          className="admin-toggle-sidebar"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          ≡
        </button>
      </div>

      <nav className="admin-nav-menu" aria-label="Main">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`admin-nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
          >
            <span className="admin-nav-icon" aria-hidden>{item.icon}</span>
            <span className="admin-nav-text">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-user-info">
          <div className="admin-user-avatar">{initials || 'A'}</div>
          <div className="admin-user-details">
            <div className="admin-user-name">{user?.name || 'Admin User'}</div>
            <div className="admin-user-role">System Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
