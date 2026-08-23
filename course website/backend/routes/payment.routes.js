const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Razorpay Payment Creation & Verification
router.post('/payment/create-order', paymentController.createPaymentOrder);
router.post('/payment/verify', paymentController.verifyPayment);
router.get('/payment/orders', paymentController.listPaymentOrders);
router.get('/enrollments', paymentController.getEnrollments);
router.get('/config', paymentController.getConfig);

module.exports = router;
