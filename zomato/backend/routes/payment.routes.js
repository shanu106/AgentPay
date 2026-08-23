const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Razorpay Direct Checkout for Store Frontend
router.post('/payment/create-order', paymentController.createPaymentOrder);
router.post('/payment/verify', paymentController.verifyPayment);

module.exports = router;
