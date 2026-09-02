const userStore = require('../services/userStore.service');
const emailService = require('../services/email.service');
const AuditService = require('../services/order/AuditService');
const PolicyEngine = require('../services/policy/PolicyEngine');
const SpendingLedger = require('../services/policy/SpendingLedger');
const { query } = require('../db/index');

let activeUserEmail = 'nawaz@gmail.com';

const getActiveUserEmail = () => activeUserEmail;

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

    // Record Immutable Audit Trail
    await AuditService.log('USER_SIGNUP', {
      userEmail: cleanEmail,
      userId: result.user.id,
      details: {
        name: result.user.name,
        phone: phone || '',
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        userAgent: req.headers['user-agent']
      }
    });

    res.cookie('agentpay_token', result.token, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: false, sameSite: 'lax', path: '/' });
    res.cookie('agentpay_email', cleanEmail, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: false, sameSite: 'lax', path: '/' });

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

    // Record Immutable Audit Trail
    await AuditService.log('USER_LOGIN', {
      userEmail: cleanEmail,
      userId: result.user.id,
      details: {
        name: result.user.name,
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        userAgent: req.headers['user-agent']
      }
    });

    res.cookie('agentpay_token', result.token, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: false, sameSite: 'lax', path: '/' });
    res.cookie('agentpay_email', cleanEmail, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: false, sameSite: 'lax', path: '/' });

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
 * Refresh Access Token using Refresh Token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }

    const { verifyRefreshToken, generateTokens } = require('../middlewares/auth.middleware');
    
    // Verify the refresh token
    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.'
      });
    }

    // Get user from database
    const user = await userStore.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Send OTP to Email
 */
const sendOtp = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required to receive OTP.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const result = await userStore.sendOtp(cleanEmail, name);

    // Record Audit Event
    await AuditService.log('OTP_REQUESTED', {
      userEmail: cleanEmail,
      details: { clientIp: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1' }
    });

    res.json({
      success: true,
      message: `6-digit verification code sent to ${cleanEmail}`,
      email: cleanEmail
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Verify OTP & Login
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp, name, phone } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    if (!otp || !otp.trim()) {
      return res.status(400).json({ success: false, message: '6-digit OTP code is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const result = await userStore.verifyOtp({ email: cleanEmail, otp, name, phone });
    activeUserEmail = cleanEmail;

    // Record Immutable Audit Trail
    await AuditService.log('USER_LOGIN_OTP', {
      userEmail: cleanEmail,
      userId: result.user.id,
      details: {
        name: result.user.name,
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        userAgent: req.headers['user-agent']
      }
    });

    res.cookie('agentpay_token', result.token, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: false, sameSite: 'lax', path: '/' });
    res.cookie('agentpay_email', cleanEmail, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: false, sameSite: 'lax', path: '/' });

    res.json({
      success: true,
      message: `Logged in successfully as ${result.user.name}`,
      user: result.user,
      token: result.token,
      stats: result.stats
    });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
};

/**
 * User Logout
 */
const logoutUser = async (req, res) => {
  res.clearCookie('agentpay_token', { path: '/' });
  res.clearCookie('agentpay_email', { path: '/' });
  res.clearCookie('agentpay_user', { path: '/' });
  res.json({ success: true, message: 'Signed out of session.' });
};


/**
 * Get User Audit Logs
 */
const getUserAuditLogs = async (req, res) => {

  try {
    const email = (req.query.email || activeUserEmail).toLowerCase().trim();
    const logs = await AuditService.getLogs({ userEmail: email, limit: 100 });
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
    const result = await query('SELECT * FROM merchants ORDER BY name ASC');
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

    const updateRes = await query(
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

/**
 * Reset / Restore Spent Today to 0
 */
const resetSpentToday = async (req, res) => {
  try {
    const email = (req.body?.email || req.query?.email || req.user?.email || activeUserEmail).toLowerCase().trim();
    const user = await userStore.getUser(email);
    await SpendingLedger.resetSpentToday(user?.id, email);
    const spendingStats = await SpendingLedger.getSpendingStats(user?.id, email);
    res.json({
      success: true,
      message: 'Daily spent counter has been restored to ₹0.00.',
      spendingStats
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getActiveUserEmail,
  signupUser,
  loginUser,
  refreshToken,
  sendOtp,
  verifyOtp,
  logoutUser,
  getUserProfile,
  getUserAuditLogs,
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
  resetSpentToday,
  getMerchants,
  updateMerchantSettings
};
