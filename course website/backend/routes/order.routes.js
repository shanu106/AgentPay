const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Standard Merchant Order Management (Spec Section 19 & 20)
router.post('/orders', orderController.createMerchantOrder);
router.get('/orders/:id', orderController.getOrderById);
router.get('/orders/:id/status', orderController.getOrderStatus);

module.exports = router;
