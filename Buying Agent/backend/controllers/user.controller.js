const userStore = require('../services/userStore.service');
const emailService = require('../services/email.service');

let activeUserEmail = 'nawaz@gmail.com';

const loginUser = (req, res) => {
  const { email } = req.body;
  if (!email || email.trim() === '') {
    return res.status(400).json({ success: false, message: 'Email / Gmail is required.' });
  }
  const cleanEmail = email.toLowerCase().trim();
  activeUserEmail = cleanEmail;
  const user = userStore.getUser(cleanEmail);
  const stats = userStore.getSpendingStats(cleanEmail);
  res.json({
    success: true,
    message: `Logged in successfully as ${user.name} (${cleanEmail})`,
    user,
    stats
  });
};

const getUserProfile = (req, res) => {
  const email = (req.query.email || activeUserEmail).toLowerCase().trim();
  const user = userStore.getUser(email);
  const stats = userStore.getSpendingStats(email);
  res.json({
    success: true,
    user,
    stats
  });
};

const addAddress = (req, res) => {
  const email = (req.body.email || activeUserEmail).toLowerCase().trim();
  const newAddr = userStore.addAddress(email, req.body);
  res.json({ success: true, message: 'Address added successfully', address: newAddr });
};

const setDefaultAddress = (req, res) => {
  const { addressId } = req.body;
  const email = (req.body.email || activeUserEmail).toLowerCase().trim();
  const addresses = userStore.setDefaultAddress(email, addressId);
  res.json({ success: true, message: 'Default address updated', addresses });
};

const getUserOrders = (req, res) => {
  const email = (req.query.email || activeUserEmail).toLowerCase().trim();
  const orders = userStore.getOrderHistory(email);
  res.json({ success: true, count: orders.length, orders });
};

const getUserEmails = (req, res) => {
  const email = (req.query.email || activeUserEmail).toLowerCase().trim();
  const emails = emailService.getSentEmails(email);
  res.json({ success: true, count: emails.length, emails });
};

const getPaymentMethods = (req, res) => {
  const email = (req.query.email || activeUserEmail).toLowerCase().trim();
  const paymentMethods = userStore.getPaymentMethods(email);
  const defaultMethod = userStore.getDefaultPaymentMethod(email);
  res.json({
    success: true,
    count: paymentMethods.length,
    paymentMethods,
    defaultMethod
  });
};

const addPaymentMethod = (req, res) => {
  const email = (req.body.email || activeUserEmail).toLowerCase().trim();
  const newMethod = userStore.addPaymentMethod(email, req.body);
  res.json({
    success: true,
    message: 'Payment method stored in agent memory successfully',
    paymentMethod: newMethod,
    paymentMethods: userStore.getPaymentMethods(email)
  });
};

const setDefaultPaymentMethod = (req, res) => {
  const { methodId } = req.body;
  const email = (req.body.email || activeUserEmail).toLowerCase().trim();
  const defaultMethod = userStore.setDefaultPaymentMethod(email, methodId);
  res.json({
    success: true,
    paymentMethod: defaultMethod,
    paymentMethods: userStore.getPaymentMethods(email),
    message: `Default payment method set to ${defaultMethod.label || defaultMethod.brand}`
  });
};

const updatePaymentMethod = (req, res) => {
  const { methodId, ...updateData } = req.body;
  const email = (req.body.email || activeUserEmail).toLowerCase().trim();
  const updated = userStore.updatePaymentMethod(email, methodId, updateData);
  res.json({
    success: true,
    message: 'Payment method updated in agent memory',
    paymentMethod: updated,
    paymentMethods: userStore.getPaymentMethods(email)
  });
};

const getActiveUserEmail = () => activeUserEmail;

module.exports = {
  loginUser,
  getUserProfile,
  addAddress,
  setDefaultAddress,
  getUserOrders,
  getUserEmails,
  getPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
  updatePaymentMethod,
  getActiveUserEmail
};
