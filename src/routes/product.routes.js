const express = require('express');
const { getProducts, getProductBySlug } = require('../controllers/product.controller');

const router = express.Router();

// GET /api/products
router.get('/', getProducts);

// GET /api/products/:slug
router.get('/:slug', getProductBySlug);

module.exports = router;
