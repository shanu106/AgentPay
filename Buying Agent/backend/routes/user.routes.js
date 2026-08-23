const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// User Authentication & Profile
router.post('/login', userController.loginUser);
router.get('/profile', userController.getUserProfile);

// Address Management
router.post('/address', userController.addAddress);
router.post('/address/default', userController.setDefaultAddress);

// Orders & Email History
router.get('/orders', userController.getUserOrders);
router.get('/emails', userController.getUserEmails);

// Default Payment Method
router.post('/payment-method/default', userController.setDefaultPaymentMethod);

module.exports = router;
