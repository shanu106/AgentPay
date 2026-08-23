const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Agent & Store Orders
router.post('/orders', orderController.createOrder);
router.post('/orders/verify', orderController.verifyOrder);
router.get('/orders', orderController.listOrders);
router.get('/orders/:id', orderController.getOrderById);
router.get('/orders/:id/status', orderController.getOrderStatus);

module.exports = router;
