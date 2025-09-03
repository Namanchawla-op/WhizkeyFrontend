import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './ChatBot.css';
import { subscribeChat } from '../../utils/chatBus';

export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'http://ec2-13-60-104-32.eu-north-1.compute.amazonaws.com:3001' ||
  'http://localhost:3001';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const api = {
  getMe: () => client.get('/api/user/me'),
  getChatHistory: (userId) => client.get('/api/chat/history', { params: { userId } }),
  sendChat: (userId, message) => client.post('/api/chat/send', { userId, message }),
  clockIn: (user_id) => client.post('/api/attendance/checkin', { user_id }),
  clockOut: (user_id) => client.post('/api/attendance/checkout', { user_id }),
  submitExpense: (payload) => client.post('/api/expense/submit', payload),
  requestStationery: (payload) => client.post('/api/stationery/request', payload),
  onboardingHelp: (payload) => client.post('/api/onboarding/help', payload),
};

const ORG_ID = Number(process.env.REACT_APP_ORG_ID || 1);

export default function ChatBot({ userId }) {
  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const endRef = useRef(null);

  const [flow, setFlow] = useState({ name: null, step: 0, data: {} });

  const nowIso = () => new Date().toISOString();
  const add = (m) => setMessages((prev) => [...prev, { ...m, timestamp: m.timestamp || nowIso() }]);
  const addUser = (t) => add({ sender: 'user', text: t });
  const addBot  = (t) => add({ sender: 'bot',  text: t });

  useEffect(() => {
    api.getMe()
      .then(r => setMe(r.data))
      .catch(() => setMe({ id: userId || 1, name: 'Demo User' }));
  }, [userId]);

  useEffect(() => {
    if (!(userId || me?.id)) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await api.getChatHistory(userId || me.id);
        const items = Array.isArray(r?.data?.messages) ? r.data.messages : [];
        if (!cancelled) setMessages(items);
      } catch {/* ignore */}
    })();
    return () => { cancelled = true; };
  }, [userId, me?.id]);

  // INSTANT scroll to bottom on new message; avoids smooth animation jank
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', inline: 'nearest' });
  }, [messages.length]);

  // Listen for button-triggered flows
  useEffect(() => {
    const unsub = subscribeChat((msg) => {
      if (msg?.sender === 'system' && String(msg.text || '').startsWith('__FLOW__:')) {
        const [, name] = String(msg.text).split(':');
        if (name === 'expense') {
          setFlow({ name: 'expense', step: 0, data: {} });
          addBot('Let’s file an expense. What is the *category*? (e.g., Travel, Meals, Supplies)');
        } else if (name === 'stationery') {
          setFlow({ name: 'stationery', step: 0, data: {} });
          addBot('What items do you need? Use format like: pen:2, notebook:1');
        } else if (name === 'onboarding') {
          setFlow({ name: 'onboarding', step: 0, data: {} });
          addBot('What do you need help with? (briefly describe)');
        } else if (name === 'clockin') {
          setFlow({ name: 'clockin', step: 0, data: {} });
          addBot('Ready to clock you in. Shall I proceed? (yes/no)');
        }
      }
    });
    return unsub;
  }, []);

  const parseItems = (text) =>
    String(text)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(p => {
        const [name, qtyRaw] = p.split(':').map(s => s.trim());
        const qty = Number(qtyRaw || '1');
        if (!name) return null;
        return { name, qty: Number.isFinite(qty) && qty > 0 ? qty : 1 };
      })
      .filter(Boolean);

  const tryCommands = async (text, effectiveUserId) => {
    const lower = text.toLowerCase().trim();

    if (/(^|\b)(clock\s?in|check\s?in)(\b|$)/.test(lower)) {
      try { await api.clockIn(effectiveUserId); addBot('✅ Clocked in successfully.'); }
      catch (e) { addBot(`❌ Clock-in failed: ${e?.response?.data?.error || e.message}`); }
      return true;
    }

    if (/(^|\b)(clock\s?out|check\s?out)(\b|$)/.test(lower)) {
      try { await api.clockOut(effectiveUserId); addBot('✅ Clocked out successfully.'); }
      catch (e) { addBot(`❌ Clock-out failed: ${e?.response?.data?.error || e.message}`); }
      return true;
    }

    if (lower.startsWith('expense ')) {
      const rest = text.slice(8).trim();
      const parts = rest.split(/\s+/);
      const amount = Number(parts[0]);
      const category = parts[1];
      const description = parts.slice(2).join(' ');
      if (!Number.isFinite(amount) || !category || !description) {
        addBot('Format: expense <amount> <category> <description>\nExample: expense 250 travel taxi from airport');
        return true;
      }
      try { await api.submitExpense({ user_id: effectiveUserId, organization_id: ORG_ID, amount, category, description }); addBot('🧾 Expense submitted.'); }
      catch (e) { addBot(`❌ Expense failed: ${e?.response?.data?.error || e.message}`); }
      return true;
    }

    if (lower.startsWith('stationery ')) {
      const items = parseItems(text.slice('stationery '.length));
      if (!items.length) { addBot('Format: stationery <item:qty, item:qty>\nExample: stationery pen:2, notebook:1'); return true; }
      try { await api.requestStationery({ user_id: effectiveUserId, organization_id: ORG_ID, items }); addBot('📦 Stationery request submitted.'); }
      catch (e) { addBot(`❌ Stationery failed: ${e?.response?.data?.error || e.message}`); }
      return true;
    }

    if (lower.startsWith('help ') || lower.startsWith('onboarding ')) {
      const question = lower.startsWith('help ') ? text.slice(5).trim() : text.slice('onboarding '.length).trim();
      if (!question) { addBot('Tell me your question, e.g., "help need VPN access".'); return true; }
      try { await api.onboardingHelp({ user_id: effectiveUserId, question }); addBot('🆘 Your onboarding ticket has been created.'); }
      catch (e) { addBot(`❌ Help request failed: ${e?.response?.data?.error || e.message}`); }
      return true;
    }

    return false;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = inputMessage.trim();
    const effectiveUserId = userId || me?.id;
    if (!text || !effectiveUserId) return;

    addUser(text);
    setInputMessage('');
    setLoading(true);
    setErr(null);

    try {
      // Guided flows
      if (flow.name) {
        if (flow.name === 'expense') {
          if (flow.step === 0) { setFlow({ name: 'expense', step: 1, data: { category: text } }); addBot('Amount?'); return; }
          if (flow.step === 1) {
            const amount = Number(text);
            if (!Number.isFinite(amount)) { addBot('Please enter a valid number for amount.'); return; }
            setFlow((f) => ({ ...f, step: 2, data: { ...f.data, amount } }));
            addBot('Optional: short description (or type "skip")');
            return;
          }
          if (flow.step === 2) {
            await api.submitExpense({
              user_id: effectiveUserId, organization_id: ORG_ID,
              category: flow.data.category, amount: flow.data.amount,
              description: text.toLowerCase() === 'skip' ? undefined : text,
            });
            addBot(`✅ Expense submitted (${flow.data.category} - ${flow.data.amount}).`);
            setFlow({ name: null, step: 0, data: {} });
            return;
          }
        }

        if (flow.name === 'stationery') {
          const items = parseItems(text);
          if (!items.length) { addBot('Use format like: pen:2, notebook:1'); return; }
          await api.requestStationery({ user_id: effectiveUserId, organization_id: ORG_ID, items });
          addBot(`✅ Stationery request created (${items.length} item(s)).`);
          setFlow({ name: null, step: 0, data: {} });
          return;
        }

        if (flow.name === 'onboarding') {
          await api.onboardingHelp({ user_id: effectiveUserId, question: text });
          addBot('✅ Onboarding help ticket logged.');
          setFlow({ name: null, step: 0, data: {} });
          return;
        }

        if (flow.name === 'clockin') {
          if (!/^y/i.test(text)) { addBot('Okay, cancelled.'); setFlow({ name: null, step: 0, data: {} }); return; }
          await api.clockIn(effectiveUserId);
          addBot('✅ Clocked in successfully.');
          setFlow({ name: null, step: 0, data: {} });
          return;
        }
      }

      // Typed quick commands
      const handled = await tryCommands(text, effectiveUserId);
      if (!handled) {
        const r = await api.sendChat(effectiveUserId, text);
        addBot(r?.data?.reply ?? '...');
      }
    } catch (e2) {
      setErr('Failed to send message');
      addBot(`❌ ${e2?.response?.data?.error || e2.message}`);
    } finally {
      setLoading(false);
    }
  };

  const list = Array.isArray(messages) ? messages : [];

  return (
    <div className="chatbot-container">
      <div className="chatbot-messages">
        {loading && list.length === 0 ? (
          <div className="loading">Loading chat...</div>
        ) : err ? (
          <div className="error">{err}</div>
        ) : (
          list.map((m, i) => (
            <div key={`${m.timestamp || i}-${i}`} className={`message ${m.sender === 'bot' ? 'bot-message' : 'user-message'}`}>
              <div className="message-content">{m.text}</div>
              {/* you can hide .message-time via CSS if desired */}
              <div className="message-time">{new Date(m.timestamp || Date.now()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form className="chatbot-input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder='Try: "clock in", "expense 250 travel taxi", "stationery pen:2, notebook:1", "help need VPN"'
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={loading || !(userId || me?.id)}
        />
        <button type="submit" disabled={loading || !inputMessage.trim() || !(userId || me?.id)}>
          {loading ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
