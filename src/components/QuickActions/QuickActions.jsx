// src/components/QuickActions/QuickActions.jsx
import React from 'react';
import './QuickActions.css';
import { pushChat, pushSystem } from '../../utils/chatBus';

export default function QuickActions() {
  const actions = [
    {
      key: 'checkin',
      label: 'Clock In',
      onClick: () => {
        pushSystem('⏱️ Clock In: use the Attendance section to record your check-in.');
        pushChat('How do I check in?', 'user');
      },
    },
    {
      key: 'checkout',
      label: 'Clock Out',
      onClick: () => {
        pushSystem('⏳ Clock Out: use the Attendance section to record your check-out.');
        pushChat('Clocking out now.', 'user');
      },
    },
    {
      key: 'expense',
      label: 'New Expense',
      onClick: () => {
        pushSystem('💳 Submit an Expense: open the Expense form from your dashboard.');
        pushChat('I want to submit an expense.', 'user');
      },
    },
    {
      key: 'stationery',
      label: 'Stationery Request',
      onClick: () => {
        pushSystem('🗂️ Stationery: create a new stationery request from the Requests section.');
        pushChat('Create a stationery request.', 'user');
      },
    },
    {
      key: 'travel',
      label: 'Travel Request',
      onClick: () => {
        pushSystem('✈️ Travel: create a new travel request from the Requests section.');
        pushChat('Create a travel request.', 'user');
      },
    },
    {
      key: 'onboarding',
      label: 'Onboarding Help',
      onClick: () => {
        pushSystem('👋 Onboarding: open the Help/Onboarding form to raise a ticket.');
        pushChat('I need onboarding help.', 'user');
      },
    },
    {
      key: 'approvals',
      label: 'Pending Approvals',
      onClick: () => {
        pushSystem('📝 Approvals: view and action pending approvals from the Admin/Supervisor dashboard.');
        pushChat('Show my pending approvals.', 'user');
      },
    },
    {
      key: 'ai',
      label: 'Open AI Assistant',
      onClick: () => {
        pushSystem('🤖 Opening the AI assistant panel…');
        pushChat('Open the AI assistant.', 'user');
      },
    },
  ];

  return (
    <div className="quick-actions">
      <h2>Quick Actions</h2>
      <div className="quick-actions-grid">
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            className="quick-action"
            onClick={a.onClick}
            aria-label={a.label}
          >
            <div className="quick-action-label">{a.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
