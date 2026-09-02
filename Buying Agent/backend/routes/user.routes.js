const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { validateAuthorizationInput } = require('../middlewares/validation.middleware');
const { authRateLimiter } = require('../middlewares/rateLimit.middleware');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Public routes (no auth required)
router.post('/signup', authRateLimiter, userController.signupUser);
router.post('/login', authRateLimiter, userController.loginUser);
router.post('/refresh-token', userController.refreshToken);

// Protected routes (auth required for all below)
router.use(authenticateToken);

// User Authentication & Profile
router.post('/send-otp', authRateLimiter, userController.sendOtp);
router.post('/verify-otp', authRateLimiter, userController.verifyOtp);
router.post('/logout', userController.logoutUser);
router.get('/profile', userController.getUserProfile);
router.get('/audit-logs', userController.getUserAuditLogs);

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
router.post('/payment-methods/delete', userController.deletePaymentMethod);
router.delete('/payment-methods', userController.deletePaymentMethod);

// Agent Authorization & Spending Policy
router.get('/authorization', userController.getAuthorization);
router.post('/authorization', validateAuthorizationInput, userController.updateAuthorization);
router.post('/authorization/revoke', userController.revokeAuthorization);
router.post('/authorization/reset-spent', userController.resetSpentToday);
router.get('/authorization/reset-spent', userController.resetSpentToday);

// Merchant AI-Commerce Settings
router.get('/merchants', userController.getMerchants);
router.post('/merchants/settings', userController.updateMerchantSettings);

module.exports = router;
