const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');

// Legacy courses endpoints
router.get('/courses', courseController.getAllCourses);
router.get('/courses/:id', courseController.getCourseById);

// Standard Merchant products API (Spec Section 17 & 18)
router.get('/products', courseController.searchProducts);
router.get('/products/:id', courseController.getProductById);
router.get('/products/:id/availability', courseController.checkAvailability);

module.exports = router;
