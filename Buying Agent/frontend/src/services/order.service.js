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

export const orderService = {
  async fetchOrderById(orderId) {
    const res = await fetch(`${API_BASE}/agent/orders/${orderId}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async fetchOrders() {
    const res = await fetch(`${API_BASE}/agent/orders`, { headers: getAuthHeaders() });
    return handleResponse(res);
  }
};
