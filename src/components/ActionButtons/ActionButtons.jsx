import React, { useState } from "react";
import { api } from "../../utils/api";
import { pushChat } from "../../utils/chatBus";
import "./ActionButtons.css";

export default function ActionButtons({ userId, organizationId = 1, onActionComplete }) {
  const [busy, setBusy] = useState(false);

  const done = (type, data) => {
    onActionComplete?.(type, data);
  };

  const handleClockIn = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      const res = await api.post("/attendance/checkin", { user_id: userId, organization_id: organizationId });
      pushChat(`✅ Clocked in at ${new Date(res.data.clock_in).toLocaleTimeString()}`);
      done("clockIn", res.data);
    } catch (e) {
      pushChat("❌ Clock-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitExpense = async () => {
    if (!userId) return;
    // quick prompts for MVP
    const amountStr = prompt("Expense amount:");
    if (!amountStr) return;
    const amount = Number(amountStr);
    const category = prompt("Category (e.g., travel, food):") || "other";
    const description = prompt("Short description:") || "";

    setBusy(true);
    try {
      const payload = { user_id: userId, organization_id: organizationId, amount, category, description };
      const res = await api.post("/expense/submit", payload);
      const claim = res.data?.claim || {};
      pushChat(`💸 Expense submitted: ${category} ₹${amount} (status: ${claim.status || "Pending"})`);
      done("expense", claim);
    } catch (e) {
      pushChat("❌ Expense submission failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleRequestStationery = async () => {
    if (!userId) return;
    const raw = prompt('List items as "Name:Qty, Name:Qty" (e.g., "Notebook:2, Pen:3"):');
    if (!raw) return;

    const items = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const [name, qtyStr] = s.split(":").map((x) => x.trim());
        return { name, qty: Number(qtyStr || 1) };
      });

    if (!items.length) return;

    setBusy(true);
    try {
      const res = await api.post("/stationery/request", { user_id: userId, organization_id: organizationId, items });
      pushChat(`🖊️ Stationery request submitted (${items.map(i => `${i.name}×${i.qty}`).join(", ")})`);
      done("stationery", res.data?.request);
    } catch (e) {
      pushChat("❌ Stationery request failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleHelpOnboarding = async () => {
    if (!userId) return;
    const question = prompt("What do you need help with?");
    if (!question) return;

    setBusy(true);
    try {
      const res = await api.post("/onboarding/help", { user_id: userId, question });
      const t = res.data?.ticket;
      pushChat(`🆘 Ticket opened (#${t?.id || "n/a"}): "${question}" — status: ${t?.status || "Open"}`);
      done("onboarding", t);
    } catch (e) {
      pushChat("❌ Could not open a help ticket.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="action-buttons">
      <button onClick={handleClockIn} disabled={busy}>Clock Me In</button>
      <button onClick={handleSubmitExpense} disabled={busy}>Submit an Expense</button>
      <button onClick={handleRequestStationery} disabled={busy}>Request Stationery</button>
      <button onClick={handleHelpOnboarding} disabled={busy}>Help with Onboarding</button>
    </div>
  );
}
