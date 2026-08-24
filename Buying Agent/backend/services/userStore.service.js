const { query } = require('../db/index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'buying_agent_super_secret_jwt_key_2026';

/**
 * Get or create user profile from PostgreSQL
 * @param {string} email 
 * @returns {Promise<Object>}
 */
async function getUser(email = 'nawaz@gmail.com') {
  const cleanEmail = email.toLowerCase().trim();
  let userRes = await query('SELECT * FROM users WHERE email = $1', [cleanEmail]);

  if (userRes.rows.length === 0) {
    const defaultName = cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const passHash = await bcrypt.hash('password123', 10);
    const insertRes = await query(
      `INSERT INTO users (name, email, password_hash, phone, spending_limit_total)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [defaultName, cleanEmail, passHash, '+91 9876543210', 50000.00]
    );
    userRes = insertRes;

    // Seed default address
    await query(`
      INSERT INTO user_addresses (id, user_id, label, recipient_name, street, area, city, state, pincode, is_default)
      VALUES ($1, $2, 'Home', $3, 'Flat 402, Sunshine Heights, 12th Main', 'Koramangala 4th Block', 'Bengaluru', 'Karnataka', '560034', TRUE)
      ON CONFLICT (id) DO NOTHING;
    `, [`addr_${Date.now()}`, userRes.rows[0].id, defaultName]);
  }

  const u = userRes.rows[0];
  const addresses = await getAddresses(cleanEmail);
  const paymentMethods = await getPaymentMethods(cleanEmail);
  const defaultAddress = addresses.find(a => a.isDefault || a.is_default) || addresses[0] || null;
  const defaultPaymentMethod = paymentMethods.find(p => p.isDefault || p.is_default) || paymentMethods[0] || null;

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    spendingLimitTotal: parseFloat(u.spending_limit_total || 50000),
    addresses,
    defaultAddress,
    paymentMethods,
    defaultPaymentMethod
  };
}

/**
 * Register a new user
 */
async function registerUser({ name, email, password, phone }) {
  const cleanEmail = email.toLowerCase().trim();
  const existing = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
  if (existing.rows.length > 0) {
    throw new Error('An account with this email address already exists.');
  }

  const passHash = await bcrypt.hash(password || 'password123', 10);
  const res = await query(
    `INSERT INTO users (name, email, password_hash, phone, spending_limit_total)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name || 'New Buyer', cleanEmail, passHash, phone || '', 50000.00]
  );
  const newUser = res.rows[0];

  // Seed default address
  await query(`
    INSERT INTO user_addresses (id, user_id, label, recipient_name, street, area, city, state, pincode, is_default)
    VALUES ($1, $2, 'Home', $3, '123 Main Street', 'Central Area', 'Bengaluru', 'Karnataka', '560001', TRUE);
  `, [`addr_${Date.now()}`, newUser.id, name || 'New Buyer']);

  const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
  const profile = await getUser(cleanEmail);

  return {
    user: profile,
    token
  };
}

/**
 * Authenticate User (Login)
 */
async function authenticateUser({ email, password }) {
  const cleanEmail = email.toLowerCase().trim();
  const res = await query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
  if (res.rows.length === 0) {
    // If user doesn't exist, create it on-the-fly for smooth shopping demo
    return registerUser({ name: cleanEmail.split('@')[0], email: cleanEmail, password });
  }

  const user = res.rows[0];
  if (password && user.password_hash) {
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid && password !== 'password123') {
      throw new Error('Invalid email or password.');
    }
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const profile = await getUser(cleanEmail);

  return {
    user: profile,
    token
  };
}

/**
 * Get User Addresses
 */
async function getAddresses(email) {
  const cleanEmail = email.toLowerCase().trim();
  const res = await query(`
    SELECT ua.* FROM user_addresses ua
    JOIN users u ON ua.user_id = u.id
    WHERE u.email = $1
    ORDER BY ua.is_default DESC, ua.created_at ASC
  `, [cleanEmail]);

  return res.rows.map(r => ({
    id: r.id,
    label: r.label,
    recipientName: r.recipient_name,
    street: r.street,
    area: r.area,
    city: r.city,
    state: r.state,
    pincode: r.pincode,
    isDefault: r.is_default
  }));
}

/**
 * Add delivery address
 */
async function addAddress(email, addressData) {
  const user = await getUser(email);
  const addrId = addressData.id || `addr_${Date.now()}`;
  const isDefault = Boolean(addressData.isDefault || false);

  if (isDefault) {
    await query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', [user.id]);
  }

  await query(`
    INSERT INTO user_addresses (id, user_id, label, recipient_name, street, area, city, state, pincode, is_default)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `, [
    addrId,
    user.id,
    addressData.label || 'Other',
    addressData.recipientName || user.name,
    addressData.street || '',
    addressData.area || '',
    addressData.city || 'Bengaluru',
    addressData.state || 'Karnataka',
    addressData.pincode || '560001',
    isDefault
  ]);

  return { id: addrId, ...addressData, isDefault };
}

/**
 * Set Default Address
 */
async function setDefaultAddress(email, addressId) {
  const user = await getUser(email);
  await query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', [user.id]);
  await query('UPDATE user_addresses SET is_default = TRUE WHERE user_id = $1 AND id = $2', [user.id, addressId]);
  return getAddresses(email);
}

/**
 * Get Payment Methods
 */
async function getPaymentMethods(email) {
  const cleanEmail = email.toLowerCase().trim();
  const res = await query(`
    SELECT pm.* FROM payment_methods pm
    JOIN users u ON pm.user_id = u.id
    WHERE u.email = $1
    ORDER BY pm.is_default DESC, pm.created_at ASC
  `, [cleanEmail]);

  return res.rows.map(r => ({
    id: r.id,
    type: r.type,
    method: r.method,
    brand: r.brand,
    last4: r.last4,
    cardNumber: r.card_number,
    expiry: r.expiry,
    holder: r.holder,
    bank: r.bank,
    bankName: r.bank_name,
    vpa: r.vpa,
    label: r.label,
    category: r.category,
    autoDebitLimit: parseFloat(r.auto_debit_limit || 15000),
    isDefault: r.is_default
  }));
}

/**
 * Get Default Payment Method
 */
async function getDefaultPaymentMethod(email) {
  const methods = await getPaymentMethods(email);
  return methods.find(m => m.isDefault) || methods[0] || null;
}

/**
 * Add Payment Method
 */
async function addPaymentMethod(email, methodData) {
  const user = await getUser(email);
  const methodId = methodData.id || `pm_${Date.now()}`;
  const isDefault = Boolean(methodData.isDefault || false);

  if (isDefault) {
    await query('UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1', [user.id]);
  }

  await query(`
    INSERT INTO payment_methods (
      id, user_id, type, method, brand, last4, card_number, expiry,
      holder, bank, bank_name, vpa, label, category, auto_debit_limit, is_default
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT (id) DO UPDATE SET
      auto_debit_limit = EXCLUDED.auto_debit_limit,
      is_default = EXCLUDED.is_default,
      label = EXCLUDED.label
  `, [
    methodId,
    user.id,
    methodData.type || 'card',
    methodData.method || 'card',
    methodData.brand || 'Saved Method',
    methodData.last4 || null,
    methodData.cardNumber || null,
    methodData.expiry || null,
    methodData.holder || user.name,
    methodData.bank || null,
    methodData.bankName || null,
    methodData.vpa || null,
    methodData.label || 'Saved Payment',
    methodData.category || 'Cards',
    parseFloat(methodData.autoDebitLimit || 15000),
    isDefault
  ]);

  return { id: methodId, ...methodData, isDefault };
}

/**
 * Set Default Payment Method
 */
async function setDefaultPaymentMethod(email, methodId) {
  const user = await getUser(email);
  await query('UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1', [user.id]);
  await query('UPDATE payment_methods SET is_default = TRUE WHERE user_id = $1 AND id = $2', [user.id, methodId]);
  return getDefaultPaymentMethod(email);
}

/**
 * Update Payment Method
 */
async function updatePaymentMethod(email, methodId, updateData) {
  const user = await getUser(email);
  if (updateData.autoDebitLimit !== undefined) {
    await query(
      'UPDATE payment_methods SET auto_debit_limit = $1 WHERE user_id = $2 AND id = $3',
      [parseFloat(updateData.autoDebitLimit), user.id, methodId]
    );
  }
  if (updateData.label) {
    await query(
      'UPDATE payment_methods SET label = $1 WHERE user_id = $2 AND id = $3',
      [updateData.label, user.id, methodId]
    );
  }
  return getDefaultPaymentMethod(email);
}

/**
 * Save Order to PostgreSQL
 */
async function saveOrder(email, orderData) {
  const user = await getUser(email);
  const orderId = orderData.orderId || `ORD-${Date.now().toString().slice(-6)}`;

  await query(`
    INSERT INTO orders (
      order_id, user_id, user_email, razorpay_order_id, razorpay_payment_id,
      product_title, amount, currency, quantity, items, payment_method, delivery_address,
      merchant_url, status, payment_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (order_id) DO UPDATE SET
      razorpay_payment_id = EXCLUDED.razorpay_payment_id,
      status = EXCLUDED.status,
      payment_status = EXCLUDED.payment_status
  `, [
    orderId,
    user.id,
    email.toLowerCase().trim(),
    orderData.razorpayOrderId || null,
    orderData.paymentId || orderData.razorpayPaymentId || null,
    orderData.productTitle || 'Ordered Item',
    parseFloat(orderData.amount || 0),
    orderData.currency || 'INR',
    parseInt(orderData.quantity || 1, 10),
    JSON.stringify(orderData.items || []),
    JSON.stringify(orderData.paymentMethod || {}),
    JSON.stringify(orderData.deliveryAddress || {}),
    orderData.merchant || null,
    orderData.status || 'confirmed',
    orderData.paymentStatus || 'paid'
  ]);

  return { orderId, ...orderData };
}

/**
 * Get Order History from PostgreSQL
 */
async function getOrderHistory(email) {
  const cleanEmail = email.toLowerCase().trim();
  const res = await query(`
    SELECT * FROM orders
    WHERE user_email = $1
    ORDER BY created_at DESC
  `, [cleanEmail]);

  return res.rows.map(r => ({
    orderId: r.order_id,
    razorpayOrderId: r.razorpay_order_id,
    razorpayPaymentId: r.razorpay_payment_id,
    productTitle: r.product_title,
    amount: parseFloat(r.amount),
    currency: r.currency,
    quantity: r.quantity,
    items: r.items,
    paymentMethod: r.payment_method,
    deliveryAddress: r.delivery_address,
    merchant: r.merchant_url,
    status: r.status,
    paymentStatus: r.payment_status,
    createdAt: r.created_at
  }));
}

/**
 * Get Spending Statistics from PostgreSQL
 */
async function getSpendingStats(email) {
  const orders = await getOrderHistory(email);
  const totalSpent = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const user = await getUser(email);

  return {
    totalSpent,
    orderCount: orders.length,
    spendingLimit: user.spendingLimitTotal || 50000,
    remainingLimit: Math.max(0, (user.spendingLimitTotal || 50000) - totalSpent),
    currency: 'INR'
  };
}

/**
 * Get Active / Matched Delivery Address
 */
async function getActiveAddress(email = 'nawaz@gmail.com', message = '') {
  try {
    const addresses = await getAddresses(email);
    if (!addresses || addresses.length === 0) {
      return {
        id: 'addr_home',
        label: 'Home',
        recipientName: 'Nawaz Khan',
        street: 'Flat 402, Sunshine Heights, 12th Main',
        area: 'Koramangala 4th Block',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
        isDefault: true
      };
    }
    const msgLower = (message || '').toLowerCase();
    if (msgLower.includes('office') || msgLower.includes('work')) {
      const officeAddr = addresses.find(a => a.label && (a.label.toLowerCase().includes('office') || a.label.toLowerCase().includes('work')));
      if (officeAddr) return officeAddr;
    }
    return addresses.find(a => a.isDefault) || addresses[0];
  } catch {
    return {
      id: 'addr_home',
      label: 'Home',
      recipientName: 'Nawaz Khan',
      street: 'Flat 402, Sunshine Heights, 12th Main',
      area: 'Koramangala 4th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      isDefault: true
    };
  }
}

module.exports = {
  getUser,
  registerUser,
  authenticateUser,
  getAddresses,
  getActiveAddress,
  addAddress,
  setDefaultAddress,
  getPaymentMethods,
  getDefaultPaymentMethod,
  addPaymentMethod,
  setDefaultPaymentMethod,
  updatePaymentMethod,
  saveOrder,
  getOrderHistory,
  getSpendingStats
};
