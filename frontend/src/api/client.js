import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fraudlens_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fraudlens_token');
      localStorage.removeItem('fraudlens_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardAPI = {
  overview: () => api.get('/dashboard/overview'),
  recentTransactions: () => api.get('/dashboard/recent-transactions'),
  fraudTrends: (days = 30) => api.get(`/dashboard/fraud-trends?days=${days}`),
  riskDistribution: () => api.get('/dashboard/risk-distribution'),
};

// Transactions
export const transactionsAPI = {
  list: (params) => api.get('/transactions', { params }),
  get: (id) => api.get(`/transactions/${id}`),
  analyze: (id) => api.post(`/transactions/${id}/analyze`),
};

// Fraud
export const fraudAPI = {
  analyze: (data) => api.post('/fraud/analyze', data),
  highRisk: () => api.get('/fraud/high-risk'),
  statistics: () => api.get('/fraud/statistics'),
  get: (txnId) => api.get(`/fraud/${txnId}`),
};

// Alerts
export const alertsAPI = {
  list: (params) => api.get('/alerts', { params }),
  get: (id) => api.get(`/alerts/${id}`),
  update: (id, data) => api.patch(`/alerts/${id}`, data),
  resolve: (id, data) => api.post(`/alerts/${id}/resolve`, data),
  assign: (id, data) => api.post(`/alerts/${id}/assign`, data),
};

// Customers
export const customersAPI = {
  list: () => api.get('/customers'),
  get: (id) => api.get(`/customers/${id}`),
  transactions: (id) => api.get(`/customers/${id}/transactions`),
  behavior: (id) => api.get(`/customers/${id}/behavior`),
  risk: (id) => api.get(`/customers/${id}/risk`),
};

// Accounts
export const accountsAPI = {
  list: () => api.get('/accounts'),
  get: (id) => api.get(`/accounts/${id}`),
  transactions: (id) => api.get(`/accounts/${id}/transactions`),
};

// Investigations
export const investigationsAPI = {
  list: (params) => api.get('/investigations', { params }),
  create: (data) => api.post('/investigations', data),
  get: (id) => api.get(`/investigations/${id}`),
  update: (id, data) => api.patch(`/investigations/${id}`, data),
  addNote: (id, data) => api.post(`/investigations/${id}/notes`, data),
  close: (id, data) => api.post(`/investigations/${id}/close`, data),
};

// Networks
export const networksAPI = {
  list: () => api.get('/networks'),
  get: (id) => api.get(`/networks/${id}`),
  graph: (id) => api.get(`/networks/${id}/graph`),
  suspicious: () => api.get('/networks/suspicious'),
  accountGraph: (id) => api.get(`/networks/account/${id}/graph`),
};

// Analytics
export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
  fraudTrends: (days) => api.get(`/analytics/fraud-trends?days=${days || 30}`),
  paymentMethods: () => api.get('/analytics/payment-methods'),
  timePatterns: () => api.get('/analytics/time-patterns'),
  riskDistribution: () => api.get('/analytics/risk-distribution'),
  locations: () => api.get('/analytics/locations'),
  merchants: () => api.get('/analytics/merchants'),
};

// Reports
export const reportsAPI = {
  fraud: () => api.get('/reports/fraud'),
  investigations: () => api.get('/reports/investigations'),
  export: (data) => api.post('/reports/export', data),
};

// AI Assistant
export const assistantAPI = {
  chat: (message) => api.post('/assistant/chat', { message }),
};

// Data
export const dataAPI = {
  devices: () => api.get('/data/devices'),
  beneficiaries: () => api.get('/data/beneficiaries'),
  merchants: () => api.get('/data/merchants'),
  locations: () => api.get('/data/locations'),
};

// ============================================
// V2 Enterprise Priority APIs
// ============================================

export const v2ScamAPI = {
  getIntelligence: () => api.get('/v2/scam/intelligence'),
  simulate: (data) => api.post('/v2/scam/simulate', data),
};

export const v2FailuresAPI = {
  getAnalytics: () => api.get('/v2/failures/analytics'),
  diagnose: (data) => api.post('/v2/failures/diagnose', data),
  smartRetry: (data) => api.post('/v2/failures/smart-retry', data),
};

export const v2RecoveryAPI = {
  getStats: () => api.get('/v2/recovery/stats'),
  getDisputes: (stage) => api.get('/v2/recovery/disputes', { params: { stage } }),
  generateEvidence: (disputeId) => api.post(`/v2/recovery/generate-evidence/${disputeId}`),
  submitRepresentment: (data) => api.post('/v2/recovery/submit-representment', data),
};

export const v2AtoAPI = {
  getEvents: () => api.get('/v2/ato/events'),
  evaluateSession: (data) => api.post('/v2/ato/evaluate-session', data),
  remediate: (data) => api.post('/v2/ato/remediate', data),
};

export const v2ComplaintsAPI = {
  getList: () => api.get('/v2/complaints'),
  analyzeText: (body) => api.post('/v2/complaints/analyze-text', null, { params: { body } }),
  escalate: (id) => api.post(`/v2/complaints/${id}/escalate`),
};

export const v2MerchantsAPI = {
  getOverview: () => api.get('/v2/merchants/overview'),
  getHealth: () => api.get('/v2/merchants/health'),
  applyAction: (data) => api.post('/v2/merchants/apply-action', data),
};

export const v2NetworkAPI = {
  getRings: () => api.get('/v2/network/rings'),
};

export const v2XaiAPI = {
  getAttribution: (txnId) => api.get(`/v2/xai/attribution/${txnId}`),
  counterfactual: (data) => api.post('/v2/xai/counterfactual', data),
};

export const v2CopilotAPI = {
  chat: (data) => api.post('/v2/copilot/chat', data),
  executeAction: (data) => api.post('/v2/copilot/execute-action', data),
};

export const v2InvestigationsAPI = {
  getCases: (status) => api.get('/v2/investigations/cases', { params: { status } }),
  generateSAR: (data) => api.post('/v2/investigations/generate-sar', data),
  getAuditTrail: (invId) => api.get(`/v2/investigations/${invId}/audit-trail`),
};

export default api;

