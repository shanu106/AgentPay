const { processPurchaseRequest } = require('../services/buyerAgent');
const { executeTool, buyerOrders, auditLogs } = require('../tools/index');
const userStore = require('../services/userStore.service');
const voiceService = require('../services/voice.service');
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
      merchantApiBase,
      enableVoice = true,
      language = 'en'
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
      merchantApiBase,
      language
    });

    // Generate Spoken Voice Feedback (ElevenLabs TTS in English or Hindi)
    const spokenFeedback = voiceService.createSpokenFeedback(response, language);
    response.spokenFeedback = spokenFeedback;
    response.language = language;

    if (enableVoice !== false) {
      try {
        const voiceResult = await voiceService.generateSpeech({ text: spokenFeedback, language });
        if (voiceResult.success && voiceResult.audioUrl) {
          response.audioUrl = voiceResult.audioUrl;
          response.voiceProvider = 'elevenlabs';
        } else {
          response.voiceProvider = 'browser-synthesis';
        }
      } catch (vErr) {
        console.warn('[Voice generation note]:', vErr.message);
        response.voiceProvider = 'browser-synthesis';
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Agent Purchase Request Error:', error);
    const failFeedback = `Sorry, your purchase could not be completed. ${error.message || 'An error occurred.'}`;
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process purchase request.',
      spokenFeedback: failFeedback,
      voiceProvider: 'browser-synthesis'
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
  const hasElevenLabsKey = Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim() !== '' && !process.env.ELEVENLABS_API_KEY.includes('your_elevenlabs'));

  res.json({
    hasGeminiKey,
    hasRazorpayKey,
    hasElevenLabsKey,
    geminiKeyMasked: hasGeminiKey ? `${process.env.GEMINI_API_KEY.slice(0, 6)}...${process.env.GEMINI_API_KEY.slice(-4)}` : null,
    elevenLabsKeyMasked: hasElevenLabsKey ? `${process.env.ELEVENLABS_API_KEY.slice(0, 4)}...${process.env.ELEVENLABS_API_KEY.slice(-4)}` : null,
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || voiceService.DEFAULT_VOICE_ID,
    elevenLabsModelId: process.env.ELEVENLABS_MODEL_ID || voiceService.DEFAULT_MODEL_ID,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    model: 'gemini-2.0-flash',
    merchantUrl: process.env.MERCHANT_API_BASE || 'http://localhost:8000/api'
  });
};

const updateConfigKey = (req, res) => {
  const { apiKey, elevenLabsKey, elevenLabsVoiceId } = req.body;
  if (apiKey) {
    process.env.GEMINI_API_KEY = apiKey.trim();
  }
  if (elevenLabsKey) {
    process.env.ELEVENLABS_API_KEY = elevenLabsKey.trim();
  }
  if (elevenLabsVoiceId) {
    process.env.ELEVENLABS_VOICE_ID = elevenLabsVoiceId.trim();
  }
  res.json({
    success: true,
    message: 'Configuration updated successfully',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasElevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY)
  });
};

const generateTTS = async (req, res) => {
  try {
    const { text, voiceId, modelId, apiKey } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Text is required for TTS.' });
    }

    const result = await voiceService.generateSpeech({ text, voiceId, modelId, apiKey });
    res.json(result);
  } catch (error) {
    console.error('TTS Generation Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate speech audio.'
    });
  }
};

const getHealth = (req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Shopping Buyer Agent Backend',
    voiceService: 'ElevenLabs Voice AI',
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
  generateTTS,
  getHealth
};

