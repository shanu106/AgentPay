const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

router.get('/products', productController.listProducts);
router.get('/products/:id', productController.getProductById);
router.get('/products/:id/availability', productController.checkAvailability);

module.exports = router;
