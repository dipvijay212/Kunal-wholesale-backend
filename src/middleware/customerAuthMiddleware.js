const { Customer } = require('../models');
const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/appError');

/**
 * Express Customer Authentication Middleware
 * Validates Bearer JWT Token for customers and attaches active customer object to req.customer
 */
const customerAuthMiddleware = async (req, res, next) => {
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
      throw new AppError('Customer authentication required. Please log in to continue.', 401);
    }

    // 2. Verify JWT signature
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Session has expired. Please log in again.', 401);
      }
      throw new AppError('Invalid authentication token.', 401);
    }

    if (!decoded || !decoded.customerId) {
      throw new AppError('Invalid customer authentication payload.', 401);
    }

    // 3. Find customer in database
    const customer = await Customer.findByPk(decoded.customerId);

    if (!customer) {
      throw new AppError('The customer account belonging to this token no longer exists.', 401);
    }

    // 4. Verify customer active status
    if (!customer.isActive) {
      throw new AppError('Customer account is deactivated. Please contact Kunal Sarees support.', 403);
    }

    // 5. Attach authenticated customer object to request
    req.customer = customer;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = customerAuthMiddleware;
