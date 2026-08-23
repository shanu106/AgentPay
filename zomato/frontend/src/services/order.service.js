import { API_BASE } from '../config/constants';

export const orderService = {
  async createPaymentOrder(orderPayload) {
    const res = await fetch(`${API_BASE}/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    return res.json();
  },

  async verifyPayment(verificationPayload) {
    const res = await fetch(`${API_BASE}/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationPayload)
    });
    return res.json();
  }
};
