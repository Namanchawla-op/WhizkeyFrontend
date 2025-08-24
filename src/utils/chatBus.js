// src/utils/chatBus.js

// Keep a simple in-memory pub/sub for chat messages
const listeners = new Set();

/**
 * Push a message to all ChatBot listeners.
 * Usage: pushChat({ sender: 'bot'|'user'|'system', text: '...', timestamp: Date|ISO })
 */
export function pushChat(message) {
  const msg = normalize(message);
  for (const fn of listeners) {
    try { fn(msg); } catch {}
  }
}

/**
 * Subscribe to incoming chat messages. Returns unsubscribe().
 * ChatBot calls this to render messages when other parts of the app push into the bus.
 */
export function subscribeChat(handler) {
  if (typeof handler !== 'function') return () => {};
  listeners.add(handler);
  return () => listeners.delete(handler);
}

// Optional helper for clearing or system notices if you need them later
export function pushSystem(text) {
  pushChat({ sender: 'system', text });
}

function normalize(m) {
  if (!m || typeof m !== 'object') return { sender: 'system', text: String(m || ''), timestamp: new Date().toISOString() };
  return {
    sender: m.sender || 'bot',
    text: m.text ?? '',
    timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
  };
}
