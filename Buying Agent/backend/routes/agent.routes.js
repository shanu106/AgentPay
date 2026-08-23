const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller');

// Autonomous Purchase
router.post('/purchase', agentController.handlePurchase);

// Saved Payment Methods
router.get('/saved-payment-method', agentController.getSavedPaymentMethod);
router.post('/saved-payment-method', agentController.updateSavedPaymentMethod);

// Checkout & Verification
router.post('/verify-checkout', agentController.verifyCheckout);

// Placed Orders & Audit Logs
router.get('/orders', agentController.listOrders);
router.get('/orders/:id', agentController.getOrderById);
router.get('/audit-logs', agentController.getAuditLogs);

module.exports = router;
