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

export const userService = {
  async fetchUserProfile(email) {
    const res = await fetch(`${API_BASE}/user/profile?email=${encodeURIComponent(email || '')}`);
    return handleResponse(res);
  },

  async signup({ name, email, password, phone }) {
    const res = await fetch(`${API_BASE}/user/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone })
    });
    return handleResponse(res);
  },

  async login({ email, password }) {
    const res = await fetch(`${API_BASE}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async fetchUserAddresses(email) {
    const res = await fetch(`${API_BASE}/user/address?email=${encodeURIComponent(email || '')}`);
    return handleResponse(res);
  },

  async addAddress(addressData, email) {
    const res = await fetch(`${API_BASE}/user/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...addressData, email })
    });
    return handleResponse(res);
  },

  async setDefaultAddress(addressId, email) {
    const res = await fetch(`${API_BASE}/user/address/default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId, email })
    });
    return handleResponse(res);
  },

  async fetchPaymentMethods(email) {
    const res = await fetch(`${API_BASE}/user/payment-methods?email=${encodeURIComponent(email || '')}`);
    return handleResponse(res);
  },

  async addPaymentMethod(methodData, email) {
    const res = await fetch(`${API_BASE}/user/payment-methods/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...methodData, email })
    });
    return handleResponse(res);
  },

  async setDefaultPaymentMethod(methodId, email) {
    const res = await fetch(`${API_BASE}/user/payment-methods/default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ methodId, email })
    });
    return handleResponse(res);
  },

  async updatePaymentMethod(data, email) {
    const res = await fetch(`${API_BASE}/user/payment-methods/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, email })
    });
    return handleResponse(res);
  },

  async fetchUserEmails(email) {
    const res = await fetch(`${API_BASE}/user/emails?email=${encodeURIComponent(email || '')}`);
    return handleResponse(res);
  }
};
