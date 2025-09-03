import React from "react";
import { pushChat } from "../../utils/chatBus";
import "./ActionButtons.css";

export default function ActionButtons() {
  return (
    <div className="action-buttons-container">
      <div className="action-buttons-grid">
        <button
          className="action-button clock-in"
          onClick={() => pushChat({ sender: "system", text: "__FLOW__:clockin:start" })}
        >
          Clock Me In
        </button>

        <button
          className="action-button submit-expense"
          onClick={() => pushChat({ sender: "system", text: "__FLOW__:expense:start" })}
        >
          Submit an Expense
        </button>

        <button
          className="action-button request-stationery"
          onClick={() => pushChat({ sender: "system", text: "__FLOW__:stationery:start" })}
        >
          Request Stationery
        </button>

        <button
          className="action-button help-onboarding"
          onClick={() => pushChat({ sender: "system", text: "__FLOW__:onboarding:start" })}
        >
          Help with Onboarding
        </button>
      </div>
    </div>
  );
}
