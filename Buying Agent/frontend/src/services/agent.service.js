import { API_BASE } from '../config/agent.config';

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
    merchantApiBase
  }) {
    const res = await fetch(`${API_BASE}/agent/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        customApiKey,
        customerName,
        customerEmail,
        autoExecutePayment,
        savedPaymentMethod,
        merchantApiBase
      })
    });
    return handleResponse(res);
  },

  async fetchAuditLogs() {
    const res = await fetch(`${API_BASE}/agent/audit-logs`);
    return handleResponse(res);
  },

  async fetchConfig() {
    const res = await fetch(`${API_BASE}/config`);
    return handleResponse(res);
  },

  async updateApiKey(apiKey) {
    const res = await fetch(`${API_BASE}/config/key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    return handleResponse(res);
  }
};
