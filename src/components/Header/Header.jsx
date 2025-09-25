import React from 'react';
import './Header.css';

export default function Header({ userName = 'Demo User' }) {
  const initial = userName?.[0]?.toUpperCase?.() || 'U';

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-title">WhizKey ERP</span>
      </div>

      <div className="header-right">
        <div className="user-chip" title={userName}>
          <div className="avatar">{initial}</div>
          <div className="user-meta">
            <div className="user-name">{userName}</div>
            <div className="user-role">Employee</div>
          </div>
        </div>
      </div>
    </header>
  );
}
