const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

router.post('/orders', orderController.createOrder);
router.get('/orders', orderController.listOrders);
router.get('/orders/:id', orderController.getOrderById);
router.get('/orders/:id/status', orderController.getOrderStatus);

module.exports = router;
