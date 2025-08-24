// src/components/ChatBot/ChatBot.jsx
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './ChatBot.css';

/**
 * Supported commands (type these into the chat):
 * - "clock in" / "check in"
 * - "clock out"
 * - "expense <amount> <category> <description...>"
 * - "stationery pen:2, notebook:1"
 * - "help <question>" or "onboarding <question>"
 */

// Prefer .env, else fallback to your EC2 backend URL, else localhost:3001
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'http://ec2-13-60-104-32.eu-north-1.compute.amazonaws.com:3001' ||
  'http://localhost:3001';

// One axios client for all calls
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Small API helpers (same endpoints your backend exposes)
const api = {
  getChatHistory: (userId) =>
    client.get('/api/chat/history', { params: { userId } }),
  sendChat: (userId, message) =>
    client.post('/api/chat/send', { userId, message }),

  clockIn: (user_id) =>
    client.post('/api/attendance/checkin', { user_id }),
  clockOut: (user_id) =>
    client.post('/api/attendance/checkout', { user_id }),

  submitExpense: (payload) =>
    client.post('/api/expense/submit', payload),

  requestStationery: (payload) =>
    client.post('/api/stationery/request', payload),

  onboardingHelp: (payload) =>
    client.post('/api/onboarding/help', payload),
};

const ORG_ID = Number(process.env.REACT_APP_ORG_ID || 1);

const ChatBot = ({ userId }) => {
  const [messages, setMessages] = useState([]); // always an array
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  // Load initial history
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await api.getChatHistory(userId);
        const items = res?.data?.messages;
        if (!cancelled) setMessages(Array.isArray(items) ? items : []);
      } catch (e) {
        console.error('❌ Chat history error:', e?.message, e?.response?.data);
        if (!cancelled) {
          setError('Failed to load chat history');
          setMessages([]); // keep array so .map is always safe
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const append = (msg) => setMessages((prev) => [...prev, msg]);
  const nowIso = () => new Date().toISOString();
  const timeLabel = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Parse "pen:2, notebook:1" -> [{ name, qty }, ...]
  const parseItems = (text) => {
    const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
    return parts
      .map((p) => {
        const [name, qtyRaw] = p.split(':').map((s) => s.trim());
        const qty = Number(qtyRaw || '1');
        if (!name) return null;
        return { name, qty: Number.isFinite(qty) && qty > 0 ? qty : 1 };
      })
      .filter(Boolean);
  };

  // Try to handle special commands; return true if handled
  const tryHandleCommand = async (text) => {
    const lower = text.toLowerCase().trim();

    // CLOCK IN
    if (/(^|\b)(clock\s?in|check\s?in)(\b|$)/.test(lower)) {
      try {
        const r = await api.clockIn(userId);
        const when = r?.data?.clock_in || nowIso();
        append({
          text: `✅ Clocked in at ${new Date(when).toLocaleTimeString()}`,
          sender: 'bot',
          timestamp: nowIso(),
        });
      } catch (e) {
        append({
          text: `❌ Clock-in failed: ${e?.response?.data?.error || e.message}`,
          sender: 'bot',
          timestamp: nowIso(),
        });
      }
      return true;
    }

    // CLOCK OUT
    if (/(^|\b)(clock\s?out|check\s?out)(\b|$)/.test(lower)) {
      try {
        const r = await api.clockOut(userId);
        const when = r?.data?.clock_out || nowIso();
        append({
          text: `✅ Clocked out at ${new Date(when).toLocaleTimeString()}`,
          sender: 'bot',
          timestamp: nowIso(),
        });
      } catch (e) {
        append({
          text: `❌ Clock-out failed: ${e?.response?.data?.error || e.message}`,
          sender: 'bot',
          timestamp: nowIso(),
        });
      }
      return true;
    }

    // EXPENSE: "expense 250 travel taxi from airport"
    if (lower.startsWith('expense ')) {
      const rest = text.slice(8).trim();
      const parts = rest.split(/\s+/);
      const amount = Number(parts[0]);
      const category = parts[1];
      const description = parts.slice(2).join(' ');
      if (!Number.isFinite(amount) || !category || !description) {
        append({
          text:
            'Format: expense <amount> <category> <description>\n' +
            'Example: expense 250 travel taxi from airport',
          sender: 'bot',
          timestamp: nowIso(),
        });
        return true;
      }

      try {
        const payload = {
          user_id: userId,
          organization_id: ORG_ID,
          amount,
          category,
          description,
        };
        const r = await api.submitExpense(payload);
        const idText = r?.data?.claim?.id ? ` (ID ${r.data.claim.id})` : '';
        append({
          text: `🧾 Expense submitted${idText}.`,
          sender: 'bot',
          timestamp: nowIso(),
        });
      } catch (e) {
        append({
          text: `❌ Expense failed: ${e?.response?.data?.error || e.message}`,
          sender: 'bot',
          timestamp: nowIso(),
        });
      }
      return true;
    }

    // STATIONERY: "stationery pen:2, notebook:1"
    if (lower.startsWith('stationery ')) {
      const rawList = text.slice('stationery '.length).trim();
      const items = parseItems(rawList);
      if (!items.length) {
        append({
          text:
            'Format: stationery <item:qty, item:qty>\n' +
            'Example: stationery pen:2, notebook:1',
          sender: 'bot',
          timestamp: nowIso(),
        });
        return true;
      }

      try {
        const r = await api.requestStationery({
          user_id: userId,
          organization_id: ORG_ID,
          items,
        });
        const status = r?.data?.request?.status || 'Pending';
        append({
          text: `📦 Stationery request submitted (${status}).`,
          sender: 'bot',
          timestamp: nowIso(),
        });
      } catch (e) {
        append({
          text: `❌ Stationery failed: ${e?.response?.data?.error || e.message}`,
          sender: 'bot',
          timestamp: nowIso(),
        });
      }
      return true;
    }

    // ONBOARDING HELP: "help <question>" or "onboarding <question>"
    if (lower.startsWith('help ') || lower.startsWith('onboarding ')) {
      const question = lower.startsWith('help ')
        ? text.slice(5).trim()
        : text.slice('onboarding '.length).trim();
      if (!question) {
        append({
          text: 'Tell me your question, e.g., "help need VPN access".',
          sender: 'bot',
          timestamp: nowIso(),
        });
        return true;
      }
      try {
        await api.onboardingHelp({ user_id: userId, question });
        append({
          text: '🆘 Your onboarding ticket has been created. Someone will reach out soon.',
          sender: 'bot',
          timestamp: nowIso(),
        });
      } catch (e) {
        append({
          text: `❌ Help request failed: ${e?.response?.data?.error || e.message}`,
          sender: 'bot',
          timestamp: nowIso(),
        });
      }
      return true;
    }

    return false; // not handled as a command
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || !userId) return;

    // Optimistic user message
    append({ text, sender: 'user', timestamp: nowIso() });
    setInputMessage('');
    setLoading(true);
    setError(null);

    try {
      // Command first
      const handled = await tryHandleCommand(text);
      if (!handled) {
        // Generic chat echo
        const r = await api.sendChat(userId, text);
        const reply = r?.data?.reply ?? '...';
        append({ text: reply, sender: 'bot', timestamp: nowIso() });
      }
    } catch (e2) {
      console.error('❌ Chat send error:', e2?.message, e2?.response?.data);
      setError('Failed to send message');
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
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          list.map((msg, idx) => (
            <div
              key={`${msg.timestamp || idx}-${idx}`}
              className={`message ${msg.sender === 'bot' ? 'bot-message' : 'user-message'}`}
            >
              <div className="message-content">{msg.text}</div>
              <div className="message-time">{timeLabel(msg.timestamp || nowIso())}</div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chatbot-input">
        <input
          type="text"
          placeholder='Try: "clock in", "expense 250 travel taxi", "stationery pen:2, notebook:1", "help need VPN"'
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={loading || !userId}
        />
        <button type="submit" disabled={loading || !inputMessage.trim() || !userId}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>

      {/* Debug footer so you can confirm which API URL is used */}
      <div className="chatbot-footnote">API: {API_BASE_URL}</div>
    </div>
  );
};

export default ChatBot;
