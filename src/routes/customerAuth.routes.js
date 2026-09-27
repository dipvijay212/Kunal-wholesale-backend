const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updateMe,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} = require('../controllers/customerAuth.controller');
const customerAuthMiddleware = require('../middleware/customerAuthMiddleware');

const router = express.Router();

// Public customer auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Password reset routes (Resend Email)
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPassword);

// Authenticated customer profile routes
router.get('/me', customerAuthMiddleware, getMe);
router.put('/me', customerAuthMiddleware, updateMe);

module.exports = router;
