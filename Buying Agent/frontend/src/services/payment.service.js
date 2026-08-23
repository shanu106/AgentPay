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

export const paymentService = {
  loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  async verifyPayment({ orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const res = await fetch(`${API_BASE}/agent/verify-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature })
    });
    return handleResponse(res);
  },

  async fetchSavedPaymentMethod() {
    const res = await fetch(`${API_BASE}/agent/saved-payment-method`);
    return handleResponse(res);
  },

  async updateSavedPaymentMethod(paymentData) {
    const res = await fetch(`${API_BASE}/agent/saved-payment-method`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    return handleResponse(res);
  }
};
