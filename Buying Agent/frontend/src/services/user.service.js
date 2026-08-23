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

  async fetchUserAddresses(email) {
    const res = await fetch(`${API_BASE}/user/addresses?email=${encodeURIComponent(email || '')}`);
    return handleResponse(res);
  },

  async fetchUserEmails(email) {
    const res = await fetch(`${API_BASE}/user/emails?email=${encodeURIComponent(email || '')}`);
    return handleResponse(res);
  },

  async login(email, name) {
    const res = await fetch(`${API_BASE}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });
    return handleResponse(res);
  }
};
