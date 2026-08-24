const userStore = require('../services/userStore.service');
const emailService = require('../services/email.service');

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
  getActiveUserEmail
};
