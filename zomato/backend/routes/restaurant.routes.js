const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');

router.get('/restaurants', restaurantController.listRestaurants);
router.get('/restaurants/:id', restaurantController.getRestaurantById);

module.exports = router;
