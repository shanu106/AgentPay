const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const orderController = require('../controllers/order.controller');

router.post('/payment/create-order', orderController.createOrder);
router.post('/payment/verify', paymentController.verifyPayment);

module.exports = router;
