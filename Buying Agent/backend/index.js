const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { processPurchaseRequest } = require('./services/buyerAgent');
const { executeTool, buyerOrders, auditLogs } = require('./tools/index');
const userStore = require('./services/userStore.service');
const emailService = require('./services/email.service');

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Serve static embeddable SDK files (e.g. /sdk/razorpay-agent.js)
app.use(express.static(path.join(__dirname, 'public')));

// ==================== USER AUTHENTICATION & MEMORY ROUTES ====================

// Active session email (default to nawaz@gmail.com)
let activeUserEmail = 'nawaz@gmail.com';

// POST /api/user/login - Authenticate or switch user by Gmail/Email
app.post('/api/user/login', (req, res) => {
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
});

// GET /api/user/profile - Get currently authenticated user profile & memory
app.get('/api/user/profile', (req, res) => {
  const email = (req.query.email || activeUserEmail).toLowerCase().trim();
  const user = userStore.getUser(email);
  const stats = userStore.getSpendingStats(email);
  res.json({
    success: true,
    user,
    stats
  });
});

// POST /api/user/address - Add a new delivery address
app.post('/api/user/address', (req, res) => {
  const email = (req.body.email || activeUserEmail).toLowerCase().trim();
  const newAddr = userStore.addAddress(email, req.body);
  res.json({ success: true, message: 'Address added successfully', address: newAddr });
});

// POST /api/user/address/default - Set default delivery address
app.post('/api/user/address/default', (req, res) => {
  const { addressId } = req.body;
  const email = (req.body.email || activeUserEmail).toLowerCase().trim();
  const addresses = userStore.setDefaultAddress(email, addressId);
  res.json({ success: true, message: 'Default address updated', addresses });
});

// GET /api/user/orders - Get user's order history from memory
app.get('/api/user/orders', (req, res) => {
  const email = (req.query.email || activeUserEmail).toLowerCase().trim();
  const orders = userStore.getOrderHistory(email);
  res.json({ success: true, count: orders.length, orders });
});

// GET /api/user/emails - View dispatched confirmation email receipts
app.get('/api/user/emails', (req, res) => {
  const email = (req.query.email || activeUserEmail).toLowerCase().trim();
  const emails = emailService.getSentEmails(email);
  res.json({ success: true, count: emails.length, emails });
});

// ==================== SPECIFICATION: BUYER AGENT ROUTES ====================

// GET /api/agent/saved-payment-method - Get user pre-saved payment method
app.get('/api/agent/saved-payment-method', (req, res) => {
  const email = (req.query.email || activeUserEmail).toLowerCase().trim();
  const paymentMethod = userStore.getDefaultPaymentMethod(email);
  res.json({ success: true, paymentMethod });
});

// POST /api/agent/saved-payment-method - Update user pre-saved payment method
app.post('/api/agent/saved-payment-method', (req, res) => {
  const email = (req.body.email || activeUserEmail).toLowerCase().trim();
  const user = userStore.getUser(email);
  const { autoDebitLimit } = req.body;
  if (autoDebitLimit && user.paymentMethods[0]) {
    user.paymentMethods[0].autoDebitLimit = Number(autoDebitLimit);
    userStore.saveMemory();
  }
  res.json({ success: true, paymentMethod: user.paymentMethods[0], message: 'Saved payment details updated successfully.' });
});

// POST /api/agent/purchase - Main Natural-Language Purchase Endpoint (Spec Section 5)
app.post('/api/agent/purchase', async (req, res) => {
  try {
    const {
      message,
      customApiKey,
      customerName,
      customerEmail,
      userEmail,
      addressId,
      autoExecutePayment = true,
      savedPaymentMethod,
      merchantApiBase
    } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message / purchase request is required.'
      });
    }

    const targetEmail = (userEmail || customerEmail || activeUserEmail).toLowerCase().trim();
    const user = userStore.getUser(targetEmail);
    const activeAddress = userStore.getActiveAddress(targetEmail, message);
    const defaultPm = savedPaymentMethod || userStore.getDefaultPaymentMethod(targetEmail);

    const response = await processPurchaseRequest({
      message,
      customApiKey,
      userEmail: targetEmail,
      customerName: customerName || user.name,
      customerEmail: targetEmail,
      deliveryAddress: activeAddress,
      autoExecutePayment,
      savedPaymentMethod: defaultPm,
      merchantApiBase
    });

    res.json(response);
  } catch (error) {
    console.error('Agent Purchase Request Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process purchase request.'
    });
  }
});

// POST /api/agent/verify-checkout - Verify Razorpay payment and confirm order (Spec Section 11 & 12)
app.post('/api/agent/verify-checkout', async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required.' });
    }

    const result = await executeTool('verifyPayment', {
      orderId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id || `pay_test_${Math.random().toString(36).slice(2, 10)}`,
      razorpaySignature: razorpay_signature || 'sig_verified'
    });

    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully.',
      verification: result,
      order: buyerOrders[orderId]
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed.'
    });
  }
});

// GET /api/agent/orders - List all placed orders
app.get('/api/agent/orders', (req, res) => {
  res.json({
    success: true,
    orders: Object.values(buyerOrders)
  });
});

// GET /api/agent/orders/:id - Get specific order status (Spec Section 13)
app.get('/api/agent/orders/:id', async (req, res) => {
  const order = buyerOrders[req.params.id];
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  res.json({ success: true, order });
});

// GET /api/agent/audit-logs - View all agent tool calls and authorization logs (Spec Section 16)
app.get('/api/agent/audit-logs', (req, res) => {
  res.json({
    success: true,
    count: auditLogs.length,
    logs: auditLogs.slice(-50).reverse()
  });
});

// GET /api/config - Check Gemini API key status & Razorpay config
app.get('/api/config', (req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && !process.env.GEMINI_API_KEY.includes('YOUR_GEMINI') && !process.env.GEMINI_API_KEY.includes('XXXX'));
  const hasRazorpayKey = Boolean(process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('XXXX'));

  res.json({
    hasGeminiKey,
    hasRazorpayKey,
    geminiKeyMasked: hasGeminiKey ? `${process.env.GEMINI_API_KEY.slice(0, 6)}...${process.env.GEMINI_API_KEY.slice(-4)}` : null,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo',
    model: 'gemini-2.0-flash',
    merchantUrl: process.env.MERCHANT_API_BASE || 'http://localhost:8000/api'
  });
});

// POST /api/config/key - Update Gemini API key
app.post('/api/config/key', (req, res) => {
  const { apiKey } = req.body;
  if (apiKey) {
    process.env.GEMINI_API_KEY = apiKey.trim();
  }
  res.json({
    success: true,
    message: 'Gemini API Key updated successfully',
    hasKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Shopping Buyer Agent Backend',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║         AI Shopping Buyer Agent Backend          ║
╠══════════════════════════════════════════════════╣
║  Buyer API:     http://localhost:${PORT}        ║
║  Purchase API:  http://localhost:${PORT}/api/agent/purchase ║
║  Merchant URL:  ${process.env.MERCHANT_API_BASE || 'http://localhost:8000/api'} ║
║  Health check:  http://localhost:${PORT}/api/health  ║
╚══════════════════════════════════════════════════╝
  `);
});