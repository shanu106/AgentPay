const API_BASE = '/api';

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

// Purchase Intent & Buyer Agent Execution (Spec Section 5)
export const submitPurchaseRequest = async ({ message, customApiKey, customerName, customerEmail }) => {
  const res = await fetch(`${API_BASE}/agent/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, customApiKey, customerName, customerEmail })
  });
  return handleResponse(res);
};

// Payment Verification (Spec Section 11 & 12)
export const verifyPayment = async ({ orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const res = await fetch(`${API_BASE}/agent/verify-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature })
  });
  return handleResponse(res);
};

// Order Details (Spec Section 13)
export const fetchOrderById = async (orderId) => {
  const res = await fetch(`${API_BASE}/agent/orders/${orderId}`);
  return handleResponse(res);
};

export const fetchOrders = async () => {
  const res = await fetch(`${API_BASE}/agent/orders`);
  return handleResponse(res);
};

// Audit Logs (Spec Section 16)
export const fetchAuditLogs = async () => {
  const res = await fetch(`${API_BASE}/agent/audit-logs`);
  return handleResponse(res);
};

// Config & API Keys
export const fetchConfig = async () => {
  const res = await fetch(`${API_BASE}/config`);
  return handleResponse(res);
};

export const updateApiKey = async (apiKey) => {
  const res = await fetch(`${API_BASE}/config/key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  });
  return handleResponse(res);
};
