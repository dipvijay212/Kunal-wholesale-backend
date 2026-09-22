const express = require('express');
const { createOrder } = require('../controllers/order.controller');

const router = express.Router();

// POST /api/orders (Public customer order placement)
router.post('/', createOrder);

module.exports = router;
