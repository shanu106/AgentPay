const { processPurchaseRequest } = require('../services/buyerAgent');
const { executeTool, buyerOrders, auditLogs } = require('../tools/index');
const userStore = require('../services/userStore.service');
const { getActiveUserEmail } = require('./user.controller');

const handlePurchase = async (req, res) => {
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

    const activeUserEmail = getActiveUserEmail();
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
};

const getSavedPaymentMethod = (req, res) => {
  const activeUserEmail = getActiveUserEmail();
  const email = (req.query.email || activeUserEmail).toLowerCase().trim();
  const user = userStore.getUser(email);
  const paymentMethod = userStore.getDefaultPaymentMethod(email);
  res.json({
    success: true,
    paymentMethod,
    paymentMethods: user.paymentMethods || []
  });
};

const updateSavedPaymentMethod = (req, res) => {
  const activeUserEmail = getActiveUserEmail();
  const email = (req.body.email || activeUserEmail).toLowerCase().trim();
  const { methodId, autoDebitLimit, holder, isDefault } = req.body;
  
  if (methodId && (isDefault || isDefault === undefined)) {
    userStore.setDefaultPaymentMethod(email, methodId);
  }
  
  const updatedMethod = userStore.updatePaymentMethod(email, methodId, { autoDebitLimit, holder, isDefault });
  const defaultMethod = userStore.getDefaultPaymentMethod(email);
  const user = userStore.getUser(email);

  res.json({
    success: true,
    paymentMethod: defaultMethod,
    paymentMethods: user.paymentMethods,
    message: `Default payment method updated to ${defaultMethod.label || defaultMethod.brand}`
  });
};

const verifyCheckout = async (req, res) => {
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
};

const listOrders = (req, res) => {
  res.json({
    success: true,
    orders: Object.values(buyerOrders)
  });
};

const getOrderById = async (req, res) => {
  const order = buyerOrders[req.params.id];
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  res.json({ success: true, order });
};

const getAuditLogs = (req, res) => {
  res.json({
    success: true,
    count: auditLogs.length,
    logs: auditLogs.slice(-50).reverse()
  });
};

const getConfig = (req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && !process.env.GEMINI_API_KEY.includes('YOUR_GEMINI') && !process.env.GEMINI_API_KEY.includes('XXXX'));
  const hasRazorpayKey = Boolean(process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('XXXX'));

  res.json({
    hasGeminiKey,
    hasRazorpayKey,
    geminiKeyMasked: hasGeminiKey ? `${process.env.GEMINI_API_KEY.slice(0, 6)}...${process.env.GEMINI_API_KEY.slice(-4)}` : null,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    model: 'gemini-2.0-flash',
    merchantUrl: process.env.MERCHANT_API_BASE || 'http://localhost:8000/api'
  });
};

const updateConfigKey = (req, res) => {
  const { apiKey } = req.body;
  if (apiKey) {
    process.env.GEMINI_API_KEY = apiKey.trim();
  }
  res.json({
    success: true,
    message: 'Gemini API Key updated successfully',
    hasKey: Boolean(process.env.GEMINI_API_KEY)
  });
};

const getHealth = (req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Shopping Buyer Agent Backend',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  handlePurchase,
  getSavedPaymentMethod,
  updateSavedPaymentMethod,
  verifyCheckout,
  listOrders,
  getOrderById,
  getAuditLogs,
  getConfig,
  updateConfigKey,
  getHealth
};
