const DEFAULT_MERCHANT_API_BASE = process.env.MERCHANT_API_BASE || 'http://localhost:8000/api';

/**
 * Merchant Service: Interacts with the Merchant Store / Course API (Spec Section 17 & 18)
 */
const searchMerchantProducts = async ({ query, maxPrice, category, merchantApiBase }) => {
  const apiBase = merchantApiBase || DEFAULT_MERCHANT_API_BASE;
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (maxPrice) params.append('maxPrice', maxPrice);
  if (category) params.append('category', category);

  const res = await fetch(`${apiBase}/products?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Merchant API error: ${res.statusText}`);
  }
  const data = await res.json();
  return data.products || [];
};

const getMerchantProduct = async (productId, merchantApiBase) => {
  const apiBase = merchantApiBase || DEFAULT_MERCHANT_API_BASE;
  const res = await fetch(`${apiBase}/products/${productId}`);
  if (!res.ok) {
    throw new Error(`Product not found on merchant with ID: ${productId}`);
  }
  const data = await res.json();
  return data.product;
};

const checkMerchantAvailability = async (productId, merchantApiBase) => {
  const apiBase = merchantApiBase || DEFAULT_MERCHANT_API_BASE;
  try {
    const res = await fetch(`${apiBase}/products/${productId}/availability`);
    if (!res.ok) return { available: false, quantity: 0 };
    const data = await res.json();
    return { available: data.available !== false, quantity: data.quantity || 1 };
  } catch {
    const prod = await getMerchantProduct(productId, apiBase);
    return { available: prod?.available !== false, quantity: 1 };
  }
};

const createMerchantOrder = async ({ courseId, productId, quantity = 1, items, totalAmount, customerName = 'Buyer Agent Customer', customerEmail = 'buyer.agent@example.com', merchantApiBase }) => {
  const apiBase = merchantApiBase || DEFAULT_MERCHANT_API_BASE;
  const pId = productId || courseId;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  // Try standard /api/orders endpoint first
  try {
    const res = await fetch(`${apiBase}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, productId: pId, courseId: pId, quantity: qty, totalAmount, customerName, customerEmail })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data;
    }
  } catch (_) {}

  // Fallback to /api/payment/create-order
  const res = await fetch(`${apiBase}/payment/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, courseId: pId, productId: pId, quantity: qty, totalAmount, customerName, customerEmail })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to create merchant order.');
  }

  return data;
};

const verifyMerchantPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, productId, orderId, merchantApiBase }) => {
  const apiBase = merchantApiBase || DEFAULT_MERCHANT_API_BASE;
  const pId = productId || courseId;

  // Try /api/orders/verify first
  try {
    const res = await fetch(`${apiBase}/orders/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, productId: pId })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data;
    }
  } catch (_) {}

  // Fallback to /api/payment/verify
  const res = await fetch(`${apiBase}/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId: pId })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Payment verification failed on merchant backend.');
  }

  return data;
};

module.exports = {
  searchMerchantProducts,
  getMerchantProduct,
  checkMerchantAvailability,
  createMerchantOrder,
  verifyMerchantPayment
};
