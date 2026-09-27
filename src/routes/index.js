const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const customerAuthRoutes = require('./customerAuth.routes');
const customerOrderRoutes = require('./customerOrder.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const orderRoutes = require('./order.routes');
const settingRoutes = require('./setting.routes');

const router = express.Router();

// Base API routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/customer/auth', customerAuthRoutes);
router.use('/customer/orders', customerOrderRoutes);
router.use('/customer', customerAuthRoutes);
router.use('/admin', adminRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/settings', settingRoutes);

module.exports = router;
