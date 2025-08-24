import React from 'react';
import './QuickActions.css';

const QuickActions = ({ onAction }) => {
  const quickActions = [
    { id: 'clockIn', label: 'Quick Clock In', icon: '⏰' },
    { id: 'submitExpense', label: 'New Expense', icon: '💰' },
    { id: 'requestStationery', label: 'Request Items', icon: '✏️' },
    { id: 'helpOnboarding', label: 'Get Help', icon: '❓' }
  ];

  return (
    <div className="quick-actions">
      <h2>Quick Actions</h2>
      <div className="quick-actions-grid">
        {quickActions.map(action => (
          <button
            key={action.id}
            className="quick-action-button"
            onClick={() => onAction(action.id)}
          >
            <span className="quick-action-icon">{action.icon}</span>
            <span className="quick-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;