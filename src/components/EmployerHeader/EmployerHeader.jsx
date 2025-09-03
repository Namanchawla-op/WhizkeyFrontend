import React from 'react';
import './EmployerHeader.css';

const EmployerHeader = ({ showAIPanel, setShowAIPanel, user }) => {
  const initials = (user?.name || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="emp-top-bar">
      <div className="emp-search-bar">
        <div className="emp-search-icon" aria-hidden>🔍</div>
        <input
          type="text"
          className="emp-search-input"
          placeholder="Search requests, employees..."
          // onChange={(e) => setQuery(e.target.value)} // wire this later when you add search
        />
      </div>

      <div className="emp-utility">
        {/* date removed on purpose per your spec */}
        <button className="emp-icon-button" title="Notifications" aria-label="Notifications">
          🔔
          <span className="emp-badge">3</span>
        </button>

        <button className="emp-icon-button" title="Messages" aria-label="Messages">✉️</button>

        <button
          className="emp-icon-button"
          title={showAIPanel ? 'Close AI Panel' : 'Open AI Panel'}
          aria-label="AI Panel"
          onClick={() => setShowAIPanel?.(!showAIPanel)}
        >
          🤖
        </button>

        <div className="emp-user-chip" title={user?.name || 'User'}>
          <div className="emp-avatar">{initials}</div>
          <div className="emp-user-name">{user?.name || 'User'}</div>
        </div>
      </div>
    </div>
  );
};

export default EmployerHeader;
