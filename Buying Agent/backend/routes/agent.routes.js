const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller');
const { validatePurchaseInput } = require('../middlewares/validation.middleware');
const { purchaseRateLimiter } = require('../middlewares/rateLimit.middleware');

// Autonomous Purchase (Rate-limited & Validated)
router.post('/purchase', purchaseRateLimiter, validatePurchaseInput, agentController.handlePurchase);

// Saved Payment Methods
router.get('/saved-payment-method', agentController.getSavedPaymentMethod);
router.post('/saved-payment-method', agentController.updateSavedPaymentMethod);

// Checkout & Verification
router.post('/verify-checkout', agentController.verifyCheckout);

// Voice & TTS (ElevenLabs)
router.post('/tts', agentController.generateTTS);
router.post('/voice/speak', agentController.generateTTS);

// Placed Orders & Audit Logs
router.get('/orders', agentController.listOrders);
router.get('/orders/:id', agentController.getOrderById);
router.get('/audit-logs', agentController.getAuditLogs);

module.exports = router;
