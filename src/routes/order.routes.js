const express = require('express');
const { createOrder } = require('../controllers/order.controller');
const optionalCustomerAuthMiddleware = require('../middleware/optionalCustomerAuthMiddleware');

const router = express.Router();

// POST /api/orders (Customer checkout order placement)
router.post('/', optionalCustomerAuthMiddleware, createOrder);

module.exports = router;
