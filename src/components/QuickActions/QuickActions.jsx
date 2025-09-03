import React from 'react';
import './QuickActions.css';
import { pushChat } from '../../utils/chatBus';

export default function QuickActions() {
  const go = (name) => pushChat({ sender: 'system', text: `__FLOW__:${name}:start` });

  return (
    <div className="quick-actions">
      <h2>Quick Actions</h2>
      <div className="quick-actions-row">
        <button className="qa-card" onClick={() => go('clockin')}>
          <span className="qa-emoji" aria-hidden>⏰</span>
          <span className="qa-label">Quick Clock In</span>
        </button>

        <button className="qa-card" onClick={() => go('expense')}>
          <span className="qa-emoji" aria-hidden>💸</span>
          <span className="qa-label">New Expense</span>
        </button>

        <button className="qa-card" onClick={() => go('stationery')}>
          <span className="qa-emoji" aria-hidden>✏️</span>
          <span className="qa-label">Request Items</span>
        </button>

        <button className="qa-card" onClick={() => go('onboarding')}>
          <span className="qa-emoji" aria-hidden>❓</span>
          <span className="qa-label">Get Help</span>
        </button>
      </div>
    </div>
  );
}
