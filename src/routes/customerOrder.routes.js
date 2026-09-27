const express = require('express');
const {
  getCustomerOrders,
  getCustomerOrderById,
} = require('../controllers/customerOrder.controller');
const customerAuthMiddleware = require('../middleware/customerAuthMiddleware');

const router = express.Router();

// All customer order routes require authentication
router.use(customerAuthMiddleware);

router.get('/', getCustomerOrders);
router.get('/:id', getCustomerOrderById);

module.exports = router;
