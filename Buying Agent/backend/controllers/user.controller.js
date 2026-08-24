const userStore = require('../services/userStore.service');
const emailService = require('../services/email.service');
const PolicyEngine = require('../services/policy/PolicyEngine');
const SpendingLedger = require('../services/policy/SpendingLedger');

let activeUserEmail = 'nawaz@gmail.com';

/**
 * User Signup / Register
 */
const signupUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const result = await userStore.registerUser({
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: password || 'password123',
      phone
    });

    activeUserEmail = cleanEmail;
    const stats = await userStore.getSpendingStats(cleanEmail);

    res.json({
      success: true,
      message: `Account created successfully for ${result.user.name}`,
      user: result.user,
      token: result.token,
      stats
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * User Login
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || email.trim() === '') {
      return res.status(400).json({ success: false, message: 'Email / Gmail is required.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    activeUserEmail = cleanEmail;

    const result = await userStore.authenticateUser({
      email: cleanEmail,
      password
    });
    const stats = await userStore.getSpendingStats(cleanEmail);

    res.json({
      success: true,
      message: `Logged in successfully as ${result.user.name} (${cleanEmail})`,
      user: result.user,
      token: result.token,
      stats
    });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
};

/**
 * Get User Profile
 */
const getUserProfile = async (req, res) => {
  try {
    const email = (req.query.email || activeUserEmail).toLowerCase().trim();
    const user = await userStore.getUser(email);
    const stats = await userStore.getSpendingStats(email);
    res.json({
      success: true,
      user,
      stats
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Addresses
 */
const getAddresses = async (req, res) => {
  try {
    const email = (req.query.email || activeUserEmail).toLowerCase().trim();
    const addresses = await userStore.getAddresses(email);
    res.json({ success: true, count: addresses.length, addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Add Address
 */
const addAddress = async (req, res) => {
  try {
    const email = (req.body.email || activeUserEmail).toLowerCase().trim();
    const newAddr = await userStore.addAddress(email, req.body);
    const addresses = await userStore.getAddresses(email);
    res.json({ success: true, message: 'Address added successfully', address: newAddr, addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Set Default Address
 */
const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.body;
    const email = (req.body.email || activeUserEmail).toLowerCase().trim();
    const addresses = await userStore.setDefaultAddress(email, addressId);
    res.json({ success: true, message: 'Default address updated', addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get User Orders
 */
const getUserOrders = async (req, res) => {
  try {
    const email = (req.query.email || activeUserEmail).toLowerCase().trim();
    const orders = await userStore.getOrderHistory(email);
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get User Confirmation Emails
 */
const getUserEmails = (req, res) => {
  const email = (req.query.email || activeUserEmail).toLowerCase().trim();
  const emails = emailService.getSentEmails(email);
  res.json({ success: true, count: emails.length, emails });
};

/**
 * Get Payment Methods
 */
const getPaymentMethods = async (req, res) => {
  try {
    const email = (req.query.email || activeUserEmail).toLowerCase().trim();
    const paymentMethods = await userStore.getPaymentMethods(email);
    const defaultMethod = await userStore.getDefaultPaymentMethod(email);
    res.json({
      success: true,
      count: paymentMethods.length,
      paymentMethods,
      defaultMethod
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Add Payment Method
 */
const addPaymentMethod = async (req, res) => {
  try {
    const email = (req.body.email || activeUserEmail).toLowerCase().trim();
    const newMethod = await userStore.addPaymentMethod(email, req.body);
    const paymentMethods = await userStore.getPaymentMethods(email);
    res.json({
      success: true,
      message: 'Payment method stored in database successfully',
      paymentMethod: newMethod,
      paymentMethods
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Set Default Payment Method
 */
const setDefaultPaymentMethod = async (req, res) => {
  try {
    const { methodId } = req.body;
    const email = (req.body.email || activeUserEmail).toLowerCase().trim();
    const defaultMethod = await userStore.setDefaultPaymentMethod(email, methodId);
    const paymentMethods = await userStore.getPaymentMethods(email);
    res.json({
      success: true,
      paymentMethod: defaultMethod,
      paymentMethods,
      message: `Default payment method set to ${defaultMethod?.label || defaultMethod?.brand}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update Payment Method
 */
const updatePaymentMethod = async (req, res) => {
  try {
    const { methodId, ...updateData } = req.body;
    const email = (req.body.email || activeUserEmail).toLowerCase().trim();
    const updated = await userStore.updatePaymentMethod(email, methodId, updateData);
    const paymentMethods = await userStore.getPaymentMethods(email);
    res.json({
      success: true,
      message: 'Payment method updated in database',
      paymentMethod: updated,
      paymentMethods
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete Payment Method
 */
const deletePaymentMethod = async (req, res) => {
  try {
    const { methodId } = req.body;
    const email = (req.body.email || req.user?.email || activeUserEmail).toLowerCase().trim();
    if (!methodId) {
      return res.status(400).json({ success: false, message: 'Payment methodId is required.' });
    }
    const paymentMethods = await userStore.deletePaymentMethod(email, methodId);
    const defaultMethod = await userStore.getDefaultPaymentMethod(email);
    res.json({
      success: true,
      message: 'Payment method removed successfully.',
      paymentMethods,
      defaultMethod
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Agent Authorization & Policy Settings
 */
const getAuthorization = async (req, res) => {
  try {
    const email = (req.query.email || req.user?.email || activeUserEmail).toLowerCase().trim();
    const user = await userStore.getUser(email);
    const auth = await PolicyEngine.getAuthorizationByEmail(email);
    const spendingStats = await SpendingLedger.getSpendingStats(user.id);

    res.json({
      success: true,
      authorization: auth,
      spendingStats,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update Agent Authorization & Spending Limits
 */
const updateAuthorization = async (req, res) => {
  try {
    const email = (req.body.email || req.user?.email || activeUserEmail).toLowerCase().trim();
    const user = await userStore.getUser(email);
    const {
      maxTransactionAmount,
      dailySpendingLimit,
      allowedCategories,
      allowedMerchants,
      allowedPaymentMethods,
      requireConfirmationAbove,
      expiresInDays
    } = req.body;

    const updated = await PolicyEngine.upsertAuthorization(user.id, {
      maxTransactionAmount: parseFloat(maxTransactionAmount) || 5000,
      dailySpendingLimit: parseFloat(dailySpendingLimit) || 10000,
      allowedCategories: allowedCategories || ['courses', 'food', 'electronics'],
      allowedMerchants: allowedMerchants || [],
      allowedPaymentMethods: allowedPaymentMethods || [],
      requireConfirmationAbove: parseFloat(requireConfirmationAbove) || 3000,
      expiresInDays: parseInt(expiresInDays, 10) || 30
    });

    const spendingStats = await SpendingLedger.getSpendingStats(user.id);

    res.json({
      success: true,
      message: 'Agent authorization policy updated successfully in PostgreSQL.',
      authorization: updated,
      spendingStats
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Revoke Agent Authorization
 */
const revokeAuthorization = async (req, res) => {
  try {
    const { authorizationId } = req.body;
    const revoked = await PolicyEngine.revokeAuthorization(authorizationId);
    res.json({
      success: true,
      message: 'Agent authorization revoked.',
      authorization: revoked
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get Merchants List & Settings
 */
const getMerchants = async (req, res) => {
  try {
    const result = await userStore.query('SELECT * FROM merchants ORDER BY name ASC');
    res.json({
      success: true,
      merchants: result.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update Merchant Settings
 */
const updateMerchantSettings = async (req, res) => {
  try {
    const { merchantId, agentCommerceEnabled, maxAutonomousOrderAmount } = req.body;
    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'merchantId is required.' });
    }

    const updateRes = await userStore.query(
      `UPDATE merchants SET 
        agent_commerce_enabled = COALESCE($1, agent_commerce_enabled),
        max_autonomous_order_amount = COALESCE($2, max_autonomous_order_amount),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [agentCommerceEnabled, maxAutonomousOrderAmount, merchantId]
    );

    res.json({
      success: true,
      message: 'Merchant AI-commerce settings updated successfully.',
      merchant: updateRes.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getActiveUserEmail = () => activeUserEmail;

module.exports = {
  signupUser,
  loginUser,
  getUserProfile,
  getAddresses,
  addAddress,
  setDefaultAddress,
  getUserOrders,
  getUserEmails,
  getPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getAuthorization,
  updateAuthorization,
  revokeAuthorization,
  getMerchants,
  updateMerchantSettings,
  getActiveUserEmail
};
