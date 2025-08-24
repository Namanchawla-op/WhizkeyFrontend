import React from 'react';
import './Header.css';

const Header = ({ user, currentTime }) => {
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="header">
      <div className="header-left">
        <h1>WhizKey ERP</h1>
        <p>Employee Dashboard</p>
      </div>
      
      <div className="header-right">
        <div className="header-date">{formattedDate}</div>
        <div className="header-user">
          <div className="user-avatar">{user.avatar}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;