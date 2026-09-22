const { User } = require('../models');
const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/appError');

/**
 * Express Authentication Middleware
 * Validates Bearer JWT Token and attaches active user object to req.user
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // 1. Check for Authorization header starting with 'Bearer '
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. Please provide a Bearer token.', 401);
    }

    // 2. Verify JWT signature
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Authentication token has expired. Please log in again.', 401);
      }
      throw new AppError('Invalid authentication token.', 401);
    }

    // 3. Find user in database
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      throw new AppError('The user belonging to this token no longer exists.', 401);
    }

    // 4. Verify user active status
    if (!user.isActive) {
      throw new AppError('User account is deactivated. Please contact support.', 403);
    }

    // 5. Attach authenticated user object to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
