const AppError = require('../utils/appError');

/**
 * Express Admin Role Authorization Middleware
 * Verifies that the authenticated user possesses admin privileges
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(
      new AppError('Access denied. Admin privileges are required to perform this action.', 403)
    );
  }
  next();
};

module.exports = adminMiddleware;
