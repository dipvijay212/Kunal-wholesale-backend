const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const collectionRoutes = require('./collection.routes');
const orderRoutes = require('./order.routes');

const router = express.Router();

// Base API routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/collections', collectionRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
