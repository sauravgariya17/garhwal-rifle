const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  getRoles: () => request('/auth/roles'),
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  forgotPassword: (payload) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  resetPassword: (payload) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  unlockAccount: (payload) =>
    request('/auth/unlock-account', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getBootstrap: () => request('/bootstrap'),
  applyLeave: (payload) =>
    request('/leaves', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  decideLeave: (id, payload) =>
    request(`/leaves/${id}/decision`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  markLeaveReturned: (id, payload) =>
    request(`/leaves/${id}/return`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  deleteLeave: (id) =>
    request(`/leaves/${id}`, {
      method: 'DELETE'
    }),
  addCompany: (payload) =>
    request('/companies', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateCompany: (id, payload) =>
    request(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteCompany: (id, actorRole) =>
    request(`/companies/${id}?actorRole=${encodeURIComponent(actorRole || '')}`, {
      method: 'DELETE'
    }),
  updateParadeCell: (payload) =>
    request('/parade/cell', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  addParadeRow: (payload) =>
    request('/parade/row', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  signParadeState: (payload) =>
    request('/parade/sign', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  resetParadeSheet: () =>
    request('/parade/reset', {
      method: 'POST'
    }),
  askAi: (prompt) =>
    request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    }),
  toggleAutomation: (payload) =>
    request('/automations/toggle', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  runRollCall: (payload) =>
    request('/automations/run-rollcall', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  markNotificationsRead: (payload) =>
    request('/notifications/read', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  clearLogs: () =>
    request('/logs/clear', {
      method: 'POST'
    }),
  resetDemo: () =>
    request('/reset-demo', {
      method: 'POST'
    })
};
