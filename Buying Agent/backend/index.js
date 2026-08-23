const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { processPurchaseRequest } = require('./services/buyerAgent');
const { executeTool, buyerOrders, auditLogs } = require('./tools/index');

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// ==================== SPECIFICATION: BUYER AGENT ROUTES ====================

// Default pre-saved payment configuration
let userSavedPayment = {
  enabled: true,
  type: 'card',
  brand: 'Visa (Domestic)',
  cardNumber: '4100 2800 0000 1007',
  last4: '1007',
  expiry: '12/28',
  holder: 'Student Buyer',
  autoDebitLimit: 15000,
  provider: 'Razorpay Domestic Test Tokenized Card'
};

// GET /api/agent/saved-payment-method - Get user pre-saved payment method
app.get('/api/agent/saved-payment-method', (req, res) => {
  res.json({ success: true, paymentMethod: userSavedPayment });
});

// POST /api/agent/saved-payment-method - Update user pre-saved payment method
app.post('/api/agent/saved-payment-method', (req, res) => {
  const { enabled, brand, last4, expiry, holder, autoDebitLimit } = req.body;
  userSavedPayment = {
    ...userSavedPayment,
    ...(enabled !== undefined ? { enabled } : {}),
    ...(brand ? { brand } : {}),
    ...(last4 ? { last4 } : {}),
    ...(expiry ? { expiry } : {}),
    ...(holder ? { holder } : {}),
    ...(autoDebitLimit ? { autoDebitLimit: Number(autoDebitLimit) } : {})
  };
  res.json({ success: true, paymentMethod: userSavedPayment, message: 'Saved payment details updated successfully.' });
});

// POST /api/agent/purchase - Main Natural-Language Purchase Endpoint (Spec Section 5)
app.post('/api/agent/purchase', async (req, res) => {
  try {
    const { 
      message, 
      customApiKey, 
      customerName, 
      customerEmail,
      autoExecutePayment = userSavedPayment.enabled,
      savedPaymentMethod = userSavedPayment
    } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message / purchase request is required.'
      });
    }

    const response = await processPurchaseRequest({
      message,
      customApiKey,
      customerName: customerName || userSavedPayment.holder,
      customerEmail: customerEmail || 'student@example.com',
      autoExecutePayment,
      savedPaymentMethod
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