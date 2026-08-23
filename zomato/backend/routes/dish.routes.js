const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dish.controller');

// Products / Dishes catalog endpoints for AI Buyer Agent
router.get('/products', dishController.listDishesAsProducts);
router.get('/products/:id', dishController.getDishById);
router.get('/products/:id/availability', dishController.checkAvailability);

module.exports = router;
