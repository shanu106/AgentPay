import { API_BASE } from '../config/agent.config';

const getAuthHeaders = () => {
  const token = localStorage.getItem('buying_agent_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned unexpected response (${res.status} ${res.statusText})`);
  }
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
};

export const agentService = {
  async submitPurchaseRequest({
    message,
    customApiKey,
    customerName,
    customerEmail,
    autoExecutePayment,
    savedPaymentMethod,
    merchantApiBase,
    language = 'en'
  }) {
    const res = await fetch(`${API_BASE}/agent/purchase`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        message,
        customApiKey,
        customerName,
        customerEmail,
        autoExecutePayment,
        savedPaymentMethod,
        merchantApiBase,
        language
      })
    });
    return handleResponse(res);
  },

  async fetchAuditLogs() {
    const res = await fetch(`${API_BASE}/agent/audit-logs`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async fetchConfig() {
    const res = await fetch(`${API_BASE}/config`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async updateApiKey(apiKey) {
    const res = await fetch(`${API_BASE}/config/key`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ apiKey })
    });
    return handleResponse(res);
  }
};
