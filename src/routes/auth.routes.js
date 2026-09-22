const express = require('express');
const { login, register, getMe } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register (Restricted/Disabled by default)
router.post('/register', register);

// GET /api/auth/me (Authenticated profile route)
router.get('/me', authMiddleware, getMe);

module.exports = router;
