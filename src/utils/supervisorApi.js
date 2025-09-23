// src/utils/supervisorApi.js
import { api } from './api';

export const ORG_ID = Number(process.env.REACT_APP_ORG_ID || 1);

export const supervisorApi = {
  finance: {
    listExpenses: (organization_id = ORG_ID) =>
      api.get('/api/finance/expenses', { params: { organization_id } }),
    setExpenseStatus: (id, status) =>
      api.put('/api/finance/expenses/status', { id, status }),
  },
  hr: {
    listAttendance: (organization_id = ORG_ID) =>
      api.get('/api/hr/attendance', { params: { organization_id } }),
    approveExemption: (id, approved) =>
      api.put('/api/hr/attendance/exemption', { id, approved }),
    listOnboarding: (organization_id = ORG_ID) =>
      api.get('/api/hr/onboarding', { params: { organization_id } }),
  },
  logistics: {
    listTravel: (organization_id = ORG_ID) =>
      api.get('/api/logistics/travel', { params: { organization_id } }),
    setTravelStatus: (id, status) =>
      api.put('/api/logistics/travel/status', { id, status }),
    listStationery: (organization_id = ORG_ID) =>
      api.get('/api/logistics/stationery', { params: { organization_id } }),
    setStationeryStatus: (id, status) =>
      api.put('/api/logistics/stationery/status', { id, status }),
  },
  onboarding: {
    createTicket: ({ user_id, question }) =>
      api.post('/api/onboarding/help', { user_id, question }),
  },
};
