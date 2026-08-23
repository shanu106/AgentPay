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

export const orderService = {
  async fetchOrderById(orderId) {
    const res = await fetch(`${API_BASE}/agent/orders/${orderId}`);
    return handleResponse(res);
  },

  async fetchOrders() {
    const res = await fetch(`${API_BASE}/agent/orders`);
    return handleResponse(res);
  }
};
