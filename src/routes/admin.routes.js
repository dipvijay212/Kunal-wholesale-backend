const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const {
  createProduct,
  getAdminProducts,
  getAdminProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/adminProduct.controller');

const {
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/adminCategory.controller');

const {
  createCollection,
  updateCollection,
  deleteCollection,
} = require('../controllers/adminCollection.controller');

const {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
} = require('../controllers/adminOrder.controller');

const router = express.Router();

// Apply authMiddleware + adminMiddleware to ALL admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// --- Product Admin APIs ---
router.post('/products', createProduct);
router.get('/products', getAdminProducts);
router.get('/products/:id', getAdminProductById);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// --- Category Admin APIs ---
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// --- Collection Admin APIs ---
router.post('/collections', createCollection);
router.patch('/collections/:id', updateCollection);
router.delete('/collections/:id', deleteCollection);

// --- Order Admin APIs ---
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderById);
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;
