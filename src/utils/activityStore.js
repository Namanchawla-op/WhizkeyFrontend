// src/utils/activityStore.js

// simple in-memory activity feed + pub/sub
const _items = [];
const _subs = new Set();

export function addActivity(item) {
  const normalized = {
    id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: item.type || 'info',          // 'clockIn' | 'expense' | 'stationery' | 'onboarding' | etc.
    message: item.message || '',
    meta: item.meta || {},
    timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
  };
  _items.unshift(normalized);           // newest first
  _emit();
}

export function getRecentActivities(limit = 20) {
  return _items.slice(0, limit);
}

export function subscribeActivity(handler) {
  if (typeof handler !== 'function') return () => {};
  _subs.add(handler);
  // send current snapshot immediately
  try { handler(getRecentActivities()); } catch {}
  return () => _subs.delete(handler);
}

function _emit() {
  const snap = getRecentActivities();
  for (const fn of _subs) {
    try { fn(snap); } catch {}
  }
}
