// src/utils/supervisorApi.js
import { api } from './api';

/**
 * Unified supervisor API for HR / Finance / Logistics dashboards.
 * Every section exposes: stats(orgId), listRequests(orgId, filter),
 * approve(id), reject(id). Add/adjust endpoints as your backend expects.
 */
const supervisorApi = {
  hr: {
    stats: (organization_id) =>
      api.get('/api/hr/stats', { params: { organization_id } }),
    listRequests: (organization_id, filter) =>
      api.get('/api/hr/requests', { params: { organization_id, filter } }),
    approve: (requestId) => api.post(`/api/hr/requests/${requestId}/approve`),
    reject: (requestId) => api.post(`/api/hr/requests/${requestId}/reject`),
  },

  finance: {
    stats: (organization_id) =>
      api.get('/api/finance/stats', { params: { organization_id } }),
    listRequests: (organization_id, filter) =>
      api.get('/api/finance/requests', { params: { organization_id, filter } }),
    approve: (requestId) =>
      api.post(`/api/finance/requests/${requestId}/approve`),
    reject: (requestId) =>
      api.post(`/api/finance/requests/${requestId}/reject`),
  },

  logistics: {
    stats: (organization_id) =>
      api.get('/api/logistics/stats', { params: { organization_id } }),
    listRequests: (organization_id, filter) =>
      api.get('/api/logistics/requests', {
        params: { organization_id, filter },
      }),
    approve: (requestId) =>
      api.post(`/api/logistics/requests/${requestId}/approve`),
    reject: (requestId) =>
      api.post(`/api/logistics/requests/${requestId}/reject`),
  },
};

/** Convenience pass-throughs when you already know the role string */
const stats = (role, organization_id) =>
  supervisorApi[role]?.stats(organization_id);

const listRequests = (role, organization_id, filter) =>
  supervisorApi[role]?.listRequests(organization_id, filter);

const approve = (role, requestId) =>
  supervisorApi[role]?.approve(requestId);

const reject = (role, requestId) =>
  supervisorApi[role]?.reject(requestId);

/** Named exports (what your components are importing) */
export { supervisorApi, stats, listRequests, approve, reject };

/** Default export too, so both import styles work */
export default supervisorApi;
