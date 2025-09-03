import React, { useEffect, useRef, useState } from 'react';
import './AdminAIPanel.css';
import { api } from '../../utils/api';

// try several endpoints so we work with your existing backend without edits
async function tryPost(paths, body) {
  let lastErr;
  for (const p of paths) {
    try { return await api.post(p, body); } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

const AdminAIPanel = ({ showAIPanel, setShowAIPanel, user }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'WhizBot',
      content:
        "Hello Admin! I'm your AI assistant for system administration. I can help with user management, monitoring, and policy questions.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!showAIPanel) return null;

  const append = (m) => setMessages((prev) => [...prev, m]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || loading) return;

    // optimistic user echo
    append({ sender: 'You', content: text, timestamp: new Date().toISOString() });
    setInputMessage('');
    setLoading(true);

    try {
      const body = {
        message: text,
        userId: user?.id ?? user?._id ?? 'admin',
        scope: 'admin',
      };
      // try admin-specific, then generic AI assist, then chat
      const r = await tryPost(
        ['/api/ai/admin-assist', '/api/ai/assist', '/api/chat/admin', '/api/chat/send'],
        body
      );
      const reply =
        r?.data?.reply ??
        r?.data?.answer ??
        r?.data?.message ??
        'Okay. (No reply content returned by server.)';

      append({ sender: 'WhizBot', content: reply, timestamp: new Date().toISOString() });
    } catch (e2) {
      append({
        sender: 'WhizBot',
        content:
          "Sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const timeLabel = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="admin-ai-panel" role="dialog" aria-label="Admin AI Assistant">
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <div className="ai-avatar" aria-hidden>🤖</div>
          <span>WhizBot Assistant</span>
        </div>
        <button
          className="toggle-ai-panel"
          onClick={() => setShowAIPanel(false)}
          aria-label="Close AI panel"
        >
          ×
        </button>
      </div>

      <div className="ai-conversation">
        {messages.map((m, i) => (
          <div
            key={`${m.timestamp}-${i}`}
            className={`ai-message ${m.sender === 'You' ? 'user-message' : ''}`}
          >
            <div className="ai-message-header">
              {m.sender !== 'You' && <span aria-hidden>🤖</span>}
              <span>{m.sender}</span>
              <span className="ai-message-time">{timeLabel(m.timestamp)}</span>
            </div>
            <div className="ai-message-content">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="ai-message">
            <div className="ai-message-header">
              <span aria-hidden>🤖</span>
              <span>WhizBot</span>
              <span className="ai-message-time">{timeLabel(new Date().toISOString())}</span>
            </div>
            <div className="ai-message-content">Thinking…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="ai-input-area" onSubmit={handleSend}>
        <input
          type="text"
          className="ai-input"
          placeholder="Ask WhizBot about system administration…"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={loading}
        />
      </form>
    </div>
  );
};

export default AdminAIPanel;
