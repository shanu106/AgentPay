const { query } = require('../db/index');

const DEFAULT_MERCHANT_API_BASE = process.env.MERCHANT_API_BASE || 'http://localhost:8000/api';

const DEFAULT_MERCHANTS = [
  { id: 'merchant_courses', name: 'LearnHub Courses', apiBase: process.env.MERCHANT_API_BASE || 'http://localhost:8000/api' },
  { id: 'merchant_ecommerce', name: 'TechGear Electronics', apiBase: process.env.ECOMMERCE_API_BASE || 'http://localhost:8002/api' },
  { id: 'merchant_zomato', name: 'FoodExpress Zomato', apiBase: process.env.ZOMATO_API_BASE || 'http://localhost:8003/api' }
];

// In-memory cache mapping productId -> merchantApiBase for fast, reliable routing
const productMerchantMap = new Map();

/**
 * Helper: Fetch active merchants from database (or fall back to DEFAULT_MERCHANTS)
 */
const getActiveMerchants = async () => {
  try {
    const res = await query(`SELECT id, name, api_base_url FROM merchants WHERE agent_commerce_enabled = TRUE AND status = 'active'`);
    if (res.rows && res.rows.length > 0) {
      return res.rows.map(r => ({
        id: r.id,
        name: r.name,
        apiBase: r.api_base_url
      }));
    }
  } catch (_) {}
  return DEFAULT_MERCHANTS;
};

/**
 * Merchant Service: Multi-Store Catalog Search
 */
const searchMerchantProducts = async ({ query: searchQuery, maxPrice, category, merchantApiBase }) => {
  // 1. If explicit merchant API base is supplied (e.g. single store context), query only that store
  if (merchantApiBase) {
    const params = new URLSearchParams();
    if (searchQuery) params.append('query', searchQuery);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (category) params.append('category', category);

    const res = await fetch(`${merchantApiBase}/products?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Merchant API error: ${res.statusText}`);
    }
    const data = await res.json();
    const products = data.products || [];
    products.forEach(p => {
      p.merchantApiBase = merchantApiBase;
      if (p.id) productMerchantMap.set(p.id, merchantApiBase);
    });
    return products;
  }

  // 2. Multi-Store Search: Query across all active merchants concurrently
  const merchants = await getActiveMerchants();
  const searchPromises = merchants.map(async (m) => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (category) params.append('category', category);

      const res = await fetch(`${m.apiBase}/products?${params.toString()}`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return [];
      const data = await res.json();
      const prods = data.products || [];
      return prods.map(p => {
        p.merchantApiBase = m.apiBase;
        p.merchantId = p.merchant?.id || p.merchantId || m.id;
        if (p.id) productMerchantMap.set(p.id, m.apiBase);
        return p;
      });
    } catch (_) {
      return [];
    }
  });

  const results = await Promise.allSettled(searchPromises);
  const aggregatedProducts = [];
  results.forEach(r => {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      aggregatedProducts.push(...r.value);
    }
  });

  return aggregatedProducts;
};

/**
 * Retrieve authoritative product details with automatic merchant routing
 */
const getMerchantProduct = async (productId, merchantApiBase) => {
  let apiBase = merchantApiBase || productMerchantMap.get(productId);

  if (apiBase) {
    try {
      const res = await fetch(`${apiBase}/products/${productId}`);
      if (res.ok) {
        const data = await res.json();
        const prod = data.product;
        if (prod) {
          prod.merchantApiBase = apiBase;
          productMerchantMap.set(productId, apiBase);
          return prod;
        }
      }
    } catch (_) {}
  }

  // Fallback: search across all active merchants until found
  const merchants = await getActiveMerchants();
  for (const m of merchants) {
    try {
      const res = await fetch(`${m.apiBase}/products/${productId}`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          data.product.merchantApiBase = m.apiBase;
          data.product.merchantId = data.product.merchant?.id || data.product.merchantId || m.id;
          productMerchantMap.set(productId, m.apiBase);
          return data.product;
        }
      }
    } catch (_) {}
  }

  throw new Error(`Product not found on any connected merchant store with ID: ${productId}`);
};

/**
 * Check product availability
 */
const checkMerchantAvailability = async (productId, merchantApiBase) => {
  const apiBase = merchantApiBase || productMerchantMap.get(productId) || DEFAULT_MERCHANT_API_BASE;
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

/**
 * Create order on the appropriate Merchant Backend
 */
const createMerchantOrder = async ({ courseId, productId, quantity = 1, items, totalAmount, customerName = 'Buyer Agent Customer', customerEmail = 'buyer.agent@example.com', merchantApiBase }) => {
  const pId = productId || courseId || (items && items[0]?.productId);
  const apiBase = merchantApiBase || productMerchantMap.get(pId) || DEFAULT_MERCHANT_API_BASE;
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
      if (data.success) {
        data.merchantApiBase = apiBase;
        return data;
      }
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

  data.merchantApiBase = apiBase;
  return data;
};

/**
 * Verify payment on Merchant Backend
 */
const verifyMerchantPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, productId, orderId, merchantApiBase }) => {
  const pId = productId || courseId;
  const apiBase = merchantApiBase || productMerchantMap.get(pId) || DEFAULT_MERCHANT_API_BASE;

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
  verifyMerchantPayment,
  productMerchantMap
};
