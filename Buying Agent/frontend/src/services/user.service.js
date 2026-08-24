import { API_BASE } from '../config/agent.config';

const getAuthHeaders = () => {
  const token = localStorage.getItem('buying_agent_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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

export const userService = {
  async fetchUserProfile(email) {
    const res = await fetch(`${API_BASE}/user/profile?email=${encodeURIComponent(email || '')}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async signup({ name, email, password, phone }) {
    const res = await fetch(`${API_BASE}/user/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('buying_agent_token', data.token);
    }
    return data;
  },

  async login({ email, password }) {
    const res = await fetch(`${API_BASE}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('buying_agent_token', data.token);
    }
    return data;
  },

  async fetchUserAddresses(email) {
    const res = await fetch(`${API_BASE}/user/address?email=${encodeURIComponent(email || '')}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async addAddress(addressData, email) {
    const res = await fetch(`${API_BASE}/user/address`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...addressData, email })
    });
    return handleResponse(res);
  },

  async setDefaultAddress(addressId, email) {
    const res = await fetch(`${API_BASE}/user/address/default`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ addressId, email })
    });
    return handleResponse(res);
  },

  async fetchPaymentMethods(email) {
    const res = await fetch(`${API_BASE}/user/payment-methods?email=${encodeURIComponent(email || '')}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async addPaymentMethod(methodData, email) {
    const res = await fetch(`${API_BASE}/user/payment-methods/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...methodData, email })
    });
    return handleResponse(res);
  },

  async setDefaultPaymentMethod(methodId, email) {
    const res = await fetch(`${API_BASE}/user/payment-methods/default`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ methodId, email })
    });
    return handleResponse(res);
  },

  async updatePaymentMethod(data, email) {
    const res = await fetch(`${API_BASE}/user/payment-methods/update`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, email })
    });
    return handleResponse(res);
  },

  async deletePaymentMethod(methodId, email) {
    const res = await fetch(`${API_BASE}/user/payment-methods/delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ methodId, email })
    });
    return handleResponse(res);
  },

  async fetchUserOrders(email) {
    const res = await fetch(`${API_BASE}/user/orders?email=${encodeURIComponent(email || '')}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async fetchUserEmails(email) {
    const res = await fetch(`${API_BASE}/user/emails?email=${encodeURIComponent(email || '')}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};
