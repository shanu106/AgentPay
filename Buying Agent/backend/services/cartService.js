const { products, coupons } = require('../data/catalog');
const { v4: uuidv4 } = require('uuid');

let cartItems = [];
let appliedCoupon = null;
const orders = [];

const calculateCartSummary = () => {
  const itemsWithDetails = cartItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    const price = product ? product.price : 0;
    return {
      productId: item.productId,
      quantity: item.quantity,
      product: product || { id: item.productId, title: 'Unknown Product', price: 0 },
      itemTotal: price * item.quantity
    };
  });

  const subtotal = itemsWithDetails.reduce((acc, curr) => acc + curr.itemTotal, 0);

  let discountAmount = 0;
  let couponInfo = null;

  if (appliedCoupon) {
    const coupon = coupons.find(c => c.code.toUpperCase() === appliedCoupon.toUpperCase());
    if (coupon) {
      if (subtotal >= (coupon.minSpend || 0)) {
        discountAmount = Math.round((subtotal * coupon.discountPercent) / 100);
        couponInfo = {
          code: coupon.code,
          discountPercent: coupon.discountPercent,
          savings: discountAmount,
          description: coupon.description
        };
      }
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);

  return {
    items: itemsWithDetails,
    totalItems: itemsWithDetails.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    discountAmount,
    coupon: couponInfo,
    finalTotal
  };
};

const addToCart = (productId, quantity = 1) => {
  const product = products.find(p => p.id === productId);
  if (!product) {
    throw new Error(`Product with ID "${productId}" not found in catalog.`);
  }

  const existingIndex = cartItems.findIndex(item => item.productId === productId);
  if (existingIndex > -1) {
    cartItems[existingIndex].quantity += quantity;
  } else {
    cartItems.push({ productId, quantity });
  }

  return calculateCartSummary();
};

const removeFromCart = (productId) => {
  cartItems = cartItems.filter(item => item.productId !== productId);
  return calculateCartSummary();
};

const updateQuantity = (productId, quantity) => {
  if (quantity <= 0) {
    return removeFromCart(productId);
  }

  const existingIndex = cartItems.findIndex(item => item.productId === productId);
  if (existingIndex > -1) {
    cartItems[existingIndex].quantity = quantity;
  } else {
    cartItems.push({ productId, quantity });
  }

  return calculateCartSummary();
};

const clearCart = () => {
  cartItems = [];
  appliedCoupon = null;
  return calculateCartSummary();
};

const applyCoupon = (code) => {
  if (!code) {
    appliedCoupon = null;
    return { success: true, message: 'Coupon removed', cart: calculateCartSummary() };
  }

  const coupon = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
  if (!coupon) {
    return {
      success: false,
      message: `Invalid coupon code "${code}". Available codes: ${coupons.map(c => c.code).join(', ')}`,
      cart: calculateCartSummary()
    };
  }

  const currentSubtotal = cartItems.reduce((sum, item) => {
    const prod = products.find(p => p.id === item.productId);
    return sum + (prod ? prod.price * item.quantity : 0);
  }, 0);

  if (currentSubtotal < coupon.minSpend) {
    return {
      success: false,
      message: `Coupon "${coupon.code}" requires minimum order value of ₹${coupon.minSpend}. Current subtotal is ₹${currentSubtotal}.`,
      cart: calculateCartSummary()
    };
  }

  appliedCoupon = coupon.code;
  return {
    success: true,
    message: `Coupon "${coupon.code}" applied! You saved ${coupon.discountPercent}%.`,
    cart: calculateCartSummary()
  };
};

const checkoutOrder = ({ customerName, customerEmail, paymentMethod = 'UPI / Card' }) => {
  const summary = calculateCartSummary();
  if (summary.items.length === 0) {
    throw new Error('Cannot checkout an empty cart.');
  }

  const orderId = `ord_nova_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
  const order = {
    orderId,
    customerName: customerName || 'Valued Shopper',
    customerEmail: customerEmail || 'shopper@example.com',
    paymentMethod,
    items: summary.items,
    totalItems: summary.totalItems,
    subtotal: summary.subtotal,
    discountAmount: summary.discountAmount,
    coupon: summary.coupon,
    finalTotal: summary.finalTotal,
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
    deliveryEstimate: 'Instant Digital Access & 2-3 Days for Hardware Items'
  };

  orders.push(order);
  clearCart();

  return order;
};

module.exports = {
  getCart: calculateCartSummary,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  applyCoupon,
  checkoutOrder,
  getOrders: () => orders
};
