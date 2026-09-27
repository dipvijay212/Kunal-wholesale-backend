const { Customer } = require('../models');
const { verifyToken } = require('../utils/jwt');

/**
 * Optional Customer Auth Middleware
 * If a valid Bearer token is provided, attaches active customer to req.customer.
 * If not provided or invalid, continues silently with req.customer = null.
 */
const optionalCustomerAuthMiddleware = async (req, res, next) => {
  req.customer = null;

  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.customerId) {
        const customer = await Customer.findByPk(decoded.customerId);
        if (customer && customer.isActive) {
          req.customer = customer;
        }
      }
    }
  } catch (error) {
    // Ignore invalid tokens for optional auth and proceed as guest
    req.customer = null;
  }

  next();
};

module.exports = optionalCustomerAuthMiddleware;
