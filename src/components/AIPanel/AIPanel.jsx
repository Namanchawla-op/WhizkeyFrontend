import React, { useEffect, useRef, useState } from 'react';
import './AIPanel.css';
import { api } from '../../utils/api';

/**
 * Uses your existing chat backend:
 *  - GET  /api/chat/history?userId=#
 *  - POST /api/chat/send { userId, message }
 * We also tag the role in the outgoing text so your backend could use it later.
 */
const AIPanel = ({ showAIPanel, setShowAIPanel, role, userId }) => {
  const [messages, setMessages] = useState([]); // { sender: 'You'|'WhizBot', content, timestamp }
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  // Load chat history when panel opens
  useEffect(() => {
    if (!showAIPanel || !userId) return;

    let cancelled = false;
    (async () => {
      try {
        const r = await api.get('/api/chat/history', { params: { userId } });
        const list = Array.isArray(r?.data?.messages) ? r.data.messages : [];
        const normalized = list.map((m) => ({
          sender: m.sender === 'bot' ? 'WhizBot' : 'You',
          content: String(m.text ?? m.content ?? ''),
          timestamp: m.timestamp || new Date().toISOString(),
        }));
        // If first open and no history, seed a single greeting (UI only)
        const seed = normalized.length
          ? normalized
          : [{
              sender: 'WhizBot',
              content:
                "Hello! I'm your AI assistant for reviewing and tracking requests. Ask about policies, or type what you want to do (e.g., “show pending expenses”).",
              timestamp: new Date().toISOString(),
            }];
        if (!cancelled) setMessages(seed);
      } catch (e) {
        if (!cancelled) {
          setMessages([{
            sender: 'WhizBot',
            content: 'Could not load chat history.',
            timestamp: new Date().toISOString(),
          }]);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [showAIPanel, userId]);

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || !userId || loading) return;

    // Optimistic user bubble
    const userBubble = {
      sender: 'You',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userBubble]);
    setInputMessage('');
    setLoading(true);

    try {
      // Tag role context into message (lightweight, backend-agnostic)
      const contextual = role ? `[role:${role}] ${text}` : text;

      const r = await api.post('/api/chat/send', { userId, message: contextual });
      const reply = r?.data?.reply ?? '…';

      const botBubble = {
        sender: 'WhizBot',
        content: String(reply),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botBubble]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'WhizBot',
          content: "Sorry, I'm having trouble connecting right now. Please try again later.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!showAIPanel) return null;

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <div className="ai-avatar">🤖</div>
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
          <div key={`${m.timestamp}-${i}`} className={`ai-message ${m.sender === 'You' ? 'user-message' : ''}`}>
            <div className="ai-message-header">
              {m.sender !== 'You' && <span aria-hidden>🤖</span>}
              <span>{m.sender}</span>
            </div>
            <div className="ai-message-content">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="ai-message">
            <div className="ai-message-header">
              <span aria-hidden>🤖</span>
              <span>WhizBot</span>
            </div>
            <div className="ai-message-content">Thinking...</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="ai-input-area" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="ai-input"
          placeholder="Ask WhizBot about policies or requests…"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={loading || !userId}
        />
      </form>
    </div>
  );
};

export default AIPanel;
