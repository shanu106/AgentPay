const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// User Authentication & Profile
router.post('/signup', userController.signupUser);
router.post('/login', userController.loginUser);
router.get('/profile', userController.getUserProfile);

// Address Management
router.get('/address', userController.getAddresses);
router.post('/address', userController.addAddress);
router.post('/address/default', userController.setDefaultAddress);

// Orders & Email History
router.get('/orders', userController.getUserOrders);
router.get('/emails', userController.getUserEmails);

// Payment Methods in Database
router.get('/payment-methods', userController.getPaymentMethods);
router.post('/payment-methods/add', userController.addPaymentMethod);
router.post('/payment-methods/default', userController.setDefaultPaymentMethod);
router.post('/payment-methods/update', userController.updatePaymentMethod);

module.exports = router;
