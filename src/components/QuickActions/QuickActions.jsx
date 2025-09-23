import React from 'react';
import './QuickActions.css';
import { pushChat } from '../utils/chatBus';

export default function QuickActions() {
  return (
    <div className="quick-actions">
      <h2>Quick Actions</h2>
      <div className="quick-actions-grid">
        <button className="quick-action-button" onClick={() => pushChat({ sender: 'system', text: '__FLOW__:expense:start' })}>
          <span className="quick-action-icon">💸</span>
          <span className="quick-action-label">Submit Expense</span>
        </button>
        <button className="quick-action-button" onClick={() => pushChat({ sender: 'system', text: '__FLOW__:clockin:start' })}>
          <span className="quick-action-icon">🕒</span>
          <span className="quick-action-label">Clock In</span>
        </button>
        <button className="quick-action-button" onClick={() => pushChat({ sender: 'system', text: '__FLOW__:stationery:start' })}>
          <span className="quick-action-icon">📝</span>
          <span className="quick-action-label">Request Stationery</span>
        </button>
        <button className="quick-action-button" onClick={() => pushChat({ sender: 'system', text: '__FLOW__:onboarding:start' })}>
          <span className="quick-action-icon">🆘</span>
          <span className="quick-action-label">Onboarding Help</span>
        </button>
      </div>
    </div>
  );
}
