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
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
} = require('../controllers/adminOrder.controller');

const {
  getAdminCustomers,
  getAdminCustomerById,
} = require('../controllers/adminCustomer.controller');

const {
  getAdminLanguageSettings,
  updateAdminLanguageSettings,
} = require('../controllers/setting.controller');

const {
  uploadImages,
  uploadVideo,
  deleteMedia,
} = require('../controllers/adminUpload.controller');

const {
  uploadMultipleImages,
  uploadSingleVideo,
} = require('../middleware/uploadMiddleware');

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

// --- Media Upload APIs (Cloudinary) ---
router.post('/upload/images', uploadMultipleImages, uploadImages);
router.post('/upload/video', uploadSingleVideo, uploadVideo);
router.delete('/upload/media', deleteMedia);

// --- Category Admin APIs ---
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// --- Order Admin APIs ---
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderById);
router.patch('/orders/:id/status', updateOrderStatus);

// --- Customer Admin APIs ---
router.get('/customers', getAdminCustomers);
router.get('/customers/:id', getAdminCustomerById);

// --- Settings Admin APIs ---
router.get('/settings/language', getAdminLanguageSettings);
router.patch('/settings/language', updateAdminLanguageSettings);

module.exports = router;
