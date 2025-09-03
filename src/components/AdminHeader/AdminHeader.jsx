import React from 'react';
import './AdminHeader.css';

const AdminHeader = ({ showAIPanel, setShowAIPanel, user, onRefresh }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const notifCount =
    Number(user?.notifications_count) ||
    (Array.isArray(user?.notifications) ? user.notifications.length : 0) ||
    0;

  return (
    <div className="admin-top-bar">
      <div className="admin-header-left">
        <h1>Master Dashboard</h1>
        <p>System Overview & Administration</p>
      </div>

      <div className="admin-header-right">
        <div className="current-date">{currentDate}</div>

        <button
          className="refresh-button"
          onClick={onRefresh}
          type="button"
          aria-label="Refresh dashboard"
          title="Refresh"
        >
          🔄 Refresh
        </button>

        <button
          className="icon-button"
          type="button"
          aria-label="Notifications"
          title="Notifications"
        >
          🔔
          {notifCount > 0 && (
            <span className="notification-badge">{notifCount > 99 ? '99+' : notifCount}</span>
          )}
        </button>

        <button
          className="icon-button"
          type="button"
          aria-label="Messages"
          title="Messages"
        >
          ✉️
        </button>

        <button
          className="icon-button"
          type="button"
          onClick={() => setShowAIPanel(!showAIPanel)}
          aria-label={showAIPanel ? 'Hide AI Assistant' : 'Show AI Assistant'}
          title={showAIPanel ? 'Hide AI Assistant' : 'Show AI Assistant'}
        >
          🤖
        </button>
      </div>
    </div>
  );
};

export default AdminHeader;
