import React, { useEffect, useRef, useState } from 'react';
import './ChatBot.css';
import api from '../../utils/api';
import { subscribeChat } from '../../utils/chatBus';

// Keep legacy import compatibility for modules that do:
//   import { API_BASE_URL } from '../ChatBot/ChatBot'
export { API_BASE as API_BASE_URL } from '../../setupAxios';

function toView(m) {
  if (!m) return null;
  const role = m.role || (m.sender === 'user' ? 'user' : 'system');
  const text = m.text ?? m.message ?? String(m ?? '');
  const ts = m.time || m.timestamp || m.ts;
  let time = '';
  if (ts) {
    try { time = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch {}
  }
  return { role, text, time };
}

const ORG_ID = Number(process.env.REACT_APP_ORG_ID || 1);

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [me, setMe] = useState(null);
  const scrollRef = useRef(null);
  const unsubRef = useRef(null);

  // Load current user + chat history
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/user/me');
        setMe(data);
        await loadHistory(data?.id);
      } catch {
        // render anyway – actions will fallback to userId 1
      }
    })();
  }, []);

  // Subscribe to in-app triggers (QuickActions, tiles, etc.)
  useEffect(() => {
    unsubRef.current = subscribeChat(async (payload) => {
      const obj = typeof payload === 'string' ? { text: payload } : payload;

      // Handle flow commands like "__FLOW__:clockin:start"
      if (obj?.text?.startsWith?.('__FLOW__:')) {
        const parts = obj.text.split(':'); // ["__FLOW__", "clockin", "start"]
        const flow = parts[1];
        await handleFlow(flow);
        return;
      }

      // Otherwise, show payload as message(s)
      if (Array.isArray(payload)) {
        const mapped = payload.map(toView).filter(Boolean);
        setMessages(mapped);
      } else {
        const mapped = toView(obj);
        if (mapped) setMessages((prev) => [...prev, mapped]);
      }
      autoScroll();
    });
    return () => unsubRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  const autoScroll = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  };

  async function loadHistory(userId) {
    if (!userId) return;
    try {
      const { data } = await api.get('/api/chat/history', { params: { userId } });
      const mapped = Array.isArray(data?.messages)
        ? data.messages.map(toView).filter(Boolean)
        : [];
      setMessages(mapped);
      autoScroll();
    } catch {}
  }

  // Flow handlers for button-triggered actions
  async function handleFlow(flow) {
    const uid = me?.id || 1;
    const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      switch (flow) {
        case 'clockin':
          await api.post('/api/attendance/checkin', { user_id: uid });
          setMessages((p) => [...p, { role: 'system', text: '✅ Clocked in successfully.', time: now() }]);
          break;
        case 'clockout':
          await api.post('/api/attendance/checkout', { user_id: uid });
          setMessages((p) => [...p, { role: 'system', text: '✅ Clocked out successfully.', time: now() }]);
          break;
        case 'expense':
          setMessages((p) => [...p, { role: 'system', text: '💳 What amount and purpose? e.g., "expense 200 taxi"', time: now() }]);
          break;
        case 'stationery':
          setMessages((p) => [...p, { role: 'system', text: '🗂️ List items like "pen:2, notebook:1".', time: now() }]);
          break;
        case 'onboarding':
          setMessages((p) => [...p, { role: 'system', text: '👋 What do you need help with?', time: now() }]);
          break;
        default:
          break;
      }
    } catch {
      setMessages((p) => [...p, { role: 'system', text: '⚠️ Request failed. Please try again.', time: now() }]);
    }
    autoScroll();
  }

  // Send user message with simple intent parsing → backend
  async function send(e) {
    e?.preventDefault?.();
    const msg = text.trim();
    if (!msg) return;
    const uid = me?.id || 1;
    const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // optimistic user bubble
    setMessages((p) => [...p, { role: 'user', text: msg, time: now() }]);
    setText('');
    autoScroll();

    const lower = msg.toLowerCase();

    try {
      // Intents
      if (lower.startsWith('clock in') || lower.startsWith('check in')) {
        await handleFlow('clockin'); return;
      }
      if (lower.startsWith('clock out') || lower.startsWith('checkout') || lower.startsWith('check out')) {
        await handleFlow('clockout'); return;
      }
      if (lower.startsWith('expense')) {
        // "expense 200 taxi"
        const parts = lower.split(' ').filter(Boolean);
        const amount = Number(parts[1]);
        const category = parts.slice(2).join(' ') || 'general';
        if (Number.isFinite(amount)) {
          await api.post('/api/expense/submit', { amount, category, description: category, user_id: uid, organization_id: ORG_ID });
          setMessages((p) => [...p, { role: 'system', text: `✅ Expense submitted: ${amount} (${category})`, time: now() }]);
          autoScroll(); return;
        }
      }
      if (lower.startsWith('stationery')) {
        // "stationery pen:2, notebook:1"
        const itemsPart = msg.slice('stationery'.length).trim();
        const items = itemsPart.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
        await api.post('/api/stationery/request', { items, user_id: uid, organization_id: ORG_ID });
        setMessages((p) => [...p, { role: 'system', text: '✅ Stationery request submitted.', time: now() }]);
        autoScroll(); return;
      }
      if (lower.startsWith('help') || lower.startsWith('onboarding')) {
        const detail = msg.replace(/^help\s*/i, '').trim() || 'General onboarding help';
        await api.post('/api/onboarding/help', { message: detail, user_id: uid, organization_id: ORG_ID });
        setMessages((p) => [...p, { role: 'system', text: `✅ Ticket created: ${detail}`, time: now() }]);
        autoScroll(); return;
      }

      // Fallback to simple echo bot on backend
      const { data } = await api.post('/api/chat/send', { userId: uid, message: msg });
      const reply = data?.reply ?? 'Ok.';
      setMessages((p) => [...p, { role: 'system', text: reply, time: now() }]);
      autoScroll();
    } catch {
      setMessages((p) => [...p, { role: 'system', text: '⚠️ Request failed. Please try again.', time: now() }]);
      autoScroll();
    }
  }

  return (
    <section className="chatbot-card">
      <div className="chat-header">
        <div className="chat-title">Assistant</div>
        <div className="chat-subtitle">Ask anything about your tasks</div>
      </div>

      <div className="chat-scroll" ref={scrollRef}>
        {(!messages || messages.length === 0) && (
          <div className="chat-empty">
            <div className="empty-title">How can I help?</div>
            <div className="empty-hints">
              Try: <span className="hint">“clock in”</span>,{' '}
              <span className="hint">“expense 200 taxi”</span>,{' '}
              <span className="hint">“pen:2 notebook:1”</span>
            </div>
          </div>
        )}

        {Array.isArray(messages) &&
          messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'system'}`}>
              <div className="bubble">
                {m.text}
                {m.time && <span className="time">{m.time}</span>}
              </div>
            </div>
          ))}
      </div>

      <form className="chat-input" onSubmit={send}>
        <input
          type="text"
          value={text}
          placeholder='Try: "clock in", "expense 200 taxi", "stationery pen:2"'
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="send-btn" aria-label="Send" disabled={!text.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}
