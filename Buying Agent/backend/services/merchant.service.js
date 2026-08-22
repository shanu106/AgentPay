const MERCHANT_API_BASE = process.env.MERCHANT_API_BASE || 'http://localhost:8000/api';

/**
 * Merchant Service: Interacts with the Merchant Course Website API (Spec Section 17 & 18)
 */
const searchMerchantProducts = async ({ query, maxPrice, category }) => {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (maxPrice) params.append('maxPrice', maxPrice);
  if (category) params.append('category', category);

  const res = await fetch(`${MERCHANT_API_BASE}/products?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Merchant API error: ${res.statusText}`);
  }
  const data = await res.json();
  return data.products || [];
};

const getMerchantProduct = async (productId) => {
  const res = await fetch(`${MERCHANT_API_BASE}/products/${productId}`);
  if (!res.ok) {
    throw new Error(`Product not found on merchant with ID: ${productId}`);
  }
  const data = await res.json();
  return data.product;
};

const checkMerchantAvailability = async (productId) => {
  try {
    const res = await fetch(`${MERCHANT_API_BASE}/products/${productId}/availability`);
    if (!res.ok) return { available: false, quantity: 0 };
    const data = await res.json();
    return { available: data.available !== false, quantity: data.quantity || 1 };
  } catch {
    const prod = await getMerchantProduct(productId);
    return { available: prod?.available !== false, quantity: 1 };
  }
};

const createMerchantOrder = async ({ courseId, customerName = 'Buyer Agent Customer', customerEmail = 'buyer.agent@example.com' }) => {
  const res = await fetch(`${MERCHANT_API_BASE}/payment/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId, customerName, customerEmail })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to create merchant order.');
  }

  return data;
};

const verifyMerchantPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId }) => {
  const res = await fetch(`${MERCHANT_API_BASE}/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId })
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
